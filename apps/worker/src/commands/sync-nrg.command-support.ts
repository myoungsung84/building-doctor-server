import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { Pool } from 'pg';

import { AppConfigService } from '@app/config';
import { PG_POOL } from '@app/db';
import { AppLoggerService } from '@app/logger';
import { MolitNrgTradeClient } from '../clients/molit-nrg-trade.client';
import { SyncNrgTradesJob, type SyncNrgTradesJobSummary } from '../jobs/sync-nrg-trades.job';
import { WORKER_LOCK_KEYS, withAdvisoryLock } from '../lib/advisory-lock';
import { expandDealYmdRange, isValidDealYmd } from '../lib/month-range';
import { WorkerAppModule } from '../modules/worker-app.module';

export type SyncNrgCliMode = 'month' | 'range';

export type SyncNrgDealYmdOptions = {
  dealYmds: string[];
  mode: SyncNrgCliMode;
};

export type SyncNrgCommandTarget = {
  addressPrefix?: string;
  dealYmds: string[];
  lawdCd: string;
  mode: SyncNrgCliMode;
  name?: string;
};

export type SyncNrgTargetSuccess = {
  summary: SyncNrgTradesJobSummary;
  target: SyncNrgCommandTarget;
};

export type SyncNrgTargetFailure = {
  error: Error;
  target: SyncNrgCommandTarget;
};

export type RunSyncNrgTargetsResult = {
  failures: SyncNrgTargetFailure[];
  skippedByLock: boolean;
  successes: SyncNrgTargetSuccess[];
};

type RunSyncNrgTargetsOptions = {
  commandContext: string;
  continueOnError: boolean;
  onTargetFailure?: (
    failure: SyncNrgTargetFailure,
    progress: { current: number; total: number },
  ) => void;
  onTargetStart?: (
    target: SyncNrgCommandTarget,
    progress: { current: number; total: number },
  ) => void;
  onTargetSuccess?: (
    success: SyncNrgTargetSuccess,
    progress: { current: number; total: number },
  ) => void;
  targets: SyncNrgCommandTarget[];
};

export function parseCliArgs(argv: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (!argument.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = argument.slice(2).split('=');

    if (inlineValue !== undefined) {
      parsed[rawKey] = inlineValue;
      continue;
    }

    const nextValue = argv[index + 1];

    if (!nextValue || nextValue.startsWith('--')) {
      throw new Error(`Missing value for --${rawKey}`);
    }

    parsed[rawKey] = nextValue;
    index += 1;
  }

  return parsed;
}

export function resolveSyncDealYmdOptions(args: Record<string, string>): SyncNrgDealYmdOptions {
  const dealYmd = args.dealYmd;
  const from = args.from;
  const to = args.to;

  if (dealYmd && (from || to)) {
    throw new Error('dealYmd and from/to cannot be used together');
  }

  if (!dealYmd && !from && !to) {
    throw new Error('Either dealYmd or from/to is required');
  }

  if (dealYmd) {
    if (!isValidDealYmd(dealYmd)) {
      throw new Error('dealYmd must be a valid YYYYMM value');
    }

    return {
      dealYmds: [dealYmd],
      mode: 'month',
    };
  }

  if (!from || !to) {
    throw new Error('from and to must be provided together');
  }

  if (!isValidDealYmd(from) || !isValidDealYmd(to)) {
    throw new Error('from and to must be valid YYYYMM values');
  }

  return {
    dealYmds: expandDealYmdRange(from, to),
    mode: 'range',
  };
}

export async function runSyncNrgTargets(
  options: RunSyncNrgTargetsOptions,
): Promise<RunSyncNrgTargetsResult> {
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    logger: false,
  });
  const logger = app.get(AppLoggerService);
  const configService = app.get(AppConfigService);
  const pool = app.get<Pool>(PG_POOL);
  const commandClient = await pool.connect();
  const molitClient = new MolitNrgTradeClient({
    baseUrl: configService.molitNrgTradeApiBaseUrl,
    serviceKey: configService.molitServiceKey,
  });
  const job = new SyncNrgTradesJob(commandClient, logger, molitClient);

  try {
    const lockedResult = await withAdvisoryLock(
      commandClient,
      {
        lockKey: WORKER_LOCK_KEYS.syncNrgTrades,
        lockName: 'sync-nrg',
      },
      async () => {
        const successes: SyncNrgTargetSuccess[] = [];
        const failures: SyncNrgTargetFailure[] = [];

        for (const [index, target] of options.targets.entries()) {
          const progress = {
            current: index + 1,
            total: options.targets.length,
          };

          options.onTargetStart?.(target, progress);
          logger.log(
            `resolved target: mode=${target.mode}, lawdCd=${target.lawdCd}, dealYmds=${target.dealYmds.join(',')}`,
            options.commandContext,
          );

          try {
            const summary = await job.run(target);
            const success = { summary, target };

            successes.push(success);
            options.onTargetSuccess?.(success, progress);
          } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error('unknown error');
            const failure = {
              error: normalizedError,
              target,
            };

            failures.push(failure);
            options.onTargetFailure?.(failure, progress);

            if (!options.continueOnError) {
              throw normalizedError;
            }
          }
        }

        return {
          failures,
          skippedByLock: false,
          successes,
        };
      },
      logger,
    );

    if (lockedResult === null) {
      return {
        failures: [],
        skippedByLock: true,
        successes: [],
      };
    }

    return lockedResult;
  } finally {
    commandClient.release();
    await app.close();
  }
}

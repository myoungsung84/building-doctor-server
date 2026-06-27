import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { Pool } from 'pg';

import { AppConfigService } from '@app/config';
import { PG_POOL } from '@app/db';
import { AppLoggerService } from '@app/logger';
import { MolitNrgTradeClient } from '../clients/molit-nrg-trade.client';
import { WORKER_LOCK_KEYS, withAdvisoryLock } from '../lib/advisory-lock';
import { expandDealYmdRange, isValidDealYmd } from '../lib/month-range';
import { SyncNrgTradesJob } from '../jobs/sync-nrg-trades.job';
import { WorkerAppModule } from '../modules/worker-app.module';

type SyncNrgCliOptions = {
  dealYmds: string[];
  lawdCd: string;
  mode: 'month' | 'range';
};

function parseCliArgs(argv: string[]): Record<string, string> {
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

function resolveSyncOptions(argv: string[]): SyncNrgCliOptions {
  const args = parseCliArgs(argv);
  const lawdCd = args.lawdCd;
  const dealYmd = args.dealYmd;
  const from = args.from;
  const to = args.to;

  if (!lawdCd || !/^\d+$/.test(lawdCd)) {
    throw new Error('lawdCd is required and must be numeric');
  }

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
      lawdCd,
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
    lawdCd,
    mode: 'range',
  };
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    logger: false,
  });
  const logger = app.get(AppLoggerService);
  const configService = app.get(AppConfigService);
  const pool = app.get<Pool>(PG_POOL);
  const options = resolveSyncOptions(process.argv.slice(2));
  const client = await pool.connect();
  const molitClient = new MolitNrgTradeClient({
    baseUrl: configService.molitNrgTradeApiBaseUrl,
    serviceKey: configService.molitServiceKey,
  });
  const job = new SyncNrgTradesJob(client, logger, molitClient);
  const context = 'SyncNrgCommand';

  try {
    logger.log(
      `resolved target: mode=${options.mode}, lawdCd=${options.lawdCd}, dealYmds=${options.dealYmds.join(',')}`,
      context,
    );

    const summary = await withAdvisoryLock(
      client,
      {
        lockKey: WORKER_LOCK_KEYS.syncNrgTrades,
        lockName: 'sync-nrg',
      },
      () => job.run(options),
      logger,
    );

    if (summary === null) {
      return;
    }

    logger.log(
      `summary: fetched=${summary.fetchedItems}, inserted=${summary.inserted}, updated=${summary.updated}, skipped=${summary.skipped}`,
      context,
    );
  } finally {
    client.release();
    await app.close();
  }
}

void bootstrap();

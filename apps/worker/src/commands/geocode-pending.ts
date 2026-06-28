import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { Pool } from 'pg';

import { AppConfigService } from '@app/config';
import { PG_POOL } from '@app/db';
import { AppLoggerService } from '@app/logger';
import { VWorldGeocodingClient } from '../clients/vworld-geocoding.client';
import { GeocodePendingJob } from '../jobs/geocode-pending.job';
import { WORKER_LOCK_KEYS, withAdvisoryLock } from '../lib/advisory-lock';
import { NonResidentialTradesRepository } from '../repositories/non-residential-trades.repository';
import { WorkerAppModule } from '../modules/worker-app.module';

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

type GeocodePendingCliOptions = {
  delayMs: number;
  limit: number;
};

function resolveOptions(argv: string[]): GeocodePendingCliOptions {
  const args = parseCliArgs(argv);
  const limitValue = args.limit;
  const delayMsValue = args.delayMs;
  let limit = 50;
  let delayMs = 250;

  if (limitValue !== undefined) {
    if (!/^\d+$/.test(limitValue)) {
      throw new Error('limit must be a positive integer');
    }

    limit = Number(limitValue);

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('limit must be greater than 0');
    }

    if (limit > 1000) {
      throw new Error('limit must be less than or equal to 1000');
    }
  }

  if (delayMsValue !== undefined) {
    if (!/^\d+$/.test(delayMsValue)) {
      throw new Error('delayMs must be an integer greater than or equal to 0');
    }

    delayMs = Number(delayMsValue);

    if (!Number.isInteger(delayMs) || delayMs < 0) {
      throw new Error('delayMs must be greater than or equal to 0');
    }
  }

  return {
    delayMs,
    limit,
  };
}

async function bootstrap(): Promise<void> {
  const options = resolveOptions(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    logger: false,
  });
  const configService = app.get(AppConfigService);
  const logger = app.get(AppLoggerService);
  const pool = app.get<Pool>(PG_POOL);
  const client = await pool.connect();
  const context = 'GeocodePendingCommand';
  const repository = new NonResidentialTradesRepository(client);
  const vworldClient = new VWorldGeocodingClient(configService.vworldApiKey);
  const job = new GeocodePendingJob(repository, logger, vworldClient);

  try {
    logger.log(`resolved limit=${options.limit}, delayMs=${options.delayMs}`, context);

    const summary = await withAdvisoryLock(
      client,
      {
        lockKey: WORKER_LOCK_KEYS.geocodePending,
        lockName: 'geocode-pending',
      },
      () => job.run(options),
      logger,
    );

    if (summary === null) {
      return;
    }

    logger.log(
      `summary: pending=${summary.pendingFound}, cacheSuccessHit=${summary.cacheSuccessHit}, cacheFailureHit=${summary.cacheFailureHit}, apiSuccess=${summary.apiSuccess}, apiPermanentFailure=${summary.apiPermanentFailure}, apiTransientFailure=${summary.apiTransientFailure}, skipped=${summary.skipped}`,
      context,
    );
  } finally {
    client.release();
    await app.close();
  }
}

void bootstrap();

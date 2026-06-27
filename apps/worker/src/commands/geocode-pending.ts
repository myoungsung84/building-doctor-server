import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { Pool } from 'pg';

import { PG_POOL } from '@app/db';
import { AppLoggerService } from '@app/logger';
import { WORKER_LOCK_KEYS, withAdvisoryLock } from '../lib/advisory-lock';
import { WorkerAppModule } from '../modules/worker-app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    logger: false,
  });
  const logger = app.get(AppLoggerService);
  const pool = app.get<Pool>(PG_POOL);
  const client = await pool.connect();
  const context = 'GeocodePendingCommand';

  try {
    await withAdvisoryLock(
      client,
      {
        lockKey: WORKER_LOCK_KEYS.geocodePending,
        lockName: 'geocode-pending',
      },
      async () => {
        logger.log('geocode worker is not implemented yet', context);
      },
      logger,
    );
  } finally {
    client.release();
    await app.close();
  }
}

void bootstrap();

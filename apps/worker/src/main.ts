import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { DbService } from '@app/db';
import { APP_NAMES } from '@app/domain';
import { AppLoggerService } from '@app/logger';
import { WorkerAppModule } from './modules/worker-app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerAppModule);
  const logger = app.get(AppLoggerService);
  const dbService = app.get(DbService);

  try {
    await dbService.healthCheck();
    logger.log('database connection ok', 'WorkerBootstrap');
    logger.log(`${APP_NAMES.worker} ready`, 'WorkerBootstrap');
  } catch (error) {
    const trace = error instanceof Error ? error.stack : undefined;
    logger.error('database connection failed', trace, 'WorkerBootstrap');
    throw error;
  } finally {
    await app.close();
  }
}

void bootstrap();

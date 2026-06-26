import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { APP_NAMES } from '../../../libs/domain/src';
import { AppLoggerService } from '../../../libs/logger/src';
import { WorkerAppModule } from './modules/worker-app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerAppModule);

  try {
    const logger = app.get(AppLoggerService);
    logger.log(`${APP_NAMES.worker} ready`, 'WorkerBootstrap');
  } finally {
    await app.close();
  }
}

void bootstrap();

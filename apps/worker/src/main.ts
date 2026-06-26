import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { APP_NAMES } from '@app/domain';
import { AppLoggerService } from '@app/logger';
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

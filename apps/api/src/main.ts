import 'dotenv/config';
import 'reflect-metadata';

import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppConfigService } from '@app/config';
import { ApiAppModule } from './modules/api-app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApiAppModule);
  const configService = app.get(AppConfigService);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (configService.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  });
  app.setGlobalPrefix('api', {
    exclude: [
      { method: RequestMethod.GET, path: 'health' },
      { method: RequestMethod.GET, path: 'health/db' },
    ],
  });

  await app.listen(configService.port);
}

void bootstrap();

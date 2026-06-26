import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppConfigService } from '../../../libs/config/src';
import { ApiAppModule } from './modules/api-app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApiAppModule);
  const configService = app.get(AppConfigService);

  await app.listen(configService.port);
}

void bootstrap();

import { Module } from '@nestjs/common';

import { ConfigModule } from '../../../../libs/config/src';
import { LoggerModule } from '../../../../libs/logger/src';
import { HealthController } from '../routes/health.controller';

@Module({
  imports: [ConfigModule, LoggerModule],
  controllers: [HealthController],
})
export class ApiAppModule {}

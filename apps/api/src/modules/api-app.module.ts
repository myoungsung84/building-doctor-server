import { Module } from '@nestjs/common';

import { ConfigModule } from '@app/config';
import { LoggerModule } from '@app/logger';
import { HealthController } from '../routes/health.controller';

@Module({
  imports: [ConfigModule, LoggerModule],
  controllers: [HealthController],
})
export class ApiAppModule {}

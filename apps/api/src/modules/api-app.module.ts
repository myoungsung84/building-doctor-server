import { Module } from '@nestjs/common';

import { ConfigModule } from '@app/config';
import { DbModule } from '@app/db';
import { LoggerModule } from '@app/logger';
import { HealthController } from '../routes/health.controller';

@Module({
  imports: [ConfigModule, DbModule, LoggerModule],
  controllers: [HealthController],
})
export class ApiAppModule {}

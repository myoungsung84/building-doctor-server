import { Module } from '@nestjs/common';

import { ConfigModule } from '@app/config';
import { DbModule } from '@app/db';
import { LoggerModule } from '@app/logger';

@Module({
  imports: [ConfigModule, DbModule, LoggerModule],
})
export class WorkerAppModule {}

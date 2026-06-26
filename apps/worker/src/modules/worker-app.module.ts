import { Module } from '@nestjs/common';

import { ConfigModule } from '../../../../libs/config/src';
import { DbModule } from '../../../../libs/db/src';
import { LoggerModule } from '../../../../libs/logger/src';

@Module({
  imports: [ConfigModule, DbModule, LoggerModule],
})
export class WorkerAppModule {}

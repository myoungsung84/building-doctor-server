import { Module } from '@nestjs/common';

import { ConfigModule } from '@app/config';
import { drizzleProviders } from './drizzle.provider';
import { DbService } from './db.service';

@Module({
  imports: [ConfigModule],
  providers: [...drizzleProviders, DbService],
  exports: [DbService, ...drizzleProviders],
})
export class DbModule {}

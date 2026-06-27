import type { Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { AppConfigService } from '@app/config';
import { DRIZZLE_DB, type DrizzleDatabase, PG_POOL } from './db.types';

export const drizzleProviders: Provider[] = [
  {
    provide: PG_POOL,
    inject: [AppConfigService],
    useFactory: (configService: AppConfigService): Pool =>
      new Pool({
        connectionString: configService.databaseUrl,
      }),
  },
  {
    provide: DRIZZLE_DB,
    inject: [PG_POOL],
    useFactory: (pool: Pool): DrizzleDatabase => drizzle(pool),
  },
];

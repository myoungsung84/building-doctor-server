import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

import { DRIZZLE_DB, type DatabaseHealthStatus, type DrizzleDatabase, PG_POOL } from './db.types';

@Injectable()
export class DbService implements OnModuleDestroy {
  private isPoolClosed = false;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(DRIZZLE_DB) readonly db: DrizzleDatabase,
  ) {}

  async healthCheck(): Promise<DatabaseHealthStatus> {
    const result = await this.pool.query<{ ok: number }>('select 1 as ok');

    if (result.rows[0]?.ok !== 1) {
      throw new Error('Database health check returned an unexpected result');
    }

    return {
      status: 'ok',
      database: 'ok',
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isPoolClosed) {
      return;
    }

    this.isPoolClosed = true;
    await this.pool.end();
  }
}

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { dbSchema } from './schema';

export const PG_POOL = Symbol('PG_POOL');
export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

export type DrizzleDatabase = NodePgDatabase<typeof dbSchema>;

export type DatabaseHealthStatus = {
  status: 'ok';
  database: 'ok';
};

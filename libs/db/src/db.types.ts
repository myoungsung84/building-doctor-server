import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export const PG_POOL = Symbol('PG_POOL');
export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

export type DrizzleDatabase = NodePgDatabase<Record<string, never>>;

export type DatabaseHealthStatus = {
  status: 'ok';
  database: 'ok';
};

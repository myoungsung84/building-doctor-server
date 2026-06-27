import type { PoolClient } from 'pg';

import type { AppLoggerService } from '@app/logger';

export const WORKER_LOCK_KEYS = {
  syncNrgTrades: 10001,
  geocodePending: 10002,
} as const;

type AdvisoryLockOptions = {
  lockKey: number;
  lockName: string;
};

type AdvisoryLockRow = {
  locked: boolean;
};

export async function withAdvisoryLock<T>(
  client: PoolClient,
  options: AdvisoryLockOptions,
  task: () => Promise<T>,
  logger?: Pick<AppLoggerService, 'error' | 'log' | 'warn'>,
): Promise<T | null> {
  const context = 'AdvisoryLock';
  let locked = false;

  try {
    const result = await client.query<AdvisoryLockRow>(
      'SELECT pg_try_advisory_lock($1::bigint) AS locked',
      [options.lockKey],
    );
    locked = result.rows[0]?.locked === true;

    if (!locked) {
      logger?.warn?.(
        `${options.lockName} worker is already running. skip current execution.`,
        context,
      );

      return null;
    }

    logger?.log?.(`${options.lockName} advisory lock acquired`, context);

    return await task();
  } finally {
    if (locked) {
      try {
        await client.query('SELECT pg_advisory_unlock($1::bigint)', [options.lockKey]);
        logger?.log?.(`${options.lockName} advisory lock released`, context);
      } catch (error) {
        const trace = error instanceof Error ? error.stack : undefined;
        logger?.error?.(`${options.lockName} advisory unlock failed`, trace, context);
      }
    }
  }
}

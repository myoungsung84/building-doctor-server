import 'dotenv/config';

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import pg from 'pg';

const { Client } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  const filenames = (await readdir(migrationsDir))
    .filter((filename) => filename.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    for (const filename of filenames) {
      const fullPath = path.join(migrationsDir, filename);
      const sql = await readFile(fullPath, 'utf8');

      console.log(`[db:migrate] applying ${filename}`);
      await client.query(sql);
    }

    console.log('[db:migrate] completed');
  } finally {
    await client.end();
  }
}

await main();

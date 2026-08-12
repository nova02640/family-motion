import pg, { type Pool, type PoolClient } from 'pg';
import { config } from '../config.js';

export const pool: Pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[pg] pool error:', err);
});

/** 执行查询并返回单行（可选） */
export async function queryOne<T = unknown>(
  text: string,
  params: unknown[],
  client?: PoolClient,
): Promise<T | null> {
  const res = await (client ?? pool).query(text, params);
  return (res.rows[0] as T) ?? null;
}

/** 执行查询并返回多行 */
export async function queryMany<T = unknown>(
  text: string,
  params: unknown[],
  client?: PoolClient,
): Promise<T[]> {
  const res = await (client ?? pool).query(text, params);
  return res.rows as T[];
}

/** 在事务中执行 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

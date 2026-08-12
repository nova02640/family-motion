import { pool } from '../auth/db.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(16) UNIQUE NOT NULL,
  class VARCHAR(16) NOT NULL,
  level INT NOT NULL DEFAULT 1,
  exp INT NOT NULL DEFAULT 0,
  map_id VARCHAR(32) NOT NULL DEFAULT 'village',
  pos_x INT NOT NULL DEFAULT 25,
  pos_y INT NOT NULL DEFAULT 25,
  hp INT NOT NULL DEFAULT 80,
  mp INT NOT NULL DEFAULT 20,
  inventory JSONB NOT NULL DEFAULT '[]'::jsonb,
  equipment JSONB NOT NULL DEFAULT '{}'::jsonb,
  gold INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
`;

async function main() {
  console.log('[db-init] Creating schema...');
  await pool.query(SCHEMA);
  console.log('[db-init] Done.');
  await pool.end();
}

main().catch((err) => {
  console.error('[db-init] Failed:', err);
  process.exit(1);
});

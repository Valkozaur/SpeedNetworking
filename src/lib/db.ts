import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

let pool: Pool | null = null;
let schemaPromise: Promise<void> | null = null;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required. Set it to a Postgres connection string.");
  }

  pool = new Pool({
    connectionString,
    ssl:
      process.env.POSTGRES_SSL === "true"
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  });
  attachDatabasePool(pool);

  return pool;
}

async function createSchema(client: Pool | PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id text PRIMARY KEY,
      title text NOT NULL,
      join_code text NOT NULL UNIQUE,
      admin_token text NOT NULL UNIQUE,
      questions jsonb NOT NULL DEFAULT '[]'::jsonb,
      subtitle text NOT NULL DEFAULT '',
      host_name text NOT NULL DEFAULT '',
      theme_preset text NOT NULL DEFAULT 'emerald',
      accent_color text NOT NULL DEFAULT '#059669',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await client.query(`
    ALTER TABLE rooms
      DROP COLUMN IF EXISTS background_image_url,
      DROP COLUMN IF EXISTS background_overlay;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS targets (
      id text PRIMARY KEY,
      room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      name text NOT NULL,
      job_position text NOT NULL DEFAULT '',
      scanner_token text NOT NULL UNIQUE,
      fallback_code text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (room_id, fallback_code)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id text PRIMARY KEY,
      room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      display_name text NOT NULL,
      first_name text NOT NULL DEFAULT '',
      last_name text NOT NULL DEFAULT '',
      job_position text NOT NULL DEFAULT '',
      participant_token text NOT NULL UNIQUE,
      fallback_code text NOT NULL,
      target_id text REFERENCES targets(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (room_id, fallback_code)
    );
  `);

  await client.query(`
    ALTER TABLE targets
      ADD COLUMN IF NOT EXISTS job_position text NOT NULL DEFAULT '';
  `);

  await client.query(`
    ALTER TABLE participants
      ADD COLUMN IF NOT EXISTS target_id text REFERENCES targets(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS job_position text NOT NULL DEFAULT '';
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS claims (
      id text PRIMARY KEY,
      room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      target_id text NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
      participant_id text NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (target_id, participant_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id text PRIMARY KEY,
      room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      title text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS category_claims (
      id text PRIMARY KEY,
      room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      participant_id text NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      target_id text NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
      admin_note text NOT NULL DEFAULT '',
      reviewed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await client.query(`CREATE INDEX IF NOT EXISTS targets_room_id_idx ON targets(room_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS participants_room_id_idx ON participants(room_id);`);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS participants_target_id_unique_idx
      ON participants(target_id)
      WHERE target_id IS NOT NULL;
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS claims_room_id_idx ON claims(room_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS claims_participant_id_idx ON claims(participant_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS categories_room_id_idx ON categories(room_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS category_claims_room_id_idx ON category_claims(room_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS category_claims_participant_id_idx ON category_claims(participant_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS category_claims_target_id_idx ON category_claims(target_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS category_claims_category_id_idx ON category_claims(category_id);`);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS category_claims_active_category_unique_idx
      ON category_claims(participant_id, category_id)
      WHERE status <> 'rejected';
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS category_claims_active_target_unique_idx
      ON category_claims(participant_id, target_id)
      WHERE status <> 'rejected';
  `);
}

export async function ensureSchema(client?: PoolClient) {
  if (client) {
    await createSchema(client);
    return;
  }

  if (!schemaPromise) {
    schemaPromise = createSchema(getPool());
  }

  await schemaPromise;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  await ensureSchema();
  return getPool().query<T>(text, params);
}

export async function transaction<T>(callback: (client: PoolClient) => Promise<T>) {
  await ensureSchema();

  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

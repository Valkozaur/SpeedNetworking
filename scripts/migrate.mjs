import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Pool } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "migrations");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.POSTGRES_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

async function main() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      const existing = await client.query(
        "SELECT 1 FROM schema_migrations WHERE version = $1",
        [version],
      );

      if (existing.rowCount > 0) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");

      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (version) VALUES ($1)",
        [version],
      );
      await client.query("COMMIT");
      console.log(`Applied ${file}`);
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

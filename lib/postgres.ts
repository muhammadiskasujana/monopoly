import { Pool, PoolClient, QueryResultRow } from "pg";

const globalDb = globalThis as typeof globalThis & { monopolyPool?: Pool };

const pool = globalDb.monopolyPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

if (process.env.NODE_ENV !== "production") globalDb.monopolyPool = pool;

function postgresSql(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

export class Statement {
  values: unknown[] = [];

  constructor(public sql: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async execute(client: Pool | PoolClient = pool) {
    return client.query(postgresSql(this.sql), this.values);
  }

  async first<T extends QueryResultRow>() {
    const result = await this.execute();
    return (result.rows[0] as T | undefined) ?? null;
  }

  async all<T extends QueryResultRow>() {
    const result = await this.execute();
    return { results: result.rows as T[] };
  }

  async run() {
    const result = await this.execute();
    return { success: true, meta: { changes: result.rowCount ?? 0 } };
  }
}

export const db = {
  prepare(sql: string) {
    return new Statement(sql);
  },
  async batch(statements: Statement[]) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const results = [];
      for (const statement of statements) results.push(await statement.execute(client));
      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};

export type Database = typeof db;

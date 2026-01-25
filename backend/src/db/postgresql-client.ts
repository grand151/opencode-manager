import { Pool, PoolClient } from 'pg'
import type { DBClient, DBStatement, DBQueryResult, ColumnInfo } from './client'

export class PostgreSQLStatement implements DBStatement {
  constructor(
    private client: PoolClient,
    private sql: string
  ) {}

  async run(...params: unknown[]): Promise<DBQueryResult> {
    const result = await this.client.query(this.sql, params)
    return {
      changes: result.rowCount || 0,
      lastInsertRowid: result.rows[0]?.id ? Number(result.rows[0].id) : undefined
    }
  }

  async get<T = unknown>(...params: unknown[]): Promise<T | undefined> {
    const result = await this.client.query(this.sql, params)
    return result.rows[0] as T | undefined
  }

  async all<T = unknown>(...params: unknown[]): Promise<T[]> {
    const result = await this.client.query(this.sql, params)
    return result.rows as T[]
  }
}

export class PostgreSQLClient implements DBClient {
  constructor(private pool: Pool) {}

  prepare(sql: string): DBStatement {
    return new PostgreSQLStatement(this.pool, sql)
  }

  async exec(sql: string): Promise<void> {
    const client = await this.pool.connect()
    try {
      await client.query(sql)
    } finally {
      client.release()
    }
  }

  async query(sql: string, params: unknown[] = []): Promise<any[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(sql, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  async run(sql: string, params: unknown[] = []): Promise<DBQueryResult> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(sql, params)
      return {
        changes: result.rowCount || 0,
        lastInsertRowid: result.rows[0]?.id ? Number(result.rows[0].id) : undefined
      }
    } finally {
      client.release()
    }
  }

  async get(sql: string, params: unknown[] = []): Promise<any> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(sql, params)
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  close(): void {
    this.pool.end()
  }

  async getTableInfo(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT 
        ordinal_position as cid,
        column_name as name,
        data_type as type,
        CASE WHEN is_nullable = 'NO' THEN 1 ELSE 0 END as notnull,
        column_default as dflt_value,
        CASE WHEN column_key = 'PRI' THEN 1 ELSE 0 END as pk
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `
    const client = await this.pool.connect()
    try {
      const result = await client.query(sql, [tableName])
      return result.rows
    } finally {
      client.release()
    }
  }
}

export function createPostgreSQLClient(connectionString: string): DBClient {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  return new PostgreSQLClient(pool)
}
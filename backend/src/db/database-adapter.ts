type SqliteDatabase = {
  run(sql: string, ...params: unknown[]): { changes: number; lastInsertRowid: number }
  get(sql: string, ...params: unknown[]): unknown
  all(sql: string, ...params: unknown[]): unknown[]
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number }
    get(...params: unknown[]): unknown
    all(...params: unknown[]): unknown[]
  }
  close(): void
}

export type Database = SqliteDatabase

export async function createDatabase(dbPath: string): Promise<Database> {
  try {
    const { Database: BunDatabase } = await import('bun:sqlite')
    return new BunDatabase(dbPath) as unknown as Database
  } catch {
    const BetterSqlite3 = (await import('better-sqlite3')).default
    const db = new BetterSqlite3(dbPath)
    
    return {
      run: (sql: string, ...params: unknown[]) => {
        const stmt = db.prepare(sql)
        const result = stmt.run(...params)
        return {
          changes: result.changes,
          lastInsertRowid: Number(result.lastInsertRowid),
        }
      },
      get: (sql: string, ...params: unknown[]) => {
        const stmt = db.prepare(sql)
        return stmt.get(...params)
      },
      all: (sql: string, ...params: unknown[]) => {
        const stmt = db.prepare(sql)
        return stmt.all(...params)
      },
      prepare: (sql: string) => {
        const stmt = db.prepare(sql)
        return {
          run: (...params: unknown[]) => {
            const result = stmt.run(...params)
            return {
              changes: result.changes,
              lastInsertRowid: Number(result.lastInsertRowid),
            }
          },
          get: (...params: unknown[]) => stmt.get(...params),
          all: (...params: unknown[]) => stmt.all(...params),
        }
      },
      close: () => db.close(),
    } as Database
  }
}

export interface DBQueryResult {
  lastInsertRowid?: number
  changes?: number
}

export interface DBStatement {
  run(...params: unknown[]): DBQueryResult | Promise<DBQueryResult>
  get<T = unknown>(...params: unknown[]): T | undefined | Promise<T | undefined>
  all<T = unknown>(...params: unknown[]): T[] | Promise<T[]>
}

export interface DBClient {
  prepare(sql: string): DBStatement
  exec(sql: string): void | Promise<void>
  query(sql: string, params?: unknown[]): Promise<any[]>
  run(sql: string, params?: unknown[]): Promise<DBQueryResult>
  get(sql: string, params?: unknown[]): Promise<any>
  close(): void
}

export interface ColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: unknown
  pk: number
}

export interface RepoRow {
  id: number
  repo_url?: string
  local_path: string
  branch?: string
  default_branch: string
  clone_status: string
  cloned_at: number
  last_pulled?: number
  opencode_config_name?: string
  is_worktree?: number
  is_local?: number
}

export interface UserPreferenceRow {
  id: number
  user_id: string
  preferences: string
  updated_at: number
}

export interface OpenCodeConfigRow {
  id: number
  user_id: string
  config_name: string
  config_content: string
  is_default: number
  created_at: number
  updated_at: number
}
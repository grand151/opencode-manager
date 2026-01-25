import { logger } from '../utils/logger'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { runMigrations } from './migrations'
import type { DBClient } from './client'

export async function initializeDatabase(dbClient: DBClient): Promise<void> {
  const tables = [
    `CREATE TABLE IF NOT EXISTS repos (
      id SERIAL PRIMARY KEY,
      repo_url TEXT,
      local_path TEXT NOT NULL,
      branch TEXT,
      default_branch TEXT,
      clone_status TEXT NOT NULL,
      cloned_at BIGINT NOT NULL,
      last_pulled BIGINT,
      opencode_config_name TEXT,
      is_worktree BOOLEAN DEFAULT FALSE,
      is_local BOOLEAN DEFAULT FALSE
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_repo_clone_status ON repos(clone_status)`,
    
    `CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      preferences TEXT NOT NULL,
      updated_at BIGINT NOT NULL,
      UNIQUE(user_id)
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_user_id ON user_preferences(user_id)`,
    
    `CREATE TABLE IF NOT EXISTS opencode_configs (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      config_name TEXT NOT NULL,
      config_content TEXT NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      UNIQUE(user_id, config_name)
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_opencode_user_id ON opencode_configs(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_opencode_default ON opencode_configs(user_id, is_default)`,
    
    `CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL,
      role TEXT DEFAULT 'user'
    )`,
    
    `CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY NOT NULL,
      expiresAt BIGINT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_session_userId ON "session"(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token)`,
    
    `CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY NOT NULL,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt BIGINT,
      refreshTokenExpiresAt BIGINT,
      scope TEXT,
      password TEXT,
      createdAt BIGINT NOT NULL,
      updatedAt BIGINT NOT NULL
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_account_userId ON "account"(userId)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_account_provider ON "account"(providerId, accountId)`,
    
    `CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY NOT NULL,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt BIGINT NOT NULL,
      createdAt BIGINT,
      updatedAt BIGINT
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"(identifier)`,
    
    `CREATE TABLE IF NOT EXISTS "passkey" (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      publicKey TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      credentialID TEXT NOT NULL,
      counter INTEGER NOT NULL,
      deviceType TEXT NOT NULL,
      backedUp BOOLEAN NOT NULL DEFAULT FALSE,
      transports TEXT,
      createdAt BIGINT,
      aaguid TEXT
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_passkey_userId ON "passkey"(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_passkey_credentialID ON "passkey"(credentialID)`
  ]

  for (const sql of tables) {
    try {
      await dbClient.exec(sql)
    } catch (error) {
      logger.debug(`Table creation failed (might already exist):`, error)
    }
  }

  await runMigrations(dbClient)
  
  try {
    await dbClient.run(
      'INSERT INTO user_preferences (user_id, preferences, updated_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING',
      ['default', '{}', Date.now()]
    )
  } catch (error) {
    logger.debug('Default user preferences might already exist:', error)
  }
  
  logger.info('Database initialized successfully')
}

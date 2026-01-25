import type { DBClient } from './client'
import { logger } from '../utils/logger'



export async function runMigrations(db: DBClient): Promise<void> {
  try {
    const tableInfo = await (db as any).getTableInfo('repos')
    
    const repoUrlColumn = tableInfo.find((col: any) => col.name === 'repo_url')
    if (repoUrlColumn && repoUrlColumn.notnull === 1) {
      logger.info('Migrating repos table to allow nullable repo_url for local repos')
      await db.exec('BEGIN')
      try {
        await db.exec(`
          CREATE TABLE repos_new (
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
          )
        `)
        
        const existingColumns = tableInfo.map((col: any) => col.name)
        const columnsToCopy = ['id', 'repo_url', 'local_path', 'branch', 'default_branch', 'clone_status', 'cloned_at', 'last_pulled', 'opencode_config_name', 'is_worktree', 'is_local']
          .filter(col => existingColumns.includes(col))
        
        const columnsStr = columnsToCopy.join(', ')
        await db.exec(`INSERT INTO repos_new (${columnsStr}) SELECT ${columnsStr} FROM repos`)
        
        await db.exec('DROP TABLE repos')
        await db.exec('ALTER TABLE repos_new RENAME TO repos')
        await db.exec('COMMIT')
        logger.info('Successfully migrated repos table to allow nullable repo_url')
      } catch (migrationError) {
        await db.exec('ROLLBACK')
        throw migrationError
      }
    }
    
    const hasBranchColumn = tableInfo.some((col: any) => col.name === 'branch')
    
    if (!hasBranchColumn) {
      logger.info('Adding missing branch column to repos table')
      await db.exec('ALTER TABLE repos ADD COLUMN branch TEXT')
    }
    
    try {
      await db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_repo_url_branch 
        ON repos(repo_url, branch) 
        WHERE branch IS NOT NULL
      `)
    } catch (error) {
      logger.debug('Index already exists or could not be created', error)
    }
    
    try {
      await db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_local_path 
        ON repos(local_path)
      `)
    } catch (error) {
      logger.debug('Local path index already exists or could not be created', error)
    }
    
    const requiredColumns = [
      { name: 'default_branch', sql: 'ALTER TABLE repos ADD COLUMN default_branch TEXT' },
      { name: 'clone_status', sql: 'ALTER TABLE repos ADD COLUMN clone_status TEXT NOT NULL DEFAULT "cloning"' },
      { name: 'cloned_at', sql: 'ALTER TABLE repos ADD COLUMN cloned_at INTEGER NOT NULL DEFAULT 0' },
      { name: 'last_pulled', sql: 'ALTER TABLE repos ADD COLUMN last_pulled INTEGER' },
      { name: 'opencode_config_name', sql: 'ALTER TABLE repos ADD COLUMN opencode_config_name TEXT' },
      { name: 'is_worktree', sql: 'ALTER TABLE repos ADD COLUMN is_worktree BOOLEAN DEFAULT FALSE' },
      { name: 'is_local', sql: 'ALTER TABLE repos ADD COLUMN is_local BOOLEAN DEFAULT FALSE' }
    ]
    
    for (const column of requiredColumns) {
      const hasColumn = tableInfo.some((col: any) => col.name === column.name)
      if (!hasColumn) {
        logger.info(`Adding missing column: ${column.name}`)
        try {
          await db.exec(column.sql)
        } catch (error) {
          logger.debug(`Column ${column.name} might already exist:`, error)
        }
      }
    }
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_repo_clone_status ON repos(clone_status)',
      'CREATE INDEX IF NOT EXISTS idx_user_id ON user_preferences(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_opencode_user_id ON opencode_configs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_opencode_default ON opencode_configs(user_id, is_default)'
    ]
    
    for (const indexSql of indexes) {
      try {
        await db.exec(indexSql)
      } catch (error) {
        logger.debug('Index already exists:', error)
      }
    }
    
    try {
      const repos = await db.query("SELECT id, local_path FROM repos WHERE local_path LIKE 'repos/%'") as Array<{
        id: number
        local_path: string
      }>
      if (repos.length > 0) {
        logger.info(`Migrating ${repos.length} repos to remove 'repos/' prefix from local_path`)
        for (const repo of repos) {
          const newPath = repo.local_path.replace(/^repos\//, '')
          await db.run("UPDATE repos SET local_path = $1 WHERE id = $2", [newPath, repo.id])
          logger.info(`Updated repo ${repo.id}: ${repo.local_path} -> ${newPath}`)
        }
      }
    } catch (error) {
      logger.error('Failed to migrate local_path format:', error)
    }
    
    await migrateGitTokenToCredentials(db)
    
    logger.info('Database migrations completed successfully')
  } catch (error) {
    logger.error('Failed to run database migrations:', error)
    throw error
  }
}

async function migrateGitTokenToCredentials(db: DBClient): Promise<void> {
  try {
    const rows = await db.query('SELECT user_id, preferences FROM user_preferences') as Array<{
      user_id: string
      preferences: string
    }>

    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.preferences) as Record<string, unknown>
        const gitToken = parsed.gitToken as string | undefined
        const existingCredentials = parsed.gitCredentials as Array<unknown> | undefined

        if (!gitToken) {
          continue
        }

        if (existingCredentials && existingCredentials.length > 0) {
          continue
        }

        const { gitToken: _, ...rest } = parsed
        const migrated = {
          ...rest,
          gitCredentials: [{
            name: 'GitHub',
            host: 'https://github.com/',
            token: gitToken,
          }],
        }

        await db.run('UPDATE user_preferences SET preferences = $1 WHERE user_id = $2', 
          [JSON.stringify(migrated), row.user_id])

        logger.info(`Migrated gitToken to gitCredentials for user: ${row.user_id}`)
      } catch (parseError) {
        logger.error(`Failed to parse preferences for user ${row.user_id}:`, parseError)
      }
    }
  } catch (error) {
    logger.error('Failed to migrate gitToken to gitCredentials:', error)
  }
}

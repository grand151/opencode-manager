import type { DBClient } from './client'
import type { Repo, CreateRepoInput } from '../types/repo'
import type { RepoRow } from './client'
import { getReposPath } from '@opencode-manager/shared/config/env'
import { getErrorMessage } from '../utils/error-utils'
import path from 'path'

function rowToRepo(row: RepoRow): Repo {
  return {
    id: row.id,
    repoUrl: row.repo_url,
    localPath: row.local_path,
    fullPath: path.join(getReposPath(), row.local_path),
    branch: row.branch,
    defaultBranch: row.default_branch,
    cloneStatus: row.clone_status as Repo['cloneStatus'],
    clonedAt: row.cloned_at,
    lastPulled: row.last_pulled,
    openCodeConfigName: row.opencode_config_name,
    isWorktree: row.is_worktree ? Boolean(row.is_worktree) : undefined,
    isLocal: row.is_local ? Boolean(row.is_local) : undefined,
  }
}

export async function createRepo(db: DBClient, repo: CreateRepoInput): Promise<Repo> {
  const normalizedPath = repo.localPath.trim().replace(/\/+$/, '')
  
  const existing = repo.isLocal 
    ? await getRepoByLocalPath(db, normalizedPath)
    : await getRepoByUrlAndBranch(db, repo.repoUrl!, repo.branch)
  
  if (existing) {
    return existing
  }
  
  const sql = `
    INSERT INTO repos (repo_url, local_path, branch, default_branch, clone_status, cloned_at, is_worktree, is_local)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
  `
  
  try {
    const result = await db.run(sql, [
      repo.repoUrl || null,
      normalizedPath,
      repo.branch || null,
      repo.defaultBranch,
      repo.cloneStatus,
      repo.clonedAt,
      repo.isWorktree ? 1 : 0,
      repo.isLocal ? 1 : 0
    ])
    
    const newRepo = await getRepoById(db, Number(result.lastInsertRowid))
    if (!newRepo) {
      throw new Error(`Failed to retrieve newly created repo with id ${result.lastInsertRowid}`)
    }
    return newRepo
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    if (errorMessage.includes('UNIQUE constraint failed') || (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE')) {
      const conflictRepo = repo.isLocal 
        ? await getRepoByLocalPath(db, normalizedPath)
        : await getRepoByUrlAndBranch(db, repo.repoUrl!, repo.branch)
      
      if (conflictRepo) {
        return conflictRepo
      }
      
      const identifier = repo.isLocal ? `path '${normalizedPath}'` : `url '${repo.repoUrl}' branch '${repo.branch || 'default'}'`
      throw new Error(`Repository with ${identifier} already exists but could not be retrieved. This may indicate database corruption.`)
    }
    
    throw new Error(`Failed to create repository: ${errorMessage}`)
  }
}

export async function getRepoById(db: DBClient, id: number): Promise<Repo | null> {
  const row = await db.get('SELECT * FROM repos WHERE id = $1', [id]) as RepoRow | undefined
  
  return row ? rowToRepo(row) : null
}

export async function getRepoByUrl(db: DBClient, repoUrl: string): Promise<Repo | null> {
  const row = await db.get('SELECT * FROM repos WHERE repo_url = $1', [repoUrl]) as RepoRow | undefined
  
  return row ? rowToRepo(row) : null
}

export async function getRepoByUrlAndBranch(db: DBClient, repoUrl: string, branch?: string): Promise<Repo | null> {
  const query = branch 
    ? 'SELECT * FROM repos WHERE repo_url = $1 AND branch = $2'
    : 'SELECT * FROM repos WHERE repo_url = $1 AND branch IS NULL'
  
  const row = branch 
    ? await db.get(query, [repoUrl, branch]) as RepoRow | undefined
    : await db.get(query, [repoUrl]) as RepoRow | undefined
  
  return row ? rowToRepo(row) : null
}

export async function getRepoByLocalPath(db: DBClient, localPath: string): Promise<Repo | null> {
  const row = await db.get('SELECT * FROM repos WHERE local_path = $1', [localPath]) as RepoRow | undefined
  
  return row ? rowToRepo(row) : null
}

export async function listRepos(db: DBClient, repoOrder?: number[]): Promise<Repo[]> {
  const rows = await db.query('SELECT * FROM repos ORDER BY cloned_at DESC') as RepoRow[]
  const repos = rows.map(rowToRepo)

  if (!repoOrder || repoOrder.length === 0) {
    return repos
  }

  const orderMap = new Map(repoOrder.map((id, index) => [id, index]))
  const orderedRepos = repos
    .filter((repo) => orderMap.has(repo.id))
    .sort((a, b) => {
      const indexA = orderMap.get(a.id)!
      const indexB = orderMap.get(b.id)!
      return indexA - indexB
    })

  const remainingRepos = repos
    .filter((repo) => !orderMap.has(repo.id))
    .sort((a, b) => {
      const nameA = getRepoName(a).toLowerCase()
      const nameB = getRepoName(b).toLowerCase()
      return nameA.localeCompare(nameB)
    })

  return [...orderedRepos, ...remainingRepos]
}

function getRepoName(repo: Repo): string {
  return repo.repoUrl
    ? repo.repoUrl.split('/').slice(-1)[0]?.replace('.git', '') || repo.localPath
    : repo.localPath
}

export async function updateRepoStatus(db: DBClient, id: number, cloneStatus: Repo['cloneStatus']): Promise<void> {
  await db.run('UPDATE repos SET clone_status = $1 WHERE id = $2', [cloneStatus, id])
}

export async function updateRepoConfigName(db: DBClient, id: number, configName: string): Promise<void> {
  await db.run('UPDATE repos SET opencode_config_name = $1 WHERE id = $2', [configName, id])
}

export async function updateLastPulled(db: DBClient, id: number): Promise<void> {
  await db.run('UPDATE repos SET last_pulled = $1 WHERE id = $2', [Date.now(), id])
}

export async function updateRepoBranch(db: DBClient, id: number, branch: string): Promise<void> {
  await db.run('UPDATE repos SET branch = $1 WHERE id = $2', [branch, id])
}

export async function deleteRepo(db: DBClient, id: number): Promise<void> {
  await db.run('DELETE FROM repos WHERE id = $1', [id])
}

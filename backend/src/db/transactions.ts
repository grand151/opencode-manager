import type { DBClient } from './client'
import { logger } from '../utils/logger'



export async function withTransactionAsync<T>(
  db: DBClient,
  fn: (db: DBClient) => Promise<T>
): Promise<T> {
  const client = await (db as any).pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(db)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Transaction rolled back:', error)
    throw error
  } finally {
    client.release()
  }
}

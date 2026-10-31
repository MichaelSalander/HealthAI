import fs from 'node:fs'
import { Pool } from 'pg'

/**
 * PostgreSQL state repository for hosted environments.
 *
 * The API keeps its domain model in memory, while this adapter provides a
 * durable, serialized snapshot store. Keeping the adapter behind the same
 * load/save boundary as SQLite lets local development remain portable and
 * makes the hosted database a configuration choice.
 */
export async function openPostgresStore({ connectionString, seedFile, ssl = false }) {
  if (!connectionString) throw new Error('HEALTHAI_DATABASE_URL is required when HEALTHAI_DB=postgres')

  const pool = new Pool({
    connectionString,
    max: Number(process.env.HEALTHAI_DB_POOL_MAX || 10),
    ssl: ssl ? { rejectUnauthorized: false } : undefined
  })

  await pool.query(`
    CREATE TABLE IF NOT EXISTS healthai_state (
      state_key TEXT PRIMARY KEY,
      state_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  let state
  const existing = await pool.query('SELECT state_json FROM healthai_state WHERE state_key = $1 LIMIT 1', ['state'])
  if (existing.rows[0]?.state_json) {
    state = existing.rows[0].state_json
  } else {
    state = JSON.parse(fs.readFileSync(seedFile, 'utf8'))
    await pool.query(
      'INSERT INTO healthai_state (state_key, state_json) VALUES ($1, $2::jsonb) ON CONFLICT (state_key) DO NOTHING',
      ['state', JSON.stringify(state)]
    )
  }

  let writeQueue = Promise.resolve()
  let lastWriteError
  function save(nextState) {
    const snapshot = structuredClone(nextState)
    writeQueue = writeQueue.then(async () => {
      await pool.query(
        'INSERT INTO healthai_state (state_key, state_json, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (state_key) DO UPDATE SET state_json = EXCLUDED.state_json, updated_at = NOW()',
        ['state', JSON.stringify(snapshot)]
      )
    }).catch(error => {
      lastWriteError = error
      console.error('[healthai] postgres persistence failed:', error.message)
    })
    return writeQueue
  }

  async function close() {
    await writeQueue
    if (lastWriteError) throw lastWriteError
    await pool.end()
  }

  return {
    load: () => structuredClone(state),
    save,
    close,
    health: async () => {
      await pool.query('SELECT 1')
      return { driver: 'postgres', stateKey: 'state' }
    }
  }
}

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'

/**
 * SQLite-compatible persistent store for the first real backend.
 * sql.js keeps local development portable without native build scripts;
 * the repository boundary can later be replaced by PostgreSQL/MySQL.
 */
export async function openSqliteStore({ dbFile, seedFile }) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  const SQL = await initSqlJs({ locateFile: file => path.resolve(moduleDir, '../../node_modules/sql.js/dist', file) })
  const database = fs.existsSync(dbFile) ? new SQL.Database(fs.readFileSync(dbFile)) : new SQL.Database()
  database.run('CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)')

  function load() {
    const rows = database.exec("SELECT value FROM app_state WHERE key = 'state' LIMIT 1")
    if (rows[0]?.values[0]?.[0]) return JSON.parse(rows[0].values[0][0])
    const seeded = JSON.parse(fs.readFileSync(seedFile, 'utf8'))
    save(seeded)
    return seeded
  }

  function save(state) {
    const value = JSON.stringify(state)
    database.run('INSERT INTO app_state(key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at', ['state', value, new Date().toISOString()])
    fs.mkdirSync(path.dirname(dbFile), { recursive: true })
    fs.writeFileSync(dbFile, Buffer.from(database.export()))
  }

  return { load, save, close: () => database.close() }
}

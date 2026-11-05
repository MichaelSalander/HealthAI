import fs from 'node:fs'
import { spawn } from 'node:child_process'

const envFile = process.env.HEALTHAI_ENV_FILE || 'server/.env'
const env = { ...process.env }
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    env[match[1]] = value
  }
}
const child = spawn(process.execPath, ['server/mock-api.mjs'], { env, stdio: 'inherit' })
child.on('exit', code => process.exit(code || 0))

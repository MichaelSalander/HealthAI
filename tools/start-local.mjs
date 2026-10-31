import net from 'node:net'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const children = []
const lanHost = process.env.HEALTHAI_LAN_HOST || ''
const bindHost = lanHost ? '0.0.0.0' : '127.0.0.1'
const apiBase = lanHost ? `http://${lanHost}:8787/api/v1` : 'http://localhost:8787/api/v1'
const childEnv = { ...process.env, HOST: bindHost, HEALTHAI_CORS_ORIGIN: lanHost ? `http://${lanHost}:5175` : (process.env.HEALTHAI_CORS_ORIGIN || 'http://localhost:5175') }
const services = [
  { name: 'API', port: 8787, cwd: root, args: ['--env-file-if-exists=server/.env', 'server/mock-api.mjs'], url: `http://${lanHost || 'localhost'}:8787/api/v1/status`, env: childEnv },
  { name: 'uni-app', port: 5175, cwd: root, args: ['node_modules/@dcloudio/vite-plugin-uni/bin/uni.js', '-p', 'h5', '--host', bindHost, '--port', '5175'], url: `http://${lanHost || 'localhost'}:5175/#/pages/demo/index`, env: { ...childEnv, VITE_API_BASE_URL: apiBase } },
  { name: 'Admin', port: 8848, cwd: path.join(root, 'console'), args: ['node_modules/vite/bin/vite.js', '--host', bindHost, '--port', '8848'], url: `http://${lanHost || 'localhost'}:8848/dispatch.html`, env: { ...childEnv, VITE_API_BASE_URL: apiBase } }
]
async function listening(port) { return new Promise(resolve => { const socket = net.connect(port, '127.0.0.1'); socket.once('connect', () => { socket.destroy(); resolve(true) }); socket.once('error', () => resolve(false)) }) }
for (const s of services) {
  if (await listening(s.port)) { console.log(`${s.name}: port ${s.port} occupied; existing process retained. ${s.url}`); continue }
  const child = spawn(process.execPath, s.args, { cwd: s.cwd, env: s.env || process.env, stdio: 'inherit', windowsHide: true }); children.push(child)
  child.on('exit', code => { if (code) console.error(`${s.name} exited (${code})`) }); console.log(`${s.name}: ${s.url}`)
}
function stop() { for (const child of children) child.kill(); process.exit() }
process.on('SIGINT', stop); process.on('SIGTERM', stop)

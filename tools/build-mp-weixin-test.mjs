import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cli = path.join(root, 'node_modules', '@dcloudio', 'vite-plugin-uni', 'bin', 'uni.js')
const result = spawnSync(process.execPath, [cli, 'build', '-p', 'mp-weixin'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_AUTH_MODE: 'wechat' }
})
process.exit(result.status ?? 1)

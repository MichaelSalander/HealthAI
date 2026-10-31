import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'src', 'manifest.json')
const appId = String(process.env.WECHAT_MP_APPID || '').trim()

if (!appId || appId === 'touristappid') {
  console.error('正式微信小程序构建必须设置 WECHAT_MP_APPID，不能使用 touristappid')
  process.exit(1)
}

const original = fs.readFileSync(manifestPath, 'utf8')
try {
  const manifest = JSON.parse(original)
  manifest['mp-weixin'] = { ...(manifest['mp-weixin'] || {}), appid: appId, setting: { ...(manifest['mp-weixin']?.setting || {}), urlCheck: true } }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  const cli = path.join(root, 'node_modules', '@dcloudio', 'vite-plugin-uni', 'bin', 'uni.js')
  const result = spawnSync(process.execPath, [cli, 'build', '-p', 'mp-weixin'], { cwd: root, stdio: 'inherit', env: { ...process.env, VITE_AUTH_MODE: 'wechat' } })
  process.exitCode = result.status ?? 1
} finally {
  fs.writeFileSync(manifestPath, original, 'utf8')
}

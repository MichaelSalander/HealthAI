import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildRoot = path.join(projectRoot, 'dist', 'build', 'h5')
const legacyRoot = path.join(projectRoot, 'dist')

if (!fs.existsSync(path.join(buildRoot, 'index.html'))) throw new Error('H5 建置產物不存在，无法同步到部署入口')
fs.copyFileSync(path.join(buildRoot, 'index.html'), path.join(legacyRoot, 'index.html'))
fs.rmSync(path.join(legacyRoot, 'assets'), { recursive: true, force: true })
fs.cpSync(path.join(buildRoot, 'assets'), path.join(legacyRoot, 'assets'), { recursive: true })
console.log('[healthai] H5 output synced to dist/ and dist/build/h5/')

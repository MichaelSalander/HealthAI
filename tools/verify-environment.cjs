const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const required = [
  '@dcloudio/uni-app',
  '@dcloudio/uni-h5',
  '@dcloudio/vite-plugin-uni',
  'typescript',
  'vue-tsc',
  'sass'
]

const exists = (name) => fs.existsSync(path.join(root, 'node_modules', ...name.split('/')))
const rows = []
const add = (name, ok, detail) => rows.push(`${ok ? 'OK  ' : 'MISS'} ${name}${detail ? ` - ${detail}` : ''}`)

add('Node.js', Number.parseInt(process.versions.node, 10) >= 18, process.version)
add('package.json', fs.existsSync(path.join(root, 'package.json')))
for (const name of required) add(name, exists(name))

const globalMcp = path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@dcloudio', 'uni-app-x-mcp')
add('uni-app-x-mcp (optional)', fs.existsSync(globalMcp), fs.existsSync(globalMcp)
  ? 'installed globally; only for uni-app x'
  : 'not installed; not required for this traditional uni-app project')

const hbuilderCandidates = [
  process.env.HBUILDERX_HOME,
  'D:\\09大健康\\HBuilderX.5.26.2026091802\\HBuilderX\\HBuilderX.exe',
  'C:\\Program Files\\HBuilderX\\HBuilderX.exe',
  'C:\\HBuilderX\\HBuilderX.exe'
].filter(Boolean)
add('HBuilderX (optional)', hbuilderCandidates.some(fs.existsSync), 'required only for device/simulator preview')

console.log(rows.join('\n'))
if (rows.some((row) => row.startsWith('MISS') && !row.includes('(optional)'))) process.exitCode = 1

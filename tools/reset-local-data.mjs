import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openSqliteStore } from '../server/storage/sqlite-store.mjs'
import { seedWorkflow } from '../server/consultation-workflow.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const databaseFile = process.env.HEALTHAI_DB_FILE || path.join(root, 'server', 'healthai.sqlite')
const seedFile = process.env.HEALTHAI_DATA_FILE || path.join(root, 'server', 'mock-db.json')
const uploadRoot = process.env.HEALTHAI_UPLOAD_DIR || path.join(root, 'server', 'uploads')
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const backupRoot = path.join(root, 'server', 'backups', `local-reset-${stamp}`)

if (fs.existsSync(databaseFile)) {
  fs.mkdirSync(backupRoot, { recursive: true })
  fs.copyFileSync(databaseFile, path.join(backupRoot, path.basename(databaseFile)))
  console.log(`已备份 SQLite：${path.join(backupRoot, path.basename(databaseFile))}`)
}
if (fs.existsSync(uploadRoot)) {
  fs.mkdirSync(backupRoot, { recursive: true })
  fs.cpSync(uploadRoot, path.join(backupRoot, 'uploads'), { recursive: true })
  fs.rmSync(uploadRoot, { recursive: true, force: true })
  console.log(`已备份并清空报告文件：${path.join(backupRoot, 'uploads')}`)
}

const seed = JSON.parse(fs.readFileSync(seedFile, 'utf8'))
const empty = structuredClone(seed)
empty.profiles = {}
empty.reports = {}
empty.observations = {}
empty.aiReports = {}
empty.aiInsightReviews = {}
empty.consents = {}
empty.reportExtractions = {}
empty.orders = {}
empty.workflow = seedWorkflow()

const store = await openSqliteStore({ dbFile: databaseFile, seedFile })
store.save(empty)
store.close()
console.log('本地测试资料已清空；保留平台配置、健管师目录、服务方案与指定体检中心。')
console.log('现在可以从零测试：建档 → 健康资料 → 咨询请求 → Admin 派单 → 健管师聊天。')

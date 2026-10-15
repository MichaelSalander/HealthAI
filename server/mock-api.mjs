import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dataFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mock-db.json')
const initialState = {
  profiles: { 'u-001': { id: 'hp-001', userId: 'u-001', gender: '女', birthYear: '1992', heightCm: '165', medicalHistory: '', allergies: '', medications: '', lifestyle: '久坐，偶尔运动', updatedAt: new Date().toISOString() } },
  reports: { 'u-001': [{ id: 'r-001', name: '2024年度体检报告.pdf', date: '2024-10-10', status: '解析成功', source: '体检报告' }, { id: 'r-002', name: '2023年度体检报告.pdf', date: '2023-09-12', status: '解析成功', source: '体检报告' }] },
  observations: { 'u-001': [
    { id: 'o-001', code: 'ldl-c', name: 'LDL-C（低密度脂蛋白）', value: '4.2', unit: 'mmol/L', reference: '< 3.4', status: '偏高', measuredAt: '2024-10-10' },
    { id: 'o-002', code: 'alt', name: 'ALT（丙氨酸转氨酶）', value: '68', unit: 'U/L', reference: '< 40', status: '偏高', measuredAt: '2024-10-10' },
    { id: 'o-003', code: 'fasting-glucose', name: '空腹血糖', value: '6.8', unit: 'mmol/L', reference: '< 6.1', status: '偏高', measuredAt: '2024-10-10' },
    { id: 'o-004', code: 'blood-pressure', name: '血压', value: '120/78', unit: 'mmHg', reference: '< 140/90', status: '正常', measuredAt: '2024-12-10' },
    { id: 'o-005', code: 'weight', name: '体重', value: '62.5', unit: 'kg', reference: '目标 55.0', status: '正常', measuredAt: '2024-12-10' }
  ] },
  aiReports: { 'u-001': [] },
  homeEntries: [
    { id: 'upload', title: '上传体检报告', subtitle: 'AI 帮你初步分析', route: '/pages/report/index', enabled: true, sort: 1 },
    { id: 'manual', title: '手动录入数据', subtitle: '记录日常健康', route: '/pages/health/manual', enabled: true, sort: 2 },
    { id: 'profile', title: '完善健康档案', subtitle: '补充基础健康信息', route: '/pages/health/profile', enabled: true, sort: 3 },
    { id: 'report', title: '查看健康报告', subtitle: '历史数据管理', route: '/pages/report/index', enabled: true, sort: 4 },
    { id: 'consultant', title: '找健康管理师', subtitle: '专业解读与指导', route: '/pages/consultants/index', enabled: true, sort: 5 }
  ],
  plans: [
    { id: 'p-001', name: '初级健康管理 7天体验', level: '初级', cycle: '7天', priceFen: 19900, description: '基础健康评估、1次1V1咨询、体验专属健康管理师', enabled: true },
    { id: 'p-002', name: '初级健康管理', level: '初级', cycle: '月', priceFen: 198000, description: '健康档案、每日打卡、每月1次1V1、月度健康报告', enabled: true },
    { id: 'p-003', name: '高级健康管理', level: '高级', cycle: '月', priceFen: 298000, description: '每日数据追踪、每周1次1V1、个性化方案', enabled: true },
    { id: 'p-004', name: '慢病健康管理 7天体验', level: '慢病', cycle: '7天', priceFen: 69900, description: '慢病一对一体验与必要时转介', enabled: true }
  ]
}
let state = loadState()

function loadState() {
  try { return { ...initialState, ...JSON.parse(fs.readFileSync(dataFile, 'utf8')) } } catch { return structuredClone(initialState) }
}
function persist() { fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), 'utf8') }
function userId(url) { return url.searchParams.get('user_id') || 'u-001' }
async function readBody(req) { const chunks = []; for await (const chunk of req) chunks.push(chunk); return JSON.parse(Buffer.concat(chunks).toString() || '{}') }

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS' })
  res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {})
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/api/home-entries' && req.method === 'GET') return send(res, 200, { code: 0, data: state.homeEntries.filter(x => x.enabled).sort((a, b) => a.sort - b.sort) })
  if (url.pathname === '/api/home-entries' && req.method === 'PUT') {
    state.homeEntries = await readBody(req)
    persist()
    return send(res, 200, { code: 0, data: state.homeEntries })
  }
  if (url.pathname === '/api/plans' && req.method === 'GET') return send(res, 200, { code: 0, data: state.plans })
  if (url.pathname === '/api/plans' && req.method === 'PUT') {
    state.plans = await readBody(req)
    persist()
    return send(res, 200, { code: 0, data: state.plans })
  }
  if (url.pathname === '/api/health/profile' && req.method === 'GET') return send(res, 200, { code: 0, data: state.profiles[userId(url)] || null })
  if (url.pathname === '/api/health/profile' && req.method === 'PUT') {
    const body = await readBody(req); const id = userId(url)
    state.profiles[id] = { ...(state.profiles[id] || {}), ...body, userId: id, updatedAt: new Date().toISOString() }; persist()
    return send(res, 200, { code: 0, data: state.profiles[id] })
  }
  if (url.pathname === '/api/health/observations' && req.method === 'GET') return send(res, 200, { code: 0, data: state.observations[userId(url)] || [] })
  if (url.pathname === '/api/health/observations' && req.method === 'POST') {
    const id = userId(url); const body = await readBody(req); const item = { ...body, id: `o-${Date.now()}`, measuredAt: body.measuredAt || new Date().toISOString().slice(0, 10) }
    state.observations[id] = [item, ...(state.observations[id] || [])]; persist(); return send(res, 201, { code: 0, data: item })
  }
  if (url.pathname === '/api/health/reports' && req.method === 'GET') return send(res, 200, { code: 0, data: state.reports[userId(url)] || [] })
  if (url.pathname === '/api/health/reports' && req.method === 'POST') {
    const id = userId(url); const body = await readBody(req); const report = { id: `r-${Date.now()}`, name: body.fileName || '体检报告.pdf', date: new Date().toISOString().slice(0, 10), status: '解析成功', source: '体检报告' }
    state.reports[id] = [report, ...(state.reports[id] || [])]; persist(); return send(res, 201, { code: 0, data: report })
  }
  if (url.pathname === '/api/health/ai-reports' && req.method === 'GET') return send(res, 200, { code: 0, data: (state.aiReports[userId(url)] || [])[0] || null })
  if (url.pathname === '/api/health/ai-reports' && req.method === 'POST') {
    const id = userId(url); const report = await readBody(req); state.aiReports[id] = [report, ...(state.aiReports[id] || [])]; persist(); return send(res, 201, { code: 0, data: report })
  }
  return send(res, 404, { code: 404, message: 'Not Found' })
})

server.listen(Number(process.env.PORT || 8787), '0.0.0.0', () => console.log('HealthAI Mock API listening on http://localhost:8787'))

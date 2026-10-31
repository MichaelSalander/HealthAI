import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { handleWorkflow } from './consultation-workflow.mjs'
import { openSqliteStore } from './storage/sqlite-store.mjs'
import { exchangeMiniProgramCode, stableWechatUserId } from './wechat-auth.mjs'
import { createAiProvider } from './providers/ai-provider.mjs'
import { createOcrProvider } from './providers/ocr-provider.mjs'

const dataFile = process.env.HEALTHAI_DATA_FILE || path.join(path.dirname(fileURLToPath(import.meta.url)), 'mock-db.json')
const databaseFile = process.env.HEALTHAI_DB_FILE || path.join(path.dirname(fileURLToPath(import.meta.url)), 'healthai.sqlite')
const uploadRoot = process.env.HEALTHAI_UPLOAD_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads')
const apiVersion = 'v1'
const isProduction = process.env.NODE_ENV === 'production'
const sessionSecret = process.env.HEALTHAI_SESSION_SECRET || 'development-only-change-this-secret'
const sessionTtlSeconds = Number(process.env.HEALTHAI_SESSION_TTL_SECONDS || 86400)
const corsOrigin = process.env.HEALTHAI_CORS_ORIGIN || '*'
const corsOrigins = corsOrigin.split(',').map(item => item.trim()).filter(Boolean)
if (isProduction && sessionSecret === 'development-only-change-this-secret') throw new Error('生产环境必须设置 HEALTHAI_SESSION_SECRET')
if (isProduction && corsOrigin === '*') throw new Error('生产环境必须设置 HEALTHAI_CORS_ORIGIN，禁止使用 *')
const wechatConfig = { appId: process.env.WECHAT_APP_ID, appSecret: process.env.WECHAT_APP_SECRET, testMode: process.env.WECHAT_TEST_MODE === 'true' }
if (isProduction && wechatConfig.testMode) throw new Error('生产环境必须关闭 WECHAT_TEST_MODE')
const ocrProvider = createOcrProvider()
const aiProvider = createAiProvider()
function loadOperatorAccounts() {
  const raw = process.env.HEALTHAI_OPERATOR_ACCOUNTS_JSON
  if (raw) {
    try {
      const accounts = JSON.parse(raw)
      if (Array.isArray(accounts)) return accounts.filter(item => item && ['admin', 'consultant'].includes(item.role) && item.username && item.password && item.id)
    } catch { throw new Error('HEALTHAI_OPERATOR_ACCOUNTS_JSON 格式无效') }
  }
  if (isProduction) return []
  return [
    { id: 'admin-001', role: 'admin', name: '管理员', username: 'admin', password: 'admin123' },
    { id: 'c-101', role: 'consultant', name: '陈晨', username: 'c-101', password: 'c-101' }
  ]
}
const operatorAccounts = loadOperatorAccounts()
const initialState = {
  consultantCategories: [
    { id: 'cat-01', name: '体重管理', enabled: true, sort: 1 }, { id: 'cat-02', name: '慢病管理', enabled: true, sort: 2 },
    { id: 'cat-03', name: '肠道健康', enabled: true, sort: 3 }, { id: 'cat-04', name: '睡眠管理', enabled: true, sort: 4 },
    { id: 'cat-05', name: '女性健康', enabled: true, sort: 5 }, { id: 'cat-06', name: '运动营养', enabled: true, sort: 6 },
    { id: 'cat-07', name: '心理压力', enabled: true, sort: 7 }, { id: 'cat-08', name: '抗衰老', enabled: true, sort: 8 },
    { id: 'cat-09', name: '亚健康管理', enabled: true, sort: 9 }
  ],
  healthCenters: [
    { id: 'hc-001', name: '华康体检中心（静安店）', address: '上海市静安区南京西路 888 号', distanceKm: 1.8, phone: '', items: ['血常规', '血糖', '血脂', '肝功能'], enabled: true, sort: 1 },
    { id: 'hc-002', name: '瑞慈健康体检中心（浦东店）', address: '上海市浦东新区世纪大道 100 号', distanceKm: 4.2, phone: '', items: ['基础血液检查套餐'], enabled: true, sort: 2 }
  ],
  contentSettings: { companyTitle: '健康，从理解自己开始', companySubtitle: 'AI 健康分析 · 真人健康管理 · 长期陪伴', companyPhilosophy: '我们帮助用户把分散的体检报告、日常记录与健康服务连接起来，用清晰易懂的方式理解自己的身体，再由专业健康管理师陪伴完成长期改善。', privacyTitle: '数据与隐私', privacyDescription: '健康资料仅在获得授权的范围内用于分析与健康管理服务。', resultDisclaimer: '以上为基础健康结果，仅供参考，不作为医疗诊断或治疗建议。', resultConsultationTitle: '建议你咨询健康管理师', resultConsultationDescription: '获取专业的分析解读和个性化建议。', metricExplanations: [{ code: 'ldl-c', name: 'LDL-C（低密度脂蛋白）', explanation: '血脂相关指标，结果略高时建议结合饮食、运动和历史趋势观察。', enabled: true, sort: 1 }, { code: 'fasting-glucose', name: '空腹血糖', explanation: '血糖相关指标，单次结果不能单独下结论，建议结合复查与生活方式记录。', enabled: true, sort: 2 }, { code: 'alt', name: 'ALT（丙氨酸转氨酶）', explanation: '肝功能相关指标，建议结合既往结果与专业人员建议综合理解。', enabled: true, sort: 3 }] },
  educationArticles: [
    { id: 'edu-001', title: '认识血糖与日常饮食', category: '血糖管理', summary: '了解日常饮食与血糖波动的关系。', body: '规律饮食、均衡搭配并结合个人健康状况，是日常血糖管理的基础。', status: 'published', publishedAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', sort: 1 },
    { id: 'edu-002', title: '如何看懂体检报告中的血脂指标', category: '指标解读', summary: '用简单方式认识总胆固醇、LDL-C 等常见指标。', body: '指标应结合参考范围、既往趋势与专业人员建议综合理解。', status: 'published', publishedAt: '2026-10-02T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z', sort: 2 },
    { id: 'edu-003', title: '睡眠、压力与体重管理', category: '生活方式', summary: '认识睡眠与压力对日常健康管理的影响。', body: '稳定作息、适度运动和持续记录有助于发现个人健康趋势。', status: 'draft', updatedAt: '2026-10-03T00:00:00.000Z', sort: 3 }
  ],
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
  consents: {},
  reportExtractions: {},
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
  ],
  orders: { 'u-001': [] },
  consultantAvailability: { 'c-001': { consultantId: 'c-001', status: 'available', dailyLimit: 10, bookedCount: 2, freeConsultEnabled: true, slots: ['今天 14:00', '今天 16:30', '明天 10:00', '明天 15:00'] } },
  bookings: [],
  notifications: []
}
const databaseMode = process.env.HEALTHAI_DB || 'sqlite'
const sqliteStore = databaseMode === 'json' ? null : await openSqliteStore({ dbFile: databaseFile, seedFile: dataFile })
let state = loadState()
state.contentSettings = { ...structuredClone(initialState.contentSettings), ...(state.contentSettings || {}) }
state.contentSettings.metricExplanations ||= structuredClone(initialState.contentSettings.metricExplanations)
state.consultantCategories ||= structuredClone(initialState.consultantCategories)
state.healthCenters ||= structuredClone(initialState.healthCenters)
state.educationArticles ||= structuredClone(initialState.educationArticles)

function loadState() {
  try { return { ...initialState, ...(sqliteStore ? sqliteStore.load() : JSON.parse(fs.readFileSync(dataFile, 'utf8'))) } } catch { return structuredClone(initialState) }
}
function persist() { if (sqliteStore) sqliteStore.save(state); else fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), 'utf8') }
function base64url(value) { return Buffer.from(value).toString('base64url') }
function issueToken(actor) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const payload = base64url(JSON.stringify({ sub: actor.id, role: actor.role, name: actor.name, exp: Math.floor(Date.now() / 1000) + sessionTtlSeconds }))
  const signature = createHmac('sha256', sessionSecret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}
function verifyToken(token) {
  const [header, payload, signature] = String(token || '').split('.'); if (!header || !payload || !signature) return undefined
  const expected = createHmac('sha256', sessionSecret).update(`${header}.${payload}`).digest(); const actual = Buffer.from(signature, 'base64url'); if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return undefined
  try { const data = JSON.parse(Buffer.from(payload, 'base64url').toString()); if (!data.sub || !data.role || !data.exp || data.exp <= Math.floor(Date.now() / 1000)) return undefined; return { id: data.sub, role: data.role, name: data.name || data.sub } } catch { return undefined }
}
function secretTextEqual(left, right) {
  const a = createHmac('sha256', sessionSecret).update(String(left || '')).digest()
  const b = createHmac('sha256', sessionSecret).update(String(right || '')).digest()
  return timingSafeEqual(a, b)
}
function resolvedCorsOrigin(req) {
  if (corsOrigins.includes('*')) return '*'
  const requestOrigin = req.headers.origin
  return requestOrigin && corsOrigins.includes(requestOrigin) ? requestOrigin : corsOrigins[0] || 'null'
}
function actorFromRequest(req) { return verifyToken((req.headers.authorization || '').replace(/^Bearer /, '')) }
function requireActor(req, roles = []) {
  const actor = actorFromRequest(req)
  if (!actor) { const error = new Error('请先登录'); error.status = 401; throw error }
  if (roles.length && !roles.includes(actor.role)) { const error = new Error('没有权限执行此操作'); error.status = 403; throw error }
  return actor
}
function requireHealthDataConsent(actor) {
  const active = (state.consents?.[actor.id] || []).some(item => item.consentType === 'health_data' && item.status === 'granted')
  if (!active) { const error = new Error('请先完成健康资料授权'); error.status = 403; error.code = 'HEALTH_DATA_CONSENT_REQUIRED'; throw error }
}
async function readBody(req) {
  const chunks = []; let total = 0; const maxBytes = 30 * 1024 * 1024
  for await (const chunk of req) { total += chunk.length; if (total > maxBytes) { const error = new Error('请求文件不能超过 20MB'); error.status = 413; throw error } chunks.push(chunk) }
  return JSON.parse(Buffer.concat(chunks).toString() || '{}')
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': resolvedCorsOrigin(res.__healthaiRequest || { headers: {} }), 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' })
  res.end(JSON.stringify({ message: status < 400 ? 'ok' : '请求失败', requestId: randomUUID(), ...body }))
}
function sendFile(res, status, buffer, contentType, fileName) {
  res.writeHead(status, { 'Content-Type': contentType || 'application/octet-stream', 'Content-Length': buffer.length, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`, 'Access-Control-Allow-Origin': resolvedCorsOrigin(res.__healthaiRequest || { headers: {} }), 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' })
  res.end(buffer)
}
function reportView(report) {
  const { storagePath, ...publicReport } = report
  return { ...publicReport, fileAvailable: Boolean(storagePath) }
}

const server = http.createServer(async (req, res) => {
  try {
  res.__healthaiRequest = req
  if (req.method === 'OPTIONS') return send(res, 204, {})
  const url = new URL(req.url, 'http://localhost')
  const route = url.pathname.replace(/^\/api\/v1(?=\/|$)/, '/api')
  // 供 Cloudways/Nginx/监控探针使用，不需要登录，也不暴露业务数据。
  if (route === '/healthz' && req.method === 'GET') return send(res, 200, { code: 0, data: { service: 'healthai-api', status: 'ok', version: apiVersion } })
  if (route === '/api/auth/operator-login' && req.method === 'POST') {
    const body = await readBody(req)
    if (!['admin', 'consultant'].includes(body.role) || typeof body.username !== 'string' || typeof body.password !== 'string') return send(res, 400, { code: 400, message: '登录信息不完整' })
    const account = operatorAccounts.find(item => item.role === body.role && item.username === body.username && secretTextEqual(item.password, body.password))
    if (!account) return send(res, operatorAccounts.length ? 401 : 503, { code: operatorAccounts.length ? 401 : 503, message: operatorAccounts.length ? '用户名或密码错误' : '尚未配置运营人员账号' })
    const actor = { id: account.id, role: account.role, name: account.name || account.username }
    return send(res, 200, { code: 0, data: { token: issueToken(actor), ...actor, expiresIn: sessionTtlSeconds } })
  }
  if (route === '/api/auth/demo-login' && req.method === 'POST') {
    if (isProduction) return send(res, 403, { code: 403, message: '生产环境不开放演示登录' })
    const body = await readBody(req)
    const role = body.role
    if (!['customer', 'consultant', 'admin'].includes(role)) return send(res, 400, { code: 400, message: '角色无效' })
    const id = role === 'admin' ? 'admin-001' : role === 'consultant' ? (['c-101', 'c-102', 'c-103'].includes(body.id) ? body.id : 'c-101') : body.id === 'u-no-blood' ? 'u-no-blood' : 'u-001'
    const actor = { id, role, name: role === 'customer' ? (id === 'u-001' ? '张小美' : '无血检测试用户') : role === 'admin' ? '管理员' : id === 'c-102' ? '林悦' : id === 'c-103' ? '周宁' : '陈晨' }
    const token = issueToken(actor)
    return send(res, 200, { code: 0, data: { token, ...actor, expiresIn: sessionTtlSeconds } })
  }
  if (route === '/api/auth/wechat-login' && req.method === 'POST') {
    const body = await readBody(req)
    const identity = await exchangeMiniProgramCode(body.code, wechatConfig)
    // 体验模式允许切换角色，生产环境只能使用后端已绑定的角色，不能由客户端自报身份。
    const requestedRole = isProduction ? 'customer' : (body.role === 'consultant' ? 'consultant' : 'customer')
    const identityKey = `${identity.openid}:${requestedRole}`
    state.wechatIdentities ||= {}
    let account = isProduction
      ? (state.wechatIdentities[`${identity.openid}:consultant`] || state.wechatIdentities[`${identity.openid}:customer`])
      : state.wechatIdentities[identityKey]
    if (!account) {
      if (wechatConfig.testMode) {
        account = { id: requestedRole === 'consultant' ? (process.env.WECHAT_TEST_CONSULTANT_ID || 'c-101') : (process.env.WECHAT_TEST_CUSTOMER_ID || 'u-001'), role: requestedRole }
      } else {
        account = { id: stableWechatUserId(identity.openid, requestedRole), role: requestedRole }
      }
      state.wechatIdentities[identityKey] = { ...account, openid: identity.openid, unionid: identity.unionid, createdAt: new Date().toISOString() }
      persist()
    }
    const actor = { id: account.id, role: account.role, name: account.role === 'consultant' ? '陈晨' : '微信用户' }
    const token = issueToken(actor)
    return send(res, 200, { code: 0, data: { token, ...actor, provider: 'wechat-mini-program', expiresIn: sessionTtlSeconds } })
  }
  const workflowRoutes = route === '/api/consultation-directory' || route.startsWith('/api/consultation-directory/') || route.startsWith('/api/consultations/') || route.startsWith('/api/consultation-requests') || route.startsWith('/api/conversations') || route.startsWith('/api/voice-sessions') || route.startsWith('/api/consultation-notifications') || route.startsWith('/api/consultant/')
  if (workflowRoutes) {
    const actor = actorFromRequest(req)
    const body = ['POST', 'PUT'].includes(req.method) ? await readBody(req) : {}
    const data = handleWorkflow({ state, route, method: req.method, body, actor, query: url.searchParams })
    if (data === undefined) return send(res, 404, { code: 404, message: '接口不存在' })
    if (req.method !== 'GET') persist()
    return send(res, 200, { code: 0, data })
  }
  if (route === '/api/status' && req.method === 'GET') return send(res, 200, { code: 0, data: { service: 'healthai-api', version: apiVersion, status: 'ok' } })
  if (route === '/api/health-centers' && req.method === 'GET') {
    const actor = actorFromRequest(req); const centers = state.healthCenters ||= structuredClone(initialState.healthCenters)
    return send(res, 200, { code: 0, data: centers.filter(item => actor?.role === 'admin' || item.enabled).sort((a, b) => a.sort - b.sort) })
  }
  if (route === '/api/health-centers' && req.method === 'PUT') {
    requireActor(req, ['admin']); const body = await readBody(req)
    if (!Array.isArray(body) || body.length > 100) { const error = new Error('体检中心数据格式无效'); error.status = 400; throw error }
    const ids = new Set(); state.healthCenters = body.map((item, index) => {
      const id = String(item?.id || ('hc-' + randomUUID().slice(0, 8))); const name = String(item?.name || '').trim(); const address = String(item?.address || '').trim()
      const items = Array.isArray(item?.items) ? item.items.map(String).map(value => value.trim()).filter(Boolean) : []
      if (!name || !address || !items.length || ids.has(id)) { const error = new Error('体检中心名称、地址、检查项目不能为空且 ID 不能重复'); error.status = 400; throw error }
      ids.add(id); return { id, name, address, distanceKm: Number.isFinite(item.distanceKm) ? Number(item.distanceKm) : undefined, phone: String(item.phone || '').trim(), items, enabled: Boolean(item.enabled), sort: Number.isInteger(item.sort) ? item.sort : index + 1 }
    }); persist(); return send(res, 200, { code: 0, data: state.healthCenters })
  }
  if (route === '/api/admin/users' && req.method === 'GET') {
    const actor = requireActor(req, ['admin']); const workflow = state.workflow || { consultants: [], bookings: [], consultationRequests: [] }
    const customerIds = new Set([...Object.keys(state.profiles || {}), ...Object.keys(state.reports || {}), ...Object.keys(state.observations || {}), ...Object.keys(state.orders || {}), ...workflow.bookings.map(item => item.userId), ...workflow.consultationRequests.map(item => item.userId)])
    const customers = [...customerIds].map(id => {
      const request = [...workflow.consultationRequests].reverse().find(item => item.userId === id); const booking = [...workflow.bookings].reverse().find(item => item.userId === id)
      const consultantId = request?.consultantId || booking?.consultantId; const consultant = workflow.consultants.find(item => item.id === consultantId)
      return { id, name: request?.userName || booking?.userName || (id === 'u-001' ? '张小美' : id), role: 'customer', consultant: consultant?.name || '', status: request?.status === 'in_progress' || booking?.status === 'accepted' ? '服务中' : '正常', reportCount: (state.reports[id] || []).length, observationCount: (state.observations[id] || []).length, createdAt: state.profiles[id]?.updatedAt || null }
    })
    const consultants = workflow.consultants.map(item => ({ id: item.id, name: item.name, role: 'consultant', consultant: '', status: item.status === 'offline' ? '离线' : '已认证', reportCount: 0, observationCount: 0, createdAt: null }))
    return send(res, 200, { code: 0, data: [...customers, ...consultants] })
  }
  if (route === '/api/consultant-categories' && req.method === 'GET') {
    state.consultantCategories ||= structuredClone(initialState.consultantCategories)
    const counts = new Map((state.workflow?.consultants || []).flatMap(item => (item.categories || []).map(category => [category, 1])).reduce((all, [category]) => all.set(category, (all.get(category) || 0) + 1), new Map()))
    return send(res, 200, { code: 0, data: state.consultantCategories.filter(item => item.enabled).sort((a, b) => a.sort - b.sort).map(item => ({ ...item, count: counts.get(item.name) || 0 })) })
  }
  if (route === '/api/consultant-categories' && req.method === 'PUT') {
    const actor = requireActor(req, ['admin']); const body = await readBody(req)
    if (!Array.isArray(body) || body.length > 50) { const error = new Error('分类数据格式无效'); error.status = 400; throw error }
    const names = new Set(); state.consultantCategories = body.map((item, index) => {
      const name = String(item?.name || '').trim(); if (!name || names.has(name)) { const error = new Error('分类名称不能为空且不能重复'); error.status = 400; throw error }
      names.add(name); return { id: String(item.id || `cat-${randomUUID().slice(0, 8)}`), name, enabled: Boolean(item.enabled), sort: Number.isInteger(item.sort) ? item.sort : index + 1 }
    }); persist(); return send(res, 200, { code: 0, data: state.consultantCategories })
  }
  if (route === '/api/auth/mock-login' && req.method === 'POST') {
    if (isProduction) return send(res, 403, { code: 403, message: '生产环境不开放演示登录' })
    const actor = { id: 'u-001', name: '张小美', role: 'customer' }; return send(res, 200, { code: 0, data: { accessToken: issueToken(actor), refreshToken: 'development-only', user: actor, expiresIn: sessionTtlSeconds } })
  }
  if (route === '/api/home-entries' && req.method === 'GET') return send(res, 200, { code: 0, data: state.homeEntries.filter(x => x.enabled).sort((a, b) => a.sort - b.sort) })
  if (route === '/api/home-entries' && req.method === 'PUT') {
    requireActor(req, ['admin'])
    const entries = await readBody(req)
    if (!Array.isArray(entries) || entries.some(item => !item?.id || typeof item.title !== 'string' || typeof item.subtitle !== 'string' || typeof item.route !== 'string' || typeof item.enabled !== 'boolean' || !Number.isInteger(item.sort))) { const error = new Error('首页配置格式无效'); error.status = 400; throw error }
    state.homeEntries = entries
    persist()
    return send(res, 200, { code: 0, data: state.homeEntries })
  }
  if (route === '/api/content-settings' && req.method === 'GET') return send(res, 200, { code: 0, data: state.contentSettings })
  if (route === '/api/content-settings' && req.method === 'PUT') {
    requireActor(req, ['admin'])
    const settings = await readBody(req)
    if (!settings || typeof settings.resultDisclaimer !== 'string' || typeof settings.resultConsultationTitle !== 'string' || typeof settings.resultConsultationDescription !== 'string' || !Array.isArray(settings.metricExplanations)) { const error = new Error('结果文案格式无效'); error.status = 400; throw error }
    const codes = new Set(); const metricExplanations = settings.metricExplanations.map((item, index) => { const code = String(item?.code || '').trim(); const name = String(item?.name || '').trim(); const explanation = String(item?.explanation || '').trim(); if (!code || !name || !explanation || codes.has(code)) { const error = new Error('指标解释格式无效或代码重复'); error.status = 400; throw error } codes.add(code); return { code, name, explanation, enabled: Boolean(item.enabled), sort: Number.isInteger(item.sort) ? item.sort : index + 1 } })
    const companyTitle = String((settings.companyTitle ?? state.contentSettings.companyTitle) || '').trim()
    const companySubtitle = String((settings.companySubtitle ?? state.contentSettings.companySubtitle) || '').trim()
    const companyPhilosophy = String((settings.companyPhilosophy ?? state.contentSettings.companyPhilosophy) || '').trim()
    const privacyTitle = String((settings.privacyTitle ?? state.contentSettings.privacyTitle) || '').trim()
    const privacyDescription = String((settings.privacyDescription ?? state.contentSettings.privacyDescription) || '').trim()
    if (!companyTitle || !companySubtitle || !companyPhilosophy || !privacyTitle || !privacyDescription) { const error = new Error('公司介绍与隐私文案不能为空'); error.status = 400; throw error }
    state.contentSettings = { companyTitle, companySubtitle, companyPhilosophy, privacyTitle, privacyDescription, resultDisclaimer: settings.resultDisclaimer.trim(), resultConsultationTitle: settings.resultConsultationTitle.trim(), resultConsultationDescription: settings.resultConsultationDescription.trim(), metricExplanations }
    persist()
    return send(res, 200, { code: 0, data: state.contentSettings })
  }
  if (route === '/api/education/articles' && req.method === 'GET') {
    const actor = actorFromRequest(req)
    const articles = actor?.role === 'admin' ? (state.educationArticles || []) : (state.educationArticles || []).filter(item => item.status === 'published')
    return send(res, 200, { code: 0, data: articles.sort((a, b) => a.sort - b.sort) })
  }
  if (route === '/api/education/articles' && req.method === 'PUT') {
    requireActor(req, ['admin'])
    const articles = await readBody(req)
    if (!Array.isArray(articles) || articles.length > 100) { const error = new Error('卫教文章格式无效'); error.status = 400; throw error }
    state.educationArticles = articles.map((item, index) => {
      const title = String(item?.title || '').trim(); const category = String(item?.category || '').trim(); const summary = String(item?.summary || '').trim(); const body = String(item?.body || '').trim()
      if (!title || !category || !body || !['draft', 'published'].includes(item?.status)) { const error = new Error('卫教文章内容不完整'); error.status = 400; throw error }
      const updatedAt = new Date().toISOString(); const publishedAt = item.status === 'published' ? (item.publishedAt || updatedAt) : undefined
      return { id: String(item.id || `edu-${randomUUID().slice(0, 8)}`), title, category, summary, body, status: item.status, ...(publishedAt ? { publishedAt } : {}), updatedAt, sort: Number.isInteger(item.sort) ? item.sort : index + 1 }
    })
    persist(); return send(res, 200, { code: 0, data: state.educationArticles })
  }
  if (route === '/api/plans' && req.method === 'GET') return send(res, 200, { code: 0, data: state.plans })
  if (route === '/api/plans' && req.method === 'PUT') {
    requireActor(req, ['admin'])
    const plans = await readBody(req)
    if (!Array.isArray(plans) || plans.some(item => !item?.id || typeof item.name !== 'string' || !Number.isInteger(item.priceFen) || item.priceFen < 0 || typeof item.enabled !== 'boolean')) { const error = new Error('服务方案格式无效'); error.status = 400; throw error }
    state.plans = plans
    persist()
    return send(res, 200, { code: 0, data: state.plans })
  }
  if (route === '/api/orders' && req.method === 'GET') {
    const actor = requireActor(req, ['customer']); return send(res, 200, { code: 0, data: state.orders?.[actor.id] || [] })
  }
  if (route === '/api/orders' && req.method === 'POST') {
    const actor = requireActor(req, ['customer']); const body = await readBody(req); const plan = state.plans.find(item => item.id === body.planId && item.enabled !== false)
    if (!plan) { const error = new Error('服务方案不存在或已下架'); error.status = 404; throw error }
    state.orders ||= {}; state.orders[actor.id] ||= []
    const existing = state.orders[actor.id].find(item => item.planId === plan.id && item.status === '待付款')
    if (existing) return send(res, 200, { code: 0, data: existing })
    const order = { id: `order-${Date.now()}-${randomUUID().slice(0, 8)}`, planId: plan.id, planName: plan.name, priceFen: plan.priceFen, status: '待付款', paymentStatus: 'unpaid', createdAt: new Date().toISOString() }
    state.orders[actor.id].unshift(order); persist(); return send(res, 201, { code: 0, data: order })
  }
  const payRoute = route.match(/^\/api\/orders\/([^/]+)\/mock-pay$/)
  if (payRoute && req.method === 'POST') {
    const actor = requireActor(req, ['customer']); const order = (state.orders?.[actor.id] || []).find(item => item.id === payRoute[1])
    if (!order) { const error = new Error('订单不存在'); error.status = 404; throw error }
    if (order.status === '已取消') { const error = new Error('订单已取消'); error.status = 409; throw error }
    order.status = '服务中'; order.paymentStatus = 'success'; order.paidAt = new Date().toISOString(); persist(); return send(res, 200, { code: 0, data: order })
  }
  if (route === '/api/health/profile' && req.method === 'GET') {
    const actor = requireActor(req, ['customer'])
    return send(res, 200, { code: 0, data: state.profiles[actor.id] || null })
  }
  if (route === '/api/health/profile/completeness' && req.method === 'GET') {
    const actor = requireActor(req, ['customer']); const profile = state.profiles[actor.id] || {}
    const fields = ['gender', 'birthYear', 'heightCm', 'medicalHistory', 'allergies', 'medications', 'lifestyle']
    const completed = fields.filter(field => String(profile[field] || '').trim()).length
    return send(res, 200, { code: 0, data: { score: Math.round(completed / fields.length * 100), completedFields: completed, totalFields: fields.length, missingFields: fields.filter(field => !String(profile[field] || '').trim()) } })
  }
  if (route === '/api/health/consents' && req.method === 'GET') {
    const actor = requireActor(req, ['customer'])
    return send(res, 200, { code: 0, data: state.consents?.[actor.id] || [] })
  }
  if (route === '/api/health/consents' && req.method === 'POST') {
    const actor = requireActor(req, ['customer']); const body = await readBody(req)
    const consentType = ['health_data', 'privacy', 'service'].includes(body.consentType) ? body.consentType : null
    const status = ['granted', 'revoked'].includes(body.status) ? body.status : null
    const version = typeof body.version === 'string' && body.version.trim() ? body.version.trim() : null
    if (!consentType || !status || !version) { const error = new Error('授权类型、版本与状态不能为空'); error.status = 400; throw error }
    const now = new Date().toISOString(); const record = { id: `consent-${Date.now()}-${randomUUID().slice(0, 8)}`, userId: actor.id, consentType, version, status, consentedAt: now, ...(status === 'revoked' ? { revokedAt: now } : {}) }
    state.consents ||= {}; state.consents[actor.id] = [record, ...(state.consents[actor.id] || []).filter(item => item.consentType !== consentType || item.status === 'revoked')]; persist()
    return send(res, 201, { code: 0, data: record })
  }
  if (route === '/api/health/profile' && req.method === 'PUT') {
    const actor = requireActor(req, ['customer']); requireHealthDataConsent(actor); const body = await readBody(req); const id = actor.id
    state.profiles[id] = { ...(state.profiles[id] || {}), ...body, userId: id, updatedAt: new Date().toISOString() }; persist()
    return send(res, 200, { code: 0, data: state.profiles[id] })
  }
  if (route === '/api/health/observations' && req.method === 'GET') {
    const actor = requireActor(req, ['customer'])
    return send(res, 200, { code: 0, data: state.observations[actor.id] || [] })
  }
  if (route === '/api/health/trends' && req.method === 'GET') {
    const actor = requireActor(req, ['customer']); const code = url.searchParams.get('code') || ''
    const items = (state.observations[actor.id] || [])
      .filter(item => item.code === code)
      .map(item => ({ label: String(item.measuredAt || '').slice(0, 7), value: Number.parseFloat(String(item.value)) }))
      .filter(item => item.label && Number.isFinite(item.value))
      .reverse()
    return send(res, 200, { code: 0, data: items })
  }
  if (route === '/api/health/observations' && req.method === 'POST') {
    const actor = requireActor(req, ['customer']); requireHealthDataConsent(actor); const id = actor.id; const body = await readBody(req); const item = { ...body, id: `o-${Date.now()}`, measuredAt: body.measuredAt || new Date().toISOString().slice(0, 10) }
    state.observations[id] = [item, ...(state.observations[id] || [])]; persist(); return send(res, 201, { code: 0, data: item })
  }
  if (route === '/api/health/data-sources' && req.method === 'GET') {
    const actor = requireActor(req, ['customer']); const reports = (state.reports[actor.id] || []).map(reportView); const observations = state.observations[actor.id] || []
    const manualEntries = observations.filter(item => item.sourceType === 'manual')
    const timestamps = [...reports.map(item => item.date), ...observations.map(item => item.measuredAt)].filter(Boolean).sort().reverse()
    return send(res, 200, { code: 0, data: { reports, manualEntries, lastUpdatedAt: timestamps[0] || null } })
  }
  if (route === '/api/health/blood-test-status' && req.method === 'GET') {
    const actor = requireActor(req, ['customer'])
    return send(res, 200, { code: 0, data: { hasBloodTest: (state.reports[actor.id] || []).some(r => r.kind === 'blood_test' && r.status === '解析成功') } })
  }
  if (route === '/api/health/reports' && req.method === 'GET') {
    const actor = requireActor(req, ['customer'])
    return send(res, 200, { code: 0, data: (state.reports[actor.id] || []).map(reportView) })
  }
  if (route === '/api/health/reports' && req.method === 'POST') {
    const actor = requireActor(req, ['customer']); requireHealthDataConsent(actor); const id = actor.id; const body = await readBody(req)
    const fileName = typeof body.fileName === 'string' && body.fileName.trim() ? path.basename(body.fileName.trim()) : '体检报告.pdf'
    const kind = body.kind === 'blood_test' ? 'blood_test' : 'general'
    const fileBase64 = typeof body.fileBase64 === 'string' ? body.fileBase64 : ''
    let storagePath
    if (fileBase64) {
      const raw = fileBase64.replace(/^data:[^;]+;base64,/, '')
      const buffer = Buffer.from(raw, 'base64')
      if (!buffer.length || buffer.length > 20 * 1024 * 1024) { const error = new Error('文件内容无效或超过 20MB'); error.status = 400; throw error }
      const folder = path.join(uploadRoot, actor.id); fs.mkdirSync(folder, { recursive: true })
      const storedName = `${Date.now()}-${randomUUID()}-${fileName}`
      fs.writeFileSync(path.join(folder, storedName), buffer)
      storagePath = path.relative(uploadRoot, path.join(folder, storedName)).replaceAll(path.sep, '/')
    }
    const reportId = `r-${Date.now()}`; const measuredAt = new Date().toISOString().slice(0, 10)
    const report = { id: reportId, name: fileName, kind, date: measuredAt, status: kind === 'blood_test' ? '待确认' : '解析成功', source: '体检报告', uploadedBy: actor.id, mimeType: typeof body.mimeType === 'string' ? body.mimeType : undefined, sizeBytes: Number.isFinite(body.sizeBytes) ? body.sizeBytes : undefined, storagePath, parseMode: 'mock' }
    if (kind === 'blood_test') {
      state.reportExtractions ||= {}
      try {
        const extraction = await ocrProvider.extract({ reportId, measuredAt })
        state.reportExtractions[reportId] = { id: `extract-${reportId}`, ...extraction, createdAt: new Date().toISOString() }
      } catch (error) {
        report.status = '解析失败'
        state.reportExtractions[reportId] = { id: `extract-${reportId}`, reportId, provider: ocrProvider.name, status: 'failed', candidates: [], errorMessage: error instanceof Error ? error.message : '报告解析失败，请稍后重试', createdAt: new Date().toISOString() }
      }
    }
    state.reports[id] = [report, ...(state.reports[id] || [])]; persist(); return send(res, 201, { code: 0, data: reportView(report) })
  }
  const reportFileRoute = route.match(/^\/api\/health\/reports\/([^/]+)\/file$/)
  if (reportFileRoute && req.method === 'GET') {
    const actor = requireActor(req, ['customer', 'consultant', 'admin']); const reportId = reportFileRoute[1]
    const ownerId = Object.keys(state.reports || {}).find(userId => (state.reports[userId] || []).some(report => report.id === reportId))
    const report = ownerId ? state.reports[ownerId].find(item => item.id === reportId) : undefined
    if (!report || !ownerId) { const error = new Error('报告不存在'); error.status = 404; throw error }
    const assigned = actor.role === 'admin' || actor.id === ownerId || (actor.role === 'consultant' && ((state.workflow?.bookings || []).some(item => item.userId === ownerId && item.consultantId === actor.id) || (state.workflow?.consultationRequests || []).some(item => item.userId === ownerId && item.consultantId === actor.id)))
    if (!assigned) { const error = new Error('无权查看此报告'); error.status = 403; throw error }
    if (!report.storagePath) { const error = new Error('该报告原文件不可用'); error.status = 404; throw error }
    const root = path.resolve(uploadRoot); const filePath = path.resolve(root, report.storagePath)
    if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath)) { const error = new Error('报告原文件不存在'); error.status = 404; throw error }
    return sendFile(res, 200, fs.readFileSync(filePath), report.mimeType || 'application/octet-stream', report.name)
  }
  const extractionRoute = route.match(/^\/api\/health\/reports\/([^/]+)\/extractions$/)
  if (extractionRoute && req.method === 'GET') {
    const actor = requireActor(req, ['customer']); const reportId = extractionRoute[1]
    if (!(state.reports[actor.id] || []).some(report => report.id === reportId)) { const error = new Error('报告不存在'); error.status = 404; throw error }
    return send(res, 200, { code: 0, data: state.reportExtractions?.[reportId] || { id: `extract-${reportId}`, reportId, provider: 'none', status: 'confirmed', candidates: [], createdAt: new Date().toISOString() } })
  }
  const retryExtractionRoute = route.match(/^\/api\/health\/reports\/([^/]+)\/retry-extraction$/)
  if (retryExtractionRoute && req.method === 'POST') {
    const actor = requireActor(req, ['customer']); const reportId = retryExtractionRoute[1]
    const report = (state.reports[actor.id] || []).find(item => item.id === reportId)
    const previous = state.reportExtractions?.[reportId]
    if (!report || report.kind !== 'blood_test') { const error = new Error('血液检测报告不存在'); error.status = 404; throw error }
    if (!previous || previous.status !== 'failed') { const error = new Error('当前报告不需要重新解析'); error.status = 409; throw error }
    try {
      const extraction = await ocrProvider.extract({ reportId, measuredAt: report.date })
      state.reportExtractions[reportId] = { id: `extract-${reportId}`, ...extraction, createdAt: new Date().toISOString() }
      report.status = '待确认'; persist(); return send(res, 200, { code: 0, data: state.reportExtractions[reportId] })
    } catch (error) {
      previous.errorMessage = error instanceof Error ? error.message : '报告解析失败，请稍后重试'; previous.createdAt = new Date().toISOString(); persist()
      return send(res, 200, { code: 0, data: previous })
    }
  }
  const confirmRoute = route.match(/^\/api\/health\/reports\/([^/]+)\/confirm$/)
  if (confirmRoute && req.method === 'POST') {
    const actor = requireActor(req, ['customer']); const reportId = confirmRoute[1]; const report = (state.reports[actor.id] || []).find(item => item.id === reportId); const extraction = state.reportExtractions?.[reportId]
    if (!report || !extraction) { const error = new Error('报告解析结果不存在'); error.status = 404; throw error }
    if (extraction.status === 'confirmed') return send(res, 200, { code: 0, data: (state.observations[actor.id] || []).filter(item => item.sourceRef === reportId) })
    if (extraction.status === 'failed') { const error = new Error(extraction.errorMessage || '报告解析失败，请重新解析'); error.status = 409; throw error }
    const body = await readBody(req); const candidates = Array.isArray(body.candidates) ? body.candidates : extraction.candidates
    if (!candidates.length) { const error = new Error('至少需要确认一项指标'); error.status = 400; throw error }
    const confirmedAt = new Date().toISOString(); const observations = candidates.map(candidate => ({ id: `o-${Date.now()}-${candidate.code}`, code: String(candidate.code), name: String(candidate.name), value: String(candidate.value), unit: String(candidate.unit), reference: String(candidate.reference || ''), status: ['正常', '偏高', '偏低'].includes(candidate.status) ? candidate.status : '正常', measuredAt: String(candidate.measuredAt || report.date), sourceType: 'report', sourceRef: reportId, confidence: Number(candidate.confidence || 0), confirmedAt }))
    state.observations[actor.id] = [...observations, ...(state.observations[actor.id] || []).filter(item => item.sourceRef !== reportId)]
    extraction.status = 'confirmed'; extraction.confirmedAt = confirmedAt; report.status = '解析成功'; persist(); return send(res, 200, { code: 0, data: observations })
  }
  if (route === '/api/health/ai-reports' && req.method === 'GET') {
    const actor = requireActor(req, ['customer'])
    return send(res, 200, { code: 0, data: (state.aiReports[actor.id] || [])[0] || null })
  }
  if (route === '/api/health/results/latest' && req.method === 'GET') {
    const actor = requireActor(req, ['customer']); const observations = state.observations[actor.id] || []; const latest = (state.aiReports[actor.id] || [])[0] || null
    return send(res, 200, { code: 0, data: { score: observations.length ? 85 : 0, summary: latest?.summary || '', attention: observations.filter(item => item.status !== '正常'), generatedAt: latest?.generatedAt || null } })
  }
  if (route === '/api/health/ai-reports/generate' && req.method === 'POST') {
    const actor = requireActor(req, ['customer']); const id = actor.id; const observations = state.observations[id] || []
    const sourceObservationVersion = observations.map(item => item.id).join(',')
    const latest = (state.aiReports[id] || [])[0]
    if (latest && latest.sourceObservationVersion === sourceObservationVersion) return send(res, 200, { code: 0, data: latest })
    const generated = await aiProvider.generate({ observations })
    const report = { id: `ai-${Date.now()}`, generatedAt: new Date().toISOString(), sourceObservationVersion, ...generated, generatedBy: actor.id, provider: aiProvider.name }
    state.aiReports[id] = [report, ...(state.aiReports[id] || [])]; persist(); return send(res, 201, { code: 0, data: report })
  }
  if (route === '/api/health/ai-reports' && req.method === 'POST') {
    const actor = requireActor(req, ['customer', 'consultant', 'admin']); const id = actor.id; const report = await readBody(req); state.aiReports[id] = [{ ...report, generatedBy: actor.id }, ...(state.aiReports[id] || [])]; persist(); return send(res, 201, { code: 0, data: state.aiReports[id][0] })
  }
  return send(res, 404, { code: 404, message: 'Not Found' })
  } catch (error) { return send(res, error.status || (error instanceof SyntaxError ? 400 : 500), { code: error.code || error.status || 500, message: error.status ? error.message : '请求处理失败，请重试' }) }
})

server.listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => console.log(`HealthAI API listening on http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 8787} (db=${databaseMode})`))

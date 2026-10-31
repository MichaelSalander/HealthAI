const baseUrl = String(process.env.HEALTHAI_VERIFY_BASE_URL || '').replace(/\/$/, '')
const username = process.env.HEALTHAI_VERIFY_USERNAME || ''
const password = process.env.HEALTHAI_VERIFY_PASSWORD || ''
const origin = process.env.HEALTHAI_VERIFY_ORIGIN || ''

if (!baseUrl) {
  console.error('请设置 HEALTHAI_VERIFY_BASE_URL，例如 https://api.example.com')
  process.exit(1)
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${path} 返回 HTTP ${response.status}: ${body.message || '未知错误'}`)
  return body
}

async function requestRaw(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options)
}

const health = await request('/healthz')
console.log(`healthz: ${health.data?.status || 'unknown'}`)
const status = await request('/api/v1/status')
console.log(`api status: ${status.data?.status || 'unknown'}`)

const unauthorized = await requestRaw('/api/v1/health/profile')
if (unauthorized.status !== 401) throw new Error(`/api/v1/health/profile 未登录时应返回 HTTP 401，实际为 ${unauthorized.status}`)
console.log('unauthorized health access: rejected (401)')

if (origin) {
  const cors = await requestRaw('/api/v1/status', { headers: { Origin: origin } })
  const allowedOrigin = cors.headers.get('access-control-allow-origin')
  if (allowedOrigin !== origin) throw new Error(`CORS 未允许验证来源 ${origin}，实际返回 ${allowedOrigin || '空'}`)
  console.log(`cors: ok (${origin})`)
}

if (username || password) {
  if (!username || !password) throw new Error('验证运营账号时必须同时设置 HEALTHAI_VERIFY_USERNAME 与 HEALTHAI_VERIFY_PASSWORD')
  const login = await request('/api/v1/auth/operator-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', username, password })
  })
  if (!login.data?.token) throw new Error('运营账号登录未返回 token')
  console.log(`operator login: ok (${login.data.role})`)
}

console.log('production verification: passed')

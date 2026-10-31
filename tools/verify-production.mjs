const baseUrl = String(process.env.HEALTHAI_VERIFY_BASE_URL || '').replace(/\/$/, '')
const username = process.env.HEALTHAI_VERIFY_USERNAME || ''
const password = process.env.HEALTHAI_VERIFY_PASSWORD || ''

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

const health = await request('/healthz')
console.log(`healthz: ${health.data?.status || 'unknown'}`)
const status = await request('/api/v1/status')
console.log(`api status: ${status.data?.status || 'unknown'}`)

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

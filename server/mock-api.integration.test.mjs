import assert from 'node:assert/strict'
import { once } from 'node:events'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { after, before, test } from 'node:test'

const port = 18000 + Math.floor(Math.random() * 500)
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'healthai-api-'))
const base = `http://127.0.0.1:${port}`
let processRef

before(async () => {
  processRef = spawn(process.execPath, ['server/mock-api.mjs'], {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      PORT: String(port),
      HEALTHAI_DB: 'json',
      HEALTHAI_DATA_FILE: path.join(tempRoot, 'state.json'),
      HEALTHAI_UPLOAD_DIR: path.join(tempRoot, 'uploads'),
      HEALTHAI_SESSION_SECRET: 'integration-test-secret'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let output = ''
  processRef.stdout.on('data', chunk => { output += chunk.toString() })
  await Promise.race([
    once(processRef.stdout, 'data'),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`API 启动超时: ${output}`)), 10000))
  ])
})

after(() => {
  if (processRef && !processRef.killed) processRef.kill()
  fs.rmSync(tempRoot, { recursive: true, force: true })
})

async function api(route, options = {}) {
  const response = await fetch(`${base}${route}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  })
  const body = await response.json().catch(() => ({}))
  return { response, body }
}

async function login(role, id) {
  const result = await api('/api/v1/auth/demo-login', { method: 'POST', body: JSON.stringify({ role, id }) })
  assert.equal(result.response.status, 200)
  assert.ok(result.body.data.token)
  return result.body.data
}

function auth(session) { return { Authorization: `Bearer ${session.token}` } }

test('HTTP API completes customer, admin and consultant consultation flow', async () => {
  const health = await api('/healthz')
  assert.equal(health.response.status, 200)
  assert.equal(health.body.data.status, 'ok')

  const customer = await login('customer', 'u-001')
  const profile = await api('/api/v1/health/profile', { headers: auth(customer) })
  assert.equal(profile.response.status, 200)
  const trends = await api('/api/v1/health/trends?code=weight', { headers: auth(customer) })
  assert.equal(trends.response.status, 200)
  assert.ok(trends.body.data.some(item => item.value === 62.5))

  const upload = await api('/api/v1/health/reports', {
    method: 'POST',
    headers: auth(customer),
    body: JSON.stringify({ fileName: 'integration-blood.pdf', kind: 'blood_test', mimeType: 'application/pdf', sizeBytes: 5, fileBase64: 'aGVsbG8=' })
  })
  assert.equal(upload.response.status, 201)
  const reportId = upload.body.data.id

  const extraction = await api(`/api/v1/health/reports/${reportId}/extractions`, { headers: auth(customer) })
  assert.equal(extraction.response.status, 200)
  assert.ok(extraction.body.data.candidates.length > 0)
  const confirmed = await api(`/api/v1/health/reports/${reportId}/confirm`, {
    method: 'POST',
    headers: auth(customer),
    body: JSON.stringify({ candidates: extraction.body.data.candidates })
  })
  assert.equal(confirmed.response.status, 200)

  const eligibility = await api('/api/v1/consultations/eligibility', { headers: auth(customer) })
  assert.equal(eligibility.body.data.hasBloodTest, true)
  const ai = await api('/api/v1/health/ai-reports/generate', { method: 'POST', headers: auth(customer), body: '{}' })
  assert.equal(ai.response.status, 201)
  assert.ok(ai.body.data.summary)

  const request = await api('/api/v1/consultation-requests', {
    method: 'POST', headers: auth(customer), body: JSON.stringify({ mode: 'immediate_text', requestId: 'integration-request-001' })
  })
  assert.equal(request.response.status, 200)
  assert.equal(request.body.data.status, 'queued')

  const admin = await login('admin')
  const categories = await api('/api/v1/consultant-categories')
  assert.equal(categories.response.status, 200)
  assert.equal(categories.body.data.length, 9)
  const directory = await api('/api/v1/consultation-directory')
  assert.equal(directory.response.status, 200)
  assert.ok(directory.body.data[0].categories?.length)
  const assign = await api('/api/v1/consultation-requests/auto-assign', { method: 'POST', headers: auth(admin), body: '{}' })
  assert.equal(assign.response.status, 200)
  assert.equal(assign.body.data.assignedCount, 1)

  const consultant = await login('consultant', 'c-101')
  const notices = await api('/api/v1/consultation-notifications', { headers: auth(consultant) })
  assert.equal(notices.response.status, 200)
  const assigned = (await api('/api/v1/consultation-requests', { headers: auth(consultant) })).body.data.find(item => item.requestId === 'integration-request-001')
  assert.ok(assigned)
  const accepted = await api(`/api/v1/consultation-requests/${assigned.id}/accept`, { method: 'POST', headers: auth(consultant), body: '{}' })
  assert.equal(accepted.response.status, 200)
  const roomId = accepted.body.data.room.id

  const message = await api(`/api/v1/conversations/${roomId}/messages`, {
    method: 'POST', headers: auth(customer), body: JSON.stringify({ type: 'text', content: '你好，我想了解这次报告。', clientMessageId: 'integration-message-001' })
  })
  assert.equal(message.response.status, 200)
  const consultantMessages = await api(`/api/v1/conversations/${roomId}/messages`, { headers: auth(consultant) })
  assert.equal(consultantMessages.response.status, 200)
  assert.ok(consultantMessages.body.data.items.some(item => item.clientMessageId === 'integration-message-001'))
})

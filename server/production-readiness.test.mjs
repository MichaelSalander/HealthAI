import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { test } from 'node:test'

async function startApi({ configured }) {
  const port = 19000 + Math.floor(Math.random() * 500)
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'healthai-ready-'))
  const environment = {
    ...process.env,
    NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port),
    HEALTHAI_DB: 'json', HEALTHAI_DATA_FILE: path.join(tempRoot, 'state.json'), HEALTHAI_UPLOAD_DIR: path.join(tempRoot, 'uploads'),
    HEALTHAI_SESSION_SECRET: 'production-readiness-test-secret', HEALTHAI_CORS_ORIGIN: 'http://localhost:5175', WECHAT_TEST_MODE: 'false'
  }
  if (configured) {
    environment.HEALTHAI_OPERATOR_ACCOUNTS_JSON = JSON.stringify([{ id: 'admin-test', role: 'admin', name: '测试管理员', username: 'admin-test', password: 'change-me' }])
    environment.WECHAT_APP_ID = 'wx-readiness-test'
    environment.WECHAT_APP_SECRET = 'readiness-secret'
    environment.HEALTHAI_ALLOW_MOCK_PROVIDERS = 'true'
  }
  const child = spawn(process.execPath, ['server/mock-api.mjs'], { cwd: path.resolve(import.meta.dirname, '..'), env: environment, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', chunk => { output += chunk.toString() })
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`API 启动超时: ${output}`)), 10000)
      child.stdout.on('data', chunk => { if (chunk.toString().includes('HealthAI API listening')) { clearTimeout(timer); resolve() } })
      child.once('error', reject)
    })
    const response = await fetch(`http://127.0.0.1:${port}/readyz`)
    const body = await response.json()
    return { response, body }
  } finally {
    child.kill()
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
}

test('production readiness rejects missing deployment credentials', async () => {
  const result = await startApi({ configured: false })
  assert.equal(result.response.status, 503)
  assert.equal(result.body.data.status, 'not_ready')
  assert.ok(result.body.data.issues.includes('operator_accounts_not_configured'))
  assert.ok(result.body.data.issues.includes('wechat_credentials_not_configured'))
})

test('production readiness passes with required deployment credentials', async () => {
  const result = await startApi({ configured: true })
  assert.equal(result.response.status, 200)
  assert.equal(result.body.data.status, 'ready')
  assert.deepEqual(result.body.data.issues, [])
})

test('production readiness rejects mock AI and OCR unless explicitly allowed', async () => {
  const result = await startApi({ configured: false })
  assert.ok(result.body.data.issues.includes('ocr_provider_is_mock'))
  assert.ok(result.body.data.issues.includes('llm_provider_is_mock'))
})

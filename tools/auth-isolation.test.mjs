import assert from 'node:assert/strict'
import { test } from 'node:test'
import vm from 'node:vm'
import { build } from 'esbuild'

const compiled = await build({ entryPoints: ['src/services/api/consultation.ts'], bundle: true, write: false, format: 'iife', globalName: 'auth', platform: 'browser', define: { 'import.meta.env': '{}' } })
const code = compiled.outputFiles[0].text
const storage = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,String(v)) } }
function tab(shared, saved = storage()) {
  const pending = [], redirects = []
  const context = vm.createContext({ window: { location: { hostname: 'test.example' }, sessionStorage: saved }, localStorage: shared, globalThis: undefined, console })
  context.globalThis = context
  context.uni = { request: options => pending.push(options), reLaunch: options => redirects.push(options.url), getStorageSync: k => shared.getItem(k), setStorageSync: (k,v) => shared.setItem(k,v) }
  vm.runInContext(code, context)
  return { api: context.auth.consultationRepository, pending, redirects, saved }
}
const session = (id, role = 'customer') => ({ id, role, name: id, token: `token-${id}` })
async function login(t, s) {
  const promise = s.role === 'customer' ? t.api.customerPasswordLogin(s.id, 'password') : t.api.operatorLogin(s.id, 'password')
  t.pending.shift().success({ statusCode: 200, data: { data: s } })
  await promise
}
test('same origin tabs keep different members and roles; logout and reload remain isolated', async () => {
  const shared = storage()
  shared.setItem('healthai_customer_session', JSON.stringify(session('legacy')))
  const a = tab(shared), b = tab(shared), c = tab(shared)
  await assert.rejects(a.api.customer(), /登录/)
  await login(a, session('alice'))
  await login(b, session('bob'))
  await login(c, session('coach', 'consultant'))
  assert.equal((await a.api.customer()).id, 'alice')
  assert.equal((await b.api.customer()).id, 'bob')
  assert.equal((await c.api.login('consultant')).id, 'coach')
  assert.equal((await tab(shared, a.saved).api.customer()).id, 'alice')
  a.api.logoutCustomer()
  assert.equal((await b.api.customer()).id, 'bob')
  assert.equal((await c.api.login('consultant')).id, 'coach')
})
test('old success and 401 responses cannot replace or log out a new identity', async () => {
  const t = tab(storage())
  await login(t, session('alice'))
  const oldSuccess = t.api.rooms(), old401 = t.api.notices()
  await Promise.resolve(); await Promise.resolve()
  const responses = t.pending.splice(0)
  await login(t, session('bob'))
  const rejected = [assert.rejects(oldSuccess, /旧账号/), assert.rejects(old401, /旧账号/)]
  responses[0].success({ statusCode: 200, data: { data: [{ userId: 'alice' }] } })
  responses[1].success({ statusCode: 401, data: { message: 'expired' } })
  await Promise.all(rejected)
  assert.equal((await t.api.customer()).id, 'bob')
  assert.equal(t.redirects.length, 0)
})

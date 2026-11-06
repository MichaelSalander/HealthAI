import test from 'node:test'
import assert from 'node:assert/strict'
import { handleWorkflow, seedWorkflow } from './consultation-workflow.mjs'

function fixture() {
  const state = { workflow: seedWorkflow(), reports: { 'u-001': [{ kind: 'blood_test', status: '解析成功' }] } }
  const customer = { id: 'u-001', role: 'customer', name: '测试客户' }
  const admin = { id: 'admin-001', role: 'admin' }
  const call = (route, method = 'GET', body = {}, actor = customer) => handleWorkflow({ state, route: `/api/${route}`, method, body, actor })
  const c = state.workflow.consultants[0]
  const book = (extra = {}, actor = customer) => call('consultations/bookings', 'POST', { consultantId: c.id, slotId: c.slots[0].id, requestId: 'request-1', ...extra }, actor)
  return { state, call, book, customer, admin, c }
}
test('blood report is optional for consultant matching; eligibility remains informational', () => {
  const f = fixture(); f.state.reports['u-001'] = []; f.state.observations = { 'u-001': [{ code: 'fasting-glucose' }] }
  assert.equal(f.call('consultations/eligibility').hasBloodTest, false)
  assert.equal(f.book().status, 'pending_assignment')
})
test('duplicate submission is idempotent and slot reservations cannot oversell', () => {
  const f = fixture(); const first = f.book(); assert.equal(f.book().id, first.id)
  f.state.reports.other = f.state.reports['u-001']
  assert.throws(() => f.book({requestId:'request-2'}, { id:'other', role:'customer' }), /不可预约/)
  assert.equal(f.state.workflow.bookings.length, 1)
})
test('offline, full, free eligibility and daily limit block bookings', () => {
  for (const status of ['offline', 'full']) { const f = fixture(); f.c.status = status; assert.throws(() => f.book(), /不可预约/) }
  const f = fixture(); f.c.freeConsultEnabled = false; assert.throws(() => f.book(), /不可预约/)
  f.c.freeConsultEnabled = true; f.c.dailyLimit = 1; f.book(); assert.throws(() => f.book({slotId:f.c.slots[1].id,requestId:'request-2'}), /不可预约/)
})
test('manual assignment, role isolation, notification and acceptance complete the flow', () => {
  const f = fixture(); const b = f.book()
  assert.throws(() => f.call('consultations/queue'), /无权/)
  assert.throws(() => f.call(`consultations/bookings/${b.id}/assign`, 'POST', {consultantId:f.c.id}), /无权/)
  f.call(`consultations/bookings/${b.id}/assign`, 'POST', {consultantId:f.c.id}, f.admin)
  const actor = {id:f.c.id,role:'consultant'}
  assert.equal(f.call('consultation-notifications', 'GET', {}, actor).length, 1)
  assert.equal(f.call('consultations/bookings', 'GET', {}, {id:'c-102',role:'consultant'}).length, 0)
  assert.throws(() => f.call(`consultations/bookings/${b.id}/accept`, 'POST', {}, {id:'c-102',role:'consultant'}), /仅接单/)
  f.c.status = 'offline'; assert.throws(() => f.call(`consultations/bookings/${b.id}/accept`, 'POST', {}, actor), /上线/)
  f.c.status = 'available'; f.call(`consultations/bookings/${b.id}/accept`, 'POST', {}, actor)
  f.call(`consultations/bookings/${b.id}/complete`, 'POST', {}, actor)
  assert.equal(b.status, 'completed'); assert.ok(f.state.workflow.audit.length >= 4)
})
test('auto assignment excludes offline requested consultant and releases original reservation', () => {
  const f = fixture(); const b = f.book(); f.c.status = 'offline'
  assert.equal(f.call('consultations/auto-assign', 'POST', {}, f.admin).assignedCount, 1)
  assert.equal(b.consultantId, 'c-102'); assert.equal(b.status, 'assigned')
  assert.equal(f.call('consultations/auto-assign', 'POST', {}, f.admin).assignedCount, 0)
})
test('cancel releases capacity; occupied slots cannot be deleted', () => {
  const f = fixture(); const b = f.book()
  assert.throws(() => f.call(`consultation-directory/${f.c.id}`, 'PUT', {...f.c, slots:[]}, {id:f.c.id, role:'consultant'}), /不能删除/)
  f.call(`consultations/bookings/${b.id}/cancel`, 'POST')
  assert.equal(f.book({requestId:'new'}).status, 'pending_assignment')
})
test('malformed input and missing authentication are rejected', () => {
  const f = fixture(); assert.throws(() => f.call('consultations/bookings', 'GET', {}, null), /登录/)
  assert.throws(() => f.book({requestId:''}), /请求标识/)
})

test('consultants cannot self-configure slots or capacity', () => {
  const f = fixture(); const consultant = { id: 'c-101', role: 'consultant', name: '陈晨' }
  const current = f.state.workflow.consultants.find(item => item.id === consultant.id)
  assert.throws(() => f.call(`consultation-directory/${consultant.id}`, 'PUT', { ...current, dailyLimit: current.dailyLimit + 1 }, consultant), error => error.status === 403)
  assert.throws(() => f.call(`consultation-directory/${consultant.id}`, 'PUT', { ...current, status: 'full' }, consultant), error => error.status === 403)
  assert.throws(() => f.call(`consultation-directory/${consultant.id}`, 'PUT', { ...current, slots: current.slots.slice(0, 1) }, consultant), error => error.status === 403)
})

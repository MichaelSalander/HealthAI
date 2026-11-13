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

test('long term rooms count toward capacity while existing rooms remain active', () => {
  const f = fixture(); const consultant = { id: f.c.id, role: 'consultant', name: f.c.name }
  for (let i = 1; i <= f.c.maxActiveClients; i += 1) {
    const customer = { id: `customer-${i}`, role: 'customer', name: `测试客户${i}` }
    const request = f.call('consultation-requests', 'POST', { requestId: `long-${i}`, mode: 'immediate_text' }, customer)
    assert.equal(request.status, 'assigned')
    const accepted = f.call(`consultation-requests/${request.id}/accept`, 'POST', {}, consultant)
    assert.equal(accepted.room.status, 'in_progress')
  }
  assert.equal(f.call('consultation-directory').find(item => item.id === f.c.id).activeClientCount, f.c.maxActiveClients)
  const queued = f.call('consultation-requests', 'POST', { requestId: 'long-over-cap', mode: 'immediate_text' }, { id: 'customer-over-cap', role: 'customer', name: '超出上限客户' })
  assert.equal(queued.status, 'queued')
  assert.equal(f.state.workflow.conversations.every(room => room.status === 'in_progress'), true)
})

test('assigned clients can message offline consultants before acceptance and reopen the same room', () => {
  const f = fixture()
  const req = f.call('consultation-requests', 'POST', { requestId: 'direct-1', mode: 'immediate_text' })
  assert.ok(req.conversationId)
  f.c.status = 'offline'; f.c.acceptingNewClients = false
  const again = f.call('consultation-requests', 'POST', { requestId: 'direct-2', mode: 'immediate_text' })
  assert.equal(again.id, req.id)
  const opened = f.call(`consultation-requests/${req.id}/open`, 'POST')
  assert.equal(opened.room.id, req.conversationId)
  f.call(`conversations/${opened.room.id}/messages`, 'POST', { content: '离线留言', clientMessageId: 'msg-1' })
  const consultant = { id: f.c.id, role: 'consultant', name: f.c.name }
  assert.equal(f.call(`conversations/${opened.room.id}/messages`, 'GET', {}, consultant).items[0].content, '离线留言')
  assert.ok(f.state.workflow.notifications.some(n => n.recipientId === consultant.id && n.resourceType === 'conversation' && n.resourceId === opened.room.id))
  f.call(`conversations/${opened.room.id}/messages`, 'POST', { content: '已收到', clientMessageId: 'reply-1' }, consultant)
  assert.equal(f.call(`conversations/${opened.room.id}/messages`).items.length, 2)
  assert.throws(() => f.call(`consultation-requests/${req.id}/open`, 'POST', {}, { id: 'other', role: 'customer' }), /无权/)
  f.call(`consultation-requests/${req.id}/accept`, 'POST', {}, consultant)
  assert.equal(f.state.workflow.conversations.length, 1)
})

test('legacy assigned request opens without consultant acknowledgement', () => {
  const f = fixture()
  f.state.workflow.consultationRequests.push({ id: 'legacy', userId: f.customer.id, userName: f.customer.name, consultantId: f.c.id, consultantName: f.c.name, status: 'assigned' })
  f.c.status = 'full'
  const opened = f.call('consultation-requests/legacy/open', 'POST')
  assert.ok(opened.room.id)
  assert.equal(f.call('consultation-requests/legacy/open', 'POST').room.id, opened.room.id)
})

test('manual and automatic assignment immediately open rooms and respect capacity', () => {
  const f = fixture(); f.c.status = 'offline'
  const request = f.call('consultation-requests', 'POST', { requestId: 'queue-manual', mode: 'immediate_text' })
  assert.equal(request.status, 'queued')
  f.c.status = 'available'
  f.call(`consultation-requests/${request.id}/assign`, 'POST', { consultantId: f.c.id }, f.admin)
  assert.ok(request.conversationId)
  f.c.status = 'offline'
  const other = { id: 'auto-client', role: 'customer', name: '自动配对客户' }
  const queued = f.call('consultation-requests', 'POST', { requestId: 'queue-auto', mode: 'immediate_text' }, other)
  f.c.status = 'available'
  f.call('consultation-requests/auto-assign', 'POST', {}, f.admin)
  assert.ok(queued.conversationId)
})

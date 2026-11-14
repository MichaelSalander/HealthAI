import test from 'node:test'
import assert from 'node:assert/strict'
import { handleWorkflow, seedWorkflow } from './consultation-workflow.mjs'
test('directory profiles are admin managed, own profile editable, preferred consultant respected', () => {
 const state = { workflow: seedWorkflow(), reports: {} }
 const admin = { id:'admin-001', role:'admin' }
 const client = { id:'client-new', name:'Test', role:'customer' }
 const call = (route, method, body, actor) => handleWorkflow({ state, route:`/api/${route}`, method, body, actor })
 assert.throws(() => call('consultation-directory','POST',{name:'Test'},client), /无权/)
 const created = call('consultation-directory','POST',{name:'测试健管师 A'},admin)
 assert.equal(created.status,'offline')
 assert.equal(created.freeConsultEnabled,false)
 const c = state.workflow.consultants.find(c => c.id === 'c-102')
 const own = { id:c.id, role:'consultant' }
 call(`consultation-directory/${c.id}`,'PUT',{...c,intro:'测试简介',avatarUrl:'https://example.com/avatar.png',certifications:['unverified']},own)
 assert.equal(c.intro,'测试简介'); assert.deepEqual(c.certifications,[])
 assert.throws(() => call(`consultation-directory/c-101`,'PUT',c,own), /无权/)
 const request = call('consultation-requests','POST',{requestId:'preferred',mode:'immediate_text',consultantId:'c-102'},client)
 assert.equal(request.consultantId,'c-102'); assert.ok(request.conversationId)
})

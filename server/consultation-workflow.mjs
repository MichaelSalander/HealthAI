import { randomUUID } from 'node:crypto'

const active = b => ['pending_assignment', 'assigned', 'accepted'].includes(b.status)
const fail = (message, status = 409) => { throw Object.assign(new Error(message), { status }) }
const people = [
  { id: 'c-101', name: '陈晨', level: '初级', status: 'available', freeConsultEnabled: true, categories: ['体重管理', '运动营养'] },
  { id: 'c-102', name: '林悦', level: '初级', status: 'available', freeConsultEnabled: true, categories: ['睡眠管理', '女性健康'] },
  { id: 'c-103', name: '周宁', level: '初级', status: 'offline', freeConsultEnabled: false, categories: ['慢病管理'] }
]
export function seedWorkflow() {
  const start = new Date(); start.setUTCHours(0, 0, 0, 0); start.setUTCDate(start.getUTCDate() + 1)
  return { consultants: people.map(p => ({ ...p, dailyLimit: 8, slots: [2, 3, 6, 7].map(hour => ({ id: randomUUID(), startAt: new Date(+start + hour * 3600000).toISOString(), capacity: 1 })) })), bookings: [], consultationRequests: [], conversations: [], messages: [], voiceSessions: [], serviceRecords: [], notifications: [], presence: {}, audit: [] }
}
export function handleWorkflow({ state, route, method, body, actor, query, now = Date.now() }) {
  const db = state.workflow ||= seedWorkflow()
  db.consultationRequests ||= []; db.conversations ||= []; db.messages ||= []; db.voiceSessions ||= []; db.serviceRecords ||= []
  const stamp = () => new Date(now).toISOString()
  const requireRole = (...roles) => { if (!actor) fail('请先登录', 401); if (!roles.includes(actor.role)) fail('无权执行此操作', 403) }
  const notify = (role, recipientId, title, bookingId) => db.notifications.unshift({ id: randomUUID(), role, recipientId, title, bookingId, read: false, createdAt: stamp() })
  const notifyResource = (role, recipientId, title, resourceType, resourceId) => db.notifications.unshift({ id: randomUUID(), role, recipientId, title, resourceType, resourceId, read: false, createdAt: stamp() })
  const audit = (action, bookingId) => db.audit.push({ id: randomUUID(), action, bookingId, actorId: actor.id, createdAt: stamp() })
  const hasBloodTest = id => (state.reports[id] || []).some(r => r.kind === 'blood_test' && r.status === '解析成功')
  const occupied = (id, slotId) => db.bookings.filter(b => active(b) && b.consultantId === id && b.slotId === slotId).length
  const available = (c, slotId) => {
    const slot = c.slots.find(s => s.id === slotId)
    if (c.level !== '初级' || c.status !== 'available' || !c.freeConsultEnabled || !slot || Date.parse(slot.startAt) <= now) return false
    const day = slot.startAt.slice(0, 10)
    return occupied(c.id, slotId) < slot.capacity && db.bookings.filter(b => active(b) && b.consultantId === c.id && b.slotStartAt?.slice(0, 10) === day).length < c.dailyLimit
  }
  const project = c => ({ ...c, slots: c.slots.map(s => ({ ...s, remaining: Math.max(0, s.capacity - occupied(c.id, s.id)) })), bookedCount: db.bookings.filter(b => active(b) && b.consultantId === c.id).length })
  const requestVisible = r => actor.role === 'admin' || r.userId === actor.id || r.consultantId === actor.id
  const roomVisible = room => actor.role === 'admin' || room.userId === actor.id || room.consultantId === actor.id
  const requestById = id => db.consultationRequests.find(r => r.id === id)
  const roomById = id => db.conversations.find(r => r.id === id)
  const roomView = room => ({ ...room, participants: room.participants.map(p => ({ ...p, online: now - Date.parse(p.lastSeenAt || 0) < 45000 })) })
  if (route === '/api/consultation-directory' && method === 'GET') return db.consultants.map(project)
  if (route === '/api/consultant/clients' && method === 'GET') {
    requireRole('consultant', 'admin')
    const assignedIds = new Set([...db.bookings.filter(item => actor.role === 'admin' || item.consultantId === actor.id).map(item => item.userId), ...db.consultationRequests.filter(item => actor.role === 'admin' || item.consultantId === actor.id).map(item => item.userId)])
    return [...assignedIds].map(userId => {
      const profile = state.profiles[userId] || {}; const requests = db.consultationRequests.filter(item => item.userId === userId); const bookings = db.bookings.filter(item => item.userId === userId)
      return { id: userId, name: requests[0]?.userName || bookings[0]?.userName || userId, profile, observationCount: (state.observations[userId] || []).length, reportCount: (state.reports[userId] || []).length, lastActivityAt: [...requests, ...bookings].map(item => item.createdAt).sort().pop() || null, status: requests.some(item => ['assigned', 'waiting_consultant', 'in_progress'].includes(item.status)) || bookings.some(item => ['assigned', 'accepted'].includes(item.status)) ? '服务中' : '待跟进' }
    })
  }
  const clientHealth = route.match(/^\/api\/consultant\/clients\/([^/]+)\/health$/)
  if (clientHealth && method === 'GET') {
    requireRole('consultant', 'admin'); const userId = clientHealth[1]; const allowed = actor.role === 'admin' || db.bookings.some(item => item.userId === userId && item.consultantId === actor.id) || db.consultationRequests.some(item => item.userId === userId && item.consultantId === actor.id)
    if (!allowed) fail('无权查看该客户资料', 403)
    return { profile: state.profiles[userId] || null, reports: (state.reports[userId] || []).map(({ storagePath, ...report }) => ({ ...report, fileAvailable: Boolean(storagePath) })), observations: state.observations[userId] || [], aiReport: (state.aiReports[userId] || [])[0] || null }
  }
  if (route === '/api/consultations/eligibility' && method === 'GET') { requireRole('customer'); return { hasBloodTest: hasBloodTest(actor.id), healthCenterRoute: '/pages/health-centers/index' } }
  if (route === '/api/consultations/presence' && method === 'POST') {
    requireRole('customer', 'consultant'); const old = db.presence[actor.id]
    db.presence[actor.id] = { userId: actor.id, name: actor.name, role: actor.role, status: body.status || (actor.role === 'consultant' ? 'online' : 'online'), conversationId: body.conversationId, lastSeenAt: stamp(), lastActionAt: body.action || !old ? stamp() : old.lastActionAt }
    return db.presence[actor.id]
  }
  if (route === '/api/consultation-requests' && method === 'POST') {
    requireRole('customer')
    if (!hasBloodTest(actor.id)) fail('请先上传并确认血液检测报告', 422)
    if (typeof body.requestId !== 'string' || !body.requestId) fail('缺少请求标识', 400)
    if (!['immediate_text', 'immediate_voice', 'scheduled'].includes(body.mode)) fail('咨询方式无效', 400)
    const existing = db.consultationRequests.find(item => item.userId === actor.id && item.requestId === body.requestId)
    if (existing) return existing
    const item = { id: randomUUID(), requestId: body.requestId, userId: actor.id, userName: actor.name, serviceType: body.serviceType || 'free_consult', mode: body.mode, consultantPreference: body.consultantPreference, status: 'queued', createdAt: stamp() }
    db.consultationRequests.unshift(item); audit('consultation.requested', item.id); notifyResource('admin', 'admin-001', '有新的即时咨询请求', 'consultation_request', item.id); return item
  }
  if (route === '/api/consultation-requests' && method === 'GET') {
    requireRole('customer', 'consultant', 'admin'); return db.consultationRequests.filter(requestVisible)
  }
  if (route === '/api/consultation-requests/queue' && method === 'GET') {
    requireRole('admin'); return { requests: db.consultationRequests, presence: Object.values(db.presence).map(p => ({ ...p, online: now - Date.parse(p.lastSeenAt) < 45000, idle: now - Date.parse(p.lastActionAt) > 60000 })) }
  }
  const requestAssign = route.match(/^\/api\/consultation-requests\/([^/]+)\/assign$/)
  if (requestAssign && method === 'POST') {
    requireRole('admin'); const item = requestById(requestAssign[1]); if (!item) fail('咨询请求不存在', 404); if (!['queued', 'reassigned'].includes(item.status)) fail('该请求当前不可派单')
    const c = db.consultants.find(person => person.id === body.consultantId); if (!c || c.status !== 'available' || !c.freeConsultEnabled) fail('目标健管师当前不可接单')
    Object.assign(item, { consultantId: c.id, consultantName: c.name, status: 'assigned', assignedAt: stamp() }); audit('consultation.assigned', item.id)
    notifyResource('consultant', c.id, `${item.userName} 已配对，请及时进入咨询`, 'consultation_request', item.id); notifyResource('customer', item.userId, `已为您配对 ${c.name}，等待健管师确认`, 'consultation_request', item.id); return item
  }
  if (route === '/api/consultation-requests/auto-assign' && method === 'POST') {
    requireRole('admin'); let assignedCount = 0
    for (const item of db.consultationRequests.filter(item => ['queued', 'reassigned'].includes(item.status))) {
      const candidates = db.consultants.filter(c => c.status === 'available' && c.freeConsultEnabled).sort((a, b) => project(a).bookedCount - project(b).bookedCount)
      const selected = candidates[0]; if (!selected) continue
      Object.assign(item, { consultantId: selected.id, consultantName: selected.name, status: 'assigned', assignedAt: stamp() }); audit('consultation.auto_assigned', item.id); notifyResource('consultant', selected.id, `${item.userName} 已配对，请及时进入咨询`, 'consultation_request', item.id); notifyResource('customer', item.userId, `已为您配对 ${selected.name}，等待健管师确认`, 'consultation_request', item.id); assignedCount++
    }
    return { assignedCount }
  }
  const requestAccept = route.match(/^\/api\/consultation-requests\/([^/]+)\/accept$/)
  if (requestAccept && method === 'POST') {
    requireRole('consultant'); const item = requestById(requestAccept[1]); if (!item) fail('咨询请求不存在', 404); if (item.consultantId !== actor.id || item.status !== 'assigned') fail('当前请求不可接受', 403)
    const room = { id: randomUUID(), consultationRequestId: item.id, userId: item.userId, userName: item.userName, consultantId: actor.id, consultantName: actor.name, status: 'in_progress', startedAt: stamp(), participants: [{ userId: item.userId, role: 'customer', name: item.userName, lastSeenAt: stamp() }, { userId: actor.id, role: 'consultant', name: actor.name, lastSeenAt: stamp() }] }
    item.status = 'in_progress'; item.acceptedAt = stamp(); item.conversationId = room.id; db.conversations.unshift(room); db.messages.unshift({ id: randomUUID(), conversationId: room.id, senderId: 'system', senderRole: 'admin', senderName: '系统', type: 'system', content: `${actor.name} 已进入咨询房间`, status: 'sent', sentAt: stamp() }); audit('consultation.accepted', item.id); notifyResource('customer', item.userId, `${actor.name} 已进入咨询房间`, 'conversation', room.id); return { request: item, room: roomView(room) }
  }
  if (route === '/api/conversations' && method === 'GET') { requireRole('customer', 'consultant', 'admin'); return db.conversations.filter(roomVisible).map(roomView) }
  const roomRoute = route.match(/^\/api\/conversations\/([^/]+)$/)
  if (roomRoute && method === 'GET') { requireRole('customer', 'consultant', 'admin'); const room = roomById(roomRoute[1]); if (!room || !roomVisible(room)) fail('无权查看此咨询房间', 403); return roomView(room) }
  const messageRoute = route.match(/^\/api\/conversations\/([^/]+)\/messages$/)
  if (messageRoute && method === 'GET') { requireRole('customer', 'consultant', 'admin'); const room = roomById(messageRoute[1]); if (!room || !roomVisible(room)) fail('无权查看此咨询房间', 403); return { items: db.messages.filter(message => message.conversationId === room.id).sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt)), nextCursor: null } }
  if (messageRoute && method === 'POST') {
    requireRole('customer', 'consultant'); const room = roomById(messageRoute[1]); if (!room || !roomVisible(room)) fail('无权发送消息', 403); if (room.status === 'completed') fail('咨询已结束'); if (!body.content?.trim()) fail('消息不能为空', 400)
    const duplicate = db.messages.find(message => message.conversationId === room.id && message.clientMessageId === body.clientMessageId); if (duplicate) return duplicate
    const message = { id: randomUUID(), conversationId: room.id, senderId: actor.id, senderRole: actor.role, senderName: actor.name, type: body.type || 'text', content: String(body.content).trim(), clientMessageId: body.clientMessageId, status: 'delivered', sentAt: stamp() }; db.messages.push(message); room.lastMessageAt = stamp(); const recipientId = actor.role === 'customer' ? room.consultantId : room.userId; const recipientRole = actor.role === 'customer' ? 'consultant' : 'customer'; notifyResource(recipientRole, recipientId, `${actor.name} 发来一条新消息`, 'conversation', room.id); return message
  }
  const roomAction = route.match(/^\/api\/conversations\/([^/]+)\/(join|leave|read|complete)$/)
  if (roomAction && method === 'POST') {
    requireRole('customer', 'consultant'); const room = roomById(roomAction[1]); if (!room || !roomVisible(room)) fail('无权操作此咨询房间', 403); const participant = room.participants.find(item => item.userId === actor.id); if (!participant) fail('不是房间成员', 403)
    if (roomAction[2] === 'join') participant.lastSeenAt = stamp();
    if (roomAction[2] === 'read') participant.lastReadMessageId = body.messageId;
    if (roomAction[2] === 'complete') { if (actor.role !== 'consultant') fail('仅健管师可以结束咨询', 403); room.status = 'completed'; room.endedAt = stamp(); const item = requestById(room.consultationRequestId); if (item) { item.status = 'completed'; item.completedAt = stamp() } const durationSec = Math.max(0, Math.floor((Date.parse(room.endedAt) - Date.parse(room.startedAt)) / 1000)); const record = { id: randomUUID(), conversationId: room.id, consultationRequestId: room.consultationRequestId, userId: room.userId, consultantId: room.consultantId, summary: body.summary || '本次咨询已完成，建议继续记录健康数据并按计划复查。', followUpItems: body.followUpItems || ['持续记录健康指标', '按计划复查异常项目'], durationSec, createdAt: stamp() }; db.serviceRecords.unshift(record); notifyResource('customer', room.userId, '本次咨询已完成', 'service_record', record.id); return record }
    return participant
  }
  if (route === '/api/voice-sessions' && method === 'POST') { requireRole('customer', 'consultant'); const room = roomById(body.conversationId); if (!room || !roomVisible(room)) fail('无权发起语音', 403); const voice = { id: randomUUID(), conversationId: room.id, initiatorId: actor.id, status: 'calling', startedAt: stamp() }; db.voiceSessions.unshift(voice); const recipientId = actor.id === room.userId ? room.consultantId : room.userId; const recipientRole = actor.role === 'customer' ? 'consultant' : 'customer'; notifyResource(recipientRole, recipientId, `${actor.name} 发起了语音咨询`, 'voice_session', voice.id); return voice }
  const voiceAction = route.match(/^\/api\/voice-sessions\/([^/]+)\/(accept|end|fail)$/)
  if (voiceAction && method === 'POST') { requireRole('customer', 'consultant'); const voice = db.voiceSessions.find(item => item.id === voiceAction[1]); if (!voice) fail('语音会话不存在', 404); const room = roomById(voice.conversationId); if (!room || !roomVisible(room)) fail('无权操作语音', 403); if (voiceAction[2] === 'accept') { voice.status = 'connected'; voice.connectedAt = stamp() } else { voice.status = voiceAction[2] === 'fail' ? 'failed' : 'ended'; voice.endedAt = stamp(); voice.durationSec = voice.connectedAt ? Math.max(0, Math.floor((Date.parse(voice.endedAt) - Date.parse(voice.connectedAt)) / 1000)) : 0 } return voice }
  if (route === '/api/consultations/queue' && method === 'GET') {
    requireRole('admin')
    return { bookings: db.bookings, presence: Object.values(db.presence).map(p => ({ ...p, online: now - Date.parse(p.lastSeenAt) < 45000, idle: now - Date.parse(p.lastActionAt) > 60000 })) }
  }
  if (route === '/api/consultations/bookings' && method === 'GET') {
    requireRole('customer', 'consultant', 'admin')
    return db.bookings.filter(b => actor.role === 'admin' || (actor.role === 'customer' ? b.userId === actor.id : b.consultantId === actor.id))
  }
  if (route === '/api/consultations/bookings' && method === 'POST') {
    requireRole('customer')
    if (!hasBloodTest(actor.id)) fail('请先上传并确认血液检测报告', 422)
    if (typeof body.requestId !== 'string' || !body.requestId) fail('缺少请求标识', 400)
    const existing = db.bookings.find(b => b.userId === actor.id && b.requestId === body.requestId)
    if (existing) return existing
    const c = db.consultants.find(c => c.id === body.consultantId)
    if (!c || !available(c, body.slotId)) fail('健管师离线、已额满、未开放免费咨询或时段不可预约')
    if (db.bookings.some(b => active(b) && b.userId === actor.id && b.slotStartAt === c.slots.find(s => s.id === body.slotId).startAt)) fail('您在此时段已有预约')
    const b = { id: randomUUID(), requestId: body.requestId, userId: actor.id, userName: actor.name, consultantId: c.id, consultantName: c.name, slotId: body.slotId, slotStartAt: c.slots.find(s => s.id === body.slotId).startAt, status: 'pending_assignment', type: 'free', createdAt: stamp() }
    db.bookings.unshift(b); audit('booking.created', b.id); notify('admin', 'admin-001', '有新的待派单咨询', b.id)
    return b
  }
  const settings = route.match(/^\/api\/consultation-directory\/([^/]+)$/)
  if (settings && method === 'PUT') {
    requireRole('admin', 'consultant'); if (actor.role === 'consultant' && actor.id !== settings[1]) fail('无权修改其他健管师', 403)
    const c = db.consultants.find(c => c.id === settings[1]); if (!c) fail('健管师不存在', 404)
    if (!['available', 'full', 'offline'].includes(body.status) || !Number.isInteger(body.dailyLimit) || body.dailyLimit < 1 || body.dailyLimit > 100) fail('状态或每日名额无效', 400)
    if (body.freeConsultEnabled !== c.freeConsultEnabled && actor.role !== 'admin') fail('免费咨询资格由管理员配置', 403)
    if (actor.role === 'consultant' && (body.status === 'full' || body.dailyLimit !== c.dailyLimit || JSON.stringify(body.slots) !== JSON.stringify(c.slots))) fail('健管师不能删除、修改或自行设置满额、名额或咨询时段，由平台统一安排', 403)
    if (!Array.isArray(body.slots) || body.slots.length > 100) fail('时段格式无效', 400)
    const slots = body.slots.map(s => {
      if (!s.id || !Number.isFinite(Date.parse(s.startAt)) || !Number.isInteger(s.capacity) || s.capacity < 1 || s.capacity > 20) fail('请填写有效时间与容量', 400)
      const old = c.slots.find(x => x.id === s.id)
      if (occupied(c.id, s.id) && (old?.startAt !== s.startAt || s.capacity < occupied(c.id, s.id))) fail('已有预约的时段不能移动或减少到不足容量')
      return { id: s.id, startAt: s.startAt, capacity: s.capacity }
    })
    if (new Set(slots.map(s => s.id)).size !== slots.length || new Set(slots.map(s => s.startAt)).size !== slots.length) fail('时段重复', 400)
    if (c.slots.some(s => occupied(c.id, s.id) && !slots.some(x => x.id === s.id))) fail('不能删除已有预约的时段')
    Object.assign(c, { status: body.status, dailyLimit: body.dailyLimit, freeConsultEnabled: Boolean(body.freeConsultEnabled), slots }); audit('availability.updated', c.id); return project(c)
  }
  const assign = route.match(/^\/api\/consultations\/bookings\/([^/]+)\/assign$/)
  const assignOne = (b, c) => {
    const slot = c.slots.find(s => s.startAt === b.slotStartAt)
    if (!slot || !available(c, slot.id)) fail('目标健管师不在线或该时段已满')
    Object.assign(b, { consultantId: c.id, consultantName: c.name, slotId: slot.id, status: 'assigned', assignedAt: stamp() }); audit('booking.assigned', b.id)
    notify('consultant', c.id, `${b.userName} 已配对，请及时确认咨询`, b.id); notify('customer', b.userId, `已为您配对 ${c.name}，等待健管师确认`, b.id)
  }
  if (assign && method === 'POST') {
    requireRole('admin'); const b = db.bookings.find(b => b.id === assign[1]); if (!b) fail('预约不存在', 404)
    if (b.status !== 'pending_assignment') fail('该预约已派单，请勿重复操作')
    const c = db.consultants.find(c => c.id === body.consultantId); if (!c) fail('健管师不存在', 404)
    // Temporarily release this booking's reservation; the synchronous operation cannot interleave.
    b.status = 'assigning'
    try { assignOne(b, c) } catch (e) { b.status = 'pending_assignment'; throw e }
    return b
  }
  if (route === '/api/consultations/auto-assign' && method === 'POST') {
    requireRole('admin'); let assignedCount = 0
    for (const b of db.bookings.filter(b => b.status === 'pending_assignment')) {
      b.status = 'assigning'
      const candidates = db.consultants.filter(c => c.slots.some(s => s.startAt === b.slotStartAt && available(c, s.id))).sort((a, z) => project(a).bookedCount - project(z).bookedCount)
      const selected = candidates.find(c => c.id === b.consultantId) || candidates[0]
      if (selected) { assignOne(b, selected); assignedCount++ } else b.status = 'pending_assignment'
    }
    return { assignedCount }
  }
  const transition = route.match(/^\/api\/consultations\/bookings\/([^/]+)\/(accept|complete|cancel)$/)
  if (transition && method === 'POST') {
    requireRole('customer', 'consultant', 'admin'); const b = db.bookings.find(b => b.id === transition[1]); if (!b) fail('预约不存在', 404)
    const action = transition[2]
    if (action === 'cancel') {
      if (actor.role !== 'admin' && !(actor.role === 'customer' && actor.id === b.userId)) fail('无权取消', 403)
      if (!active(b)) fail('该预约已经结束'); b.status = 'cancelled'
    } else {
      if (actor.role !== 'consultant' || actor.id !== b.consultantId) fail('仅接单健管师可以处理', 403)
      const c = db.consultants.find(c => c.id === actor.id)
      if (action === 'accept' && (b.status !== 'assigned' || c.status === 'offline')) fail('请上线并确认派单状态')
      if (action === 'complete' && b.status !== 'accepted') fail('请先接受咨询')
      b.status = action === 'accept' ? 'accepted' : 'completed'
    }
    const labels = { accepted: '健管师已接受咨询', completed: '本次咨询已完成', cancelled: '预约已取消' }
    audit(`booking.${action}`, b.id); notify('customer', b.userId, labels[b.status], b.id); return b
  }
  if (route === '/api/consultation-notifications' && method === 'GET') { requireRole('customer', 'consultant', 'admin'); return db.notifications.filter(n => n.role === actor.role && n.recipientId === actor.id) }
  const read = route.match(/^\/api\/consultation-notifications\/([^/]+)\/read$/)
  if (read && method === 'POST') {
    requireRole('customer', 'consultant', 'admin'); const n = db.notifications.find(n => n.id === read[1] && n.role === actor.role && n.recipientId === actor.id)
    if (!n) fail('通知不存在', 404); n.read = true; return n
  }
  return undefined
}

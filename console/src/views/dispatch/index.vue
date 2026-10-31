<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { consultationAdminApi as api } from '../../api/consultation'
import { bookingStatusLabels } from '../../../../src/types/consultation'
import type { ConsultationConsultant, ConsultationNotice, ConsultationPresence, ConsultationRequest, ConsultationRequestV2 } from '../../../../src/types/consultation'
const consultants = ref<ConsultationConsultant[]>([])
const bookings = ref<ConsultationRequest[]>([])
const requests = ref<ConsultationRequestV2[]>([])
const presence = ref<ConsultationPresence[]>([])
const notices = ref<ConsultationNotice[]>([])
const selected = ref<Record<string, string>>({})
const error = ref('')
const loading = ref(true)
const busy = ref(false)
const editingConfig = ref(false)
let timer: ReturnType<typeof setInterval>
let initialized = false
let known = new Set<string>()
async function load() {
  try {
    const [directory, queue, notifications, requestQueue] = await Promise.all([api.directory(), api.queue(), api.notices(), api.requestQueue()])
    if (!editingConfig.value) consultants.value = directory
    bookings.value = queue.bookings; presence.value = queue.presence; notices.value = notifications; requests.value = requestQueue.requests
    if (initialized && notifications.some(n => !n.read && !known.has(n.id))) ElMessage.info('有新的待派单咨询')
    initialized = true; known = new Set(notifications.map(n => n.id)); error.value = ''
  } catch (e) { error.value = (e as Error).message } finally { loading.value = false }
}
async function act(task: () => Promise<unknown>, message = '操作成功') {
  if (busy.value) return; busy.value = true
  try { await task(); await load(); ElMessage.success(message) } catch (e) { error.value = (e as Error).message; ElMessage.error(error.value) } finally { busy.value = false }
}
function markRead(id: string) { return act(() => api.read(id)) }
function saveConsultant(value: unknown) { return act(async () => { await api.save(value as ConsultationConsultant); editingConfig.value = false }) }
async function assign(value: unknown) {
  const b = value as ConsultationRequest
  try { await ElMessageBox.confirm(`将 ${b.userName} 分配给选定的初级健管师？`, '确认派单'); await act(() => api.assign(b.id, selected.value[b.id] || b.consultantId)) } catch { /* User cancelled. */ }
}
async function autoAssign() { try { await ElMessageBox.confirm('为所有待派单客户匹配在线且有容量的初级健管师？', '自动派单'); await act(async () => { const result = await api.autoAssign(); ElMessage.info(`已派单 ${result.assignedCount} 人`) }) } catch { /* User cancelled. */ } }
async function assignRequest(value: unknown) {
  const item = value as ConsultationRequestV2
  const consultantId = selected.value[item.id] || item.consultantId
  if (!consultantId) return ElMessage.warning('请先选择健管师')
  try { await ElMessageBox.confirm(`将 ${item.userName} 分配给选定的健管师？`, '确认派单'); await act(() => api.assignRequest(item.id, consultantId), '新咨询已派单') } catch { /* User cancelled. */ }
}
async function autoAssignAll() { try { await ElMessageBox.confirm('为所有排队客户自动匹配在线且有容量的健管师？', '确认自动派单'); await act(async () => { const result = await api.autoAssignRequests(); ElMessage.info(`新咨询已派单 ${result.assignedCount} 人`) }) } catch { /* User cancelled. */ } }
onMounted(async () => { try { await api.login(); await load(); timer = setInterval(() => { if (!busy.value) load() }, 5000) } catch (e) { error.value = (e as Error).message; loading.value = false } })
onUnmounted(() => clearInterval(timer))
</script>
<template><main class="dispatch"><header><div><h1>咨询派单工作台</h1><p>待咨询客户、健管师容量与配对通知</p></div><el-button type="primary" :disabled="busy || loading" @click="autoAssign">自动派初级健管师</el-button></header>
  <el-alert v-if="error" :title="error" type="error" :closable="false" /><el-button @click="load">刷新</el-button>
  <el-card><h2>待处理通知 · {{ notices.filter(n => !n.read).length }}</h2><p v-if="!notices.length">暂无通知</p><div v-for="n in notices.filter(n => !n.read)" :key="n.id" class="notice">{{ n.title }}<el-button link @click="markRead(n.id)">已读</el-button></div></el-card>
  <el-card class="request-card"><div class="card-heading"><div><h2>即时咨询队列</h2><p>客户发起后由公司统一派单；健管师不自行设置时段。</p></div><el-button :disabled="busy" @click="autoAssignAll">自动派单</el-button></div><el-table v-loading="loading" :data="requests" empty-text="暂无待处理咨询"><el-table-column prop="userName" label="客户" /><el-table-column label="咨询方式"><template #default="{row}">{{ row.mode === 'immediate_voice' ? '语音咨询' : '文字咨询' }}</template></el-table-column><el-table-column prop="status" label="状态" /><el-table-column prop="consultantName" label="当前健管师"><template #default="{row}">{{ row.consultantName || '待分配' }}</template></el-table-column><el-table-column label="派单" width="330"><template #default="{row}"><template v-if="row.status === 'queued' || row.status === 'reassigned'"><el-select v-model="selected[row.id]" placeholder="选择健管师" style="width:170px"><el-option v-for="c in consultants" :key="c.id" :label="c.name" :value="c.id" :disabled="c.status !== 'available' || !c.freeConsultEnabled" /></el-select><el-button :disabled="busy" @click="assignRequest(row)">派单</el-button></template><el-tag v-else-if="row.status === 'assigned' || row.status === 'waiting_consultant'" type="warning">等待接入</el-tag><el-tag v-else-if="row.status === 'in_progress'" type="success">进行中</el-tag></template></el-table-column></el-table></el-card>
  <el-card><h2>历史预约兼容队列</h2><el-table v-loading="loading" :data="bookings" empty-text="暂无预约"><el-table-column prop="userName" label="客户" /><el-table-column label="时间"><template #default="{row}">{{ new Date(row.slotStartAt).toLocaleString('zh-CN') }}</template></el-table-column><el-table-column label="进度"><template #default="{row}">{{ bookingStatusLabels[row.status as ConsultationRequest['status']] }}</template></el-table-column><el-table-column prop="consultantName" label="当前健管师" /><el-table-column label="派单" width="300"><template #default="{row}"><template v-if="row.status === 'pending_assignment'"><el-select v-model="selected[row.id]" :placeholder="row.consultantName" style="width:150px"><el-option v-for="c in consultants" :key="c.id" :label="c.name" :value="c.id" :disabled="c.status !== 'available' || !c.freeConsultEnabled" /></el-select><el-button :disabled="busy" @click="assign(row)">派单</el-button></template></template></el-table-column></el-table></el-card>
  <el-card><h2>客户在线状态</h2><el-table :data="presence" empty-text="客户打开预约页后显示"><el-table-column prop="name" label="客户" /><el-table-column label="状态"><template #default="{row}">{{ !row.online ? '离线' : row.idle ? '在线中，暂无动作' : '在线活跃' }}</template></el-table-column><el-table-column prop="lastActionAt" label="最后操作时间" /></el-table></el-card>
  <el-card><h2>免费咨询资格与接待名额</h2><el-table :data="consultants"><el-table-column prop="name" label="初级健管师" /><el-table-column label="状态"><template #default="{row}"><el-select v-model="row.status" @change="editingConfig = true"><el-option label="可预约" value="available" /><el-option label="已额满" value="full" /><el-option label="离线" value="offline" /></el-select></template></el-table-column><el-table-column label="免费咨询"><template #default="{row}"><el-switch v-model="row.freeConsultEnabled" @change="editingConfig = true" /></template></el-table-column><el-table-column label="每日名额"><template #default="{row}"><el-input-number v-model="row.dailyLimit" @change="editingConfig = true" :min="1" :max="100" /></template></el-table-column><el-table-column label="操作"><template #default="{row}"><el-button :disabled="busy" @click="saveConsultant(row)">保存</el-button></template></el-table-column></el-table></el-card>
</main></template>
<style scoped>.dispatch{max-width:1400px;margin:auto;padding:28px;color:#26313e;background:#faf6f1;min-height:100vh;box-sizing:border-box}header{display:flex;align-items:center;justify-content:space-between;gap:20px}h1{font-size:26px}h2{font-size:18px;margin:0 0 8px}.card-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.card-heading p{margin:0;color:#73818a}.el-card{margin-top:20px}.notice{padding:10px 0;display:flex;justify-content:space-between}@media(max-width:700px){.dispatch{padding:14px}header{display:block}.card-heading{display:block}.card-heading .el-button{margin-top:12px}}</style>

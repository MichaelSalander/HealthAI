<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { onShow, onHide, onUnload } from '@dcloudio/uni-app'
import AppCard from './AppCard.vue'
import { consultationRepository as api } from '../services/api/consultation'
import type { ConsultationMessage, ConsultationRoom as Room, DemoSession, VoiceSession } from '../types/consultation'
import type { Observation } from '../types/domain'
import { uniApi as uni } from '../services/platform/uni'

const props = defineProps<{ roomId: string; session: DemoSession }>()
const emit = defineEmits<{ (event: 'back'): void; (event: 'completed'): void }>()
const room = ref<Room>(); const messages = ref<ConsultationMessage[]>([]); const draft = ref(''); const error = ref(''); const loading = ref(true); const sending = ref(false); const voice = ref<VoiceSession>(); const showHealth = ref(false); const healthObservations = ref<Observation[]>([])
let timer: ReturnType<typeof setInterval> | undefined
let socket: WebSocket | undefined
const otherPerson = computed(() => room.value?.participants.find(item => item.userId !== props.session.id))
const isConsultant = computed(() => props.session.role === 'consultant')
const accessDenied = computed(() => /无权|权限|不存在|失效/.test(error.value))
const invalidTitle = computed(() => isConsultant.value ? '这是一间客户专属咨询室' : '这是一间你的专属咨询室')
const invalidCopy = computed(() => isConsultant.value ? '当前账号不是本次配对的健管师，请从工作台的待办咨询进入。' : '当前账号不是本次咨询的参与者，请从“我的咨询”进入自己的聊天室。')
const invalidAction = computed(() => isConsultant.value ? '返回健管师工作台' : '返回我的咨询')
const statusText = computed(() => room.value?.status === 'completed' ? '已结束' : voice.value?.status === 'connected' ? '语音通话中' : otherPerson.value?.online ? '在线' : '暂时离线')
const roomBannerTitle = computed(() => isConsultant.value ? '客户咨询' : '健康咨询')
const roomBannerSubtitle = computed(() => isConsultant.value ? '查看客户资料并跟进本次咨询' : '与健管师沟通你的健康问题')
const healthDrawerTitle = computed(() => isConsultant.value ? '客户健康摘要' : '我的健康摘要')

async function load() { try { const [roomData, result, voiceData] = await Promise.all([api.room(props.roomId, props.session), api.messages(props.roomId, props.session), api.voiceSessions(props.roomId, props.session)]); room.value = roomData; messages.value = result.items; voice.value = voiceData || undefined; if (isConsultant.value) { const health = await api.clientHealth(roomData.userId, props.session); healthObservations.value = health.observations } if (messages.value.length) await api.readRoom(props.roomId, messages.value[messages.value.length - 1].id, props.session); error.value = '' } catch (e) { error.value = /无权|权限|不存在/.test((e as Error).message) ? '该咨询房间已结束、失效，或当前账号没有查看权限。请从咨询列表进入有效的咨询。' : (e as Error).message } finally { loading.value = false } }
async function send() { const text = draft.value.trim(); if (!text || sending.value || room.value?.status === 'completed') return; sending.value = true; try { await api.sendMessage(props.roomId, text, props.session); draft.value = ''; await load() } catch (e) { error.value = (e as Error).message } finally { sending.value = false } }
async function startOrAcceptVoice() { uni.showModal({ title: '语音咨询', content: '语音功能暂未开启，请先使用文字消息沟通。', showCancel: false }) }
async function complete() { if (!isConsultant.value || !room.value) return; try { await api.completeRoom(room.value.id, '本次咨询已完成，建议继续记录健康数据并按计划复查。', props.session); await load(); emit('completed') } catch (e) { error.value = (e as Error).message } }
function stop() { if (timer) clearInterval(timer); timer = undefined }
function connectRealtime() {
  if (typeof WebSocket === 'undefined' || typeof location === 'undefined') return
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  socket?.close()
  socket = new WebSocket(`${protocol}//${location.host}/ws/conversations/${encodeURIComponent(props.roomId)}?token=${encodeURIComponent(props.session.token)}`)
  socket.onmessage = event => {
    try {
      const payload = JSON.parse(String(event.data))
      if (payload.type === 'message.created' && payload.data?.conversationId === props.roomId) load()
    } catch { /* Ignore malformed realtime frames and keep HTTP fallback alive. */ }
  }
  socket.onerror = () => { socket?.close(); socket = undefined }
  socket.onclose = () => { socket = undefined }
}
function start() { stop(); connectRealtime(); timer = setInterval(load, 5000) }
function showRoomMenu() { uni.showModal({ title: '咨询信息', content: '本次咨询可查看健康摘要并发送消息。语音功能暂未开放。', showCancel: false }) }
onShow(() => { api.joinRoom(props.roomId, props.session).catch(() => undefined); load(); start() }); onHide(() => { stop(); socket?.close(); socket = undefined }); onUnload(() => { stop(); socket?.close(); socket = undefined }); onBeforeUnmount(() => { stop(); socket?.close(); socket = undefined })
</script>

<template>
  <view class="room-shell">
    <view class="room-topbar"><view class="back" @click="emit('back')">‹</view><view class="room-title"><text>{{ otherPerson?.name || '一对一健康咨询' }}</text><view class="presence"><view class="presence-dot" :class="{ offline: !otherPerson?.online }" /><text>{{ statusText }}</text></view></view><view class="room-more" @click="showRoomMenu">⋯</view></view>
    <view class="room-banner"><view class="room-avatar">{{ otherPerson?.name?.slice(0, 1) || '健' }}</view><view class="room-banner-copy"><text class="room-banner-title">{{ roomBannerTitle }}</text><text class="room-banner-subtitle">{{ roomBannerSubtitle }}</text></view></view>
    <view v-if="error && accessDenied" class="room-invalid"><view class="invalid-icon">锁</view><text class="invalid-title">{{ invalidTitle }}</text><text class="invalid-copy">{{ invalidCopy }}</text><text class="invalid-detail">{{ error }}</text><button class="invalid-action" @click="emit('back')">{{ invalidAction }}</button></view>
    <view v-else-if="error" class="room-error">{{ error }}</view>
    <scroll-view v-if="!accessDenied" scroll-y class="message-scroll" :scroll-into-view="messages.length ? `message-${messages[messages.length - 1].id}` : ''"><view class="system-tip">健康管理服务记录</view><view v-if="loading" class="loading">正在进入咨询房间…</view><view v-for="message in messages" :id="`message-${message.id}`" :key="message.id" class="message-row" :class="{ mine: message.senderId === props.session.id, system: message.type === 'system' }"><view v-if="message.type === 'system'" class="system-message">{{ message.content }}</view><template v-else><view class="message-avatar">{{ message.senderName.slice(0, 1) }}</view><view class="message-stack"><text v-if="message.senderId !== props.session.id" class="sender-name">{{ message.senderName }}</text><view class="bubble">{{ message.content }}</view><text class="message-time">{{ new Date(message.sentAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</text></view></template></view></scroll-view>
    <view v-if="showHealth" class="health-drawer"><view class="drawer-head"><text>{{ healthDrawerTitle }}</text><text @click="showHealth = false">×</text></view><text class="drawer-label">最近状态</text><text v-if="healthObservations.length" class="drawer-value">{{ healthObservations.slice(0, 3).map(item => `${item.name} ${item.status}`).join(' · ') }}</text><text v-else class="drawer-muted">暂无可展示的健康指标</text><text class="drawer-label">资料说明</text><text class="drawer-muted">仅展示已授权的健康摘要，详细分析请查看 AI 洞察。</text></view>
    <view v-if="!accessDenied" class="room-tools"><view @click="showHealth = !showHealth"><text class="tool-icon">♧</text><text>健康摘要</text></view><view v-if="isConsultant" @click="complete"><text class="tool-icon end">✓</text><text>结束咨询</text></view></view>
    <view v-if="!accessDenied" class="composer"><input v-model="draft" confirm-type="send" placeholder="输入消息…" @confirm="send" /><button class="send" :disabled="sending" @click="send">发送</button></view>
  </view>
</template>

<style scoped>
.room-shell{position:relative;display:flex;flex-direction:column;width:100%;height:100vh;box-sizing:border-box;background:#fffaf6;color:#2b231f}.room-topbar{flex:0 0 92rpx;display:flex;align-items:center;justify-content:space-between;padding:0 28rpx;background:#fff;border-bottom:1rpx solid #f1e8df}.back,.room-more{width:56rpx;color:#b36a3e;font-size:50rpx;line-height:1;text-align:center}.room-title{text-align:center}.room-title>text{display:block;font-size:29rpx;font-weight:800}.presence{display:flex;align-items:center;justify-content:center;gap:8rpx;margin-top:7rpx;color:#66a879;font-size:19rpx}.presence-dot{width:13rpx;height:13rpx;border-radius:50%;background:#72be83}.presence-dot.offline{background:#b4b2ad}.room-banner{flex:0 0 116rpx;display:flex;align-items:center;padding:18rpx 28rpx;background:linear-gradient(135deg,#fff0e5,#fffaf6)}.room-avatar{width:70rpx;height:70rpx;margin-right:17rpx;border-radius:24rpx;color:#fff;background:linear-gradient(145deg,#dc8e5b,#b9582d);font-size:31rpx;line-height:70rpx;text-align:center;font-weight:800}.room-banner-copy{flex:1;min-width:0}.room-banner-title{display:block;color:#5c3425;font-size:25rpx;font-weight:800}.room-banner-subtitle{display:block;margin-top:7rpx;color:#98796a;font-size:20rpx}.room-live{padding:8rpx 13rpx;color:#ae683f;border-radius:13rpx;background:#fff;border:1rpx solid #f1d5c1;font-size:18rpx}.room-live.talking{color:#fff;background:#d96b2b;border-color:#d96b2b}.room-error{margin:14rpx 28rpx 0;padding:16rpx;color:#c84e34;border-radius:15rpx;background:#fff0ed;font-size:21rpx;line-height:1.5}.room-invalid{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;margin:0 34rpx;padding:48rpx 24rpx;text-align:center}.invalid-title{color:#5c3425;font-size:33rpx;font-weight:800}.invalid-copy{margin-top:18rpx;color:#8f7b70;font-size:24rpx;line-height:1.65}.invalid-action{margin-top:34rpx;width:100%;height:82rpx;border:0;border-radius:22rpx;color:#fff;background:#d96b2b;font-size:26rpx}.message-scroll{flex:1;min-height:0;padding:20rpx 28rpx 10rpx;box-sizing:border-box}.system-tip{margin:0 auto 24rpx;padding:10rpx 18rpx;color:#a49891;border-radius:16rpx;background:#f6eee9;font-size:19rpx;text-align:center}.loading{padding:80rpx 0;color:#a49891;text-align:center;font-size:22rpx}.message-row{display:flex;align-items:flex-start;margin:22rpx 0}.message-row.mine{justify-content:flex-end}.message-row.mine .message-avatar{order:2;margin:0 0 0 12rpx;background:#f2bd98}.message-row.mine .message-stack{align-items:flex-end}.message-row.system{justify-content:center}.system-message{padding:9rpx 16rpx;color:#a49891;border-radius:14rpx;background:#f5eeea;font-size:19rpx}.message-avatar{flex:0 0 56rpx;width:56rpx;height:56rpx;margin-right:12rpx;border-radius:20rpx;color:#fff;background:#d98a5b;font-size:25rpx;line-height:56rpx;text-align:center;font-weight:700}.message-stack{display:flex;flex-direction:column;max-width:70%}.sender-name{margin:0 0 7rpx 4rpx;color:#9a8174;font-size:19rpx}.bubble{padding:17rpx 20rpx;color:#4c3930;border-radius:22rpx 22rpx 22rpx 7rpx;background:#fff;box-shadow:0 5rpx 18rpx rgba(121,77,49,.06);font-size:25rpx;line-height:1.55;overflow-wrap:anywhere}.mine .bubble{color:#fff;border-radius:22rpx 22rpx 7rpx 22rpx;background:#d96b2b}.message-time{margin-top:6rpx;color:#b2a49c;font-size:18rpx}.health-drawer{position:absolute;z-index:20;left:20rpx;right:20rpx;bottom:232rpx;padding:24rpx;border:1rpx solid #f0dfd2;border-radius:24rpx;background:#fff;box-shadow:0 16rpx 50rpx rgba(86,48,28,.18)}.drawer-head{display:flex;justify-content:space-between;color:#5c3425;font-size:27rpx;font-weight:800}.drawer-label{display:block;margin-top:20rpx;color:#aa8b7d;font-size:19rpx}.drawer-value{display:block;margin-top:7rpx;color:#50372c;font-size:24rpx}.drawer-muted{display:block;margin-top:7rpx;color:#8d7c73;font-size:20rpx;line-height:1.55}.room-tools{flex:0 0 82rpx;display:flex;align-items:center;justify-content:space-around;border-top:1rpx solid #f1e8df;background:#fff;color:#806f66;font-size:19rpx}.room-tools>view{display:flex;flex-direction:column;align-items:center;gap:5rpx}.tool-icon{display:flex;align-items:center;justify-content:center;width:37rpx;height:37rpx;border-radius:13rpx;color:#c8652a;background:#fff0e5;font-size:22rpx}.tool-icon.voice{color:#fff;background:#d96b2b}.tool-icon.end{color:#4c9c67;background:#e8f7ed}.composer{flex:0 0 106rpx;display:flex;align-items:center;gap:12rpx;padding:12rpx 22rpx calc(12rpx + env(safe-area-inset-bottom));box-sizing:border-box;border-top:1rpx solid #f1e8df;background:#fff}.composer input{flex:1;min-width:0;height:72rpx;padding:0 20rpx;border:1rpx solid #eadbd2;border-radius:22rpx;background:#fffaf6;color:#43332c;font-size:23rpx}.voice-quick{width:72rpx;height:72rpx;border-radius:22rpx;color:#d96b2b;background:#fff0e5;font-size:32rpx;line-height:72rpx;text-align:center}.send{flex:0 0 108rpx;width:108rpx;height:72rpx;padding:0;border:0;border-radius:22rpx;color:#fff;background:#d96b2b;font-size:23rpx;line-height:72rpx}.send[disabled]{opacity:.55}
</style>

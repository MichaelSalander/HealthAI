<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow, onHide, onUnload } from '@dcloudio/uni-app'
import AppCard from '../../components/AppCard.vue'
import ConsultantBottomNav from '../../components/ConsultantBottomNav.vue'
import ConsultationBookingCard from '../../components/ConsultationBookingCard.vue'
import { consultationRepository as api } from '../../services/api/consultation'
import type { ConsultationConsultant, ConsultationNotice, ConsultationRequest, ConsultationRequestV2, DemoSession } from '../../types/consultation'
import { uniApi as uni } from '../../services/platform/uni'

const session = ref<DemoSession>()
const consultant = ref<ConsultationConsultant>()
const bookings = ref<ConsultationRequest[]>([])
const requests = ref<ConsultationRequestV2[]>([])
const notices = ref<ConsultationNotice[]>([])
const error = ref('')
const saving = ref(false)
const initializing = ref(true)
const isDemoMode = Boolean(!(import.meta as any).env?.VITE_AUTH_MODE)
let timer: ReturnType<typeof setInterval> | undefined
let knownNoticeIds = new Set<string>()
let noticesLoaded = false
const pendingCount = computed(() => requests.value.filter(item => item.status === 'assigned').length + bookings.value.filter(item => item.status === 'assigned').length)
const activeCount = computed(() => requests.value.filter(item => item.status === 'in_progress').length + bookings.value.filter(item => item.status === 'accepted').length)
const unreadCount = computed(() => notices.value.filter(item => !item.read).length)

async function load() {
  try {
    if (!session.value) {
      const authMode = (import.meta as any).env?.VITE_AUTH_MODE
      if (authMode === 'wechat' && !uni.getStorageSync('healthai_consultant_session')) { uni.redirectTo({ url: '/pages/consultant/login' }); return }
      session.value = await api.login('consultant', 'c-101')
    }
    const [directory, items, consultationItems, notifications] = await Promise.all([api.directory(), api.bookings(session.value), api.consultationRequests(session.value), api.notices(session.value)])
    consultant.value = directory.find(item => item.id === session.value?.id); bookings.value = items; requests.value = consultationItems; notices.value = notifications
    if (noticesLoaded && notifications.some(item => !item.read && !knownNoticeIds.has(item.id))) uni.showToast({ title: '有新的客户配对通知' })
    knownNoticeIds = new Set(notifications.map(item => item.id)); noticesLoaded = true; error.value = ''
  } catch (e) { error.value = (e as Error).message } finally { initializing.value = false }
}
async function act(fn: () => Promise<unknown>) { if (saving.value) return; saving.value = true; try { await fn(); await load() } catch (e) { error.value = (e as Error).message } finally { saving.value = false } }
function stop() { if (timer) clearInterval(timer); timer = undefined }
onShow(() => { load(); stop(); timer = setInterval(load, 5000) }); onHide(stop); onUnload(stop)
async function switchConsultant(id: string) { session.value = await api.login('consultant', id); noticesLoaded = false; await load() }
async function acceptRequest(item: ConsultationRequestV2) { if (!session.value) return; await act(async () => { const result = await api.acceptRequest(item.id, session.value!); uni.navigateTo({ url: `/pages/consultant/room?conversationId=${result.room.id}&consultantId=${session.value!.id}` }) }) }
</script>

<template>
  <view class="page workbench-page">
    <view class="page-head"><view><text class="eyebrow">今日工作</text><text class="title">你好，{{ session?.name || '健管师' }}</text><text class="subtitle">及时回应每一位找你的客户</text></view><view class="head-bell" @click="uni.reLaunch({ url: '/pages/consultants/notices' })"><text>◉</text><view v-if="unreadCount" class="badge">{{ unreadCount }}</view></view></view>
    <AppCard v-if="error" class="error-card"><text class="danger">{{ error }}</text><button class="retry" @click="load">重新连接</button></AppCard><text v-if="initializing" class="muted loading">正在同步工作台…</text>
    <view class="summary-grid"><view class="summary-card primary"><text class="summary-number">{{ pendingCount }}</text><text class="summary-label">待确认咨询</text><text class="summary-hint">需要及时回应</text></view><view class="summary-card"><text class="summary-number">{{ activeCount }}</text><text class="summary-label">进行中</text><text class="summary-hint">今天的服务</text></view></view>
    <view class="section-head"><text class="section-title">待办咨询</text><text class="section-link" @click="uni.reLaunch({ url: '/pages/consultant/clients' })">查看全部 ›</text></view>
    <AppCard v-for="item in requests" :key="item.id" class="request-card"><view class="request-head"><view><text class="request-title">{{ item.userName }} · {{ item.mode === 'immediate_voice' ? '语音咨询' : '文字咨询' }}</text><text class="muted">{{ item.status === 'assigned' ? '平台已为你配对，请及时响应' : item.status === 'in_progress' ? '咨询进行中' : '等待平台处理' }}</text></view><text class="request-tag" :class="item.status">{{ item.status === 'assigned' ? '待确认' : item.status === 'in_progress' ? '进行中' : item.status }}</text></view><button v-if="item.status === 'assigned'" class="action-btn" :disabled="saving || consultant?.status === 'offline'" @click="acceptRequest(item)">进入咨询房间</button><button v-if="item.status === 'in_progress' && item.conversationId" class="action-btn" @click="uni.navigateTo({ url: `/pages/consultant/room?conversationId=${item.conversationId}&consultantId=${session?.id}` })">继续咨询</button></AppCard>
    <AppCard v-if="!bookings.length" class="empty-card"><text class="empty-icon">✓</text><text class="empty-title">暂时没有待办</text><text class="muted">公司分配新的客户后会在这里提醒你</text></AppCard>
    <ConsultationBookingCard v-for="booking in bookings" :key="booking.id" :booking="booking" class="booking-card"><button v-if="booking.status === 'assigned'" class="action-btn" :disabled="saving || consultant?.status === 'offline'" @click="act(() => api.transition(booking.id, 'accept', session))">接受咨询</button><button v-if="booking.status === 'accepted'" class="action-btn" :disabled="saving" @click="act(() => api.transition(booking.id, 'complete', session))">完成本次咨询</button><button v-if="booking.status === 'completed'" class="ghost-btn" @click="uni.navigateTo({ url: '/pages/consultation/index' })">查看服务记录</button></ConsultationBookingCard>
    <view class="section-head"><text class="section-title">我的服务状态</text><text class="company-mark">平台统一安排</text></view>
    <AppCard class="status-card"><view class="status-row"><view class="status-dot" :class="consultant?.status" /><view class="status-copy"><text class="status-name">{{ consultant?.status === 'offline' ? '暂时离线' : '在线接待中' }}</text><text class="muted">{{ consultant?.status === 'offline' ? '上线后才能接受新咨询' : '有客户配对时会立即通知你' }}</text></view><text class="status-tag">{{ consultant?.status === 'full' ? '今日已满' : consultant?.status === 'offline' ? '离线' : '可接待' }}</text></view><view class="company-note"><text class="note-icon">i</text><text>咨询时段和客户由平台统一分配，你只需要保持在线并及时回应。</text></view></AppCard>
    <view class="section-head"><text class="section-title">最新提醒</text><text class="section-link" @click="uni.reLaunch({ url: '/pages/consultants/notices' })">全部通知 ›</text></view>
    <AppCard class="notice-card"><view v-if="notices[0]" class="notice-row"><view class="notice-icon">!</view><view class="notice-copy"><text class="notice-title">{{ notices[0].title }}</text><text class="muted">及时确认咨询，客户会收到状态更新</text></view></view><text v-else class="muted">暂无新的提醒</text></AppCard>
    <view v-if="isDemoMode" class="demo-switch"><text>演示账号</text><button size="mini" @click="switchConsultant('c-101').catch(e => error = e.message)">陈晨</button><button size="mini" @click="switchConsultant('c-102').catch(e => error = e.message)">林悦</button></view>
    <ConsultantBottomNav active="workbench" />
  </view>
</template>

<style scoped>
.workbench-page{padding-top:34rpx;padding-bottom:170rpx;background:#fffaf6}.page-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28rpx}.eyebrow{display:block;color:#b37a57;font-size:22rpx;letter-spacing:2rpx}.title{display:block;margin-top:8rpx;color:#2a201c;font-size:42rpx}.head-bell{position:relative;display:flex;align-items:center;justify-content:center;width:74rpx;height:74rpx;margin-top:4rpx;border-radius:24rpx;color:#c8652a;background:#fff0e5;font-size:33rpx}.badge{position:absolute;right:-6rpx;top:-6rpx;min-width:30rpx;height:30rpx;padding:0 8rpx;box-sizing:border-box;border:3rpx solid #fffaf6;border-radius:20rpx;color:#fff;background:#db5b36;font-size:18rpx;line-height:25rpx;text-align:center}.error-card{padding:20rpx 24rpx;background:#fff2ee}.error-card .danger{display:block;line-height:1.5}.retry{width:100%;height:62rpx;margin-top:16rpx;line-height:62rpx;color:#c25728;background:#fff}.loading{display:block;margin-bottom:20rpx}.summary-grid{display:flex;gap:18rpx}.summary-card{flex:1;min-height:156rpx;padding:24rpx;box-sizing:border-box;border:1rpx solid #f3e6dc;border-radius:26rpx;background:#fff;box-shadow:0 8rpx 22rpx rgba(125,78,42,.05)}.summary-card.primary{color:#fff;border:0;background:linear-gradient(140deg,#e47b38,#c95d28);box-shadow:0 12rpx 26rpx rgba(202,96,42,.2)}.summary-number,.summary-label,.summary-hint,.status-name,.notice-title,.request-title,.request-head .muted{display:block}.summary-number{font-size:52rpx;font-weight:800;line-height:1}.summary-label{margin-top:16rpx;font-size:25rpx;font-weight:700}.summary-hint{margin-top:8rpx;color:#a4938a;font-size:20rpx}.primary .summary-hint{color:#ffe7d7}.section-head{display:flex;align-items:center;justify-content:space-between;margin:34rpx 2rpx 16rpx}.section-head .section-title{margin:0;color:#2a201c;font-size:30rpx;font-weight:800}.section-link{color:#c8652a;font-size:22rpx}.company-mark{padding:8rpx 14rpx;color:#b37a57;border-radius:12rpx;background:#fff0e5;font-size:19rpx}.request-card{margin-top:16rpx;padding:24rpx;border-left:7rpx solid #d96b2b;background:#fff}.request-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16rpx}.request-head .muted{margin-top:9rpx}.request-tag{padding:8rpx 13rpx;color:#c8652a;border-radius:13rpx;background:#fff0e5;font-size:19rpx;white-space:nowrap}.request-tag.in_progress{color:#378e5e;background:#e7f7ed}.booking-card{margin-top:16rpx;border-color:#f0e1d6}.action-btn{width:100%;height:78rpx;margin-top:20rpx;line-height:78rpx;color:#fff;border:0;background:#d96b2b}.ghost-btn{width:100%;height:70rpx;margin-top:18rpx;line-height:70rpx;color:#c8652a;border:1rpx solid #f0d4c2;background:#fff8f2}.empty-card{text-align:center;padding:42rpx 24rpx}.empty-icon{display:block;width:66rpx;height:66rpx;margin:0 auto;border-radius:50%;color:#fff;background:#8bc5a2;font-size:35rpx;line-height:66rpx}.empty-title{display:block;margin-top:18rpx;font-size:27rpx;font-weight:700}.empty-card .muted{margin-top:9rpx}.status-card{padding:24rpx}.status-row{display:flex;align-items:center}.status-dot{flex:0 0 20rpx;width:20rpx;height:20rpx;margin-right:16rpx;border-radius:50%;background:#65ba85;box-shadow:0 0 0 8rpx #e5f7ea}.status-dot.full{background:#e7a03e;box-shadow:0 0 0 8rpx #fff4dc}.status-dot.offline{background:#a7aaa8;box-shadow:0 0 0 8rpx #eff0ef}.status-copy{flex:1}.status-tag{display:block;padding:9rpx 14rpx;color:#3a9862;border-radius:14rpx;background:#eaf8ee;font-size:20rpx}.company-note{display:flex;align-items:flex-start;gap:12rpx;margin-top:22rpx;padding:18rpx;color:#7e7068;border-radius:16rpx;background:#fff8f2;font-size:21rpx;line-height:1.55}.note-icon{flex:0 0 28rpx;width:28rpx;height:28rpx;border-radius:50%;color:#fff;background:#d98a5b;font-size:19rpx;line-height:28rpx;text-align:center}.notice-card{padding:22rpx}.notice-row{display:flex;align-items:center}.notice-icon{flex:0 0 54rpx;width:54rpx;height:54rpx;margin-right:16rpx;border-radius:18rpx;color:#c8652a;background:#fff0e5;font-size:31rpx;line-height:54rpx;text-align:center;font-weight:800}.notice-copy{flex:1;min-width:0}.notice-copy .muted{margin-top:7rpx}.demo-switch{display:flex;align-items:center;gap:12rpx;margin:28rpx 0 10rpx;color:#a3958e;font-size:20rpx}.demo-switch button{margin:0;padding:0 18rpx;color:#ba6735;background:#fff0e5;border:0}
</style>

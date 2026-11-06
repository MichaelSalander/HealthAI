<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow, onHide, onUnload } from '@dcloudio/uni-app'
import AppCard from '../../components/AppCard.vue'
import ConsultantBottomNav from '../../components/ConsultantBottomNav.vue'
import { consultationRepository as api } from '../../services/api/consultation'
import type { ConsultationNotice, DemoSession } from '../../types/consultation'
import { uniApi as uni } from '../../services/platform/uni'

const items = ref<ConsultationNotice[]>([])
const session = ref<DemoSession>()
const error = ref('')
const loading = ref(true)
let timer: ReturnType<typeof setInterval> | undefined
const unread = computed(() => items.value.filter(item => !item.read).length)

async function load() {
  try {
    const stored = uni.getStorageSync('healthai_consultant_session')
    if (!stored) { uni.redirectTo({ url: '/pages/consultant/login' }); return }
    session.value ||= JSON.parse(String(stored)) as DemoSession
    items.value = await api.notices(session.value)
    error.value = ''
  } catch (e) { error.value = (e as Error).message } finally { loading.value = false }
}
async function read(id: string) { try { if (session.value) await api.readNotice(id, session.value); await load() } catch (e) { error.value = (e as Error).message } }
async function open(item: ConsultationNotice) { if (!item.read) await read(item.id); if (item.resourceType === 'conversation' && item.resourceId) uni.navigateTo({ url: `/pages/consultant/room?conversationId=${item.resourceId}&consultantId=${session.value?.id || ''}` }); else if (item.resourceType === 'consultation_request') uni.reLaunch({ url: '/pages/consultant/workbench' }) }
function stop() { if (timer) clearInterval(timer); timer = undefined }
onShow(() => { load(); stop(); timer = setInterval(load, 5000) })
onHide(stop)
onUnload(stop)
</script>

<template>
  <view class="page notices-page">
    <view class="page-head"><view><text class="eyebrow">实时消息</text><text class="title">咨询通知</text><text class="subtitle">客户配对、状态变化都会第一时间提醒你</text></view><view class="notice-count"><text>{{ unread }}</text><text>未读</text></view></view>
    <AppCard v-if="error" class="error-card"><text class="danger">{{ error }}</text><button class="retry" @click="load">重新连接</button></AppCard>
    <text v-if="loading" class="muted loading">正在同步通知…</text>
    <AppCard v-if="!loading && !items.length" class="empty-card"><text class="empty-icon">✓</text><text class="empty-title">暂无新通知</text><text class="muted">客户配对后，通知会出现在这里</text></AppCard>
    <AppCard v-for="item in items" :key="item.id" class="notice-card" :class="{ unread: !item.read }" @click="open(item)"><view class="notice-row"><view class="notice-icon">{{ item.read ? '•' : '!' }}</view><view class="notice-content"><view class="notice-title-row"><text class="notice-title">{{ item.title }}</text><text v-if="!item.read" class="new-tag">未读</text></view><text class="notice-time">{{ new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false }) }}</text><text class="notice-desc">请及时查看客户状态并确认咨询，点击进入对应页面。</text></view></view><button v-if="!item.read" class="read-btn" @click.stop="read(item.id)">标记为已读</button></AppCard>
    <ConsultantBottomNav active="notices" />
  </view>
</template>

<style scoped>
.notices-page{padding-top:34rpx;padding-bottom:170rpx;background:#fffaf6}.page-head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28rpx}.eyebrow{display:block;color:#b37a57;font-size:22rpx;letter-spacing:2rpx}.title{display:block;margin-top:8rpx;color:#2a201c;font-size:42rpx;font-weight:800}.notice-count{display:flex;flex-direction:column;align-items:center;justify-content:center;width:76rpx;height:76rpx;border-radius:25rpx;color:#c8652a;background:#fff0e5}.notice-count text:first-child{font-size:30rpx;font-weight:800;line-height:1}.notice-count text:last-child{margin-top:7rpx;font-size:18rpx}.error-card{padding:20rpx 24rpx;background:#fff2ee}.error-card .danger{display:block;line-height:1.5}.retry{width:100%;height:62rpx;margin-top:16rpx;line-height:62rpx;color:#c25728;background:#fff}.loading{display:block;margin-bottom:20rpx}.empty-card{text-align:center;padding:55rpx 24rpx}.empty-icon{display:block;width:66rpx;height:66rpx;margin:0 auto;border-radius:50%;color:#fff;background:#8bc5a2;font-size:35rpx;line-height:66rpx}.empty-title{display:block;margin-top:18rpx;font-size:28rpx;font-weight:700}.empty-card .muted{margin-top:10rpx}.notice-card{position:relative;margin-top:16rpx;padding:24rpx;border-color:#f1e3d9}.notice-card.unread{border-left:7rpx solid #d96b2b;background:#fff}.notice-row{display:flex;align-items:flex-start}.notice-icon{flex:0 0 58rpx;width:58rpx;height:58rpx;margin-right:17rpx;border-radius:20rpx;color:#a99e96;background:#f4eeea;font-size:33rpx;font-weight:800;line-height:58rpx;text-align:center}.unread .notice-icon{color:#fff;background:#d96b2b}.notice-content{flex:1;min-width:0}.notice-title-row{display:flex;align-items:center;gap:12rpx}.notice-title{color:#332821;font-size:27rpx;font-weight:800;line-height:1.4}.new-tag{padding:5rpx 10rpx;color:#c25728;border-radius:10rpx;background:#fff0e5;font-size:18rpx}.notice-time{display:block;margin-top:7rpx;color:#a19690;font-size:20rpx}.notice-desc{display:block;margin-top:13rpx;color:#776b64;font-size:22rpx;line-height:1.55}.read-btn{width:100%;height:64rpx;margin-top:20rpx;line-height:64rpx;color:#c8652a;border:1rpx solid #f0d4c2;background:#fff8f2;font-size:23rpx}
</style>

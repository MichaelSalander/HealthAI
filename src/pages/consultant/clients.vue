<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppCard from '../../components/AppCard.vue'
import ConsultantBottomNav from '../../components/ConsultantBottomNav.vue'
import { consultationRepository as api } from '../../services/api/consultation'
import { uniApi as uni } from '../../services/platform/uni'
import type { ConsultantClient, DemoSession } from '../../types/consultation'

const clients = ref<ConsultantClient[]>([])
const error = ref('')
const session = ref<DemoSession>()
const openingRoom = ref('')
const loading = ref(true)
const activeClients = computed(() => clients.value.filter(item => item.status === '服务中'))
const followUpClients = computed(() => clients.value.filter(item => item.status !== '服务中'))

async function load() {
  loading.value = true
  try {
    const stored = uni.getStorageSync('healthai_consultant_session')
    if (!stored) { uni.redirectTo({ url: '/pages/consultant/login' }); return }
    session.value = await api.login('consultant')
    clients.value = await api.consultantClients(session.value)
    error.value = ''
  } catch (e) { error.value = (e as Error).message }
  finally { loading.value = false }
}
function openHealth(userId: string) { uni.navigateTo({ url: `/pages/consultant/insights?userId=${encodeURIComponent(userId)}` }) }
async function openChat(client: ConsultantClient) {
  if (client.conversationId) {
    uni.navigateTo({ url: `/pages/consultant/room?conversationId=${encodeURIComponent(client.conversationId)}&consultantId=${encodeURIComponent(session.value?.id || '')}` })
    return
  }
  if (!client.requestId || !session.value) { uni.showToast({ title: '目前没有可进入的聊天室' }); return }
  openingRoom.value = client.id
  try {
    const result = await api.openConsultantRequest(client.requestId, session.value)
    uni.navigateTo({ url: `/pages/consultant/room?conversationId=${encodeURIComponent(result.room.id)}&consultantId=${encodeURIComponent(session.value.id)}` })
  } catch (e) { error.value = (e as Error).message }
  finally { openingRoom.value = '' }
}
function metricChange(current: string, previous: string | null) {
  if (previous === null) return '首次记录'
  const now = Number(current); const before = Number(previous)
  if (!Number.isFinite(now) || !Number.isFinite(before)) return `前次 ${previous}`
  const delta = now - before
  return delta === 0 ? '与前次相同' : `${delta > 0 ? '较前次 +' : '较前次 '}${Number(delta.toFixed(2))}`
}
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleDateString('zh-TW') : '尚无更新' }
onShow(load)
</script>

<template>
  <view class="page consultant-page">
    <view class="head"><view><text class="eyebrow">客户关系</text><text class="title">我的客户</text><text class="subtitle">查看负责客户与健康资料变化</text></view><text class="count">{{ clients.length }} 位</text></view>
    <view class="summary-row"><view class="summary"><text class="summary-num">{{ activeClients.length }}</text><text class="summary-label">服务中</text></view><view class="summary"><text class="summary-num">{{ followUpClients.length }}</text><text class="summary-label">待跟进</text></view></view>
    <AppCard v-if="error" class="error-card"><text class="danger">{{ error }}</text><button class="retry" @click="load">重新加载</button></AppCard>
    <text v-if="loading" class="muted loading">正在同步客户资料…</text>
    <AppCard v-if="!loading && !clients.length && !error" class="empty"><text class="empty-title">暂无分配客户</text><text class="muted">新客户配对后会显示在这里</text></AppCard>
    <template v-for="client in clients" :key="client.id">
      <AppCard class="client-card">
        <view class="client-head"><view class="avatar">{{ client.name.slice(0, 1) }}</view><view class="identity"><text class="client-name">{{ client.name }}</text><text class="muted">最近服务更新：{{ formatDate(client.lastActivityAt) }}</text></view><text class="status" :class="{ active: client.status === '服务中' }">{{ client.status }}</text></view>
        <view class="data-summary"><view class="data-total"><text class="data-number">{{ client.observationCount }}</text><text class="muted">项指标</text></view><view class="data-total"><text class="data-number">{{ client.reportCount }}</text><text class="muted">份报告</text></view><text class="data-date">健康数据</text></view>
        <view v-if="client.recentMetrics.length" class="metrics"><view v-for="metric in client.recentMetrics" :key="metric.code || metric.name" class="metric-row"><view class="metric-copy"><text class="metric-name">{{ metric.name }}</text><text class="metric-date">{{ formatDate(metric.measuredAt) }} · {{ metricChange(metric.value, metric.previousValue) }}</text></view><view class="metric-value"><text>{{ metric.value }}</text><text class="unit">{{ metric.unit }}</text></view></view></view>
        <view v-else class="no-metrics">客户尚未提供健康指标</view>
        <view class="actions"><button class="health-btn" @click="openHealth(client.id)">健康档案</button><button class="chat-btn" :loading="openingRoom === client.id" :disabled="openingRoom === client.id" @click="openChat(client)">进入聊天室</button></view>
      </AppCard>
    </template>
    <ConsultantBottomNav active="clients" />
  </view>
</template>

<style scoped>
.consultant-page{padding-top:34rpx;padding-bottom:170rpx;background:#fffaf6}.head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24rpx}.eyebrow{display:block;color:#b37a57;font-size:22rpx}.title{display:block;margin-top:8rpx;color:#2a201c;font-size:42rpx;font-weight:800}.subtitle{display:block;margin-top:9rpx;color:#8a7770;font-size:22rpx}.count{color:#c8652a;font-size:25rpx;font-weight:700}.summary-row{display:flex;gap:16rpx;margin-bottom:20rpx}.summary{flex:1;display:flex;align-items:baseline;gap:12rpx;padding:20rpx 24rpx;border:1rpx solid #f3e6dc;border-radius:22rpx;background:#fff}.summary-num{color:#c8652a;font-size:36rpx;font-weight:800}.summary-label{color:#77675e;font-size:22rpx}.client-card{margin-bottom:18rpx;padding:24rpx;background:#fff}.client-head{display:flex;align-items:center;gap:16rpx}.avatar{flex:0 0 72rpx;width:72rpx;height:72rpx;border-radius:24rpx;color:#fff;background:#d9824d;font-size:34rpx;line-height:72rpx;text-align:center;font-weight:800}.identity{flex:1;min-width:0}.client-name{display:block;color:#2a201c;font-size:29rpx;font-weight:800}.identity .muted{margin-top:6rpx;font-size:19rpx}.status{padding:8rpx 13rpx;border-radius:14rpx;color:#a46f31;background:#fff1dc;font-size:19rpx;white-space:nowrap}.status.active{color:#3d8b5c;background:#e7f7ed}.data-summary{display:flex;align-items:center;gap:24rpx;margin:20rpx 0 12rpx;padding:16rpx 18rpx;border-radius:16rpx;background:#fff8f2}.data-total{display:flex;align-items:baseline;gap:8rpx}.data-number{color:#3a2e27;font-size:27rpx;font-weight:800}.data-total .muted{font-size:19rpx}.data-date{margin-left:auto;color:#9b8476;font-size:19rpx}.metrics{border-top:1rpx solid #f2e8e1}.metric-row{display:flex;align-items:center;justify-content:space-between;gap:16rpx;padding:16rpx 2rpx;border-bottom:1rpx solid #f5eee9}.metric-copy{min-width:0}.metric-name{display:block;color:#4b3930;font-size:22rpx;font-weight:700}.metric-date{display:block;margin-top:6rpx;color:#9b8a81;font-size:18rpx}.metric-value{flex:none;color:#c8652a;font-size:27rpx;font-weight:800}.unit{margin-left:5rpx;color:#8a7770;font-size:18rpx;font-weight:400}.no-metrics{padding:20rpx 4rpx;color:#9b8a81;font-size:21rpx}.actions{display:flex;gap:14rpx;margin-top:18rpx}.actions button{flex:1;height:72rpx;margin:0;border-radius:16rpx;font-size:22rpx;line-height:72rpx}.health-btn{color:#b65e2c;border:1rpx solid #edcdb9;background:#fff8f2}.chat-btn{color:#fff;border:0;background:#d96b2b}.empty{text-align:center;padding:60rpx 24rpx}.empty-title{display:block;font-size:28rpx;font-weight:700}.empty .muted{margin-top:12rpx}.error-card{padding:22rpx;background:#fff2ee}.retry{margin-top:14rpx;color:#b65e2c;background:#fff}.loading{display:block;margin:24rpx 4rpx}
</style>

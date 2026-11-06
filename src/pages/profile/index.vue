<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppCard from '../../components/AppCard.vue'
import BottomNav from '../../components/BottomNav.vue'
import { healthRepository } from '../../services/api/repositories'
import { consultationRepository } from '../../services/api/consultation'
import type { DemoSession } from '../../types/consultation'
import type { HealthDataSources, Observation, Order } from '../../types/domain'

const go = (url: string) => uni.navigateTo({ url })
const dataSources = ref<HealthDataSources | null>(null)
const observations = ref<Observation[]>([])
const observationCount = ref(0)
const dataLoading = ref(true)
const dataError = ref('')
const session = ref<DemoSession | null>(null)
const orders = ref<Order[]>([])
const formatDate = (value?: string | null) => value ? value.slice(0, 10) : '暂无记录'
const activeOrder = computed(() => orders.value.find(item => item.status === '服务中' || item.paymentStatus === 'success'))
const switchAccount = () => { consultationRepository.logoutCustomer(); uni.reLaunch({ url: '/pages/login/index' }) }

const load = async () => {
  try {
    session.value = await consultationRepository.customer()
    const [sources, items, customerOrders] = await Promise.all([healthRepository.listDataSources(), healthRepository.getObservations(), consultationRepository.orders(session.value)])
    dataSources.value = sources
    observationCount.value = items.length
    observations.value = items.slice(0, 3)
    orders.value = customerOrders
  } catch (error) {
    dataError.value = error instanceof Error ? error.message : '健康资料暂时无法读取'
  } finally {
    dataLoading.value = false
  }
}
onShow(load)

const items = [
  { label: '我的健康档案', url: '/pages/health/index' },
  { label: '我的报告', url: '/pages/report/index' },
  { label: '健康资料授权', url: '/pages/health/consent' },
  { label: '我的服务计划', url: '/pages/records/index' },
  { label: '我的订单', url: '/pages/orders/index' },
  { label: '我的收藏', url: '/pages/consultants/index' },
  { label: '我的优惠券', url: '/pages/orders/index' },
  { label: '我的评价', url: '/pages/consultation/index' },
  { label: '设置', url: '/pages/service/index' }
]
if ((import.meta as any).env?.DEV) items.unshift({ label: '本地流程验收（演示）', url: '/pages/demo/index' })
</script>

<template>
  <view class="page">
    <AppCard class="profile-head"><view class="avatar">{{ session?.name?.slice(0, 1) || '我' }}</view><view class="grow"><text class="name">{{ session?.name || '会员' }}</text><text class="muted">账号：{{ session?.id || '未登录' }}</text></view><text class="switch" @click="switchAccount">切换账号</text></AppCard>
    <view class="benefit"><text class="benefit-title">◆ 我的健康权益</text><template v-if="activeOrder"><text>{{ activeOrder.planName }}</text><text class="benefit-date">已开通 · {{ formatDate(activeOrder.paidAt || activeOrder.createdAt) }}</text><button class="benefit-btn" @click="go('/pages/service/index')">查看权益</button></template><template v-else><text>暂未开通服务方案</text><text class="benefit-date">选择适合你的健康管理服务</text><button class="benefit-btn" @click="go('/pages/plans/formal')">去选择</button></template></view>
    <AppCard class="data-card" @click="go('/pages/health/index')">
      <view class="data-card-head"><text class="data-title">我的健康数据</text><text class="data-link">查看全部 ›</text></view>
      <text v-if="dataLoading" class="muted">正在同步健康资料…</text>
      <text v-else-if="dataError" class="data-error">{{ dataError }}</text>
      <template v-else>
        <view class="data-stats"><view><text class="stat-value">{{ observationCount }}</text><text class="stat-label">已记录指标</text></view><view><text class="stat-value">{{ dataSources?.reports.length || 0 }}</text><text class="stat-label">体检报告</text></view><view><text class="stat-value">{{ formatDate(dataSources?.lastUpdatedAt) }}</text><text class="stat-label">最近更新</text></view></view>
        <view v-if="observations.length" class="recent-list"><view v-for="item in observations" :key="item.id" class="recent-item"><view class="recent-main"><text class="recent-name">{{ item.name }}</text><text v-if="item.category" class="recent-category">{{ item.category }}</text></view><text :class="item.status === '正常' ? 'normal' : 'danger'">{{ item.value }} {{ item.unit }} · {{ item.status }}</text></view></view>
        <text v-else class="muted">还没有健康指标，上传报告或手动记录后会显示在这里。</text>
      </template>
    </AppCard>
    <AppCard v-for="item in items" :key="item.label" class="profile-item" @click="go(item.url)"><text class="profile-icon">▣</text><text class="grow">{{ item.label }}</text><text>›</text></AppCard>
    <BottomNav active="profile" />
  </view>
</template>

<style scoped>
.benefit{display:block;width:100%;box-sizing:border-box;position:relative;margin-top:24rpx;padding:30rpx;border-radius:24rpx;color:#fff;background:linear-gradient(135deg,#c85d24,#e89a68)}
.profile-head{display:flex;align-items:center;padding:28rpx}.avatar{width:96rpx;height:96rpx;line-height:96rpx;margin-right:20rpx;border-radius:50%;text-align:center;color:#fff;background:#e6b6a8;font-size:38rpx;font-weight:700}.name{display:block;font-size:36rpx;font-weight:700}.muted{display:block;margin-top:8rpx;color:#8B8179;font-size:23rpx}.switch{color:#D96B2B;font-size:22rpx}.benefit-title{display:block;margin-bottom:22rpx;color:#ffe29b;font-size:29rpx;font-weight:700}.benefit-date{display:block;margin-top:6rpx;color:#d9e1ea;font-size:22rpx}.benefit-btn{position:absolute;right:24rpx;bottom:28rpx;height:54rpx;line-height:54rpx;padding:0 20rpx;border:0;border-radius:14rpx;color:#364052;background:#ffe29b;font-size:22rpx}
.data-card{margin-top:16rpx;padding:24rpx;background:#fff8f3}.data-card-head{display:flex;align-items:center;justify-content:space-between}.data-title{font-size:29rpx;font-weight:700;color:#5b321e}.data-link{color:#D96B2B;font-size:22rpx}.data-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10rpx;margin-top:22rpx}.data-stats view{text-align:center}.stat-value{display:block;color:#D96B2B;font-size:30rpx;font-weight:800}.stat-label{display:block;margin-top:6rpx;color:#8B8179;font-size:20rpx}.recent-list{margin-top:18rpx;padding-top:16rpx;border-top:1rpx solid #f0ded1}.recent-item{display:flex;justify-content:space-between;gap:12rpx;padding:10rpx 0}.recent-name{max-width:52%;font-size:22rpx;color:#5b463a}.normal,.danger{font-size:21rpx}.normal{color:#D96B2B}.danger,.data-error{color:#e45446}.profile-item{display:flex;align-items:center;margin-top:14rpx;padding:22rpx}.profile-icon{width:56rpx;color:#D96B2B;font-size:30rpx}
.recent-main{display:flex;align-items:center;gap:8rpx;max-width:52%}.recent-category{padding:3rpx 8rpx;border-radius:8rpx;color:#D96B2B;background:#FFF0E5;font-size:17rpx}
</style>


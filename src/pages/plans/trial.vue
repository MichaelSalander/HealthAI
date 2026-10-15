<script setup lang="ts">
import { ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { commerceRepository } from '../../services/mock/repositories'
import type { ServicePlan } from '../../types/domain'
import { uniApi as uni } from '../../services/platform/uni'
const plans = ref<ServicePlan[]>([])
commerceRepository.listPlans().then(items => { plans.value = items.filter(item => item.cycle === '7天') })
const choose = (plan: ServicePlan) => uni.navigateTo({ url: `/pages/order/confirm?planId=${plan.id}` })
</script>
<template>
  <view class="page trial-page">
    <view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">选择服务</text><text class="share">□</text></view>
    <view class="tabs"><text class="active">服务套餐</text><text @click="uni.navigateTo({url:'/pages/services/addons'})">加值服务</text></view>
    <view class="page-intro"><text class="intro-title">选择适合你的健康体验方案</text><text class="muted">先体验，再决定长期健康管理方式</text></view>
    <AppCard v-for="plan in plans" :key="plan.id" :class="['plan-card', plan.level === '高级' ? 'purple' : plan.level === '慢病' ? 'blue' : 'hot']"><view class="plan-head"><view><text class="plan-name">{{ plan.name }}</text><text class="plan-desc">{{ plan.description }}</text></view><text class="badge">{{ plan.level === '初级' ? '热门' : plan.level === '高级' ? '推荐' : '慢病' }}</text></view><text class="price">¥{{ plan.priceFen / 100 }}</text><text class="benefit">✓ 基础健康评估</text><text class="benefit">✓ 1次1V1咨询</text><text class="benefit">✓ 体验专属健康管理师</text><PrimaryButton label="选择体验" @click="choose(plan)" /></AppCard>
    <AppCard class="formal-link"><text class="muted">体验结束后可选择对应的正式方案，体验费用可抵扣正式方案费用。</text><PrimaryButton label="查看正式方案" secondary @click="uni.navigateTo({url:'/pages/plans/formal'})" /></AppCard>
  </view>
</template>
<style scoped>
.trial-page{padding-bottom:40rpx}.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:34rpx;font-weight:700}.share{color:#08a990;font-size:30rpx}.tabs{display:flex;justify-content:space-around;padding:12rpx 40rpx 20rpx;color:#72847f;font-size:24rpx;border-bottom:1rpx solid #edf3f1}.tabs .active{color:#08aa95;font-weight:700;padding-bottom:12rpx;border-bottom:5rpx solid #08b39f}.page-intro{padding:24rpx 6rpx 10rpx}.intro-title{display:block;font-size:30rpx;font-weight:700}.muted{display:block;margin-top:8rpx;color:#7f918d;font-size:22rpx;line-height:1.6}.plan-card{position:relative;margin-top:18rpx;padding:24rpx;border:2rpx solid #ffe0de;background:#fffafa}.plan-card.purple{border-color:#ddd4ff;background:#fbf9ff}.plan-card.blue{border-color:#d5ddff;background:#f9faff}.plan-head{display:flex;align-items:flex-start;justify-content:space-between}.plan-name{display:block;color:#1a2339;font-size:29rpx;font-weight:700}.plan-desc{display:block;max-width:450rpx;margin-top:8rpx;color:#74827f;font-size:21rpx}.badge{padding:7rpx 12rpx;color:#fff;background:#f06f73;border-radius:12rpx;font-size:19rpx}.purple .badge{background:#8d76e8}.blue .badge{background:#5879e8}.price{display:block;margin:14rpx 0 12rpx;color:#ea313a;font-size:36rpx;font-weight:700}.purple .price{color:#6e54d9}.blue .price{color:#4164d5}.benefit{display:block;margin-top:8rpx;color:#4d5e5a;font-size:22rpx}.plan-card :deep(.btn){margin-top:20rpx}.formal-link{margin-top:20rpx;padding:24rpx}.formal-link :deep(.btn){margin-top:18rpx}
</style>

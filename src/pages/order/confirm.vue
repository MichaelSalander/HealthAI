<script setup lang="ts">
import { computed, ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { commerceRepository } from '../../services/mock/repositories'
import type { ServicePlan } from '../../types/domain'
import { uniApi as uni } from '../../services/platform/uni'
const plans = ref<ServicePlan[]>([])
const route = (getCurrentPages().at(-1) as any)?.options as Record<string, string> | undefined
commerceRepository.listPlans().then(items => { plans.value = items })
const addon = computed<ServicePlan | undefined>(() => route?.name ? { id: `addon-${route.name}`, name: decodeURIComponent(route.name), level: '初级', cycle: '月', priceFen: Number(route.price || 0), description: '专项健康增值服务' } : undefined)
const plan = computed(() => addon.value || plans.value.find(item => item.id === route?.planId) || plans.value[0])
const pay = async () => { if (!plan.value) return; await commerceRepository.createMockOrder(plan.value); uni.showToast({ title: 'Mock支付成功' }); setTimeout(() => uni.navigateTo({ url: '/pages/orders/index' }), 500) }
</script>
<template>
  <view class="page order-page">
    <view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">订单确认</text><text class="share">□</text></view>
    <AppCard class="consultant"><image class="avatar avatar-image" src="/static/images/consultants/li-xiaowen.png" mode="aspectFill" /><view class="grow"><text class="name">{{ plan?.name || '健康管理服务' }}</text><text class="muted">李晓雯 · 专属健康管理师</text><text class="rating">★ 4.9　523条评价</text></view></AppCard>
    <view class="section-title">服务内容</view><AppCard class="content-card"><text v-for="item in ['健康档案建立与分析','定制化健康改善计划','每日健康打卡与提醒','每月1次1V1咨询','专属健康管理师','月度健康报告']" :key="item" class="check">●　{{ item }}</text></AppCard>
    <view class="section-title">支付方式</view><AppCard class="payment-card"><view class="pay-row selected"><text class="pay-icon wechat">微</text><text class="grow">微信支付</text><text class="radio">●</text></view><view class="pay-row"><text class="pay-icon alipay">支</text><text class="grow">支付宝支付</text><text class="radio empty">○</text></view></AppCard>
    <view class="section-title">优惠信息</view><AppCard class="coupon"><text class="muted">暂无可用优惠券</text><text class="arrow">›</text></AppCard>
    <view class="pay-bar"><view><text class="muted">应付金额</text><text class="total">¥{{ (plan?.priceFen || 0) / 100 }}</text></view><PrimaryButton label="立即支付" @click="pay" /></view>
  </view>
</template>
<style scoped>
.order-page{padding-bottom:170rpx}.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:34rpx;font-weight:700}.share{color:#08a990;font-size:30rpx}.consultant{display:flex;align-items:center;padding:24rpx}.avatar{width:94rpx;height:94rpx;line-height:94rpx;margin-right:18rpx;border-radius:50%;text-align:center;color:#fff;background:linear-gradient(145deg,#f5c4b6,#d68d7c);font-size:36rpx;font-weight:700}.avatar-image{display:block;object-fit:cover}.name,.muted,.rating,.check{display:block}.name{font-size:29rpx;font-weight:700}.muted{margin-top:7rpx;color:#81918f;font-size:22rpx}.rating{margin-top:8rpx;color:#eea32c;font-size:21rpx}.section-title{margin:28rpx 0 14rpx;font-size:29rpx;font-weight:700}.content-card{padding:12rpx 24rpx}.check{padding:16rpx 0;color:#425a56;font-size:23rpx;border-bottom:1rpx solid #edf2f1}.check:last-child{border:0}.check:first-letter{color:#09ac96}.payment-card{padding:4rpx 24rpx}.pay-row{display:flex;align-items:center;padding:20rpx 0;border-bottom:1rpx solid #edf2f1;font-size:24rpx}.pay-row:last-child{border:0}.pay-row.selected{color:#12243c}.pay-icon{width:44rpx;height:44rpx;line-height:44rpx;margin-right:14rpx;border-radius:12rpx;text-align:center;color:#fff;font-size:21rpx;font-weight:700}.wechat{background:#38c965}.alipay{background:#2d86ef}.radio{color:#08b39f;font-size:30rpx}.radio.empty{color:#9caeaa}.coupon{display:flex;align-items:center;justify-content:space-between;padding:20rpx 24rpx}.arrow{color:#97aaa5;font-size:34rpx}.pay-bar{position:fixed;z-index:30;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,430px);box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;padding:16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));background:rgba(255,255,255,.98);box-shadow:0 -8rpx 24rpx rgba(26,88,79,.08)}.pay-bar .muted{margin:0}.total{display:block;margin-top:4rpx;color:#15223a;font-size:36rpx;font-weight:700}.pay-bar :deep(.btn){width:240rpx}
</style>

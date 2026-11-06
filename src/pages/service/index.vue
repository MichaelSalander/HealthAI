<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import BottomNav from '../../components/BottomNav.vue'
import { commerceRepository } from '../../services/api/repositories'
import type { Order } from '../../types/domain'
const orders = ref<Order[]>([])
const currentOrder = computed(() => orders.value.find(item => item.status === '服务中'))
onMounted(async () => { orders.value = await commerceRepository.listOrders() })
const back = () => uni.navigateBack()
const go = (url: string) => uni.navigateTo({ url })
const items = [{ label: '1V1咨询', sub: '与健康管理师沟通', url: '/pages/consultation/index' }, { label: '健康打卡', sub: '记录每日健康状态', url: '/pages/health/manual' }, { label: '我的服务计划', sub: '查看当前服务安排', url: '/pages/records/index' }]
</script>
<template><view class="page"><view class="topbar"><text class="back" @click="back">‹</text><text class="top-title">服务</text><text>⋯</text></view><AppCard v-if="currentOrder" class="service-card"><view class="service-head"><view class="avatar">服</view><view><text class="name">{{ currentOrder.planName }}</text><text class="muted">服务已开通</text></view><text class="online">服务中</text></view><text class="plan">订单 {{ currentOrder.id }}</text><text class="period">开通时间 {{ currentOrder.paidAt || currentOrder.createdAt }}</text></AppCard><AppCard v-else class="empty-service"><text class="name">暂未开通服务</text><text class="muted">购买服务方案后，这里会显示服务安排。</text><button class="btn" @click="go('/pages/plans/formal')">查看服务方案</button></AppCard><view class="section-title">服务入口</view><AppCard v-for="item in items" :key="item.label" class="service-item" @click="go(item.url)"><view class="entry-icon">▣</view><view class="grow"><text class="name">{{ item.label }}</text><text class="muted">{{ item.sub }}</text></view><text>›</text></AppCard><BottomNav active="service" /></view></template>
<style scoped>.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:36rpx;font-weight:700}.service-card{padding:26rpx}.service-head{display:flex;align-items:center}.avatar{width:74rpx;height:74rpx;line-height:74rpx;margin-right:16rpx;border-radius:50%;text-align:center;color:#fff;background:#e2b0a0;font-size:30rpx;font-weight:700}.name,.muted,.plan,.period{display:block}.name{font-size:30rpx;font-weight:700}.muted{margin-top:6rpx;color:#8B8179;font-size:22rpx}.online{margin-left:auto;padding:8rpx 14rpx;color:#D96B2B;background:#FFF0E5;border-radius:12rpx;font-size:21rpx}.plan{margin-top:28rpx;font-size:30rpx;font-weight:700}.period{margin-top:8rpx;color:#8B8179;font-size:23rpx}.progress{height:12rpx;margin:24rpx 0 12rpx;border-radius:9rpx;background:#F3E8E0}.progress view{width:60%;height:100%;border-radius:9rpx;background:#D96B2B}.service-item{display:flex;align-items:center;margin-top:16rpx;padding:24rpx}.entry-icon{width:64rpx;height:64rpx;line-height:64rpx;margin-right:18rpx;border-radius:18rpx;text-align:center;color:#D96B2B;background:#FFF0E5;font-size:30rpx}</style>



<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import ConsultantBottomNav from '../../components/ConsultantBottomNav.vue'
import ConsultationBookingCard from '../../components/ConsultationBookingCard.vue'
import { consultationRepository as api } from '../../services/api/consultation'
import { uniApi as uni } from '../../services/platform/uni'
import type { ConsultationRequest, DemoSession } from '../../types/consultation'
const items = ref<ConsultationRequest[]>([]); const error = ref(''); const session = ref<DemoSession>()
async function load() { try { session.value ||= await api.login('consultant', 'c-101'); items.value = await api.bookings(session.value); error.value = '' } catch (e) { error.value = (e as Error).message } }
onShow(load)
</script>
<template><view class="page consultant-page"><view class="head"><view><text class="eyebrow">客户关系</text><text class="title">我的客户</text><text class="subtitle">公司分配给你的客户与咨询记录</text></view><text class="count">{{ items.length }} 位</text></view><text v-if="error" class="danger">{{ error }}</text><AppCard v-if="!items.length" class="empty"><text class="empty-title">暂无分配客户</text><text class="muted">新客户配对后会自动出现在这里</text></AppCard><ConsultationBookingCard v-for="item in items" :key="item.id" :booking="item"><button class="health-btn" @click="uni.navigateTo({ url: `/pages/consultant/insights?userId=${item.userId}` })">查看健康资料</button></ConsultationBookingCard><ConsultantBottomNav active="clients" /></view></template>
<style scoped>.consultant-page{padding-top:34rpx;padding-bottom:170rpx;background:#fffaf6}.head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:30rpx}.eyebrow{display:block;color:#b37a57;font-size:22rpx}.title{display:block;margin-top:8rpx;color:#2a201c;font-size:42rpx;font-weight:800}.count{color:#c8652a;font-size:23rpx}.empty{text-align:center;padding:60rpx 24rpx}.empty-title{display:block;font-size:28rpx;font-weight:700}.empty .muted{margin-top:12rpx}</style>

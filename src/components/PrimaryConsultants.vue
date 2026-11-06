<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppCard from './AppCard.vue'
import BottomNav from './BottomNav.vue'
import { consultationRepository as api } from '../services/api/consultation'
import { availabilityLabels } from '../types/consultation'
import type { ConsultationConsultant } from '../types/consultation'
import { uniApi as uni } from '../services/platform/uni'
const items = ref<ConsultationConsultant[]>([])
const error = ref('')
const loading = ref(true)
async function load() { try { items.value = (await api.directory()).filter(item => item.id === 'c-101'); error.value = '' } catch (e) { error.value = (e as Error).message } finally { loading.value = false } }
onShow(load)
</script>
<template><view class="page"><text class="title">找健康管理师</text><text class="subtitle">直接选择初级健康管理师，预约免费咨询</text><AppCard v-if="error"><text class="danger">{{ error }}</text><button @click="load">重试</button></AppCard><text v-if="loading">正在加载…</text><AppCard v-for="c in items" :key="c.id"><view class="row"><view class="avatar">{{ c.name[0] }}</view><view class="grow"><text class="name">{{ c.name }}</text><text class="subtitle">{{ c.level }}健康管理师</text></view><text class="tag">{{ availabilityLabels[c.status] }}</text></view><text class="subtitle">{{ c.freeConsultEnabled ? '免费咨询已开放' : '暂未开放免费咨询' }}</text><button class="btn" :disabled="c.status !== 'available' || !c.freeConsultEnabled" @click="uni.navigateTo({url:`/pages/consultants/booking?id=${c.id}`})">选择并预约</button></AppCard><button class="btn secondary" @click="uni.navigateTo({url:'/pages/consultants/booking'})">我的咨询进度</button><BottomNav active="consultant" /></view></template>
<style scoped>.avatar{flex-shrink:0;width:84rpx;height:84rpx;border-radius:50%;background:#f5d9c7;color:#a94b1d;text-align:center;line-height:84rpx;font-size:32rpx;margin-right:18rpx}.name{font-size:30rpx;font-weight:700}.row{flex-wrap:wrap;gap:12rpx}.btn{margin-top:24rpx}.btn[disabled]{opacity:.5}</style>

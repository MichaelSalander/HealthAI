<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ConsultationRoom from '../../components/ConsultationRoom.vue'
import { consultationRepository as api } from '../../services/api/consultation'
import type { DemoSession } from '../../types/consultation'
import { uniApi as uni } from '../../services/platform/uni'
const roomId = ref(''); const session = ref<DemoSession>()
onLoad(async options => { roomId.value = options?.conversationId || ''; session.value = await api.customer() })
// 聊天室是長期服務入口；離開不代表結束諮詢，回首頁後仍可從「我的主責健康管理師」重新進入。
function backToHome() { uni.reLaunch({ url: '/pages/home/index' }) }
</script>
<template><ConsultationRoom v-if="roomId && session" :room-id="roomId" :session="session" @back="backToHome" @completed="backToHome" /><view v-else class="loading-page">正在进入我的健康管理师…</view></template>
<style scoped>.loading-page{display:flex;align-items:center;justify-content:center;height:100vh;color:#9b8c83;background:#fffaf6;font-size:25rpx}</style>

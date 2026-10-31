<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ConsultationRoom from '../../components/ConsultationRoom.vue'
import { consultationRepository as api } from '../../services/api/consultation'
import type { DemoSession } from '../../types/consultation'
import { uniApi as uni } from '../../services/platform/uni'
const roomId = ref(''); const session = ref<DemoSession>()
onLoad(async options => { roomId.value = options?.conversationId || ''; session.value = await api.login('consultant', options?.consultantId || 'c-101') })
</script>
<template><ConsultationRoom v-if="roomId && session" :room-id="roomId" :session="session" @back="uni.navigateBack()" @completed="uni.navigateBack()" /><view v-else class="loading-page">正在进入咨询房间…</view></template>
<style scoped>.loading-page{display:flex;align-items:center;justify-content:center;height:100vh;color:#9b8c83;background:#fffaf6;font-size:25rpx}</style>

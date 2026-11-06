<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ConsultationRoom from '../../components/ConsultationRoom.vue'
import { consultationRepository as api } from '../../services/api/consultation'
import type { DemoSession } from '../../types/consultation'
import { uniApi as uni } from '../../services/platform/uni'
const roomId = ref(''); const session = ref<DemoSession>()
onLoad(async options => { roomId.value = options?.conversationId || ''; try { session.value = await api.login('consultant') } catch { uni.redirectTo({ url: '/pages/consultant/login' }) } })
function backToWorkbench() { uni.reLaunch({ url: '/pages/consultant/workbench' }) }
</script>
<template><ConsultationRoom v-if="roomId && session" :room-id="roomId" :session="session" @back="backToWorkbench" @completed="backToWorkbench" /><view v-else class="loading-page">正在进入客户咨询…</view></template>
<style scoped>.loading-page{display:flex;align-items:center;justify-content:center;height:100vh;color:#9b8c83;background:#fffaf6;font-size:25rpx}</style>

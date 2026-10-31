<script setup lang="ts">
import AppCard from './AppCard.vue'
import { bookingStatusLabels } from '../types/consultation'
import type { ConsultationRequest } from '../types/consultation'
defineProps<{ booking: ConsultationRequest }>()
</script>
<template><AppCard><view class="row"><text>{{ booking.userName }} · {{ booking.consultantName }}</text><text class="tag">{{ bookingStatusLabels[booking.status] }}</text></view><text class="muted small">{{ new Date(booking.slotStartAt).toLocaleString('zh-CN', { hour12: false }) }}</text><view class="actions"><slot /></view></AppCard></template>
<style scoped>.row{flex-wrap:wrap;gap:12rpx;line-height:1.6}.actions{display:flex;flex-wrap:wrap;gap:16rpx;margin-top:18rpx}.muted{margin-top:16rpx}</style>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppCard from './AppCard.vue'
import type { ConsultationConsultant } from '../types/consultation'
const props = defineProps<{ consultant: ConsultationConsultant; saving: boolean }>()
const emit = defineEmits<{ (e: 'save', value: ConsultationConsultant): void }>()
const draft = ref<ConsultationConsultant>(JSON.parse(JSON.stringify(props.consultant)))
const date = ref('')
const time = ref('10:00')
watch(() => props.consultant.id, () => { draft.value = JSON.parse(JSON.stringify(props.consultant)) })
function addSlot() {
  if (!date.value || !time.value) return
  const stamp = new Date(`${date.value}T${time.value}:00`)
  if (!Number.isFinite(+stamp)) return
  draft.value.slots.push({ id: `slot-${Date.now()}-${Math.random()}`, startAt: stamp.toISOString(), capacity: 1, remaining: 1 })
}
</script>
<template><AppCard><text class="section-title">接单状态与排班</text>
  <view class="statuses"><button v-for="state in [{id:'available',name:'可预约'}, {id:'full',name:'已额满'}, {id:'offline',name:'离线'}]" :key="state.id" size="mini" :class="{ chosen: draft.status === state.id }" @click="draft.status = state.id as ConsultationConsultant['status']">{{ state.name }}</button></view>
  <text class="label">每日名额（1～100）</text><input v-model.number="draft.dailyLimit" type="number" class="field" />
  <text class="muted small">免费咨询资格由平台管理；离线后不能接受咨询。</text>
  <view v-for="slot in draft.slots" :key="slot.id" class="slot"><text>{{ new Date(slot.startAt).toLocaleString('zh-CN', {hour12:false}) }}</text><view class="row"><text>时段容量</text><input v-model.number="slot.capacity" type="number" class="capacity" /><button size="mini" @click="draft.slots = draft.slots.filter(s => s.id !== slot.id)">移除</button></view></view>
  <text class="label">新增时段</text><view class="row"><picker mode="date" :value="date" @change="date = $event.detail.value"><view class="field">{{ date || '选择日期' }}</view></picker><picker mode="time" :value="time" @change="time = $event.detail.value"><view class="field">{{ time }}</view></picker><button size="mini" @click="addSlot">添加</button></view>
  <button class="btn save" :disabled="saving" @click="emit('save', draft)">{{ saving ? '保存中…' : '保存状态和时段' }}</button>
</AppCard></template>
<style scoped>.statuses{display:flex;flex-wrap:wrap;gap:12rpx}.chosen{color:#a94b1d;background:#fff0e5}.label{display:block;margin:24rpx 0 12rpx;font-size:26rpx}.field{padding:16rpx;border:1px solid #e7d4c8;border-radius:12rpx;min-height:62rpx;font-size:26rpx}.slot{padding:20rpx 0;border-bottom:1px solid #f0e7df;font-size:24rpx;line-height:1.6}.capacity{width:76rpx;border:1px solid #e7d4c8;padding:8rpx}.row{gap:12rpx;margin-top:12rpx;flex-wrap:wrap}.save{margin-top:28rpx}.muted{margin-top:18rpx}</style>

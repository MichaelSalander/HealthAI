<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { healthRepository } from '../services/api/repositories'
import type { HealthTrend } from '../types/domain'
const props = defineProps<{ months?: number }>()
const metrics = [{ code: 'weight', name: '体重' }, { code: 'blood-pressure', name: '血压' }, { code: 'blood-glucose', name: '血糖' }, { code: 'fasting-glucose', name: '空腹血糖' }, { code: 'heart-rate', name: '心率' }, { code: 'sleep', name: '睡眠' }]
const selected = ref('weight')
const points = ref<HealthTrend[]>([])
const error = ref('')
const loading = ref(false)
let request = 0
async function load() {
  const current = ++request
  loading.value = true; error.value = ''
  try { const data = await healthRepository.getTrends(selected.value); if (current === request) points.value = data }
  catch (e) { if (current === request) { points.value = []; error.value = (e as Error).message } }
  finally { if (current === request) loading.value = false }
}
watch(selected, load, { immediate: true })
onShow(load)
const visible = computed(() => {
  if (!props.months) return points.value
  const since = new Date(); since.setMonth(since.getMonth() - props.months)
  return points.value.filter(point => new Date(point.measuredAt || point.label).getTime() >= since.getTime())
})
const max = computed(() => Math.max(1, ...visible.value.flatMap(p => [p.value, p.secondaryValue || 0])))
const height = (value: number) => `${value / max.value * 160}rpx`
</script>
<template>
  <view>
    <scroll-view scroll-x class="choices"><button v-for="metric in metrics" :key="metric.code" class="choice" :class="{ selected: selected === metric.code }" @click="selected = metric.code">{{ metric.name }}</button></scroll-view>
    <text v-if="loading" class="muted">正在加载…</text>
    <text v-else-if="error" class="muted">{{ error }}</text>
    <scroll-view v-else-if="visible.length" scroll-x>
      <view class="plot"><view v-for="(point, index) in visible" :key="point.id || index" class="point"><text class="value">{{ point.value }}{{ point.secondaryValue !== undefined ? `/${point.secondaryValue}` : '' }}</text><view class="bars"><view class="bar" :style="{ height: height(point.value) }" /><view v-if="point.secondaryValue !== undefined" class="bar secondary" :style="{ height: height(point.secondaryValue) }" /></view><text class="date">{{ point.label }}</text><text class="date">{{ point.unit }}</text></view></view>
    </scroll-view>
    <text v-else class="muted">此项暂无记录</text>
  </view>
</template>
<style scoped>
.choices{white-space:nowrap;margin-bottom:24rpx}.choice{display:inline-block;margin:0 10rpx 0 0;padding:8rpx 18rpx;font-size:24rpx;background:#fff7f0;color:#786b63;line-height:1.6}.selected{background:#d96b2b;color:white}.plot{display:flex;min-width:100%;align-items:flex-end}.point{flex:1;min-width:150rpx;text-align:center}.value{display:block;font-size:25rpx;color:#493a30}.bars{height:180rpx;display:flex;align-items:flex-end;justify-content:center;gap:6rpx;border-bottom:1px solid #eedfd5}.bar{width:30rpx;background:#d96b2b;border-radius:6rpx 6rpx 0 0}.secondary{background:#edb18b}.date{display:block;font-size:20rpx;color:#85786e;margin-top:8rpx}
</style>

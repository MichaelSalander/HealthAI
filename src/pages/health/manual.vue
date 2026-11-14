<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Observation } from '../../types/domain'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { healthRepository } from '../../services/api/repositories'
import { uniApi as uni } from '../../services/platform/uni'

const metrics = [
  { key: 'weight', label: '体重', unit: 'kg', placeholder: '请输入体重', reference: '个人记录' },
  { key: 'blood-pressure', label: '血压', unit: 'mmHg', placeholder: '例如 120/80', reference: '参考 90/60–120/80' },
  { key: 'blood-glucose', label: '血糖', unit: 'mmol/L', placeholder: '请输入血糖', reference: '参考范围以报告为准' },
  { key: 'heart-rate', label: '心率', unit: '次/分', placeholder: '请输入心率', reference: '参考 60–100' },
  { key: 'sleep', label: '睡眠', unit: '小时', placeholder: '请输入睡眠时长', reference: '建议 7–9 小时' }
] as const
const activeKey = ref<(typeof metrics)[number]['key']>('weight')
const value = ref('')
const note = ref('')
const activeMetric = computed(() => metrics.find(item => item.key === activeKey.value) || metrics[0])
function selectMetric(key: (typeof metrics)[number]['key']) { activeKey.value = key; value.value = '' }
const saving = ref(false)
const error = ref('')
const records = ref<Observation[]>([])
const target = ref('')
const editingTarget = ref(false)
const savingTarget = ref(false)
const targetDraft = ref('')
function latest(code: string) { return [...records.value].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)).find(item => item.code === code) }
async function load() {
  try { const [items, profile] = await Promise.all([healthRepository.getObservations(), healthRepository.getProfile()]); records.value = items; target.value = profile.targetWeightKg || '' }
  catch (e) { error.value = (e as Error).message }
}
onShow(load)
async function saveTarget() {
  if (savingTarget.value) return
  if (!Number.isFinite(Number(targetDraft.value)) || Number(targetDraft.value) <= 0) { error.value = '请填写有效目标体重'; return }
  savingTarget.value = true; error.value = ''
  try { const profile = await healthRepository.getProfile(); const saved = await healthRepository.saveProfile({ ...profile, targetWeightKg: targetDraft.value }); target.value = saved.targetWeightKg || ''; editingTarget.value = false }
  catch (e) { error.value = (e as Error).message }
  finally { savingTarget.value = false }
}
async function save() {
  if (saving.value) return
  if (!value.value.trim()) { error.value = '请先填写数据'; return }
  saving.value = true; error.value = ''
  try {
    await healthRepository.addObservation({ code: activeMetric.value.key, name: activeMetric.value.label, value: value.value.trim(), unit: activeMetric.value.unit, reference: activeMetric.value.reference, status: '正常', sourceType: 'manual', interpretation: note.value.trim() || undefined })
    await load()
    value.value = ''; note.value = ''
    uni.showToast({ title: '记录已保存' })
  } catch (e) { error.value = (e as Error).message }
  finally { saving.value = false }
}
</script>
<template>
  <view class="page manual-page"><scroll-view scroll-x class="metric-tabs"><view v-for="item in metrics" :key="item.key" class="metric-tab" :class="{ active: activeKey === item.key }" @click="selectMetric(item.key)">{{ item.label }}</view></scroll-view><view class="metric-card"><text class="metric-label">{{ activeMetric.label }}</text><view class="metric-input-row"><input v-model="value" class="metric-input" type="text" :placeholder="activeMetric.placeholder" /><text class="metric-unit">{{ activeMetric.unit }}</text></view><view v-if="activeKey === 'weight'"><text class="metric-reference">目标体重：{{ target ? `${target} kg` : '未设置' }}</text><button size="mini" @click="targetDraft = target; editingTarget = !editingTarget">{{ target ? '修改目标' : '设置目标' }}</button><view v-if="editingTarget"><input v-model="targetDraft" type="digit" placeholder="目标体重（kg）" /><button :disabled="savingTarget" @click="saveTarget">保存目标</button></view></view><text v-else class="metric-reference">{{ activeMetric.reference }}</text><text v-if="latest(activeKey)" class="metric-reference">最近记录：{{ latest(activeKey)?.value }} {{ latest(activeKey)?.unit }} · {{ latest(activeKey)?.measuredAt.slice(0, 10) }}</text></view><view class="section-title">其他指标记录</view><view class="other-grid"><view v-for="item in metrics.filter(metric => metric.key !== activeKey)" :key="item.key" class="other-card" @click="selectMetric(item.key)"><text class="other-icon">{{ item.label === '睡眠' ? '◔' : item.label === '心率' ? '♡' : item.label === '血压' ? '⌁' : '◌' }}</text><view><text class="other-name">{{ item.label }}</text><text class="other-value">{{ latest(item.key) ? `${latest(item.key)?.value} ${latest(item.key)?.unit}` : '暂无记录' }}</text></view></view></view><view class="section-title note-title">记录备注</view><textarea v-model="note" class="note" placeholder="例如：今天运动30分钟，饮食清淡…" /><text v-if="error" class="metric-reference">{{ error }}</text><button v-if="error.includes('授权')" @click="uni.navigateTo({ url: '/pages/health/consent' })">查看健康资料授权</button><PrimaryButton :label="saving ? '保存中…' : '保存记录'" @tap="save" /></view>
</template>
<style scoped>
.manual-page{padding:0 28rpx 48rpx;background:#fffaf6}.metric-tabs{white-space:nowrap;margin:0 -8rpx;padding:0 8rpx 16rpx;border-bottom:1rpx solid #f1e4dc}.metric-tab{display:inline-block;margin-right:12rpx;padding:13rpx 21rpx;color:#8c7d75;border-radius:18rpx;background:#fff;font-size:23rpx}.metric-tab.active{color:#c8652a;background:#fff0e5;font-weight:700}.metric-card{margin-top:22rpx;padding:34rpx 28rpx 24rpx;border:1rpx solid #f3e4da;border-radius:28rpx;background:#fff;box-shadow:0 10rpx 28rpx rgba(125,78,42,.06)}.metric-label{display:block;color:#8e7d74;font-size:22rpx}.metric-input-row{display:flex;align-items:baseline;margin-top:16rpx}.metric-input{flex:1;min-width:0;color:#2b231f;font-size:54rpx;font-weight:800}.metric-unit{margin-left:10rpx;color:#66564e;font-size:24rpx}.metric-reference{display:block;margin-top:13rpx;color:#a39791;font-size:20rpx}.metric-line{position:relative;height:12rpx;margin-top:28rpx;border-bottom:2rpx solid #e6d6ca}.metric-line:before{content:'';position:absolute;left:0;right:0;bottom:-6rpx;border-bottom:2rpx solid #d96b2b}.line-dot{position:absolute;left:48%;bottom:-15rpx;width:24rpx;height:24rpx;border:5rpx solid #fff;border-radius:50%;background:#d96b2b;box-shadow:0 0 0 2rpx #d96b2b}.section-title{margin:30rpx 2rpx 14rpx;color:#2a201c;font-size:28rpx;font-weight:800}.other-grid{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}.other-card{display:flex;align-items:center;min-height:92rpx;padding:17rpx;border:1rpx solid #f0e2d9;border-radius:20rpx;background:#fff}.other-icon{display:flex;align-items:center;justify-content:center;width:48rpx;height:48rpx;margin-right:12rpx;border-radius:16rpx;color:#d96b2b;background:#fff0e5;font-size:27rpx}.other-name,.other-value{display:block}.other-name{color:#4a3931;font-size:23rpx;font-weight:700}.other-value{margin-top:5rpx;color:#a39791;font-size:19rpx}.note-title{margin-top:30rpx}.note{width:100%;height:126rpx;padding:20rpx;box-sizing:border-box;border:1rpx solid #f0e0d6;border-radius:20rpx;background:#fff;color:#4a3931;font-size:23rpx;line-height:1.55}.manual-page :deep(button){width:100%;margin-top:22rpx}
</style>


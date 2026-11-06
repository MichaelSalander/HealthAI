<script setup lang="ts">
import { computed, ref } from 'vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { healthRepository } from '../../services/api/repositories'
import { uniApi as uni } from '../../services/platform/uni'

const metrics = [
  { key: 'weight', label: '体重', unit: 'kg', placeholder: '请输入体重', reference: '目标 55.0' },
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
async function save() {
  if (!value.value.trim()) { uni.showToast({ title: '请先填写数据' }); return }
  try { await healthRepository.addObservation({ code: activeMetric.value.key, name: activeMetric.value.label, value: value.value.trim(), unit: activeMetric.value.unit, reference: activeMetric.value.reference, status: '正常', sourceType: 'manual', interpretation: note.value.trim() || undefined }); uni.showToast({ title: '记录已保存' }); setTimeout(() => uni.navigateBack(), 500) } catch (error) { const message = (error as Error).message; uni.showToast({ title: message }); if (message.includes('授权')) uni.navigateTo({ url: '/pages/health/consent' }) }
}
</script>
<template>
  <view class="page manual-page"><view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">手动记录</text><text class="top-action">⌁</text></view><scroll-view scroll-x class="metric-tabs"><view v-for="item in metrics" :key="item.key" class="metric-tab" :class="{ active: activeKey === item.key }" @click="selectMetric(item.key)">{{ item.label }}</view></scroll-view><view class="metric-card"><text class="metric-label">{{ activeMetric.label }}</text><view class="metric-input-row"><input v-model="value" class="metric-input" type="text" :placeholder="activeMetric.placeholder" /><text class="metric-unit">{{ activeMetric.unit }}</text></view><text class="metric-reference">{{ activeMetric.reference }}</text><view class="metric-line"><view class="line-dot" /></view></view><view class="section-title">其他指标记录</view><view class="other-grid"><view v-for="item in metrics.filter(metric => metric.key !== activeKey)" :key="item.key" class="other-card" @click="selectMetric(item.key)"><text class="other-icon">{{ item.label === '睡眠' ? '◔' : item.label === '心率' ? '♡' : item.label === '血压' ? '⌁' : '◌' }}</text><view><text class="other-name">{{ item.label }}</text><text class="other-value">点击记录</text></view></view></view><view class="section-title note-title">记录备注</view><textarea v-model="note" class="note" placeholder="例如：今天运动30分钟，饮食清淡…" /><PrimaryButton label="保存记录" @tap="save" /></view>
</template>
<style scoped>
.manual-page{padding:0 28rpx 48rpx;background:#fffaf6}.topbar{height:92rpx;display:flex;align-items:center;justify-content:space-between}.back,.top-action{width:52rpx;color:#6d5d55;font-size:46rpx;text-align:center}.top-action{color:#d96b2b;font-size:30rpx}.top-title{color:#2a201c;font-size:34rpx;font-weight:800}.metric-tabs{white-space:nowrap;margin:0 -8rpx;padding:0 8rpx 16rpx;border-bottom:1rpx solid #f1e4dc}.metric-tab{display:inline-block;margin-right:12rpx;padding:13rpx 21rpx;color:#8c7d75;border-radius:18rpx;background:#fff;font-size:23rpx}.metric-tab.active{color:#c8652a;background:#fff0e5;font-weight:700}.metric-card{margin-top:22rpx;padding:34rpx 28rpx 24rpx;border:1rpx solid #f3e4da;border-radius:28rpx;background:#fff;box-shadow:0 10rpx 28rpx rgba(125,78,42,.06)}.metric-label{display:block;color:#8e7d74;font-size:22rpx}.metric-input-row{display:flex;align-items:baseline;margin-top:16rpx}.metric-input{flex:1;min-width:0;color:#2b231f;font-size:54rpx;font-weight:800}.metric-unit{margin-left:10rpx;color:#66564e;font-size:24rpx}.metric-reference{display:block;margin-top:13rpx;color:#a39791;font-size:20rpx}.metric-line{position:relative;height:12rpx;margin-top:28rpx;border-bottom:2rpx solid #e6d6ca}.metric-line:before{content:'';position:absolute;left:0;right:0;bottom:-6rpx;border-bottom:2rpx solid #d96b2b}.line-dot{position:absolute;left:48%;bottom:-15rpx;width:24rpx;height:24rpx;border:5rpx solid #fff;border-radius:50%;background:#d96b2b;box-shadow:0 0 0 2rpx #d96b2b}.section-title{margin:30rpx 2rpx 14rpx;color:#2a201c;font-size:28rpx;font-weight:800}.other-grid{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}.other-card{display:flex;align-items:center;min-height:92rpx;padding:17rpx;border:1rpx solid #f0e2d9;border-radius:20rpx;background:#fff}.other-icon{display:flex;align-items:center;justify-content:center;width:48rpx;height:48rpx;margin-right:12rpx;border-radius:16rpx;color:#d96b2b;background:#fff0e5;font-size:27rpx}.other-name,.other-value{display:block}.other-name{color:#4a3931;font-size:23rpx;font-weight:700}.other-value{margin-top:5rpx;color:#a39791;font-size:19rpx}.note-title{margin-top:30rpx}.note{width:100%;height:126rpx;padding:20rpx;box-sizing:border-box;border:1rpx solid #f0e0d6;border-radius:20rpx;background:#fff;color:#4a3931;font-size:23rpx;line-height:1.55}.manual-page :deep(button){width:100%;margin-top:22rpx}
</style>


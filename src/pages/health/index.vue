<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import BottomNav from '../../components/BottomNav.vue'
import SectionTitle from '../../components/SectionTitle.vue'
import { healthRepository } from '../../services/api/repositories'
import type { HealthTrend, Observation } from '../../types/domain'

const observations = ref<Observation[]>([])
const trends = ref<HealthTrend[]>([])
const activeTab = ref<'overview' | 'metrics' | 'trends'>('overview')
onMounted(async () => { observations.value = await healthRepository.getObservations(); trends.value = await healthRepository.getTrends('weight') })
const go = (url: string) => uni.navigateTo({ url })
</script>

<template>
  <view class="page">
    <view class="topbar"><text class="back" @click="go('/pages/home/index')">‹</text><text class="top-title">我的健康</text><text @click="go('/pages/health/consent')">♧</text></view>
    <view class="tabs"><button class="tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">总览</button><button class="tab" :class="{ active: activeTab === 'metrics' }" @click="activeTab = 'metrics'">指标</button><button class="tab" :class="{ active: activeTab === 'trends' }" @click="activeTab = 'trends'">趋势</button></view>

    <template v-if="activeTab === 'overview'">
      <AppCard class="center"><view class="score"><text class="score-num">85</text><text class="small">健康评分</text></view><text class="subtitle">整体健康状况良好</text></AppCard>
      <SectionTitle title="需要关注的3项指标" /><AppCard><view v-for="item in observations.filter(x => x.status !== '正常')" :key="item.id" class="list-item"><view class="icon-box danger-icon">↑</view><view class="grow"><text>{{ item.name }}</text><text class="subtitle">{{ item.value }} {{ item.unit }}（参考 {{ item.reference }}）</text></view><text class="danger">偏高</text></view><text v-if="!observations.some(item => item.status !== '正常')" class="muted">暂无异常指标，继续保持良好习惯。</text></AppCard>
    </template>
    <template v-else-if="activeTab === 'metrics'">
      <SectionTitle title="全部健康指标" /><AppCard><view v-for="item in observations" :key="item.id" class="list-item"><view class="icon-box" :class="item.status === '正常' ? 'normal-icon' : 'danger-icon'">{{ item.status === '正常' ? '✓' : '↑' }}</view><view class="grow"><text>{{ item.name }}</text><text class="subtitle">{{ item.value }} {{ item.unit }} · 参考 {{ item.reference }}</text></view><text :class="item.status === '正常' ? 'normal' : 'danger'">{{ item.status }}</text></view><text v-if="!observations.length" class="muted">暂无健康指标，请上传报告或手动记录。</text></AppCard>
    </template>
    <template v-else>
      <SectionTitle title="健康趋势" /><AppCard><view class="row"><text class="tag">体重</text><text class="tag">血压</text><text class="tag">血糖</text></view><view class="chart"><view v-for="item in trends" :key="item.label" class="bar" :style="{ height: `${Math.max(28, item.value * 1.8)}rpx` }"></view></view><view class="row muted small"><text v-for="item in trends" :key="item.label">{{ item.label }}</text></view><button class="btn secondary" @click="go('/pages/trends/index')">查看完整趋势</button></AppCard>
    </template>
    <AppCard v-if="activeTab !== 'metrics'" class="result-link"><button class="btn" @click="go('/pages/result/index')">查看健康结果</button></AppCard>
    <BottomNav active="health" />
  </view>
</template>

<style scoped>
.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:36rpx;font-weight:700}.tabs{display:flex;justify-content:space-around;padding:18rpx 0;color:#7d8d89}.tab{height:auto;margin:0;padding:0 22rpx 14rpx;border:0;border-radius:0;color:#7d8d89;background:transparent;font-size:26rpx;line-height:1.4}.tab.active{color:#d96b2b;font-weight:700;border-bottom:5rpx solid #d96b2b}.danger-icon{color:#f04438;background:#ffefed}.normal-icon{color:#08a990;background:#e5faf4}.normal{color:#08a990}.chart{height:180rpx;display:flex;align-items:flex-end;gap:16rpx;padding:18rpx 12rpx;border-bottom:2rpx solid #f1d8c8}.bar{flex:1;background:linear-gradient(#e9935e,#f8d9c4);border-radius:12rpx 12rpx 0 0}.result-link{padding:0;background:transparent;box-shadow:none;border:0}.result-link .btn{margin-top:0}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import BottomNav from '../../components/BottomNav.vue'
import SectionTitle from '../../components/SectionTitle.vue'
import { healthRepository } from '../../services/mock/repositories'
import type { HealthTrend, Observation } from '../../types/domain'
const observations = ref<Observation[]>([]); const trends = ref<HealthTrend[]>([])
onMounted(async () => { observations.value = await healthRepository.getObservations(); trends.value = await healthRepository.getTrends('weight') })
const go = (url: string) => uni.navigateTo({ url })
</script>
<template>
  <view class="page"><view class="topbar"><text class="back" @click="go('/pages/home/index')">‹</text><text class="top-title">我的健康</text><text>♧</text></view><view class="tabs"><text class="active">总览</text><text>指标</text><text @click="go('/pages/trends/index')">趋势</text></view><AppCard class="center"><view class="score"><text class="score-num">85</text><text class="small">健康评分</text></view><text class="subtitle">整体健康状况良好</text></AppCard><SectionTitle title="需要关注的3项指标" /><AppCard><view v-for="item in observations.filter(x => x.status !== '正常')" :key="item.id" class="list-item"><view class="icon-box danger-icon">↑</view><view class="grow"><text>{{ item.name }}</text><text class="subtitle">{{ item.value }} {{ item.unit }}（参考 {{ item.reference }}）</text></view><text class="danger">偏高</text></view></AppCard><SectionTitle title="健康趋势" /><AppCard><view class="row"><text class="tag">体重</text><text class="tag">血压</text><text class="tag">血糖</text></view><view class="chart"><view v-for="item in trends" :key="item.label" class="bar" :style="{height: `${Math.max(28, item.value * 1.8)}rpx`}"></view></view><view class="row muted small"><text v-for="item in trends" :key="item.label">{{ item.label }}</text></view><button class="btn secondary" @click="go('/pages/trends/index')">查看历史趋势</button><button class="btn" @click="go('/pages/result/index')">查看健康结果</button></AppCard><BottomNav active="health" /></view>
</template>
<style scoped>.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:36rpx;font-weight:700}.tabs{display:flex;justify-content:space-around;padding:18rpx 0;color:#7d8d89}.tabs .active{color:#08b39f;font-weight:700;border-bottom:5rpx solid #08b39f;padding-bottom:14rpx}.danger-icon{color:#f04438;background:#ffefed}.chart{height:180rpx;display:flex;align-items:flex-end;gap:16rpx;padding:18rpx 12rpx;border-bottom:2rpx solid #d7eeea}.bar{flex:1;background:linear-gradient(#19c8ad,#b8f1e6);border-radius:12rpx 12rpx 0 0}</style>

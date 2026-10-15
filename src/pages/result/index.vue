<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import BottomNav from '../../components/BottomNav.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { aiRepository, healthRepository } from '../../services/mock/repositories'
import { uniApi as uni } from '../../services/platform/uni'
import type { AIHealthReport, Observation } from '../../types/domain'
const observations = ref<Observation[]>([])
const report = ref<AIHealthReport | null>(null)
onMounted(async () => { observations.value = await healthRepository.getObservations(); report.value = await aiRepository.generateReport(observations.value) })
const go = () => uni.navigateTo({ url: '/pages/health/index' })
</script>
<template>
  <view class="page"><view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">健康结果</text><text>♧</text></view>
    <AppCard class="summary"><view class="score"><text class="score-num">85</text><text class="small">健康评分</text></view><view class="summary-copy"><text class="summary-title">{{ report?.summary || '正在生成健康结果…' }}</text><text class="muted">AI Mock 分析 · {{ report?.riskLevel || '分析中' }}</text></view></AppCard>
    <view class="section-title">需要关注的指标</view><AppCard><view v-for="item in observations.filter(x => x.status !== '正常')" :key="item.id" class="metric-item"><view class="metric-icon">↑</view><view class="grow"><text class="metric-name">{{ item.name }}　<span>偏高</span></text><text class="metric-value">{{ item.value }} {{ item.unit }} <text class="muted">（参考值 {{ item.reference }}）</text></text></view><text class="danger">↑</text></view></AppCard>
    <AppCard class="guide-card"><view class="guide-icon">✥</view><view class="guide-copy"><text class="guide-title">建议你咨询健康管理师</text><text class="muted">获取专业的分析解读和个性化建议。</text></view><PrimaryButton label="咨询我的健康管理师" @tap="go" /></AppCard><text class="disclaimer">以上为基础健康结果，仅供参考，不作为医疗诊断或治疗建议。</text><BottomNav active="health" />
  </view>
</template>
<style scoped>.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:36rpx;font-weight:700}.summary{display:flex;align-items:center;padding:24rpx;background:linear-gradient(135deg,#e4fff7,#f2fffb)}.score{width:150rpx;height:150rpx;border:14rpx solid #a6efe0;border-right-color:#08b39f;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-right:24rpx}.score-num{font-size:47rpx;font-weight:800}.summary-title{display:block;font-size:29rpx;font-weight:700}.muted{display:block;margin-top:8rpx;color:#7f908c;font-size:22rpx}.metric-item{display:flex;align-items:center;padding:23rpx 0;border-bottom:1rpx solid #edf2f1}.metric-item:last-child{border:0}.metric-icon{width:54rpx;height:54rpx;line-height:54rpx;margin-right:18rpx;border-radius:50%;text-align:center;color:#f04438;background:#fff0ed;font-weight:700}.metric-name{display:block;font-size:29rpx;font-weight:700}.metric-name span{color:#f04438;font-size:23rpx}.metric-value{display:block;margin-top:8rpx;color:#f04438;font-size:24rpx}.metric-value .muted{display:inline;color:#82918e;font-size:21rpx}.danger{color:#f04438;font-size:32rpx}.guide-card{display:flex;flex-wrap:wrap;align-items:center;margin-top:22rpx;background:#eef7ff}.guide-icon{width:64rpx;height:64rpx;line-height:64rpx;margin-right:18rpx;border-radius:20rpx;text-align:center;color:#e4a32a;background:#fff4d9;font-size:34rpx}.guide-copy{flex:1}.guide-title{display:block;font-size:27rpx;font-weight:700}.guide-card .btn{width:100%;margin-top:20rpx}.disclaimer{display:block;margin:28rpx 20rpx;color:#91a09c;text-align:center;font-size:21rpx}</style>

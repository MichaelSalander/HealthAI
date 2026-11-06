<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppCard from '../../components/AppCard.vue'
import BottomNav from '../../components/BottomNav.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { aiRepository, contentRepository, healthRepository } from '../../services/api/repositories'
import { uniApi as uni } from '../../services/platform/uni'
import type { AIHealthReport, Observation } from '../../types/domain'
const observations = ref<Observation[]>([])
const report = ref<AIHealthReport | null>(null)
const content = ref({ resultDisclaimer: '以上为基础健康结果，仅供参考，不作为医疗诊断或治疗建议。', resultConsultationTitle: '建议你咨询健康管理师', resultConsultationDescription: '获取专业的分析解读和个性化建议。', metricExplanations: [] as { code: string; explanation: string; enabled: boolean }[] })
const explanationFor = (item: Observation) => content.value.metricExplanations.find(entry => entry.code === item.code && entry.enabled)?.explanation || '本次结果超出当前参考范围，建议结合历史趋势与健康管理师建议综合理解。'
const healthScore = computed(() => {
  if (!observations.value.length) return '--'
  const abnormal = observations.value.filter(item => item.status !== '正常').length
  return String(Math.max(0, Math.round(100 - abnormal / observations.value.length * 35)))
})
const load = async () => { const [items, settings] = await Promise.all([healthRepository.getObservations(), contentRepository.listContentSettings()]); observations.value = items; content.value = settings; report.value = items.length ? await aiRepository.generateReport(items) : null }
onShow(load)
const go = () => uni.navigateTo({ url: '/pages/health/index' })
</script>
<template>
  <view class="page"><view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">健康结果</text><text>♧</text></view>
    <AppCard class="summary"><view class="score"><text class="score-num">{{ healthScore }}</text><text class="small">健康评分</text></view><view class="summary-copy"><text class="summary-title">{{ report?.summary || (observations.length ? 'AI健康结果生成中' : '暂无健康结果') }}</text><text class="muted">{{ report ? `AI分析 · ${report.riskLevel || '待评估'}` : '确认健康指标后生成' }}</text></view></AppCard>
<view class="section-title">需要关注的指标</view><AppCard><view v-for="item in observations.filter(x => x.status !== '正常')" :key="item.id" class="metric-item"><view class="metric-icon">↑</view><view class="grow"><text class="metric-name">{{ item.name }}　<span>{{ item.status }}</span></text><text class="metric-value">{{ item.value }} {{ item.unit }} <text class="muted">（参考值 {{ item.reference }}）</text></text><text class="explanation">{{ explanationFor(item) }}</text></view></view><text v-if="!observations.some(item => item.status !== '正常')" class="muted">{{ observations.length ? '暂无异常指标。' : '暂无健康指标，请先上传报告或手动记录。' }}</text></AppCard>
    <AppCard class="guide-card"><view class="guide-icon">✥</view><view class="guide-copy"><text class="guide-title">{{ content.resultConsultationTitle }}</text><text class="muted">{{ content.resultConsultationDescription }}</text></view><PrimaryButton label="咨询我的健康管理师" @tap="go" /></AppCard><text class="disclaimer">{{ content.resultDisclaimer }}</text><BottomNav active="health" />
  </view>
</template>
<style scoped>.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:36rpx;font-weight:700}.summary{display:flex;align-items:center;box-sizing:border-box;width:100%;padding:24rpx;background:linear-gradient(135deg,#FFF0E5,#FFFCFA)}.score{width:150rpx;height:150rpx;flex-shrink:0;border:14rpx solid #F2BE9B;border-right-color:#D96B2B;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-right:24rpx}.score-num{font-size:47rpx;font-weight:800;white-space:nowrap;line-height:1}.summary-copy{flex:1;min-width:0}.summary-title{display:block;font-size:29rpx;font-weight:700;line-height:1.4;overflow-wrap:anywhere}.muted{display:block;margin-top:8rpx;color:#8B8179;font-size:22rpx}.metric-item{display:flex;align-items:flex-start;padding:23rpx 0;border-bottom:1rpx solid #F3E8E0}.metric-item:last-child{border:0}.metric-icon{width:54rpx;height:54rpx;line-height:54rpx;margin-right:18rpx;border-radius:50%;text-align:center;color:#f04438;background:#fff0ed;font-weight:700}.metric-name{display:block;font-size:29rpx;font-weight:700}.metric-name span{color:#f04438;font-size:23rpx}.metric-value{display:block;margin-top:8rpx;color:#f04438;font-size:24rpx}.metric-value .muted{display:inline;color:#82918e;font-size:21rpx}.explanation{display:block;margin-top:8rpx;color:#8B8179;font-size:21rpx;line-height:1.5}.danger{color:#f04438;font-size:32rpx}.guide-card{display:flex;flex-wrap:wrap;align-items:center;margin-top:22rpx;background:#FFF8F3}.guide-icon{width:64rpx;height:64rpx;line-height:64rpx;margin-right:18rpx;border-radius:20rpx;text-align:center;color:#e4a32a;background:#fff4d9;font-size:34rpx}.guide-copy{flex:1;min-width:0}.guide-title{display:block;font-size:27rpx;font-weight:700;line-height:1.4;overflow-wrap:anywhere}.guide-card .btn{width:100%;margin-top:20rpx}.disclaimer{display:block;margin:28rpx 20rpx;color:#91a09c;text-align:center;font-size:21rpx}</style>



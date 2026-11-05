<script setup lang="ts">
import { computed, ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import { uniApi as uni } from '../../services/platform/uni'
const records = [{ date: '12月10日', name: '1V1咨询', desc: '与李晓雯老师沟通体检报告', type: '▣', category: '咨询' }, { date: '12月08日', name: '健康打卡', desc: '体重 62.5kg · 饮水 1800ml', type: '▤', category: '打卡' }, { date: '12月05日', name: '营养方案', desc: '获得个性化饮食建议', type: '♧', category: '方案' }, { date: '12月01日', name: '体检报告解读', desc: '完成 2024 年度体检报告解读', type: '▤', category: '方案' }]
const activeTab = ref('全部')
const tabs = ['全部', '1V1咨询', '健康打卡', '方案服务']
const visibleRecords = computed(() => activeTab.value === '全部' ? records : records.filter(item => activeTab.value === '1V1咨询' ? item.category === '咨询' : activeTab.value === '健康打卡' ? item.category === '打卡' : item.category === '方案'))
const showRecord = (name: string) => uni.showModal({ title: name, content: '这条服务记录已纳入你的健康档案，可继续从服务页面查看相关内容。', showCancel: false })
const showMore = () => uni.showToast({ title: '服务记录已按时间整理' })
</script>
<template><view class="page"><view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">服务记录</text><text @click="showMore">⋯</text></view><view class="tabs"><text v-for="tab in tabs" :key="tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab }}</text></view><AppCard v-for="item in visibleRecords" :key="item.date" class="record" @click="showRecord(item.name)"><text class="date">{{ item.date }}</text><view class="record-body"><view class="icon">{{ item.type }}</view><view class="grow"><text class="name">{{ item.name }}</text><text class="muted">{{ item.desc }}</text></view><text>›</text></view></AppCard><text v-if="!visibleRecords.length" class="empty">暂无记录</text></view></template>
<style scoped>.topbar,.tabs{display:flex;align-items:center;justify-content:space-between}.topbar{height:82rpx}.back{font-size:48rpx}.top-title{font-size:36rpx;font-weight:700}.tabs{padding:18rpx 0 24rpx;color:#81918f;font-size:21rpx}.active{color:#08b39f;font-weight:700}.record{padding:20rpx;margin-top:14rpx}.date{display:block;color:#72837f;font-size:22rpx}.record-body{display:flex;align-items:center;margin-top:14rpx}.icon{width:66rpx;height:66rpx;line-height:66rpx;margin-right:16rpx;border-radius:18rpx;text-align:center;color:#08a990;background:#e5faf4}.name,.muted{display:block}.name{font-size:28rpx;font-weight:700}.muted{margin-top:6rpx;color:#81918f;font-size:22rpx}</style>

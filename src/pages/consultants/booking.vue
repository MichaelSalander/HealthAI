<script setup lang="ts">
import AppCard from '../../components/AppCard.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { uniApi as uni } from '../../services/platform/uni'

const hasBloodTest = false
const slots = ['今天 14:00', '今天 16:30', '明天 10:00', '明天 15:00']
let selectedSlot = ''
const selectSlot = (slot: string) => { selectedSlot = slot }
const go = (url: string) => uni.navigateTo({ url })
const submit = () => {
  if (!hasBloodTest) {
    go('/pages/health-centers/index')
    return
  }
  uni.showToast({ title: selectedSlot ? `已预约 ${selectedSlot}` : '请选择咨询时段' })
}
</script>

<template>
  <view class="page booking-page">
    <view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">预约咨询</text><text class="share">⋯</text></view>
    <AppCard class="consultant-card"><view class="consultant-line"><view class="avatar">李</view><view><text class="name">李晓雯</text><text class="muted">高级健康管理师 · 慢病管理</text><text class="online">当前在线</text></view></view></AppCard>
    <view class="section-title">选择咨询方式</view>
    <AppCard class="mode-card"><view class="mode active"><text class="mode-icon">◉</text><view class="grow"><text class="name">免费健康咨询</text><text class="muted">初次了解健康情况，限时 15 分钟</text></view><text class="check">✓</text></view><view class="mode"><text class="mode-icon">◌</text><view class="grow"><text class="name">语音咨询</text><text class="muted">适合深入沟通健康管理问题</text></view><text class="price">¥99</text></view></AppCard>
    <view class="section-title">选择可预约时段</view>
    <AppCard class="slot-card"><view class="slot-grid"><text v-for="slot in slots" :key="slot" class="slot" :class="{ selected: selectedSlot === slot }" @click="selectSlot(slot)">{{ slot }}</text></view></AppCard>
    <AppCard v-if="!hasBloodTest" class="notice"><text class="notice-title">完成血液检查后再开始个性化分析</text><text class="muted">为了让健管师更准确了解你的健康状态，请先完成指定体检中心的血液检查。</text><text class="link" @click="go('/pages/health-centers/index')">查看指定体检中心 ›</text></AppCard>
    <view class="booking-footer"><PrimaryButton label="提交预约" @click="submit" /></view>
  </view>
</template>

<style scoped>
.booking-page{padding-bottom:150rpx}.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:34rpx;font-weight:700}.share{font-size:34rpx;color:#d96b2b}.consultant-card{padding:24rpx}.consultant-line{display:flex;align-items:center}.avatar{width:84rpx;height:84rpx;line-height:84rpx;margin-right:18rpx;border-radius:50%;background:#efbb9f;color:#fff;text-align:center;font-size:34rpx;font-weight:700}.name,.muted,.online{display:block}.name{font-size:29rpx;font-weight:700}.muted{margin-top:7rpx;color:#81918f;font-size:22rpx}.online{margin-top:8rpx;color:#c45d25;font-size:21rpx}.section-title{margin:30rpx 0 14rpx;font-size:29rpx;font-weight:700}.mode{display:flex;align-items:center;padding:22rpx 0;border-bottom:1rpx solid #f3e9e2}.mode:last-child{border-bottom:0}.mode-icon{width:54rpx;color:#d96b2b;font-size:30rpx}.mode.active .name{color:#b65321}.check{color:#d96b2b;font-size:30rpx}.price{color:#b65321;font-weight:700}.slot-grid{display:grid;grid-template-columns:1fr 1fr;gap:16rpx}.slot{padding:20rpx 10rpx;border:1rpx solid #f0ded2;border-radius:14rpx;text-align:center;color:#667672;font-size:23rpx}.slot.selected{border-color:#d96b2b;background:#fff0e5;color:#b65321;font-weight:700}.notice{padding:24rpx;background:#fff8f2}.notice-title{display:block;color:#6d3d24;font-weight:700;font-size:25rpx}.link{display:block;margin-top:18rpx;color:#c45d25;font-size:23rpx}.booking-footer{position:fixed;z-index:30;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,430px);padding:16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));box-sizing:border-box;background:rgba(255,255,255,.98);box-shadow:0 -8rpx 24rpx rgba(109,61,36,.08)}
</style>

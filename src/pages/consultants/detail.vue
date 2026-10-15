<script setup lang="ts">
import AppCard from '../../components/AppCard.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { uniApi as uni } from '../../services/platform/uni'

const go = (url: string) => uni.navigateTo({ url })
const specialties = ['体重管理', '慢病管理', '睡眠健康', '营养调理']
const certifications = ['国家注册营养师', '健康管理师（高级）', '慢性病管理专项认证']
</script>
<template>
  <view class="page detail-page">
    <view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">健管师详情</text><text class="share">□</text></view>
    <view class="profile-hero"><view class="profile-photo">李<text class="online-dot">●</text></view><view class="profile-main"><text class="name">李晓雯</text><text class="muted">高级健康管理师</text><text class="rating">★ 4.9 <span>｜523条评价</span></text></view><text class="online">在线</text></view>
    <view class="stats"><view><text class="stat-value">5年</text><text class="muted">从业经验</text></view><view><text class="stat-value">600+</text><text class="muted">服务客户</text></view><view><text class="stat-value">98%</text><text class="muted">客户满意度</text></view></view>
    <view class="section-title">擅长领域</view><view class="tags"><text v-for="item in specialties" :key="item" class="tag">{{ item }}</text></view>
    <view class="section-title">专业认证</view><AppCard class="cert-card"><view v-for="item in certifications" :key="item" class="list-item"><text class="cert-icon">●</text><text>{{ item }}</text></view></AppCard>
    <view class="section-title">个人简介</view><AppCard class="intro-card"><text class="muted intro">擅长通过科学营养、运动管理和生活方式干预，帮助用户改善健康状态。已服务超过 600 位用户，专注于慢病管理和长期健康改善。</text></AppCard>
    <view class="detail-footer"><PrimaryButton label="选择服务" @click="go('/pages/plans/trial')" /></view>
  </view>
</template>
<style scoped>
.detail-page{padding-bottom:150rpx}.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx;color:#17253d}.top-title{font-size:34rpx;font-weight:700}.share{color:#06ad98;font-size:34rpx}.profile-hero{display:flex;align-items:center;padding:24rpx 20rpx;background:#fff;border-radius:24rpx}.profile-photo{position:relative;flex:0 0 128rpx;width:128rpx;height:128rpx;line-height:128rpx;margin-right:20rpx;border-radius:50%;text-align:center;color:#fff;background:linear-gradient(145deg,#f6c8b8,#d78e7c);font-size:54rpx;font-weight:700}.online-dot{position:absolute;right:2rpx;bottom:2rpx;width:30rpx;height:30rpx;line-height:30rpx;border-radius:50%;color:#08b39f;background:#fff;font-size:22rpx}.profile-main{flex:1}.name,.muted,.rating,.stat-value{display:block}.name{font-size:36rpx;font-weight:700}.muted{margin-top:8rpx;color:#7f918d;font-size:23rpx}.rating{margin-top:12rpx;color:#ee9e25;font-size:24rpx}.rating span{color:#7f918d;font-size:21rpx}.online{padding:9rpx 14rpx;color:#08a990;background:#e2faf4;border-radius:14rpx;font-size:21rpx}.stats{display:flex;justify-content:space-around;margin-top:14rpx;padding:24rpx 8rpx;text-align:center;background:#fff;border-radius:24rpx}.stat-value{color:#15223a;font-size:34rpx;font-weight:700}.stats .muted{margin-top:6rpx;font-size:20rpx}.section-title{margin-top:30rpx;margin-bottom:16rpx;font-size:29rpx;font-weight:700}.tags{display:flex;flex-wrap:wrap;gap:14rpx}.tag{padding:12rpx 20rpx;color:#2773df;background:#edf4ff;border-radius:18rpx;font-size:22rpx}.cert-card{padding:8rpx 24rpx}.list-item{display:flex;align-items:center;padding:20rpx 0;border-bottom:1rpx solid #edf2f1;color:#4b625e;font-size:24rpx}.list-item:last-child{border-bottom:0}.cert-icon{margin-right:16rpx;color:#0aa996;font-size:18rpx}.intro-card{padding:24rpx}.intro{line-height:1.7}.detail-footer{position:fixed;z-index:30;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,430px);box-sizing:border-box;padding:16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));background:rgba(255,255,255,.97);box-shadow:0 -8rpx 24rpx rgba(26,88,79,.08)}.detail-footer :deep(.btn){width:100%}
.profile-main{min-width:0;width:0}.name,.muted,.rating,.stat-value{white-space:normal;word-break:break-word}
</style>

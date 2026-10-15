<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHealthStore } from '../../stores/health'
import AppCard from '../../components/AppCard.vue'
import BottomNav from '../../components/BottomNav.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { contentRepository } from '../../services/mock/repositories'
import type { HomeEntry } from '../../services/api/contracts'

const store = useHealthStore()
const entries = ref<HomeEntry[]>([])
onMounted(async () => { store.ensureMockUser(); entries.value = await contentRepository.listHomeEntries() })
const go = (url: string) => uni.navigateTo({ url })
</script>

<template>
  <view class="page home-page">
    <view class="home-hero"><text class="title">你好，{{ store.state.user?.name || '朋友' }}<br />开启你的健康管理之旅</text><text class="subtitle">建立健康档案，持续看见自己的变化</text><text class="hero-leaf">✦</text></view>
    <view class="section-title home-section-title">健康数据入口</view><text class="subtitle">上传报告或手动记录，生成个人健康档案</text>
    <view class="entry-list"><AppCard v-for="(entry, index) in entries" :key="entry.id" class="entry-card" @click="go(entry.route)"><view :class="['entry-icon', ['mint','sky','blue','pink'][index % 4]]">{{ ['▤','＋','⌑','♙'][index % 4] }}</view><view class="entry-copy"><text class="entry-title">{{ entry.title }}</text><text class="entry-subtitle">{{ entry.subtitle }}</text></view><text class="entry-arrow">›</text></AppCard></view>
    <view class="section-title home-section-title">我的主责健康管理师</view>
    <AppCard class="consultant-card"><view class="consultant-row"><view class="avatar">李</view><view class="grow"><text class="consultant-name">李晓雯</text><text class="subtitle">高级健康管理师｜慢病管理</text><text class="rating">★ 4.9　523条评价</text></view><text class="online">在线</text></view><PrimaryButton label="立即咨询" @tap="go('/pages/service/index')" /></AppCard>
    <BottomNav active="home" />
  </view>
</template>

<style scoped>
.home-page { padding-top: 28rpx; }.home-hero { position: relative; overflow: hidden; min-height: 210rpx; padding: 42rpx 30rpx 30rpx; border-radius: 34rpx; background: linear-gradient(135deg,#d8f8f1 0%,#f7fffd 62%,#e9f8e4 100%); }.home-hero::after { content: ''; position: absolute; right: -56rpx; bottom: -70rpx; width: 240rpx; height: 240rpx; border-radius: 50%; background: rgba(183,235,184,.42); }.home-hero .title { position: relative; z-index: 1; font-size: 40rpx; line-height: 1.4; }.home-hero .subtitle { position: relative; z-index: 1; margin-top: 14rpx; }.hero-leaf { position: absolute; z-index: 1; right: 42rpx; bottom: 52rpx; color: #8fd6a2; font-size: 82rpx; }.home-section-title { margin: 34rpx 0 8rpx; }.entry-list { margin-top: 18rpx; }.entry-card { display: flex; align-items: center; min-height: 112rpx; margin-top: 16rpx; padding: 22rpx 24rpx; }.entry-icon { flex: 0 0 68rpx; width: 68rpx; height: 68rpx; line-height: 68rpx; margin-right: 20rpx; border-radius: 21rpx; text-align: center; font-size: 40rpx; font-weight: 700; }.mint { color: #08b39f; background: #d9fbf2; }.sky { color: #0aa7c8; background: #dff6fb; }.blue { color: #397cf0; background: #e7efff; }.pink { color: #e77b9e; background: #ffedf4; }.entry-copy { flex: 1; min-width: 0; }.entry-title,.entry-subtitle { display: block; }.entry-title { color: #15223a; font-size: 30rpx; font-weight: 700; }.entry-subtitle { margin-top: 6rpx; color: #7b898b; font-size: 23rpx; }.entry-arrow { color: #a1b1ae; font-size: 40rpx; }.consultant-card { padding: 26rpx; }.consultant-row { display: flex; align-items: center; margin-bottom: 22rpx; }.avatar { width: 92rpx; height: 92rpx; line-height: 92rpx; margin-right: 20rpx; border-radius: 50%; text-align: center; color: #fff; font-size: 35rpx; font-weight: 700; background: linear-gradient(145deg,#f6c6b7,#d89581); }.consultant-name { display: block; font-size: 34rpx; font-weight: 700; }.rating { display: block; margin-top: 8rpx; color: #eea32c; font-size: 22rpx; }.online { padding: 8rpx 14rpx; color: #08a88f; background: #e5faf4; border-radius: 12rpx; font-size: 22rpx; }
</style>

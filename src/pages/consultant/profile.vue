<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import ConsultantBottomNav from '../../components/ConsultantBottomNav.vue'
import AppCard from '../../components/AppCard.vue'
import { consultationRepository as api } from '../../services/api/consultation'
import { uniApi as uni } from '../../services/platform/uni'
import type { ConsultationConsultant, DemoSession } from '../../types/consultation'

const session = ref<DemoSession>()
const consultant = ref<ConsultationConsultant>()
const error = ref('')

async function load() {
  const stored = uni.getStorageSync('healthai_consultant_session')
  if (!stored) {
    uni.redirectTo({ url: '/pages/consultant/login' })
    return
  }
  try {
    session.value = JSON.parse(String(stored)) as DemoSession
    const directory = await api.directory()
    consultant.value = directory.find(item => item.id === session.value?.id)
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}

onShow(load)
</script>
<template><view class="page consultant-page"><view class="head"><view><text class="eyebrow">个人中心</text><text class="title">我的资料</text><text class="subtitle">查看认证信息与服务状态</text></view><view class="avatar">{{ session?.name?.slice(0, 1) || '管' }}</view></view><AppCard v-if="error" class="notice"><text class="danger">{{ error }}</text></AppCard><AppCard class="profile-card"><view class="profile-row"><view class="avatar large">{{ session?.name?.slice(0, 1) || '管' }}</view><view><text class="name">{{ session?.name || '健管师' }}</text><text class="muted">{{ consultant?.level || '平台认证' }} · 平台认证</text></view></view><view class="line"><text>服务状态</text><text class="green">{{ consultant?.status === 'offline' ? '暂时离线' : '在线接待中' }}</text></view><view class="line"><text>免费咨询资格</text><text class="green">{{ consultant?.freeConsultEnabled ? '已开启' : '未开启' }}</text></view></AppCard><AppCard class="notice"><text class="notice-title">平台说明</text><text class="muted">客户、咨询时段和免费资格均由公司后台统一安排，健管师端无需自行设置排班。</text></AppCard><ConsultantBottomNav active="profile" /></view></template>
<style scoped>.consultant-page{padding-top:34rpx;padding-bottom:170rpx;background:#fffaf6}.head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:30rpx}.eyebrow{display:block;color:#b37a57;font-size:22rpx}.title{display:block;margin-top:8rpx;color:#2a201c;font-size:42rpx;font-weight:800}.avatar{width:74rpx;height:74rpx;border-radius:26rpx;color:#c8652a;background:#fff0e5;font-size:36rpx;line-height:74rpx;text-align:center;font-weight:800}.large{width:92rpx;height:92rpx;margin-right:18rpx;border-radius:50%;line-height:92rpx}.profile-card{padding:28rpx}.profile-row{display:flex;align-items:center;padding-bottom:24rpx;border-bottom:1rpx solid #f2e8e1}.name{display:block;font-size:30rpx;font-weight:800}.line{display:flex;justify-content:space-between;padding-top:22rpx;color:#5f514a;font-size:23rpx}.green{color:#3e9b64}.notice{margin-top:18rpx;padding:24rpx;background:#fff0e5}.notice-title{display:block;color:#9f5428;font-size:26rpx;font-weight:700}.notice .muted{margin-top:10rpx;color:#8a6857;line-height:1.6}</style>

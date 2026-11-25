<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useHealthStore } from '../../stores/health'
import AppCard from '../../components/AppCard.vue'
import BottomNav from '../../components/BottomNav.vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { consultantRepository, contentRepository } from '../../services/api/repositories'
import type { ContentSettings, HomeEntry } from '../../services/api/contracts'
import type { Consultant } from '../../types/domain'
import type { ConsultationRequestV2 } from '../../types/consultation'
import { consultationRepository } from '../../services/api/consultation'
import brandCover from '../../assets/brand/hela-brand-cover.jpg'
import founderImage from '../../assets/brand/hela-founder.jpg'
import companyProfileImage from '../../assets/brand/hela-company-profile.jpg'
import healthManagementImage from '../../assets/brand/hela-health-management.jpg'
import consultationImage from '../../assets/brand/hela-one-to-one.jpg'

const store = useHealthStore()
const entries = ref<HomeEntry[]>([])
const brandContent = ref<Pick<ContentSettings, 'companyTitle' | 'companySubtitle' | 'companyPhilosophy'>>({
  companyTitle: '海拉精准预防医学中心',
  companySubtitle: '精准预防医学 · 健康管理 · 持续陪伴',
  companyPhilosophy: '以精准预防为理念，连接健康评估、报告解读与持续健康管理。'
})
const brandSlides = [
  { title: '创办人介绍', src: founderImage },
  { title: '海拉品牌介绍', src: companyProfileImage },
  { title: '健康管理服务', src: healthManagementImage },
  { title: '一对一健康咨询', src: consultationImage }
]
const consultants = ref<Consultant[]>([])
const consultationRequests = ref<ConsultationRequestV2[]>([])
const activeConsultation = computed(() => consultationRequests.value.find(item => item.conversationId && ['assigned', 'in_progress', 'waiting_customer', 'waiting_consultant'].includes(item.status)))
const assignedConsultant = computed(() => {
  const request = activeConsultation.value
  if (!request?.consultantId) return null
  return consultants.value.find(item => item.id === request.consultantId) || {
    id: request.consultantId,
    name: request.consultantName || '健康管理师',
    level: '初级',
    categories: ['健康管理'],
    rating: 0,
    clients: 0,
    avatar: '👩🏻‍⚕️'
  } as Consultant
})
async function loadHome() {
  await store.ensureUser()
  const [homeEntries, people, content] = await Promise.all([contentRepository.listHomeEntries(), consultantRepository.list(), contentRepository.listContentSettings()])
  entries.value = homeEntries
  consultants.value = people
  brandContent.value = content
  try { consultationRequests.value = await consultationRepository.consultationRequests() } catch { consultationRequests.value = [] }
}
onShow(loadHome)
const go = (url: string) => uni.navigateTo({ url })
function openConsultation() {
  if (activeConsultation.value?.conversationId) go(`/pages/consultation/index?conversationId=${activeConsultation.value.conversationId}`)
  else go('/pages/service/index')
}
function previewBrand(src: string) {
  uni.previewImage({ current: src, urls: [brandCover, ...brandSlides.map(slide => slide.src)] })
}
</script>

<template>
  <view class="page home-page">
    <view class="home-hero"><text class="title">你好，{{ store.state.user?.name || '朋友' }}<br />开启你的健康管理之旅</text><text class="subtitle">建立健康档案，持续看见自己的变化</text><text class="hero-leaf">✦</text></view>
    <AppCard class="brand-card"><view class="brand-heading"><view class="brand-copy"><text class="brand-title">{{ brandContent.companyTitle }}</text><text class="brand-subtitle">{{ brandContent.companySubtitle }}</text></view><text class="brand-arrow" @click="go('/pages/company/index')">品牌介绍 ›</text></view><image class="brand-cover" :src="brandCover" mode="widthFix" @click="previewBrand(brandCover)" /><text class="brand-description">{{ brandContent.companyPhilosophy }}</text><scroll-view scroll-x class="brand-gallery"><view v-for="slide in brandSlides" :key="slide.src" class="brand-slide" @click="previewBrand(slide.src)"><image class="brand-slide-image" :src="slide.src" mode="aspectFill" /><text class="brand-slide-title">{{ slide.title }}</text></view></scroll-view><text class="brand-link" @click="go('/pages/company/index')">了解海拉 ›</text></AppCard>
    <view class="section-title home-section-title">健康数据入口</view><text class="subtitle">上传报告或手动记录，生成个人健康档案</text>
    <view class="entry-list"><AppCard v-for="(entry, index) in entries" :key="entry.id" class="entry-card" @click="go(entry.route)"><view :class="['entry-icon', ['mint','sky','blue','pink'][index % 4]]">{{ ['▤','＋','⌑','♙'][index % 4] }}</view><view class="entry-copy"><text class="entry-title">{{ entry.title }}</text><text class="entry-subtitle">{{ entry.subtitle }}</text></view><text class="entry-arrow">›</text></AppCard></view>
    <view class="section-title home-section-title">我的主责健康管理师</view>
    <AppCard v-if="assignedConsultant" class="consultant-card"><view class="consultant-row"><view class="avatar">{{ assignedConsultant.name.slice(0, 1) }}</view><view class="grow"><text class="consultant-name">{{ assignedConsultant.name }}</text><text class="subtitle">{{ assignedConsultant.level }}健康管理师｜{{ assignedConsultant.categories?.[0] || '健康管理' }}</text><text v-if="assignedConsultant.rating" class="rating">★ {{ assignedConsultant.rating }}　{{ assignedConsultant.clients }}位服务客户</text><text v-else class="muted">平台已为你安排，可进入咨询</text></view><text class="online">已配对</text></view><PrimaryButton label="进入咨询" @tap="openConsultation" /></AppCard>
    <AppCard v-else class="consultant-card empty-consultant"><text class="consultant-name">配对健康管理师</text><text class="subtitle">发起咨询后，平台会为你安排合适的健康管理师</text><PrimaryButton label="咨询我的健康管理师" @tap="openConsultation" /></AppCard>
    <BottomNav active="home" />
  </view>
</template>

<style scoped>
.home-page { padding-top: 28rpx; }.home-hero { position: relative; overflow: hidden; min-height: 210rpx; padding: 42rpx 30rpx 30rpx; border-radius: 34rpx; background: linear-gradient(135deg,#fff0e5 0%,#fffaf6 62%,#ffe6d4 100%); }.home-hero::after { content: ''; position: absolute; right: -56rpx; bottom: -70rpx; width: 240rpx; height: 240rpx; border-radius: 50%; background: rgba(240,180,130,.34); }.home-hero .title { position: relative; z-index: 1; font-size: 40rpx; line-height: 1.4; }.home-hero .subtitle { position: relative; z-index: 1; margin-top: 14rpx; }.hero-leaf { position: absolute; z-index: 1; right: 42rpx; bottom: 52rpx; color: #e8a77c; font-size: 82rpx; }.home-section-title { margin: 34rpx 0 8rpx; }.entry-list { margin-top: 18rpx; }.entry-card { display: flex; align-items: center; min-height: 112rpx; margin-top: 16rpx; padding: 22rpx 24rpx; }.entry-icon { flex: 0 0 68rpx; width: 68rpx; height: 68rpx; line-height: 68rpx; margin-right: 20rpx; border-radius: 21rpx; text-align: center; font-size: 40rpx; font-weight: 700; }.mint,.sky,.blue,.pink { color: #D96B2B; background: #FFF0E5; }.entry-copy { flex: 1; min-width: 0; }.entry-title,.entry-subtitle { display: block; }.entry-title { color: #5b321e; font-size: 30rpx; font-weight: 700; }.entry-subtitle { margin-top: 6rpx; color: #8b8179; font-size: 23rpx; }.entry-arrow { color: #c18e6d; font-size: 40rpx; }.consultant-card { padding: 26rpx; }.consultant-row { display: flex; align-items: center; margin-bottom: 22rpx; }.avatar { width: 92rpx; height: 92rpx; line-height: 92rpx; margin-right: 20rpx; border-radius: 50%; text-align: center; color: #fff; font-size: 35rpx; font-weight: 700; background: linear-gradient(145deg,#f6c6b7,#d89581); }.consultant-name { display: block; font-size: 34rpx; font-weight: 700; }.rating { display: block; margin-top: 8rpx; color: #D96B2B; font-size: 22rpx; }.online { padding: 8rpx 14rpx; color: #D96B2B; background: #FFF0E5; border-radius: 12rpx; font-size: 22rpx; }
.brand-card { margin-top: 22rpx; padding: 22rpx; border: 1rpx solid #e7f1ed; background: linear-gradient(120deg,#f0faf7,#fff); }.brand-heading { display: flex; align-items: center; justify-content: space-between; gap: 14rpx; margin-bottom: 16rpx; }.brand-copy { flex: 1; min-width: 0; }.brand-title,.brand-subtitle,.brand-description,.brand-slide-title { display: block; }.brand-title { color: #174a43; font-size: 27rpx; font-weight: 700; line-height: 1.45; }.brand-subtitle { margin-top: 5rpx; color: #238579; font-size: 21rpx; }.brand-arrow,.brand-link { color: #25877b; font-size: 21rpx; white-space: nowrap; }.brand-cover { display: block; width: 100%; border-radius: 18rpx; overflow: hidden; }.brand-description { margin-top: 16rpx; color: #71837e; font-size: 22rpx; line-height: 1.6; }.brand-gallery { width: 100%; margin-top: 16rpx; white-space: nowrap; }.brand-slide { display: inline-block; width: 250rpx; margin-right: 14rpx; overflow: hidden; border-radius: 16rpx; background: #fff; vertical-align: top; }.brand-slide-image { display: block; width: 250rpx; height: 150rpx; }.brand-slide-title { padding: 11rpx 13rpx; color: #426a63; font-size: 20rpx; }.brand-link { display: block; margin-top: 16rpx; text-align: right; }
</style>


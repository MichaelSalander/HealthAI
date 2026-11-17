<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import { uniApi as uni } from '../../services/platform/uni'
import { contentRepository } from '../../services/api/repositories'
import type { ContentSettings, EducationArticle } from '../../services/api/contracts'
import brandCover from '../../assets/brand/hela-brand-cover.jpg'
import founderImage from '../../assets/brand/hela-founder.jpg'
import companyProfileImage from '../../assets/brand/hela-company-profile.jpg'
import healthManagementImage from '../../assets/brand/hela-health-management.jpg'
import consultationImage from '../../assets/brand/hela-one-to-one.jpg'
const articles = ref<EducationArticle[]>([])
const content = ref<ContentSettings>({ companyTitle: '海拉精准预防医学中心', companySubtitle: '精准预防医学 · 健康管理 · 持续陪伴', companyPhilosophy: '以精准预防为理念，连接健康评估、报告解读与持续健康管理，帮助用户更好地理解和管理健康。', privacyTitle: '数据与隐私', privacyDescription: '健康资料仅在获得授权的范围内用于分析与健康管理服务。', resultDisclaimer: '', resultConsultationTitle: '', resultConsultationDescription: '', metricExplanations: [] })
const loading = ref(true)
const brandSlides = [
  { title: '创办人介绍', src: founderImage },
  { title: '海拉品牌介绍', src: companyProfileImage },
  { title: '健康管理服务流程', src: healthManagementImage },
  { title: '一对一健康咨询', src: consultationImage }
]
onMounted(async () => { try { articles.value = await contentRepository.listEducationArticles() } finally { loading.value = false } })
onMounted(async () => { content.value = await contentRepository.listContentSettings() })
const openArticle = (article: EducationArticle) => uni.showModal({ title: article.title, content: article.body, showCancel: false })
const share = () => uni.showToast({ title: '公司介绍已准备分享' })
const previewBrand = (src: string) => uni.previewImage({ current: src, urls: [brandCover, ...brandSlides.map(slide => slide.src)] })
</script>
<template>
  <view class="page company-page">
    <view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">关于我们</text><text class="share" @click="share">⋯</text></view>
    <image class="brand-cover" :src="brandCover" mode="widthFix" @click="previewBrand(brandCover)" />
    <view class="brand-heading"><text class="brand-title">{{ content.companyTitle }}</text><text class="brand-subtitle">{{ content.companySubtitle }}</text></view>
    <view class="section-title">我们的理念</view><AppCard><text class="body">{{ content.companyPhilosophy }}</text></AppCard>
    <view class="section-title">品牌与服务</view>
    <AppCard v-for="slide in brandSlides" :key="slide.src" class="brand-slide" @click="previewBrand(slide.src)"><image class="slide-image" :src="slide.src" mode="widthFix" /><text class="slide-title">{{ slide.title }}</text><text class="slide-hint">点击查看大图</text></AppCard>
    <view class="section-title">健康卫教</view>
    <AppCard v-if="loading"><text class="muted">正在加载卫教内容…</text></AppCard>
    <AppCard v-else-if="!articles.length"><text class="muted">暂无已发布卫教内容</text></AppCard>
    <AppCard v-for="article in articles" v-else :key="article.id" class="article" @click="openArticle(article)"><view class="article-icon">＋</view><view class="grow"><text class="article-title">{{ article.title }}</text><text class="muted">{{ article.category }} · {{ article.summary }}</text></view><text class="arrow">›</text></AppCard>
    <AppCard class="notice"><text class="notice-title">{{ content.privacyTitle }}</text><text class="muted">{{ content.privacyDescription }}</text></AppCard>
  </view>
</template>
<style scoped>
.company-page{padding-bottom:60rpx}.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:34rpx;font-weight:700}.share{font-size:34rpx;color:#d96b2b}.brand-cover{display:block;width:100%;border-radius:24rpx;overflow:hidden}.brand-heading{padding:20rpx 4rpx 0}.brand-title,.brand-subtitle,.slide-title,.slide-hint{display:block}.brand-title{color:#174a43;font-size:32rpx;font-weight:700}.brand-subtitle{margin-top:8rpx;color:#238579;font-size:23rpx}.section-title{margin:30rpx 0 14rpx;font-size:29rpx;font-weight:700}.body{display:block;color:#5c6965;font-size:25rpx;line-height:1.8}.brand-slide{margin-bottom:18rpx;padding:12rpx;overflow:hidden}.slide-image{display:block;width:100%;border-radius:16rpx}.slide-title{margin:12rpx 8rpx 0;color:#174a43;font-size:25rpx;font-weight:700}.slide-hint{margin:5rpx 8rpx 3rpx;color:#899993;font-size:20rpx}.article{display:flex;align-items:center;padding:22rpx}.article-icon{width:64rpx;height:64rpx;line-height:64rpx;margin-right:18rpx;border-radius:18rpx;background:#fff0e5;color:#d96b2b;text-align:center;font-size:34rpx}.article-title{display:block;font-size:26rpx;font-weight:700}.muted{display:block;margin-top:8rpx;color:#8B8179;font-size:22rpx}.arrow{color:#aab5b0;font-size:36rpx}.notice{padding:24rpx}.notice-title{display:block;color:#6d3d24;font-size:26rpx;font-weight:700}
</style>


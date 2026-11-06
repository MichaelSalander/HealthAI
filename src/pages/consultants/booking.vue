<script setup lang="ts">
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import type { ConsultationConsultant, ConsultationRequestV2 } from '../../types/consultation'
import { consultationRepository as api } from '../../services/api/consultation'
import { uniApi as uni } from '../../services/platform/uni'

const loading = ref(true); const busy = ref(false); const error = ref(''); const hasBloodTest = ref(false); const consultants = ref<ConsultationConsultant[]>([]); const requests = ref<ConsultationRequestV2[]>([]); const selectedId = ref(''); let timer: ReturnType<typeof setInterval> | undefined
const consultant = computed(() => consultants.value.find(item => item.id === selectedId.value) || consultants.value.find(item => item.acceptingNewClients) || consultants.value[0])
const current = computed(() => requests.value[0])
const statusLabel = computed(() => consultant.value?.status === 'offline' ? '暂时离线' : consultant.value?.status === 'full' ? '当前已满' : '可接受咨询')
async function load() { try { const [eligibility, directory, items] = await Promise.all([api.eligibility(), api.directory(), api.consultationRequests()]); hasBloodTest.value = eligibility.hasBloodTest; consultants.value = directory; if (!selectedId.value) selectedId.value = directory.find(item => item.id === 'c-101')?.id || directory[0]?.id || ''; requests.value = items; error.value = '' } catch (e) { error.value = (e as Error).message } finally { loading.value = false } }
function stop() { if (timer) clearInterval(timer); timer = undefined }
onLoad(options => { selectedId.value = options?.id || '' })
onShow(() => { load(); stop(); timer = setInterval(load, 5000) }); onHide(stop); onUnload(stop)
async function submit() { if (busy.value || !consultant.value || consultant.value.status === 'offline' || consultant.value.status === 'full') return; busy.value = true; try { const item = await api.createRequest('immediate_text'); requests.value = [item, ...requests.value]; uni.navigateTo({ url: `/pages/consultation/waiting?requestId=${item.id}` }) } catch (e) { error.value = (e as Error).message } finally { busy.value = false } }
</script>

<template>
  <view class="page consult-entry">
    <view class="topbar"><text class="back" @click="uni.navigateBack()">‹</text><text class="top-title">咨询我的健康管理师</text><text class="top-action">♧</text></view>
    <view class="entry-head"><text class="eyebrow">健康服务</text><text class="title">咨询我的健康管理师</text><text class="subtitle">平台会为你安排主责健康管理师，配对后即可进入专属咨询。</text></view>
    <AppCard v-if="error" class="error"><text class="danger">{{ error }}</text><button class="retry" @click="load">重新连接</button></AppCard>
    <AppCard v-if="!loading && consultant" class="consultant-card"><view class="consultant-head"><view class="avatar">{{ consultant.name.slice(0, 1) }}</view><view class="consultant-copy"><text class="consultant-name">{{ consultant.name }}</text><text class="consultant-level">{{ consultant.level }} · 平台安排</text><text class="consultant-intro">{{ consultant.intro || '为你持续跟进健康资料与咨询需求' }}</text></view><text class="status" :class="consultant.status">{{ statusLabel }}</text></view><view class="tags"><text v-for="item in consultant.categories?.slice(0, 3)" :key="item" class="tag">{{ item }}</text></view><button class="detail-btn" @click="uni.navigateTo({ url: `/pages/consultants/detail?id=${consultant.id}` })">查看健管师资料</button></AppCard>
    <AppCard v-else-if="!loading" class="empty"><text class="empty-title">正在安排健康管理师</text><text class="muted">平台确认后会通知你。</text></AppCard>
    <AppCard v-if="!loading && !hasBloodTest" class="guide"><view class="guide-icon">i</view><view class="guide-copy"><text class="guide-title">还没有血液检测报告</text><text class="muted">不影响本次咨询；上传报告后，健管师可结合指标继续跟进。</text></view><button class="guide-link" @click="uni.navigateTo({ url: '/pages/health-centers/index' })">查看指定体检中心</button></AppCard>
    <AppCard v-if="current" class="progress-card"><view class="progress-head"><text class="progress-title">当前咨询</text><text class="tag">{{ current.status === 'queued' ? '等待配对' : current.status === 'assigned' ? '待确认' : current.status === 'in_progress' ? '咨询中' : current.status }}</text></view><text class="muted">{{ current.consultantName || '平台正在安排健管师' }}</text><button v-if="current.conversationId" class="outline-btn" @click="uni.navigateTo({ url: `/pages/consultation/index?conversationId=${current.conversationId}` })">进入咨询</button></AppCard>
    <button class="btn submit" :disabled="busy || !consultant || consultant.status === 'offline' || consultant.status === 'full'" @click="submit">{{ busy ? '正在提交…' : consultant?.status === 'full' ? '当前暂不接待' : '立即咨询' }}</button>
  </view>
</template>

<style scoped>
.consult-entry{padding:0 28rpx 60rpx;background:#fffaf6}.topbar{height:92rpx;display:flex;align-items:center;justify-content:space-between}.back,.top-action{width:52rpx;color:#6d5d55;font-size:46rpx;text-align:center}.top-action{color:#d96b2b;font-size:28rpx}.top-title{color:#2a201c;font-size:31rpx;font-weight:800}.entry-head{padding:22rpx 2rpx 18rpx}.eyebrow{display:block;color:#b37a57;font-size:22rpx;letter-spacing:2rpx}.title{display:block;margin-top:8rpx;color:#2a201c;font-size:40rpx;font-weight:800}.subtitle{display:block;margin-top:12rpx;color:#8a7770;font-size:23rpx;line-height:1.6}.error{padding:20rpx;background:#fff0ed}.error .danger{display:block}.retry{width:100%;height:64rpx;margin-top:14rpx;line-height:64rpx;color:#c8652a;background:#fff}.consultant-card{margin-top:14rpx;padding:26rpx}.consultant-head{display:flex;align-items:flex-start}.avatar{flex:0 0 94rpx;width:94rpx;height:94rpx;margin-right:18rpx;border-radius:30rpx;color:#fff;background:linear-gradient(145deg,#efab7b,#c85c2c);font-size:42rpx;font-weight:800;line-height:94rpx;text-align:center}.consultant-copy{flex:1;min-width:0}.consultant-name{display:block;color:#3e2c24;font-size:31rpx;font-weight:800}.consultant-level,.consultant-intro{display:block;margin-top:7rpx;color:#9a8174;font-size:21rpx;line-height:1.45}.status{flex:0 0 auto;padding:8rpx 12rpx;color:#3d9864;border-radius:13rpx;background:#eaf8ee;font-size:19rpx}.status.full{color:#b56c23;background:#fff2dc}.status.offline{color:#8f8c87;background:#f1efec}.tags{display:flex;gap:10rpx;margin-top:22rpx}.tag{padding:7rpx 12rpx;color:#c8652a;border-radius:12rpx;background:#fff0e5;font-size:19rpx}.detail-btn,.outline-btn{width:100%;height:68rpx;margin-top:20rpx;color:#c8652a;border:1rpx solid #f0d4c2;border-radius:18rpx;background:#fff8f2;font-size:23rpx;line-height:68rpx}.guide{display:flex;align-items:flex-start;margin-top:16rpx;padding:20rpx;background:#fff4e9}.guide-icon{flex:0 0 38rpx;width:38rpx;height:38rpx;margin-right:12rpx;border-radius:50%;color:#fff;background:#d98a5b;font-size:22rpx;line-height:38rpx;text-align:center}.guide-copy{flex:1}.guide-title{display:block;color:#9f5428;font-size:24rpx;font-weight:800}.guide-copy .muted{margin-top:7rpx;color:#8a6857;font-size:20rpx;line-height:1.5}.guide-link{flex:0 0 auto;margin:20rpx 0 0 50rpx;padding:0;color:#c8652a;background:transparent;border:0;font-size:21rpx}.progress-card{margin-top:16rpx;padding:22rpx}.progress-head{display:flex;align-items:center;justify-content:space-between}.progress-title{color:#3e2c24;font-size:26rpx;font-weight:800}.progress-card .muted{margin-top:11rpx}.outline-btn{margin-top:16rpx}.submit{margin-top:22rpx;width:100%}.empty{text-align:center;padding:46rpx 24rpx}.empty-title{display:block;font-size:28rpx;font-weight:800}.empty .muted{margin-top:10rpx}
</style>
<style scoped>
.consultant-head { position: relative; padding-right: 100rpx; }
.consultant-level { white-space: nowrap; font-size: 20rpx; }
.status { position: absolute; top: 0; right: 0; }
</style>

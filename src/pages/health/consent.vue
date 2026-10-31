<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { healthRepository } from '../../services/api/repositories'
import type { ConsentRecord } from '../../types/domain'

const records = ref<ConsentRecord[]>([])
const saving = ref(false)
const message = ref('')
const uniApi = (globalThis as any).uni
const load = async () => { records.value = await healthRepository.listConsents() }
const granted = () => records.value.some(item => item.consentType === 'health_data' && item.status === 'granted')
const save = async (status: 'granted' | 'revoked') => {
  if (saving.value) return
  saving.value = true; message.value = ''
  try {
    if (status === 'granted') await healthRepository.grantConsent('health_data', 'v1')
    else {
      const { consultationRepository } = await import('../../services/api/consultation')
      await consultationRepository.saveConsent('health_data', 'v1', 'revoked')
    }
    await load(); message.value = status === 'granted' ? '授权已保存' : '已撤回授权'
  } catch (error) { message.value = (error as Error).message } finally { saving.value = false }
}
onMounted(load)
</script>
<template>
  <view class="page">
    <view class="topbar"><text class="back" @click="uniApi.navigateBack()">‹</text><text class="top-title">数据授权</text><text></text></view>
    <view class="intro"><text class="intro-title">健康资料授权</text><text class="subtitle">我们会在你授权的范围内保存体检报告、健康指标和档案，用于生成健康结果及提供健康管理服务。</text></view>
    <view class="card">
      <view class="item"><text class="item-title">健康资料使用</text><text class="muted">包括体检报告、手动记录、健康档案和由此生成的基础分析。</text><text class="status" :class="{ active: granted() }">{{ granted() ? '已授权' : '未授权' }}</text></view>
      <PrimaryButton v-if="!granted()" :label="saving ? '保存中…' : '同意并授权'" @tap="save('granted')" />
      <button v-else class="revoke" :disabled="saving" @click="save('revoked')">{{ saving ? '处理中…' : '撤回授权' }}</button>
      <text v-if="message" class="message">{{ message }}</text>
    </view>
    <view class="section-title">授权记录</view>
    <view class="card"><view v-for="record in records" :key="record.id" class="record"><text>{{ record.version }} · {{ record.status === 'granted' ? '已同意' : '已撤回' }}</text><text class="muted">{{ record.consentedAt }}</text></view><text v-if="!records.length" class="muted">暂无授权记录</text></view>
  </view>
</template>
<style scoped>
.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:36rpx;font-weight:700}.intro{padding:24rpx 4rpx 20rpx}.intro-title{display:block;font-size:38rpx;font-weight:700;color:#15223a;margin-bottom:12rpx}.card{padding:28rpx}.item{position:relative;padding-bottom:20rpx}.item-title{display:block;font-size:30rpx;font-weight:700;color:#15223a}.muted{display:block;margin-top:10rpx;color:#7f908c;font-size:23rpx;line-height:1.5}.status{display:inline-block;margin-top:18rpx;padding:8rpx 16rpx;border-radius:20rpx;color:#a27620;background:#fff5dc;font-size:22rpx}.status.active{color:#078e7d;background:#e5faf4}.revoke{margin-top:22rpx;width:100%;color:#c65b47;background:#fff;border:1rpx solid #e6b7ab}.message{display:block;margin-top:16rpx;color:#08a990}.record{padding:18rpx 0;border-bottom:1rpx solid #edf2f1}.record:last-child{border-bottom:0}.section-title{margin-top:28rpx}
</style>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { healthRepository } from '../../services/api/repositories'

const saving = ref(false)
const editing = ref(false)
const loading = ref(true)
const uniApi = (globalThis as any).uni
const form = reactive({ gender: '', birthYear: '', heightCm: '', medicalHistory: '', allergies: '', medications: '', lifestyle: '' })
onMounted(async () => { try { Object.assign(form, await healthRepository.getProfile()) } finally { loading.value = false } })
const save = async () => { saving.value = true; try { await healthRepository.saveProfile(form); editing.value = false; uni.showToast({ title: '健康档案已保存' }) } catch (error) { const message = (error as Error).message; uni.showToast({ title: message }); if (message.includes('授权')) uniApi.navigateTo({ url: '/pages/health/consent' }) } finally { saving.value = false } }
</script>
<template>
  <view class="page">
    <view class="topbar"><text class="back" @click="uniApi.navigateBack()">‹</text><text class="top-title">健康档案</text><text></text></view>
    <view class="intro"><text class="intro-title">先完善你的健康资料</text><text class="subtitle">资料只用于生成更准确的健康结果，并会持续沉淀到你的健康档案。</text></view>
    <view v-if="loading" class="empty">正在加载健康档案…</view>
    <view v-else class="card">
      <view class="card-head"><view class="section-title">个人数据</view><button v-if="!editing" class="edit-btn" @click="editing = true">修改资料</button></view>
      <view v-if="!editing" class="summary">
        <view class="summary-row"><text>性别</text><text>{{ form.gender || '未填写' }}</text></view>
        <view class="summary-row"><text>出生年份</text><text>{{ form.birthYear || '未填写' }}</text></view>
        <view class="summary-row"><text>身高</text><text>{{ form.heightCm ? `${form.heightCm} cm` : '未填写' }}</text></view>
        <view class="summary-block"><text>既往病史</text><text>{{ form.medicalHistory || '未填写' }}</text></view>
        <view class="summary-block"><text>过敏史</text><text>{{ form.allergies || '未填写' }}</text></view>
        <view class="summary-block"><text>目前用药</text><text>{{ form.medications || '未填写' }}</text></view>
        <view class="summary-block"><text>生活方式</text><text>{{ form.lifestyle || '未填写' }}</text></view>
      </view>
      <view class="section-title">基础信息</view>
      <template v-if="editing">
        <view class="field"><text>性别</text><input v-model="form.gender" placeholder="例如：女" /></view>
        <view class="field"><text>出生年份</text><input v-model="form.birthYear" type="number" placeholder="例如：1992" /></view>
        <view class="field"><text>身高（cm）</text><input v-model="form.heightCm" type="digit" placeholder="例如：165" /></view>
      <view class="section-title block-title">健康情况</view>
        <view class="field"><text>既往病史</text><textarea v-model="form.medicalHistory" placeholder="没有可填写：无" /></view>
        <view class="field"><text>过敏史</text><textarea v-model="form.allergies" placeholder="药物、食物或其他过敏信息" /></view>
        <view class="field"><text>目前用药</text><textarea v-model="form.medications" placeholder="正在使用的药物或保健品" /></view>
        <view class="field"><text>生活方式</text><textarea v-model="form.lifestyle" placeholder="作息、运动、饮食等情况" /></view>
      </template>
      <button class="consent-link" @click="uniApi.navigateTo({ url: '/pages/health/consent' })">查看健康资料授权</button>
      <PrimaryButton v-if="editing" :label="saving ? '保存中…' : '保存健康档案'" @tap="save" />
    </view>
  </view>
</template>
<style scoped>
.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:36rpx;font-weight:700}.intro{padding:24rpx 4rpx 20rpx}.intro-title{display:block;font-size:38rpx;font-weight:700;color:#15223a;margin-bottom:12rpx}.card{padding:28rpx}.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:28rpx}.section-title{font-size:30rpx;font-weight:700;color:#15223a}.block-title{margin-top:28rpx}.edit-btn{margin:0;padding:0 24rpx;height:64rpx;line-height:64rpx;border-radius:32rpx;background:#e9faf6;color:#D96B2B;font-size:24rpx}.summary-row,.summary-block{display:flex;justify-content:space-between;padding:22rpx 0;border-bottom:1rpx solid #F3E8E0;color:#526563;font-size:26rpx}.summary-row text:last-child,.summary-block text:last-child{color:#15223a}.summary-block{display:block}.summary-block text{display:block}.summary-block text:last-child{margin-top:10rpx;line-height:1.6}.field{margin:24rpx 0;padding-bottom:18rpx;border-bottom:1rpx solid #F3E8E0}.field text{display:block;color:#526563;font-size:26rpx}.field input,.field textarea{display:block;width:100%;margin-top:14rpx;font-size:29rpx;color:#15223a}.field textarea{height:92rpx;line-height:1.5}.empty{padding:80rpx 0;text-align:center;color:#91a6a1}
.consent-link{margin:20rpx 0;color:#D96B2B;background:transparent;font-size:24rpx}
</style>


<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import { healthRepository } from '../../services/mock/repositories'

const saving = ref(false)
const uniApi = (globalThis as any).uni
const form = reactive({ gender: '', birthYear: '', heightCm: '', medicalHistory: '', allergies: '', medications: '', lifestyle: '' })
onMounted(async () => Object.assign(form, await healthRepository.getProfile()))
const save = async () => { saving.value = true; await healthRepository.saveProfile(form); saving.value = false; uni.showToast({ title: '健康档案已保存' }); setTimeout(() => uni.navigateBack(), 500) }
</script>
<template>
  <view class="page">
    <view class="topbar"><text class="back" @click="uniApi.navigateBack()">‹</text><text class="top-title">健康档案</text><text></text></view>
    <view class="intro"><text class="intro-title">先完善你的健康资料</text><text class="subtitle">资料只用于生成更准确的健康结果，并会持续沉淀到你的健康档案。</text></view>
    <view class="card">
      <view class="section-title">基础信息</view>
      <view class="field"><text>性别</text><input v-model="form.gender" placeholder="例如：女" /></view>
      <view class="field"><text>出生年份</text><input v-model="form.birthYear" type="number" placeholder="例如：1992" /></view>
      <view class="field"><text>身高（cm）</text><input v-model="form.heightCm" type="digit" placeholder="例如：165" /></view>
      <view class="section-title block-title">健康情况</view>
      <view class="field"><text>既往病史</text><textarea v-model="form.medicalHistory" placeholder="没有可填写：无" /></view>
      <view class="field"><text>过敏史</text><textarea v-model="form.allergies" placeholder="药物、食物或其他过敏信息" /></view>
      <view class="field"><text>目前用药</text><textarea v-model="form.medications" placeholder="正在使用的药物或保健品" /></view>
      <view class="field"><text>生活方式</text><textarea v-model="form.lifestyle" placeholder="作息、运动、饮食等情况" /></view>
      <PrimaryButton :label="saving ? '保存中…' : '保存健康档案'" @tap="save" />
    </view>
  </view>
</template>
<style scoped>
.topbar{height:82rpx;display:flex;align-items:center;justify-content:space-between}.back{font-size:48rpx}.top-title{font-size:36rpx;font-weight:700}.intro{padding:24rpx 4rpx 20rpx}.intro-title{display:block;font-size:38rpx;font-weight:700;color:#15223a;margin-bottom:12rpx}.card{padding:28rpx}.section-title{font-size:30rpx;font-weight:700;color:#15223a}.block-title{margin-top:28rpx}.field{margin:24rpx 0;padding-bottom:18rpx;border-bottom:1rpx solid #edf2f1}.field text{display:block;color:#526563;font-size:26rpx}.field input,.field textarea{display:block;width:100%;margin-top:14rpx;font-size:29rpx;color:#15223a}.field textarea{height:92rpx;line-height:1.5}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { uniApi as uni } from '../../services/platform/uni'
import { consultationRepository as api } from '../../services/api/consultation'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
async function submit() {
  if (!username.value.trim() || !password.value) { error.value = '请输入账号和密码'; return }
  loading.value = true; error.value = ''
  try { await api.operatorLogin(username.value.trim(), password.value); uni.redirectTo({ url: '/pages/consultant/workbench' }) }
  catch (e) { error.value = (e as Error).message }
  finally { loading.value = false }
}
</script>

<template>
  <view class="page">
    <view class="hero"><text class="eyebrow">HEALTH AI</text><text class="title">健管师工作台</text><text class="subtitle">登录后查看平台分配的客户与咨询通知</text></view>
    <view class="form-card">
      <text class="label">工作账号</text><input v-model="username" class="input" placeholder="请输入工作账号" maxlength="64" />
      <text class="label">登录密码</text><input v-model="password" class="input" password placeholder="请输入登录密码" maxlength="128" />
      <text v-if="error" class="error">{{ error }}</text>
      <button class="submit" :disabled="loading" @click="submit">{{ loading ? '登录中…' : '登录工作台' }}</button>
    </view>
    <text class="hint">账号由平台管理员创建和分配，咨询时段与客户由公司统一安排。</text>
  </view>
</template>

<style scoped>
.page{min-height:100vh;padding:70rpx 34rpx;background:#fffaf6;box-sizing:border-box}.hero{padding:20rpx 8rpx 42rpx}.eyebrow{display:block;color:#c8652a;font-size:22rpx;letter-spacing:4rpx}.title{display:block;margin-top:18rpx;color:#2a201c;font-size:48rpx;font-weight:800}.subtitle{display:block;margin-top:14rpx;color:#8a7770;font-size:24rpx;line-height:1.6}.form-card{padding:30rpx;border-radius:28rpx;background:#fff;box-shadow:0 16rpx 40rpx rgba(125,78,42,.08)}.label{display:block;margin:4rpx 0 12rpx;color:#5f514a;font-size:24rpx;font-weight:700}.input{height:84rpx;margin-bottom:24rpx;padding:0 22rpx;border:1rpx solid #f0ded2;border-radius:16rpx;background:#fffaf6;color:#2a201c;font-size:25rpx;box-sizing:border-box}.error{display:block;margin-bottom:16rpx;color:#d85f42;font-size:22rpx;line-height:1.5}.submit{width:100%;height:82rpx;margin-top:8rpx;border:0;border-radius:18rpx;color:#fff;background:#d96b2b;font-size:27rpx;line-height:82rpx}.hint{display:block;margin:24rpx 10rpx;color:#a08e86;font-size:21rpx;line-height:1.6;text-align:center}
</style>

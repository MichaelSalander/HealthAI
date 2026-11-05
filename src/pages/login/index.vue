<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { consultationRepository } from '../../services/api/consultation'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

onLoad(() => {
  if (uni.getStorageSync('healthai_customer_session')) uni.reLaunch({ url: '/pages/home/index' })
})

async function passwordLogin() {
  if (!username.value.trim() || !password.value) { error.value = '请输入账号和密码'; return }
  loading.value = true; error.value = ''
  try {
    await consultationRepository.customerPasswordLogin(username.value.trim(), password.value)
    uni.reLaunch({ url: '/pages/home/index' })
  } catch (err) { error.value = err instanceof Error ? err.message : '登录失败，请稍后重试' }
  finally { loading.value = false }
}

async function wechatLogin() {
  loading.value = true; error.value = ''
  try {
    await consultationRepository.loginWithWechat('customer')
    uni.reLaunch({ url: '/pages/home/index' })
  } catch (err) { error.value = err instanceof Error ? err.message : '微信登录失败，请在微信小程序中重试' }
  finally { loading.value = false }
}
</script>

<template>
  <view class="page">
    <view class="brand">HealthAI</view>
    <view class="title">登录健康管理</view>
    <view class="subtitle">使用账号密码或微信登录，继续管理你的健康资料</view>
    <view class="form-card">
      <input v-model="username" class="field" placeholder="请输入账号" maxlength="64" />
      <input v-model="password" class="field" placeholder="请输入密码" password maxlength="128" />
      <text v-if="error" class="error">{{ error }}</text>
      <button class="primary" :disabled="loading" @click="passwordLogin">{{ loading ? '登录中…' : '账号密码登录' }}</button>
      <view class="divider"><view /> <text>或</text> <view /></view>
      <button class="wechat" :disabled="loading" @click="wechatLogin">微信登录</button>
    </view>
    <text class="hint">账号由平台创建或配置，未开放自动注册。</text>
  </view>
</template>

<style scoped>
.page{min-height:100vh;box-sizing:border-box;padding:96rpx 40rpx;background:#f7fbfa;color:#173b36}.brand{color:#0aa88f;font-size:36rpx;font-weight:800}.title{margin-top:48rpx;font-size:52rpx;font-weight:800}.subtitle{margin-top:18rpx;color:#78908b;font-size:26rpx;line-height:1.6}.form-card{margin-top:52rpx;padding:30rpx;border-radius:28rpx;background:#fff;box-shadow:0 18rpx 48rpx rgba(32,102,91,.08)}.field{height:92rpx;margin-bottom:22rpx;padding:0 24rpx;border:2rpx solid #e2eeeb;border-radius:18rpx;box-sizing:border-box;font-size:28rpx}.primary,.wechat{height:88rpx;border-radius:18rpx;font-size:28rpx}.primary{color:#fff;background:#08aa91}.wechat{color:#168b5f;background:#eaf8f0}.divider{display:flex;align-items:center;gap:18rpx;margin:28rpx 0;color:#9aaca8;font-size:24rpx}.divider view{flex:1;height:1rpx;background:#edf2f1}.error{display:block;margin:0 0 18rpx;color:#d85b53;font-size:24rpx}.hint{display:block;margin-top:26rpx;text-align:center;color:#91a6a1;font-size:22rpx}
</style>

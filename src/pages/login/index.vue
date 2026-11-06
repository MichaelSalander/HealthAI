<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { consultationRepository } from '../../services/api/consultation'

const username = ref('')
const email = ref('')
const name = ref('')
const password = ref('')
const confirmPassword = ref('')
const mode = ref<'login' | 'register'>('login')
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

async function register() {
  if (!email.value.trim() || !password.value || !confirmPassword.value) { error.value = '请填写 Email、密码和确认密码'; return }
  if (password.value !== confirmPassword.value) { error.value = '两次输入的密码不一致'; return }
  loading.value = true; error.value = ''
  try {
    await consultationRepository.customerRegister(email.value.trim(), password.value, name.value.trim())
    uni.reLaunch({ url: '/pages/report/index' })
  } catch (err) { error.value = err instanceof Error ? err.message : '注册失败，请稍后重试' }
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
      <template v-if="mode === 'login'">
        <input v-model="username" class="field" placeholder="请输入 Email" maxlength="64" />
      </template>
      <template v-else>
        <input v-model="email" class="field" placeholder="请输入 Email" maxlength="64" />
        <input v-model="name" class="field" placeholder="昵称（选填）" maxlength="32" />
      </template>
      <input v-model="password" class="field" placeholder="请输入密码" password maxlength="128" />
      <input v-if="mode === 'register'" v-model="confirmPassword" class="field" placeholder="请再次输入密码" password maxlength="128" />
      <text v-if="error" class="error">{{ error }}</text>
      <button class="primary" :disabled="loading" @click="mode === 'login' ? passwordLogin() : register()">{{ loading ? (mode === 'login' ? '登录中…' : '注册中…') : (mode === 'login' ? 'Email 登录' : '注册并开始使用') }}</button>
      <text class="switch" @click="mode = mode === 'login' ? 'register' : 'login'; error = ''">{{ mode === 'login' ? '没有账号？立即注册' : '已有账号？返回登录' }}</text>
      <view class="divider"><view /> <text>或</text> <view /></view>
      <button class="wechat" :disabled="loading" @click="wechatLogin">微信登录</button>
    </view>
    <text class="hint">Email 注册暂不要求验证，注册后可直接建立健康档案。</text>
  </view>
</template>

<style scoped>
.page{min-height:100vh;box-sizing:border-box;padding:96rpx 40rpx;background:#f7fbfa;color:#173b36}.brand{color:#0aa88f;font-size:36rpx;font-weight:800}.title{margin-top:48rpx;font-size:52rpx;font-weight:800}.subtitle{margin-top:18rpx;color:#78908b;font-size:26rpx;line-height:1.6}.form-card{margin-top:52rpx;padding:30rpx;border-radius:28rpx;background:#fff;box-shadow:0 18rpx 48rpx rgba(32,102,91,.08)}.field{height:92rpx;margin-bottom:22rpx;padding:0 24rpx;border:2rpx solid #e2eeeb;border-radius:18rpx;box-sizing:border-box;font-size:28rpx}.primary,.wechat{height:88rpx;border-radius:18rpx;font-size:28rpx}.primary{color:#fff;background:#08aa91}.wechat{color:#168b5f;background:#eaf8f0}.switch{display:block;margin-top:24rpx;text-align:center;color:#08a990;font-size:24rpx}.divider{display:flex;align-items:center;gap:18rpx;margin:28rpx 0;color:#9aaca8;font-size:24rpx}.divider view{flex:1;height:1rpx;background:#edf2f1}.error{display:block;margin:0 0 18rpx;color:#d85b53;font-size:24rpx}.hint{display:block;margin-top:26rpx;text-align:center;color:#91a6a1;font-size:22rpx}
</style>

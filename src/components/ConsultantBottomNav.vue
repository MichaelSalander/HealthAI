<script setup lang="ts">
withDefaults(defineProps<{ active?: string }>(), { active: 'workbench' })
const items = [
  { key: 'workbench', label: '工作台', icon: 'home', url: '/pages/consultant/workbench' },
  { key: 'clients', label: '我的客户', icon: 'personadd', url: '/pages/consultant/clients' },
  { key: 'insights', label: 'AI洞察', icon: 'star', url: '/pages/consultant/insights' },
  { key: 'notices', label: '通知', icon: 'notification', url: '/pages/consultants/notices' },
  { key: 'profile', label: '我的', icon: 'person', url: '/pages/consultant/profile' }
]
const go = (url: string) => uni.reLaunch({ url })
</script>

<template>
  <view class="consultant-nav">
    <view v-for="item in items" :key="item.key" class="nav-item" :class="{ active: active === item.key }" @click="go(item.url)">
      <uni-icons class="nav-icon" :type="item.icon" size="22" :color="active === item.key ? '#d96b2b' : '#9a938d'" />
      <text class="nav-label">{{ item.label }}</text>
    </view>
  </view>
</template>

<style scoped>
.consultant-nav { position: fixed; z-index: 40; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100%, 430px); height: 118rpx; box-sizing: border-box; display: flex; align-items: center; justify-content: space-around; padding: 10rpx 10rpx calc(10rpx + env(safe-area-inset-bottom)); background: rgba(255,255,255,.98); border-top: 1rpx solid #f1e8df; box-shadow: 0 -12rpx 30rpx rgba(116,76,44,.08); }
.nav-item { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7rpx; color: #9a938d; font-size: 20rpx; }
.nav-icon { display: flex; align-items: center; justify-content: center; width: 48rpx; height: 48rpx; border-radius: 16rpx; color: #9a938d; font-size: 31rpx; line-height: 1; }
.nav-label { white-space: nowrap; }
.nav-item.active { color: #d96b2b; font-weight: 700; }
.nav-item.active .nav-icon { color: #d96b2b; background: #fff0e5; }
</style>

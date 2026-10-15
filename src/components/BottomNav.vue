<script setup lang="ts">
withDefaults(defineProps<{ active?: string }>(), { active: 'home' })
const items = [
  { key: 'home', label: '首页', icon: 'home', url: '/pages/home/index' },
  { key: 'health', label: '我的健康', icon: 'heart', url: '/pages/health/index' },
  { key: 'consultant', label: '找健管师', icon: 'personadd', url: '/pages/consultants/index' },
  { key: 'service', label: '服务', icon: 'shop', url: '/pages/service/index' },
  { key: 'profile', label: '我的', icon: 'person', url: '/pages/profile/index' }
]
const go = (url: string) => uni.reLaunch({ url })
</script>
<template>
  <view class="bottom-nav"><view v-for="item in items" :key="item.key" class="nav-item" :class="{ active: active === item.key }" @click="go(item.url)"><uni-icons class="nav-icon" :type="item.icon" size="21" :color="active === item.key ? '#08b39f' : '#70847f'" /><text class="nav-label">{{ item.label }}</text></view></view>
</template>
<style scoped>
.bottom-nav { position: fixed; z-index: 20; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100%, 430px); height: 112rpx; box-sizing: border-box; display: flex; justify-content: space-around; align-items: center; padding: 8rpx 14rpx calc(8rpx + env(safe-area-inset-bottom)); background: rgba(255,255,255,.97); border-top: 1rpx solid #edf3f1; box-shadow: 0 -8rpx 24rpx rgba(23,86,78,.06); }
.nav-item { min-width: 108rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx; color: #879692; font-size: 21rpx; }.nav-icon { width: 46rpx; height: 46rpx; line-height: 44rpx; text-align: center; border-radius: 16rpx; font-size: 37rpx; font-weight: 600; color: #70847f; }.nav-item.active { color: #08b39f; font-weight: 700; }.nav-item.active .nav-icon { color: #08b39f; background: #e5faf5; }.nav-label { white-space: nowrap; }
</style>

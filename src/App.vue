<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useHealthStore } from './stores/health'

function currentRoute() {
  const hashPath = typeof window !== 'undefined' ? window.location.hash.split('?')[0] : ''
  const currentPages = (globalThis as { getCurrentPages?: () => Array<{ route?: string }> }).getCurrentPages?.() || []
  return hashPath || currentPages[0]?.route || ''
}

function guardRoute() {
  const route = currentRoute()
  const isConsultant = route.includes('/pages/consultant/') || route === '/pages/consultants/notices'
  const isLogin = route === '/pages/login/index' || route === '/pages/consultant/login'
  if (isLogin) return
  const key = isConsultant ? 'healthai_consultant_session' : 'healthai_customer_session'
  if (!uni.getStorageSync(key)) uni.reLaunch({ url: isConsultant ? '/pages/consultant/login' : '/pages/login/index' })
  else if (!isConsultant) useHealthStore().ensureUser()
}

onMounted(() => {
  guardRoute()
  if (typeof window !== 'undefined') window.addEventListener('hashchange', guardRoute)
})
onUnmounted(() => { if (typeof window !== 'undefined') window.removeEventListener('hashchange', guardRoute) })
</script>

<template><slot /></template>

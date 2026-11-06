<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useHealthStore } from './stores/health'

function currentRoute() {
  const hashPath = typeof window !== 'undefined' ? window.location.hash.split('?')[0] : ''
  const currentPages = (globalThis as { getCurrentPages?: () => Array<{ route?: string }> }).getCurrentPages?.() || []
  return hashPath || currentPages[0]?.route || ''
}

type PortalRole = 'customer' | 'consultant'

function portalRole(): PortalRole | undefined {
  const configured = String((import.meta as any).env?.VITE_PORTAL_ROLE || '').toLowerCase()
  if (configured === 'consultant' || configured === 'customer') return configured
  if (typeof window === 'undefined') return undefined
  const host = window.location.hostname.toLowerCase()
  if (host.startsWith('consultant.') || host.startsWith('coach.')) return 'consultant'
  if (host.startsWith('app.') || host.startsWith('member.')) return 'customer'
  return undefined
}

function guardRoute() {
  const route = currentRoute()
  const isConsultant = route.includes('/pages/consultant/') || route === '/pages/consultants/notices'
  const isLogin = route === '/pages/login/index' || route === '/pages/consultant/login'
  const forcedPortal = portalRole()
  const portalIsConsultant = forcedPortal === 'consultant'
  if (isLogin) {
    if (portalIsConsultant && route !== '/pages/consultant/login') uni.reLaunch({ url: '/pages/consultant/login' })
    else if (forcedPortal === 'customer' && route === '/pages/consultant/login') uni.reLaunch({ url: '/pages/login/index' })
    return
  }
  if (forcedPortal && isConsultant !== portalIsConsultant) {
    uni.reLaunch({ url: portalIsConsultant ? '/pages/consultant/login' : '/pages/login/index' })
    return
  }
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

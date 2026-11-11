<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useHealthStore } from './stores/health'
import { uniApi as uni } from './services/platform/uni'

function currentRoute() {
  const hashPath = typeof window !== 'undefined' ? window.location.hash.split('?')[0] : ''
  const currentPages = (globalThis as { getCurrentPages?: () => Array<{ route?: string }> }).getCurrentPages?.() || []
  const route = (hashPath || currentPages[currentPages.length - 1]?.route || '').replace(/^#/, '')
  return route.startsWith('/') ? route : `/${route}`
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
  let valid = false
  try { const saved = JSON.parse(String(uni.getStorageSync(key) || 'null')); valid = Boolean(saved?.token && saved.role === (isConsultant ? 'consultant' : 'customer')) } catch { /* Invalid session is treated as logged out. */ }
  if (!valid) uni.reLaunch({ url: isConsultant ? '/pages/consultant/login' : '/pages/login/index' })
  else if (!isConsultant) useHealthStore().ensureUser()
}

onMounted(() => {
  guardRoute()
  if (typeof window !== 'undefined') { window.addEventListener('hashchange', guardRoute); window.addEventListener('storage', guardRoute) }
})
onUnmounted(() => { if (typeof window !== 'undefined') { window.removeEventListener('hashchange', guardRoute); window.removeEventListener('storage', guardRoute) } })
</script>

<template><slot /></template>

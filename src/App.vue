<script setup lang="ts">
import { onMounted } from 'vue'
import { useHealthStore } from './stores/health'

function isConsultantRoute() {
  const hashPath = typeof window !== 'undefined' ? window.location.hash.split('?')[0] : ''
  const currentPages = (globalThis as { getCurrentPages?: () => Array<{ route?: string }> }).getCurrentPages?.() || []
  const route = hashPath || currentPages[0]?.route || ''
  return route.includes('/pages/consultant/') || route === '/pages/consultants/notices'
}

onMounted(() => {
  if (!isConsultantRoute()) useHealthStore().ensureUser()
})
</script>

<template><slot /></template>

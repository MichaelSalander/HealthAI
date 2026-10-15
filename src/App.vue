<script setup lang="ts">
import { onMounted } from 'vue'
import { useHealthStore } from './stores/health'

onMounted(() => useHealthStore().ensureMockUser())
</script>

<template><slot /></template>

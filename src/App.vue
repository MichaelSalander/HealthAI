<script setup lang="ts">
import { onMounted } from 'vue'
import { useHealthStore } from './stores/health'

onMounted(() => useHealthStore().ensureUser())
</script>

<template><slot /></template>

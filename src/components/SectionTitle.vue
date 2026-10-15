<script setup lang="ts">
const props = defineProps<{ title: string; action?: string }>()
</script>
<template><view class="row section-title"><text>{{ props.title }}</text><text v-if="props.action" class="muted small">{{ props.action }} ›</text></view></template>

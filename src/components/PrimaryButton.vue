<script setup lang="ts">
const props = defineProps<{ label: string; secondary?: boolean }>()
const emit = defineEmits<{ (event: 'tap'): void }>()
</script>
<template><button :class="['btn', { secondary: props.secondary }]" @click="emit('tap')">{{ props.label }}</button></template>

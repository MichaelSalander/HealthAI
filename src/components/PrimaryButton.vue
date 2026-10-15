<script setup lang="ts">
const props = defineProps<{ label: string; secondary?: boolean }>()
const emit = defineEmits<{ (event: 'tap'): void; (event: 'click'): void }>()
const handleClick = () => {
  emit('click')
  emit('tap')
}
</script>
<template><button :class="['btn', { secondary: props.secondary }]" @click="handleClick">{{ props.label }}</button></template>

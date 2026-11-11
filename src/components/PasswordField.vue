<script setup lang="ts">
import { ref } from 'vue'
withDefaults(defineProps<{ modelValue: string; placeholder?: string }>(), { placeholder: '请输入密码' })
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()
const visible = ref(false)
const updateValue = (event: Event) => emit('update:modelValue', (event as Event & { detail: { value: string } }).detail.value)
</script>

<template>
  <view class="password-field">
    <input :value="modelValue" :password="!visible" :placeholder="placeholder" :maxlength="128" @input="updateValue" />
    <button class="visibility" :aria-label="visible ? '隐藏密码' : '显示密码'" @click="visible = !visible">
      <uni-icons :type="visible ? 'eye-filled' : 'eye-slash-filled'" size="22" color="#8b8179" />
    </button>
  </view>
</template>

<style scoped>
.password-field{display:flex;align-items:center;min-height:92rpx;margin-bottom:22rpx;border:2rpx solid #eadfd7;border-radius:18rpx;box-sizing:border-box;background:#fff}
input{flex:1;min-width:0;height:88rpx;padding:0 24rpx;font-size:28rpx;color:#2a201c}
.visibility{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:88rpx;height:88rpx;padding:0;margin:0;background:transparent;border:0}
.visibility::after{border:0}
</style>

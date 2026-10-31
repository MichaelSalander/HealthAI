<script setup lang="ts">
import { ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import { consultationRepository as api } from '../../services/api/consultation'
import { uniApi as uni } from '../../services/platform/uni'
const message = ref('')
async function customer(id: string, blood = false) { try { await api.useCustomer(id); if (blood) await api.addDemoBloodReport(); uni.navigateTo({ url: '/pages/consultants/booking' }) } catch (e) { message.value = (e as Error).message } }
</script>
<template><view class="page"><text class="title">本地流程验收</text><text class="subtitle">演示账号，只用于本地 Mock；客户与健管师可分别在两个窗口操作。</text><text v-if="message" class="danger">{{ message }}</text><AppCard><button class="btn" @click="customer('u-001', true)">客户：有血检，开始预约</button><button class="btn secondary" @click="customer('u-no-blood')">客户：无血检，查看导流</button><button class="btn secondary" @click="uni.navigateTo({url:'/pages/consultant/workbench'})">健管师：进入手机工作台</button></AppCard></view></template>
<style scoped>.btn{margin-top:22rpx;white-space:normal;height:auto;min-height:88rpx;line-height:1.6;padding:20rpx}</style>

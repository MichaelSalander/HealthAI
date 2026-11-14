<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppCard from './AppCard.vue'
import BottomNav from './BottomNav.vue'
import { consultationRepository as api } from '../services/api/consultation'
import { availabilityLabels } from '../types/consultation'
import type { ConsultationConsultant } from '../types/consultation'
import { uniApi as uni } from '../services/platform/uni'
const items = ref<ConsultationConsultant[]>([])
const categories = ref<{ id: string; name: string }[]>([])
const category = ref('')
const search = ref('')
const error = ref('')
const loading = ref(true)
const shown = computed(() => items.value.filter(c => (!category.value || c.categories?.includes(category.value)) && `${c.name} ${c.intro || ''} ${(c.categories || []).join(' ')}`.includes(search.value.trim())).sort((a, b) => Number(b.acceptingNewClients && b.status === 'available') - Number(a.acceptingNewClients && a.status === 'available') || a.activeClientCount - b.activeClientCount))
async function load() { loading.value = true; try { [items.value, categories.value] = await Promise.all([api.directory(), api.categories()]); error.value = '' } catch (e) { error.value = (e as Error).message } finally { loading.value = false } }
onShow(load)
</script>
<template><view class="page"><input v-model="search" class="search" placeholder="搜索健管师或擅长领域" /><view class="categories"><button v-for="item in categories" :key="item.id" :class="{ active: category === item.name }" @click="category = category === item.name ? '' : item.name">{{ item.name }}</button></view><view class="row"><text class="title">{{ category || '推荐健管师' }}</text><button v-if="category" size="mini" @click="category = ''">全部</button></view><AppCard v-if="error"><text class="danger">{{ error }}</text><button @click="load">重试</button></AppCard><text v-if="loading">正在加载…</text><text v-else-if="!shown.length" class="muted">暂无符合条件的健管师</text><AppCard v-for="c in shown" :key="c.id"><view class="row" @click="uni.navigateTo({url:`/pages/consultants/detail?id=${c.id}`})"><image v-if="c.avatarUrl" :src="c.avatarUrl" class="avatar" mode="aspectFill" /><view v-else class="avatar">{{ c.name[0] }}</view><view class="grow"><text class="name">{{ c.name }}</text><text class="subtitle">{{ c.level }}健康管理师</text></view><text class="tag">{{ availabilityLabels[c.status] }}</text></view><view class="tags"><text v-for="tag in c.categories" :key="tag" class="tag">{{ tag }}</text></view><text v-if="c.intro" class="subtitle">{{ c.intro }}</text><button class="btn secondary" @click="uni.navigateTo({url:`/pages/consultants/detail?id=${c.id}`})">查看资料</button></AppCard><button class="btn" @click="uni.navigateTo({url:'/pages/consultants/booking'})">咨询我的健康管理师</button><BottomNav active="consultant" /></view></template>
<style scoped>.search{background:white;border-radius:20rpx;padding:24rpx;margin-bottom:24rpx}.categories{display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx;margin-bottom:26rpx}.categories button{margin:0;padding:16rpx 4rpx;font-size:24rpx;line-height:1.5;background:#fff0e5;color:#94542c}.categories .active{background:#d96b2b;color:white}.avatar{flex-shrink:0;width:84rpx;height:84rpx;border-radius:50%;background:#f5d9c7;color:#a94b1d;text-align:center;line-height:84rpx;font-size:32rpx;margin-right:18rpx}.name{font-size:30rpx;font-weight:700}.row,.tags{display:flex;flex-wrap:wrap;gap:12rpx}.tags{margin-top:18rpx}.btn{margin-top:24rpx}</style>

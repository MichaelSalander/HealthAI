<script setup lang="ts">
import { ref } from 'vue'
import AppCard from '../../components/AppCard.vue'
import HealthTrendChart from '../../components/HealthTrendChart.vue'
const months = ref(3)
const ranges = [{ label: '1个月', value: 1 }, { label: '3个月', value: 3 }, { label: '6个月', value: 6 }, { label: '1年', value: 12 }]
</script>
<template><view class="page"><view class="ranges"><button v-for="item in ranges" :key="item.value" :class="{ active: months === item.value }" @click="months = item.value">{{ item.label }}</button></view><AppCard><HealthTrendChart :months="months" /></AppCard></view></template>
<style scoped>.ranges{display:flex;gap:12rpx;margin-bottom:24rpx}.ranges button{font-size:24rpx;padding:10rpx 16rpx;line-height:1.6;background:#fff7f0;color:#786b63}.ranges .active{background:#d96b2b;color:white}</style>

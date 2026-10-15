<script setup lang="ts">
import { ref } from 'vue'
import PrimaryButton from '../../components/PrimaryButton.vue'
import BottomNav from '../../components/BottomNav.vue'
import { healthRepository } from '../../services/mock/repositories'

const weight = ref('62.5')
const save = async () => {
  await healthRepository.addObservation({ code: 'weight', name: '体重', value: weight.value, unit: 'kg', reference: '目标 55.0', status: '正常' })
  uni.showToast({ title: '记录已保存' })
  setTimeout(() => uni.navigateBack(), 500)
}
</script>
<template><view class="page"><view class="card"><view class="section-title">记录健康数据</view><text class="subtitle">记录结果会进入你的长期健康档案</text><view class="field"><text>体重（kg）</text><input v-model="weight" type="digit" placeholder="请输入体重" /></view><view class="field"><text>记录备注</text><textarea placeholder="例如：今天运动30分钟，饮食清淡…" /></view><PrimaryButton label="保存记录" @tap="save" /></view></view></template><style scoped>.field{margin:30rpx 0;padding:22rpx 0;border-bottom:1rpx solid #edf2f1}.field input,.field textarea{display:block;margin-top:16rpx;width:100%;font-size:30rpx}.field textarea{height:130rpx}</style>

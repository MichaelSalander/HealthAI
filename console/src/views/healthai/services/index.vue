<script setup lang="ts">
import { ref } from "vue";
import { onMounted } from "vue";
import { healthAiApi, type ServicePlan } from "@/api/healthai";
defineOptions({ name: "HealthAiServices" });
const plans = ref<ServicePlan[]>([
  { id: 'p-002', name: "初级健康管理", level: "初级", cycle: "月", priceFen: 198000, description: '健康档案、每日打卡', enabled: true },
  { id: 'p-003', name: "高级健康管理", level: "高级", cycle: "月", priceFen: 298000, description: '每日数据追踪、每周咨询', enabled: true },
  { id: 'p-005', name: "慢病健康管理", level: "慢病", cycle: "月", priceFen: 598000, description: '慢病一对一管理', enabled: true }
]);
onMounted(async () => { plans.value = await healthAiApi.listPlans(plans.value); });
const addPlan = () => plans.value.push({ id: `p-${Date.now()}`, name: "新服务方案", level: "初级", cycle: "月", priceFen: 0, description: '', enabled: false });
const save = async () => { plans.value = await healthAiApi.savePlans(plans.value); };
</script>
<template><div class="health-page"><el-card shadow="never"><template #header><div class="card-title"><span>服务方案与价格</span><div><el-button @click="addPlan">新增方案</el-button><el-button type="primary" @click="save">保存并发布</el-button></div></div></template><el-alert title="金额以元展示，正式 API 将以整数分存储。价格修改需要审核后发布。" type="warning" :closable="false" class="mb" /><el-table :data="plans"><el-table-column label="方案名称"><template #default="{row}"><el-input v-model="row.name" /></template></el-table-column><el-table-column prop="level" label="等级" width="120" /><el-table-column prop="cycle" label="周期" width="120" /><el-table-column label="价格（元）" width="180"><template #default="{row}"><el-input-number :model-value="row.priceFen / 100" :min="0" @update:model-value="value => row.priceFen = Number(value || 0) * 100" /></template></el-table-column><el-table-column label="状态" width="120"><template #default="{row}"><el-switch v-model="row.enabled" /></template></el-table-column><el-table-column label="操作" width="130"><template #default><el-button link type="primary">编辑权益</el-button></template></el-table-column></el-table></el-card></div></template>
<style scoped>.health-page{padding:4px}.card-title{display:flex;justify-content:space-between;align-items:center}.mb{margin-bottom:16px}</style>

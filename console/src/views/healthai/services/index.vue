<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { healthAiApi, type ServicePlan } from "@/api/healthai";
defineOptions({ name: "HealthAiServices" });
const plans = ref<ServicePlan[]>([]); const loading = ref(true); const error = ref("");
onMounted(async () => { try { plans.value = await healthAiApi.listPlans([]); } catch (e) { error.value = (e as Error).message; } finally { loading.value = false; } });
const addPlan = () => plans.value.push({ id: `p-${Date.now()}`, name: "新服务方案", level: "初级", cycle: "月", priceFen: 0, description: "", enabled: false });
const save = async () => { try { plans.value = await healthAiApi.savePlans(plans.value); ElMessage.success("方案已保存并同步 C 端"); } catch (e) { ElMessage.error((e as Error).message); } };
</script>
<template>
  <div class="health-page"><el-alert v-if="error" :title="error" type="error" :closable="false" class="mb" /><el-card shadow="never" v-loading="loading"><template #header><div class="card-title"><span>服务方案与价格</span><div><el-button @click="addPlan">新增方案</el-button><el-button type="primary" @click="save">保存并发布</el-button></div></div></template><el-alert title="金额以元展示，后端以整数分存储。修改后会同步到 C 端方案列表。" type="warning" :closable="false" class="mb" /><el-empty v-if="!plans.length" description="暂无服务方案" /><el-table v-else :data="plans"><el-table-column label="方案名称" min-width="170"><template #default="{row}"><el-input v-model="row.name" /></template></el-table-column><el-table-column label="等级" width="130"><template #default="{row}"><el-select v-model="row.level"><el-option label="初级" value="初级" /><el-option label="高级" value="高级" /><el-option label="慢病" value="慢病" /></el-select></template></el-table-column><el-table-column label="周期" width="120"><template #default="{row}"><el-select v-model="row.cycle"><el-option label="7天" value="7天" /><el-option label="月" value="月" /><el-option label="季" value="季" /><el-option label="年" value="年" /></el-select></template></el-table-column><el-table-column label="价格（元）" width="180"><template #default="{row}"><el-input-number :model-value="row.priceFen / 100" :min="0" @update:model-value="value => row.priceFen = Math.round(Number(value || 0) * 100)" /></template></el-table-column><el-table-column label="方案说明" min-width="220"><template #default="{row}"><el-input v-model="row.description" /></template></el-table-column><el-table-column label="状态" width="100"><template #default="{row}"><el-switch v-model="row.enabled" /></template></el-table-column></el-table></el-card></div>
</template>
<style scoped>.health-page{padding:4px}.card-title{display:flex;justify-content:space-between;align-items:center}.mb{margin-bottom:16px}</style>

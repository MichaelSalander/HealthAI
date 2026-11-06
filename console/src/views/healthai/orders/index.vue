<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { healthAiApi, type AdminOrder } from "@/api/healthai";
defineOptions({ name: "HealthAiOrders" });
const rows = ref<AdminOrder[]>([]); const loading = ref(true); const error = ref("");
const paid = computed(() => rows.value.filter(row => row.paymentStatus === "success"));
const today = computed(() => new Date().toISOString().slice(0, 10));
const todayRows = computed(() => rows.value.filter(row => row.createdAt.slice(0, 10) === today.value));
const todayAmountFen = computed(() => todayRows.value.filter(row => row.paymentStatus === "success").reduce((sum, row) => sum + row.priceFen, 0));
const formatTime = (value: string) => new Date(value).toLocaleString("zh-CN");
onMounted(async () => { try { rows.value = await healthAiApi.listOrders([]); } catch (e) { error.value = (e as Error).message; } finally { loading.value = false; } });
</script>
<template><div class="page"><el-alert v-if="error" :title="error" type="error" :closable="false" class="mb" /><el-card shadow="never" v-loading="loading"><template #header><div class="bar"><b>A-04 订单、支付与结算</b><el-button type="primary" plain disabled>导出对账单</el-button></div></template><el-row :gutter="16" class="stats"><el-col :span="6"><el-statistic title="今日订单" :value="todayRows.length" /></el-col><el-col :span="6"><el-statistic title="今日成交额" prefix="¥" :value="todayAmountFen / 100" :precision="2" /></el-col><el-col :span="6"><el-statistic title="已支付订单" :value="paid.length" /></el-col><el-col :span="6"><el-statistic title="待处理订单" :value="rows.filter(row => row.status === '待付款').length" /></el-col></el-row><el-divider /><el-empty v-if="!rows.length" description="暂无订单数据" /><el-table v-else :data="rows" stripe><el-table-column prop="id" label="订单号" min-width="190" /><el-table-column prop="userName" label="客户" /><el-table-column prop="productName" label="商品" min-width="200" /><el-table-column label="金额"><template #default="{ row }">¥{{ (row.priceFen / 100).toFixed(2) }}</template></el-table-column><el-table-column label="下单时间" min-width="170"><template #default="{ row }">{{ formatTime(row.createdAt) }}</template></el-table-column><el-table-column prop="status" label="状态"><template #default="{ row }"><el-tag :type="row.status === '服务中' ? 'success' : row.status === '待付款' ? 'warning' : 'info'">{{ row.status }}</el-tag></template></el-table-column><el-table-column label="操作"><template #default><el-button link type="primary" disabled>详情</el-button></template></el-table-column></el-table></el-card></div></template>
<style scoped>.page{padding:4px}.bar{display:flex;justify-content:space-between;align-items:center}.stats{padding:8px 0}.mb{margin-bottom:16px}</style>

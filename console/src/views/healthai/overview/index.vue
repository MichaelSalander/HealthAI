<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { healthAiApi, type AdminOverview } from "@/api/healthai";
defineOptions({ name: "HealthAiOverview" });
const loading = ref(true); const error = ref("");
const data = ref<AdminOverview>({ metrics: { activeCustomers: 0, pendingReports: 0, consultationsToday: 0, monthRevenueFen: 0 }, recentCustomers: [], notices: [] });
const metrics = computed(() => [
  { label: "服务中客户", value: String(data.value.metrics.activeCustomers), note: "来自当前服务关系", color: "#e8792f" },
  { label: "待跟进报告", value: String(data.value.metrics.pendingReports), note: "需要人工确认", color: "#f59e0b" },
  { label: "今日咨询", value: String(data.value.metrics.consultationsToday), note: "来自实际咨询记录", color: "#3b82f6" },
  { label: "本月服务收入", value: `¥${(data.value.metrics.monthRevenueFen / 100).toFixed(2)}`, note: "已支付订单", color: "#8b5cf6" }
]);
const formatTime = (value: string) => value ? new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
onMounted(async () => { try { data.value = await healthAiApi.getOverview(data.value); } catch (e) { error.value = (e as Error).message; } finally { loading.value = false; } });
</script>
<template>
  <div class="health-page" v-loading="loading">
    <el-alert v-if="error" :title="error" type="error" :closable="false" class="mb" />
    <div class="page-head"><div><h2>HealthAI 智能健康管理平台</h2><p>查看真实客户、报告与咨询运营状态</p></div></div>
    <el-row :gutter="16" class="metrics"><el-col v-for="item in metrics" :key="item.label" :span="6"><el-card shadow="never" class="metric-card"><span class="metric-label">{{ item.label }}</span><strong :style="{ color: item.color }">{{ item.value }}</strong><span class="metric-note">{{ item.note }}</span></el-card></el-col></el-row>
    <el-row :gutter="16"><el-col :span="15"><el-card shadow="never"><template #header><div class="card-title">客户健康概览 <el-button link type="primary" @click="$router.push('/healthai/clients')">查看全部</el-button></div></template><el-empty v-if="!data.recentCustomers.length" description="暂无客户资料" /><el-table v-else :data="data.recentCustomers" stripe><el-table-column prop="name" label="客户" /><el-table-column prop="tag" label="主要关注" /><el-table-column label="健康资料"><template #default="{ row }">{{ row.reportCount }} 份报告 · {{ row.observationCount }} 项指标</template></el-table-column><el-table-column prop="status" label="状态"><template #default="{ row }"><el-tag :type="row.status === '服务中' ? 'success' : 'warning'">{{ row.status }}</el-tag></template></el-table-column></el-table></el-card></el-col><el-col :span="9"><el-card shadow="never"><template #header><div class="card-title">待办提醒 <el-badge v-if="data.notices.length" :value="data.notices.length" type="danger" /></div></template><el-empty v-if="!data.notices.length" description="暂无待办提醒" /><el-timeline v-else><el-timeline-item v-for="notice in data.notices" :key="notice.id" :type="notice.type as any" :timestamp="formatTime(notice.time)">{{ notice.title }}</el-timeline-item></el-timeline></el-card></el-col></el-row>
  </div>
</template>
<style scoped>.health-page{padding:4px}.page-head,.card-title{display:flex;align-items:center;justify-content:space-between}.page-head{margin-bottom:18px}h2{margin:0;color:var(--el-text-color-primary)}p{margin:8px 0 0;color:var(--el-text-color-secondary)}.metrics{margin-bottom:16px}.metric-card{min-height:120px;display:flex;flex-direction:column;gap:10px}.metric-label,.metric-note{color:var(--el-text-color-secondary);font-size:13px}.metric-card strong{font-size:28px}.card-title{font-weight:600}.mb{margin-bottom:16px}</style>

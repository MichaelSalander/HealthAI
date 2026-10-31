<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { consultationAdminApi as api } from "../../../api/consultation";

defineOptions({ name: "ConsultantClientHealth" });
const route = useRoute();
const loading = ref(true);
const error = ref("");
const data = ref<Awaited<ReturnType<typeof api.clientHealth>> | null>(null);
const userId = String(route.query.userId || route.params.userId || "u-001");
onMounted(async () => { try { await api.login(); data.value = await api.clientHealth(userId); } catch (e) { error.value = (e as Error).message; ElMessage.error(error.value); } finally { loading.value = false; } });
</script>

<template>
  <div class="page" v-loading="loading">
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <template v-if="data">
      <el-card shadow="never" class="profile"><div class="avatar">{{ data.profile?.gender === '女' ? '女' : '客' }}</div><div><h2>客户 {{ userId }}</h2><p>{{ data.profile?.gender || '未填写性别' }} · {{ data.profile?.birthYear || '未填写出生年份' }} · 已分配客户</p></div></el-card>
      <el-row :gutter="16">
        <el-col :span="16"><el-card shadow="never"><template #header><b>确认健康指标</b></template><el-row :gutter="12"><el-col v-for="item in data.observations" :key="item.id" :span="12"><div class="metric"><span>{{ item.name }}</span><strong>{{ item.value }} {{ item.unit }}</strong><el-tag :type="item.status === '正常' ? 'success' : 'danger'">{{ item.status }}</el-tag><small>参考 {{ item.reference }} · {{ item.measuredAt }}</small></div></el-col></el-row><el-empty v-if="!data.observations.length" description="客户尚未确认健康指标" /></el-card></el-col>
        <el-col :span="8"><el-card shadow="never"><template #header><b>资料状态</b></template><el-descriptions :column="1" border><el-descriptions-item label="报告数">{{ data.reports.length }} 份</el-descriptions-item><el-descriptions-item label="确认指标">{{ data.observations.length }} 项</el-descriptions-item><el-descriptions-item label="AI结果">{{ data.aiReport ? '已生成' : '待生成' }}</el-descriptions-item></el-descriptions></el-card></el-col>
      </el-row>
      <el-card shadow="never" class="mt"><template #header><b>资料时间线</b></template><el-empty v-if="!data.timeline.length" description="暂无资料变更记录" /><el-timeline v-else><el-timeline-item v-for="item in data.timeline" :key="item.id" :timestamp="item.occurredAt" :type="item.type === 'report_error' ? 'danger' : item.type === 'report_review' ? 'warning' : 'primary'"><b>{{ item.title }}</b><span class="timeline-status">{{ item.status }}</span><p>{{ item.detail }}</p></el-timeline-item></el-timeline></el-card>
      <el-card shadow="never" class="mt"><template #header><b>AI 健康摘要</b></template><p>{{ data.aiReport?.consultantInsight || '暂无 AI 摘要，客户确认资料后等待生成。' }}</p><small v-if="data.aiReport">来源版本：{{ data.aiReport.sourceObservationVersion }}</small></el-card>
    </template>
  </div>
</template>

<style scoped>
.page{padding:4px}.profile{display:flex;align-items:center;gap:16px;margin-bottom:16px}.avatar{width:52px;height:52px;border-radius:50%;background:#f8b4a9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px}h2{margin:0 0 8px}p,small{color:var(--el-text-color-secondary)}.metric{border:1px solid var(--el-border-color-lighter);padding:16px;border-radius:8px;margin-bottom:12px}.metric strong{display:block;font-size:22px;margin:8px 0}.metric small{display:block;margin-top:8px}.mt{margin-top:16px}.timeline-status{margin-left:10px;color:var(--el-text-color-secondary)}.el-timeline p{margin:6px 0 0}
</style>

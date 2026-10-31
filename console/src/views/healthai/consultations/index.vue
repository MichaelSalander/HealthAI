<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { consultationAdminApi as api } from "@/api/consultation";
import type { ConsultationConsultant, ConsultationRequestV2 } from "../../../../../src/types/consultation";

defineOptions({ name: "HealthAiConsultations" });
type QueueRow = ConsultationRequestV2 & { selectedConsultantId: string };
const rows = ref<QueueRow[]>([]); const consultants = ref<ConsultationConsultant[]>([]); const loading = ref(true); const error = ref(""); const busy = ref(""); let timer: ReturnType<typeof setInterval> | undefined;
const pending = (row: { status?: string }) => ["queued", "reassigned"].includes(row.status || "");
async function load() {
  try {
    const [queue, directory] = await Promise.all([api.requestQueue(), api.directory()]);
    consultants.value = directory.filter(item => item.status === "available" && item.freeConsultEnabled);
    rows.value = queue.requests.map(item => ({ ...item, selectedConsultantId: item.consultantId || consultants.value[0]?.id || "" }));
    error.value = "";
  } catch (e) { error.value = (e as Error).message; }
  finally { loading.value = false; }
}
async function assign(row: QueueRow | Record<string, any>) {
  if (!row.selectedConsultantId) return ElMessage.warning("当前没有可接单的健管师");
  busy.value = row.id;
  try { await api.assignRequest(row.id, row.selectedConsultantId); await load(); ElMessage.success("已完成派单"); }
  catch (e) { ElMessage.error((e as Error).message); }
  finally { busy.value = ""; }
}
async function autoAssign() {
  busy.value = "all";
  try { const result = await api.autoAssignRequests(); await load(); ElMessage.success(`已自动派单 ${result.assignedCount} 个请求`); }
  catch (e) { ElMessage.error((e as Error).message); }
  finally { busy.value = ""; }
}
onMounted(async () => { try { await api.login(); await load(); timer = setInterval(load, 10000); } catch (e) { error.value = (e as Error).message; loading.value = false; } });
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div class="page" v-loading="loading">
    <el-alert v-if="error" :title="error" type="error" :closable="false" class="mb" />
    <el-alert title="自动派单只会分配给在线、可接免费咨询且未达到每日上限的健管师。客户资料与状态来自后端 API。" type="info" :closable="false" class="mb" />
    <el-card shadow="never">
      <template #header><div class="bar"><b>待咨询与派单</b><div><el-button @click="load">刷新</el-button><el-button type="primary" :loading="busy === 'all'" @click="autoAssign">自动派单</el-button></div></div></template>
      <el-empty v-if="!rows.length" description="暂无咨询请求" />
      <el-table v-else :data="rows" stripe>
        <el-table-column prop="userName" label="客户" min-width="120" />
        <el-table-column prop="mode" label="咨询方式" min-width="120" />
        <el-table-column prop="createdAt" label="发起时间" min-width="170"><template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template></el-table-column>
        <el-table-column prop="consultantName" label="健管师" min-width="190"><template #default="{ row }"><template v-if="pending(row)"><el-select v-model="row.selectedConsultantId" placeholder="选择健管师" size="small"><el-option v-for="item in consultants" :key="item.id" :label="`${item.name} · ${item.status === 'available' ? '可接单' : item.status}`" :value="item.id" /></el-select></template><span v-else>{{ row.consultantName || '—' }}</span></template></el-table-column>
        <el-table-column prop="status" label="状态" width="130"><template #default="{ row }"><el-tag :type="pending(row) ? 'warning' : row.status === 'in_progress' ? 'success' : 'info'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="120"><template #default="{ row }"><el-button v-if="pending(row)" link type="primary" :loading="busy === row.id" @click="assign(row)">人工派单</el-button><span v-else class="muted">已进入流程</span></template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>.page{padding:4px}.mb{margin-bottom:16px}.bar{display:flex;align-items:center;justify-content:space-between}.muted{color:var(--el-text-color-secondary)}</style>

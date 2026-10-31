<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { consultationAdminApi as api, type ConsultantClient, type ConsultantClientHealth } from "@/api/consultation";

defineOptions({ name: "HealthAiClients" });
const keyword = ref(""); const statusFilter = ref(""); const rows = ref<ConsultantClient[]>([]); const loading = ref(true); const error = ref(""); const detailVisible = ref(false); const detailLoading = ref(false); const selectedName = ref(""); const detail = ref<ConsultantClientHealth | null>(null);
const filteredRows = computed(() => rows.value.filter(row => (!keyword.value || row.name.includes(keyword.value) || JSON.stringify(row.profile).includes(keyword.value)) && (!statusFilter.value || row.status === statusFilter.value)));
const formatTime = (value: string | null) => value ? new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "暂无记录";
async function load() { try { await api.login(); rows.value = await api.clients(); error.value = ""; } catch (e) { error.value = (e as Error).message; } finally { loading.value = false; } }
async function openDetail(row: ConsultantClient | Record<string, any>) { selectedName.value = String(row.name || "客户"); detailVisible.value = true; detailLoading.value = true; try { detail.value = await api.clientHealth(String(row.id)); } catch (e) { ElMessage.error((e as Error).message); } finally { detailLoading.value = false; } }
onMounted(load);
</script>
<template>
  <div class="health-page">
    <el-alert v-if="error" :title="error" type="error" :closable="false" class="mb" />
    <el-card shadow="never" v-loading="loading">
      <template #header><div class="card-title"><span>客户健康档案</span><el-button @click="load">刷新数据</el-button></div></template>
      <div class="toolbar"><el-input v-model="keyword" clearable placeholder="搜索客户姓名或档案信息" style="width:280px" /><el-select v-model="statusFilter" placeholder="服务状态" clearable style="width:150px"><el-option label="服务中" value="服务中" /><el-option label="待跟进" value="待跟进" /></el-select></div>
      <el-empty v-if="!filteredRows.length" description="暂无已分配客户" />
      <el-table v-else :data="filteredRows" stripe><el-table-column prop="name" label="客户" /><el-table-column label="健康资料"><template #default="{row}">{{ row.observationCount }} 项指标 · {{ row.reportCount }} 份报告</template></el-table-column><el-table-column label="最近动态"><template #default="{row}">{{ formatTime(row.lastActivityAt) }}</template></el-table-column><el-table-column prop="status" label="服务状态"><template #default="{row}"><el-tag :type="row.status === '待跟进' ? 'warning' : 'success'">{{ row.status }}</el-tag></template></el-table-column><el-table-column label="操作"><template #default="{row}"><el-button link type="primary" @click="openDetail(row)">查看档案</el-button></template></el-table-column></el-table>
    </el-card>
    <el-dialog v-model="detailVisible" :title="`${selectedName} · 健康资料`" width="720px"><el-skeleton v-if="detailLoading" :rows="5" animated /><template v-else-if="detail"><el-descriptions :column="2" border><el-descriptions-item label="性别">{{ detail.profile?.gender || '—' }}</el-descriptions-item><el-descriptions-item label="出生年份">{{ detail.profile?.birthYear || '—' }}</el-descriptions-item><el-descriptions-item label="身高">{{ detail.profile?.heightCm ? `${detail.profile.heightCm} cm` : '—' }}</el-descriptions-item><el-descriptions-item label="生活方式">{{ detail.profile?.lifestyle || '—' }}</el-descriptions-item></el-descriptions><h4>最近指标（{{ detail.observations.length }} 项）</h4><el-table :data="detail.observations" size="small"><el-table-column prop="name" label="指标" /><el-table-column prop="value" label="结果" /><el-table-column prop="status" label="状态" /></el-table><h4>AI 工作摘要</h4><el-alert :title="detail.aiReport?.summary || '尚未生成 AI 摘要'" type="info" :closable="false" /></template></el-dialog>
  </div>
</template>
<style scoped>.health-page{padding:4px}.card-title,.toolbar{display:flex;align-items:center;justify-content:space-between}.toolbar{justify-content:flex-start;gap:12px;margin-bottom:16px}.mb{margin-bottom:16px}h4{margin:18px 0 10px}</style>

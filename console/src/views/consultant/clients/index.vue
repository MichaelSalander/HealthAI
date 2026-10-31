<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { consultationConsultantApi as api } from "../../../api/consultation";
import type { ConsultantClient } from "../../../api/consultation";
defineOptions({ name: "ConsultantClients" });
const keyword = ref("");
const statusFilter = ref("");
const clients = ref<ConsultantClient[]>([]); const loading = ref(true); const error = ref("");
const router = useRouter();
const filtered = computed(() => clients.value.filter(item => (!keyword.value || item.name.includes(keyword.value) || JSON.stringify(item.profile).includes(keyword.value)) && (!statusFilter.value || item.status === statusFilter.value)));
const formatTime = (value: string | null) => value ? new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "暂无记录";
onMounted(async () => { try { await api.login(); clients.value = await api.clients() } catch (e) { error.value = (e as Error).message; ElMessage.error(error.value) } finally { loading.value = false } });
</script>
<template><div class="page"><el-alert v-if="error" :title="error" type="error" :closable="false"/><el-card shadow="never" v-loading="loading"><template #header><div class="bar"><b>我的客户</b><span class="muted">仅显示公司已分配给你的客户</span></div></template><div class="toolbar"><el-input v-model="keyword" clearable placeholder="搜索客户姓名或档案信息" style="width:280px"/><el-select v-model="statusFilter" placeholder="客户状态" clearable style="width:140px"><el-option label="服务中" value="服务中"/><el-option label="待跟进" value="待跟进"/></el-select></div><el-table :data="filtered" stripe><el-table-column prop="name" label="客户"/><el-table-column label="健康资料"><template #default="{row}">{{ row.observationCount }} 项指标 · {{ row.reportCount }} 份报告</template></el-table-column><el-table-column label="最近动态"><template #default="{row}">{{ formatTime(row.lastActivityAt) }}</template></el-table-column><el-table-column prop="status" label="状态"><template #default="{row}"><el-tag :type="row.status==='待跟进'?'warning':'success'">{{row.status}}</el-tag></template></el-table-column><el-table-column label="操作"><template #default="{row}"><el-button link type="primary" @click="router.push({ path: '/consultant/client-health', query: { userId: row.id } })">查看档案</el-button></template></el-table-column></el-table></el-card></div></template>
<style scoped>.page{padding:4px}.bar,.toolbar{display:flex;justify-content:space-between;align-items:center}.toolbar{justify-content:flex-start;gap:12px;margin-bottom:16px}</style>

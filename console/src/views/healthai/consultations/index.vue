<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
defineOptions({ name: "HealthAiConsultations" });
const rows = ref([{ id: 1, name: "张小美", type: "免费咨询", time: "今天 14:00", focus: "血糖、体重管理", status: "待分配", consultant: "" }, { id: 2, name: "陈先生", type: "语音咨询", time: "今天 16:30", focus: "慢病管理", status: "待分配", consultant: "" }, { id: 3, name: "王女士", type: "复诊咨询", time: "明天 10:00", focus: "睡眠管理", status: "已分配", consultant: "王雅婷" }]);
const assign = (row: any) => { row.status = "已分配"; row.consultant = "李晓雯"; ElMessage.success(`已将 ${row.name} 派给李晓雯`); };
const autoAssign = () => { rows.value.filter(row => row.status === "待分配").forEach(row => { row.status = "已分配"; row.consultant = "李晓雯"; }); ElMessage.success("已按在线状态与工作量自动派单"); };
</script>
<template><div class="page"><el-alert title="自动派单只会分配给在线、可预约且未达到每日上限的健管师。" type="info" :closable="false" class="mb"/><el-card shadow="never"><template #header><div class="bar"><b>待諮詢與派單</b><el-button type="primary" @click="autoAssign">自动派单</el-button></div></template><el-table :data="rows" stripe><el-table-column prop="name" label="客户"/><el-table-column prop="type" label="咨询类型"/><el-table-column prop="time" label="预约时段"/><el-table-column prop="focus" label="关注领域"/><el-table-column prop="consultant" label="健管师"><template #default="{ row }">{{ row.consultant || '—' }}</template></el-table-column><el-table-column prop="status" label="状态"><template #default="{ row }"><el-tag :type="row.status === '待分配' ? 'warning' : 'success'">{{ row.status }}</el-tag></template></el-table-column><el-table-column label="操作"><template #default="{ row }"><el-button v-if="row.status === '待分配'" link type="primary" @click="assign(row)">派给李晓雯</el-button><el-button v-else link>查看服务</el-button></template></el-table-column></el-table></el-card></div></template>
<style scoped>.page{padding:4px}.mb{margin-bottom:16px}.bar{display:flex;align-items:center;justify-content:space-between}</style>

<script setup lang="ts">
import { ref } from "vue";
defineOptions({ name: "HealthAiClients" });
const keyword = ref("");
const rows = ref([
  { name: "张小美", phone: "138****8888", consultant: "李晓雯", score: 85, status: "服务中", updated: "2024-12-10" },
  { name: "陈先生", phone: "139****1203", consultant: "李晓雯", score: 78, status: "待跟进", updated: "2024-12-09" },
  { name: "王女士", phone: "186****5621", consultant: "王雅婷", score: 91, status: "服务中", updated: "2024-12-08" }
]);
const filteredRows = () => rows.value.filter(row => !keyword.value || row.name.includes(keyword.value) || row.phone.includes(keyword.value));
</script>
<template>
  <div class="health-page">
    <el-card shadow="never">
      <template #header><div class="card-title"><span>客户健康档案</span><el-button type="primary" plain>导出列表</el-button></div></template>
      <div class="toolbar"><el-input v-model="keyword" clearable placeholder="搜索客户姓名或手机号" style="width: 280px" /><el-select placeholder="服务状态" clearable style="width: 150px"><el-option label="服务中" value="服务中" /><el-option label="待跟进" value="待跟进" /></el-select></div>
      <el-table :data="filteredRows()" stripe>
        <el-table-column prop="name" label="客户" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="consultant" label="主责健管师" />
        <el-table-column prop="score" label="健康评分" />
        <el-table-column prop="status" label="服务状态"><template #default="{ row }"><el-tag :type="row.status === '待跟进' ? 'warning' : 'success'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="updated" label="最近更新" />
        <el-table-column label="操作"><template #default><el-button link type="primary">查看档案</el-button><el-button link>咨询记录</el-button></template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
<style scoped>
.health-page { padding: 4px; }.card-title, .toolbar { display: flex; align-items: center; justify-content: space-between; }.toolbar { justify-content: flex-start; gap: 12px; margin-bottom: 16px; }
</style>

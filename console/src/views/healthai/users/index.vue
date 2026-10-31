<script setup lang="ts">
import { ref } from "vue";
defineOptions({ name: "HealthAiUsers" });
const keyword = ref("");
const rows = ref([{name:'张小美',phone:'138****8888',role:'客户',consultant:'李晓雯',status:'正常',created:'2024-10-10'},{name:'陈先生',phone:'139****1203',role:'客户',consultant:'李晓雯',status:'正常',created:'2024-10-12'},{name:'李晓雯',phone:'138****2233',role:'健管师',consultant:'-',status:'已认证',created:'2024-09-01'}]);
const filtered = () => rows.value.filter(row => !keyword.value || row.name.includes(keyword.value) || row.phone.includes(keyword.value));
</script>
<template><div class="page"><el-card shadow="never"><template #header><div class="bar"><b>A-01 用户与客户</b><el-button type="primary">新增用户</el-button></div></template><div class="toolbar"><el-input v-model="keyword" clearable placeholder="姓名或手机号" style="width:260px"/><el-select placeholder="用户角色" clearable style="width:140px"><el-option label="客户" value="客户"/><el-option label="健管师" value="健管师"/></el-select></div><el-table :data="filtered()" stripe><el-table-column prop="name" label="姓名"/><el-table-column prop="phone" label="手机号"/><el-table-column prop="role" label="角色"/><el-table-column prop="consultant" label="主责健管师"/><el-table-column prop="created" label="注册时间"/><el-table-column prop="status" label="状态"><template #default="{row}"><el-tag type="success">{{row.status}}</el-tag></template></el-table-column><el-table-column label="操作"><template #default><el-button link type="primary">查看</el-button><el-button link>分配健管师</el-button></template></el-table-column></el-table></el-card></div></template>
<style scoped>.page{padding:4px}.bar,.toolbar{display:flex;justify-content:space-between;align-items:center}.toolbar{justify-content:flex-start;gap:12px;margin-bottom:16px}</style>

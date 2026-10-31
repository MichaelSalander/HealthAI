<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
defineOptions({ name: "ConsultantSchedule" });
const status = ref("可预约");
const dailyLimit = ref(8);
const slots = ref([
  { time: "今天 14:00", enabled: true, booked: 1 },
  { time: "今天 16:30", enabled: true, booked: 2 },
  { time: "明天 10:00", enabled: true, booked: 0 },
  { time: "明天 15:00", enabled: false, booked: 0 }
]);
const save = () => ElMessage.success("服务状态与预约时段已保存");
</script>
<template>
  <div class="page">
    <el-alert title="状态为不在线、暂停接单或已额满时，客户端不会显示立即咨询。" type="warning" :closable="false" class="mb" />
    <el-card shadow="never" class="mb"><template #header><b>当前服务状态</b></template><el-radio-group v-model="status"><el-radio-button label="在线" /><el-radio-button label="可预约" /><el-radio-button label="忙碌" /><el-radio-button label="已额满" /><el-radio-button label="暂停接单" /></el-radio-group><el-form inline class="form"><el-form-item label="每日上限"><el-input-number v-model="dailyLimit" :min="1" :max="30" /></el-form-item><el-form-item label="免费咨询"><el-switch :model-value="true" /></el-form-item></el-form></el-card>
    <el-card shadow="never"><template #header><div class="bar"><b>可预约时段</b><el-button type="primary" plain @click="save">保存设置</el-button></div></template><el-table :data="slots"><el-table-column prop="time" label="时段" /><el-table-column prop="booked" label="已预约" width="100" /><el-table-column label="开放预约" width="120"><template #default="{ row }"><el-switch v-model="row.enabled" /></template></el-table-column><el-table-column label="状态"><template #default="{ row }"><el-tag :type="row.enabled ? (row.booked ? 'warning' : 'success') : 'info'">{{ row.enabled ? (row.booked ? '部分预约' : '可预约') : '关闭' }}</el-tag></template></el-table-column></el-table></el-card>
  </div>
</template>
<style scoped>.page{padding:4px}.mb{margin-bottom:16px}.bar{display:flex;align-items:center;justify-content:space-between}.form{margin-top:20px}.form :deep(.el-form-item){margin-bottom:0}</style>

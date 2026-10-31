<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
defineOptions({ name: "HealthAiCenters" });
const centers = ref([{ name: "华康体检中心（静安店）", address: "上海市静安区南京西路 888 号", items: "血常规、血糖、血脂、肝功能", enabled: true }, { name: "瑞慈健康体检中心（浦东店）", address: "上海市浦东新区世纪大道 100 号", items: "基础血液检查套餐", enabled: true }]);
const add = () => { centers.value.push({ name: "新体检中心", address: "待填写地址", items: "待配置检查项目", enabled: false }); ElMessage.success("已新增体检中心草稿"); };
</script>
<template><div class="page"><el-card shadow="never"><template #header><div class="bar"><b>指定体检中心</b><el-button type="primary" @click="add">新增体检中心</el-button></div></template><el-table :data="centers"><el-table-column prop="name" label="名称"/><el-table-column prop="address" label="地址"/><el-table-column prop="items" label="推荐检查项目"/><el-table-column label="启用"><template #default="{ row }"><el-switch v-model="row.enabled"/></template></el-table-column><el-table-column label="操作"><template #default><el-button link type="primary">编辑</el-button><el-button link>查看预约</el-button></template></el-table-column></el-table></el-card></div></template>
<style scoped>.page{padding:4px}.bar{display:flex;align-items:center;justify-content:space-between}</style>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { healthAiApi, type HealthCheckCenter } from "@/api/healthai";
defineOptions({ name: "HealthAiCenters" });
const fallback: HealthCheckCenter[] = [{ id: "hc-001", name: "华康体检中心（静安店）", address: "上海市静安区南京西路 888 号", items: ["血常规", "血糖", "血脂", "肝功能"], enabled: true, sort: 1 }, { id: "hc-002", name: "瑞慈健康体检中心（浦东店）", address: "上海市浦东新区世纪大道 100 号", items: ["基础血液检查套餐"], enabled: true, sort: 2 }];
const centers = ref<HealthCheckCenter[]>([]);
const saving = ref(false);
const load = async () => { centers.value = await healthAiApi.listHealthCenters(fallback); };
const add = () => { centers.value.push({ id: "hc-" + Date.now(), name: "新体检中心", address: "待填写地址", items: ["待配置检查项目"], enabled: false, sort: centers.value.length + 1 }); ElMessage.success("已新增体检中心草稿"); };
const setItems = (row: any, value: string) => { row.items = value.split(/[，,]/).map(item => item.trim()).filter(Boolean); };
const save = async () => { saving.value = true; try { centers.value = await healthAiApi.saveHealthCenters(centers.value); ElMessage.success("体检中心配置已保存"); } catch (error) { ElMessage.error((error as Error).message); } finally { saving.value = false; } };
onMounted(load);
</script>
<template><div class="page"><el-card shadow="never"><template #header><div class="bar"><b>指定体检中心</b><div><el-button @click="add">新增体检中心</el-button><el-button type="primary" :loading="saving" @click="save">保存配置</el-button></div></div></template><el-table :data="centers" v-loading="!centers.length"><el-table-column prop="name" label="名称"><template #default="{ row }"><el-input v-model="row.name"/></template></el-table-column><el-table-column prop="address" label="地址"><template #default="{ row }"><el-input v-model="row.address"/></template></el-table-column><el-table-column label="推荐检查项目"><template #default="{ row }"><el-input :model-value="row.items.join('，')" placeholder="用逗号分隔" @update:model-value="setItems(row, $event)"/></template></el-table-column><el-table-column label="启用" width="90"><template #default="{ row }"><el-switch v-model="row.enabled"/></template></el-table-column></el-table></el-card></div></template>
<style scoped>.page{padding:4px}.bar{display:flex;align-items:center;justify-content:space-between}</style>

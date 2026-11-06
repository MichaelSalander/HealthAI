<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { healthAiApi, type ConsultantCategory } from "@/api/healthai";
defineOptions({ name: "HealthAiConsultants" });
const categories = ref<ConsultantCategory[]>([]); const loading = ref(true); const error = ref("");
onMounted(async () => { try { categories.value = await healthAiApi.listConsultantCategories([]); } catch (e) { error.value = (e as Error).message; } finally { loading.value = false; } });
const add = () => categories.value.push({ id: `cat-${Date.now()}`, name: "新分类", count: 0, enabled: false, sort: categories.value.length + 1 });
const save = async () => { try { categories.value = await healthAiApi.saveConsultantCategories(categories.value); ElMessage.success("分类已保存，客户端目录已同步"); } catch (e) { ElMessage.error((e as Error).message); } };
</script>
<template>
  <div class="page"><el-alert v-if="error" :title="error" type="error" :closable="false" class="mb" /><el-card shadow="never" v-loading="loading"><template #header><div class="bar"><b>健管师分类</b><div><el-button @click="add">新增分类</el-button><el-button type="primary" @click="save">保存配置</el-button></div></div></template><el-alert title="分类由平台统一维护，客户端与健管师目录读取启用中的分类。" type="info" :closable="false" class="mb" /><el-empty v-if="!categories.length" description="暂无分类" /><el-table v-else :data="categories"><el-table-column label="分类名称" min-width="220"><template #default="{row}"><el-input v-model="row.name" /></template></el-table-column><el-table-column prop="count" label="健管师数量" width="130" /><el-table-column label="排序" width="130"><template #default="{row}"><el-input-number v-model="row.sort" :min="1" /></template></el-table-column><el-table-column label="启用" width="110"><template #default="{row}"><el-switch v-model="row.enabled" /></template></el-table-column></el-table></el-card><el-card shadow="never" class="cert"><template #header><b>认证审核</b></template><el-empty description="目前没有待审核的认证资料" /></el-card></div>
</template>
<style scoped>.page{padding:4px}.bar{display:flex;justify-content:space-between;align-items:center}.mb{margin-bottom:16px}.cert{margin-top:16px}</style>

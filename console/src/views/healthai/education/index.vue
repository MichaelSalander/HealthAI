<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
defineOptions({ name: "HealthAiEducation" });
const articles = ref([{ title: "认识血糖与日常饮食", category: "血糖管理", status: "已发布", updated: "今天 09:20" }, { title: "如何看懂体检报告中的血脂指标", category: "指标解读", status: "已发布", updated: "昨天 16:00" }, { title: "睡眠、压力与体重管理", category: "生活方式", status: "草稿", updated: "12月08日" }]);
const publish = (item: any) => { item.status = item.status === "已发布" ? "草稿" : "已发布"; ElMessage.success(`已${item.status === '已发布' ? '发布' : '保存为草稿'}`); };
</script>
<template><div class="page"><el-card shadow="never"><template #header><div class="bar"><b>卫教内容</b><el-button type="primary" plain>新增文章</el-button></div></template><el-table :data="articles"><el-table-column prop="title" label="标题"/><el-table-column prop="category" label="分类"/><el-table-column prop="status" label="状态"><template #default="{ row }"><el-tag :type="row.status === '已发布' ? 'success' : 'info'">{{ row.status }}</el-tag></template></el-table-column><el-table-column prop="updated" label="更新时间"/><el-table-column label="操作"><template #default="{ row }"><el-button link type="primary">编辑</el-button><el-button link @click="publish(row)">{{ row.status === '已发布' ? '下架' : '发布' }}</el-button></template></el-table-column></el-table></el-card></div></template>
<style scoped>.page{padding:4px}.bar{display:flex;align-items:center;justify-content:space-between}</style>

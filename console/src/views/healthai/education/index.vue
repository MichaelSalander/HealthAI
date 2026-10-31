<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { healthAiApi, type EducationArticle } from "@/api/healthai";

defineOptions({ name: "HealthAiEducation" });
const articles = ref<EducationArticle[]>([]);
const loading = ref(true);
const error = ref("");
const dialogVisible = ref(false);
const editing = ref<EducationArticle | null>(null);

onMounted(async () => {
  try { articles.value = await healthAiApi.listEducationArticles([]); }
  catch (e) { error.value = (e as Error).message; }
  finally { loading.value = false; }
});
function openCreate() {
  editing.value = { id: `edu-${Date.now()}`, title: "", category: "指标解读", summary: "", body: "", status: "draft", updatedAt: new Date().toISOString(), sort: articles.value.length + 1 };
  dialogVisible.value = true;
}
function openEdit(article: any) { editing.value = { ...article }; dialogVisible.value = true; }
function toggleStatus(article: any) { article.status = article.status === "published" ? "draft" : "published"; }
async function save() {
  if (!editing.value?.title.trim() || !editing.value.body.trim()) { ElMessage.warning("请填写标题和正文"); return; }
  const next = articles.value.filter(item => item.id !== editing.value!.id);
  next.push(editing.value);
  try { articles.value = await healthAiApi.saveEducationArticles(next); dialogVisible.value = false; ElMessage.success("卫教内容已保存并同步客户端"); }
  catch (e) { ElMessage.error((e as Error).message); }
}
async function saveStatus(article: any) {
  try { articles.value = await healthAiApi.saveEducationArticles(articles.value); ElMessage.success(article.status === "published" ? "文章已发布" : "文章已保存为草稿"); }
  catch (e) { ElMessage.error((e as Error).message); }
}
</script>

<template>
  <div class="page">
    <el-alert v-if="error" :title="error" type="error" :closable="false" class="mb" />
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <div class="bar"><div><b>卫教内容</b><span class="hint">客户端只展示已发布文章</span></div><el-button type="primary" @click="openCreate">新增文章</el-button></div>
      </template>
      <el-empty v-if="!articles.length" description="暂无卫教内容，请新增第一篇文章" />
      <el-table v-else :data="articles" row-key="id">
        <el-table-column prop="title" label="标题" min-width="220" />
        <el-table-column prop="category" label="分类" width="130" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'published' ? 'success' : 'info'">{{ row.status === 'published' ? '已发布' : '草稿' }}</el-tag></template></el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="190" />
        <el-table-column label="操作" width="180"><template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><el-button link @click="toggleStatus(row); saveStatus(row)">{{ row.status === 'published' ? '下架' : '发布' }}</el-button></template></el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="编辑卫教文章" width="680px">
      <el-form v-if="editing" label-width="82px">
        <el-form-item label="标题"><el-input v-model="editing.title" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="editing.category" placeholder="例如：指标解读" /></el-form-item>
        <el-form-item label="摘要"><el-input v-model="editing.summary" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="正文"><el-input v-model="editing.body" type="textarea" :rows="8" /></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="editing.status"><el-radio value="draft">草稿</el-radio><el-radio value="published">发布</el-radio></el-radio-group></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { padding: 4px; }
.bar { display: flex; align-items: center; justify-content: space-between; }
.hint { margin-left: 12px; color: #909399; font-size: 12px; }
.mb { margin-bottom: 16px; }
</style>

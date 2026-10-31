<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { onMounted } from "vue";
import { healthAiApi, type ContentSettings, type HomeEntry } from "@/api/healthai";
defineOptions({ name: "HealthAiContent" });
const active = ref("home");
const settings = ref<ContentSettings>({ companyTitle: "健康，从理解自己开始", companySubtitle: "AI 健康分析 · 真人健康管理 · 长期陪伴", companyPhilosophy: "我们帮助用户把分散的体检报告、日常记录与健康服务连接起来。", privacyTitle: "数据与隐私", privacyDescription: "健康资料仅在获得授权的范围内用于分析与健康管理服务。", resultDisclaimer: "以上为基础健康结果，仅供参考，不作为医疗诊断或治疗建议。", resultConsultationTitle: "建议你咨询健康管理师", resultConsultationDescription: "获取专业的分析解读和个性化建议。", metricExplanations: [] });
const items = ref<HomeEntry[]>([
  { id: 'upload', title: "上传体检报告", subtitle: "AI 帮你初步分析", route: '/pages/report/index', sort: 1, enabled: true },
  { id: 'manual', title: "手动录入数据", subtitle: "记录日常健康", route: '/pages/health/manual', sort: 2, enabled: true },
  { id: 'report', title: "查看健康报告", subtitle: "历史数据管理", route: '/pages/report/index', sort: 3, enabled: true },
  { id: 'consultant', title: "找健康管理师", subtitle: "专业解读与指导", route: '/pages/consultants/index', sort: 4, enabled: true }
]);
onMounted(async () => { items.value = await healthAiApi.listHomeEntries(items.value); settings.value = await healthAiApi.listContentSettings(settings.value); });
const addMetric = () => settings.value.metricExplanations.push({ code: `metric-${Date.now()}`, name: "新指标", explanation: "", enabled: true, sort: settings.value.metricExplanations.length + 1 });
const save = async () => { if (active.value === "home") items.value = await healthAiApi.saveHomeEntries(items.value); else settings.value = await healthAiApi.saveContentSettings(settings.value); ElMessage.success("配置已保存，C 端将读取最新内容"); };
</script>
<template>
  <div class="health-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-title"><span>内容与首页配置</span><el-button type="primary" @click="save">保存配置</el-button></div>
      </template>
      <el-tabs v-model="active">
        <el-tab-pane label="首页入口" name="home">
          <el-alert title="以下配置会同步到 C 端首页，第一阶段使用 API 持久化。" type="info" :closable="false" class="mb" />
          <el-table :data="items">
            <el-table-column label="入口名称"><template #default="{ row }"><el-input v-model="row.title" /></template></el-table-column>
            <el-table-column label="副标题"><template #default="{ row }"><el-input v-model="row.subtitle" /></template></el-table-column>
            <el-table-column prop="sort" label="排序" width="120"><template #default="{ row }"><el-input-number v-model="row.sort" :min="1" /></template></el-table-column>
            <el-table-column label="启用" width="100"><template #default="{ row }"><el-switch v-model="row.enabled" /></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="公司介绍" name="company">
          <el-form label-width="120px">
            <el-form-item label="品牌主标题"><el-input v-model="settings.companyTitle" /></el-form-item>
            <el-form-item label="品牌副标题"><el-input v-model="settings.companySubtitle" /></el-form-item>
            <el-form-item label="公司理念"><el-input v-model="settings.companyPhilosophy" type="textarea" :rows="5" /></el-form-item>
            <el-form-item label="隐私标题"><el-input v-model="settings.privacyTitle" /></el-form-item>
            <el-form-item label="隐私说明"><el-input v-model="settings.privacyDescription" type="textarea" :rows="3" /></el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="健康结果文案" name="result">
          <el-form label-width="120px">
            <el-form-item label="结果说明"><el-input v-model="settings.resultDisclaimer" type="textarea" :rows="5" /></el-form-item>
            <el-form-item label="咨询标题"><el-input v-model="settings.resultConsultationTitle" /></el-form-item>
            <el-form-item label="咨询引导"><el-input v-model="settings.resultConsultationDescription" /></el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="指标基础解释" name="metrics">
          <div class="metric-head"><span>客户端显示基础解释，不替代医疗诊断。</span><el-button @click="addMetric">新增指标</el-button></div>
          <el-table :data="settings.metricExplanations">
            <el-table-column label="指标名称" min-width="190"><template #default="{ row }"><el-input v-model="row.name" /></template></el-table-column>
            <el-table-column label="代码" width="160"><template #default="{ row }"><el-input v-model="row.code" /></template></el-table-column>
            <el-table-column label="基础解释" min-width="320"><template #default="{ row }"><el-input v-model="row.explanation" /></template></el-table-column>
            <el-table-column label="排序" width="110"><template #default="{ row }"><el-input-number v-model="row.sort" :min="1" /></template></el-table-column>
            <el-table-column label="启用" width="90"><template #default="{ row }"><el-switch v-model="row.enabled" /></template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
<style scoped>.health-page{padding:4px}.card-title{display:flex;justify-content:space-between;align-items:center}.mb{margin-bottom:16px}.metric-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;color:var(--el-text-color-secondary)}</style>

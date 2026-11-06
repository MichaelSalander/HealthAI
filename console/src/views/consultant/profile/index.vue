<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { ConsultationConsultant } from "../../../../../src/types/consultation";
import type { ConsultantCertificate } from "@/api/consultation";
import { consultationAdminApi } from "@/api/consultation";

defineOptions({ name: "ConsultantProfile" });
const loading = ref(true), saving = ref(false), uploading = ref(false), error = ref("");
const consultant = ref<ConsultationConsultant | null>(null);
const certificates = ref<ConsultantCertificate[]>([]);
const form = reactive({ phone: "", intro: "", categories: [] as string[] });
const categoryOptions = ["慢病管理", "运动营养", "体重管理", "睡眠管理", "女性健康", "心理压力"];

async function load() {
  loading.value = true;
  try {
    await consultationAdminApi.login();
    const directory = await consultationAdminApi.directory();
    const current = directory.find(item => item.id === "c-101") || directory[0];
    if (!current) throw new Error("暂时没有可用的健管师资料");
    consultant.value = current; form.phone = current.phone || ""; form.intro = current.intro || ""; form.categories = [...(current.categories || [])];
    certificates.value = await consultationAdminApi.certificates(current.id);
  } catch (e) { error.value = (e as Error).message; } finally { loading.value = false; }
}
async function save() {
  if (!consultant.value) return;
  saving.value = true;
  try { consultant.value = await consultationAdminApi.save({ ...consultant.value, phone: form.phone.trim(), intro: form.intro.trim(), categories: form.categories }); ElMessage.success("资料已保存"); }
  catch (e) { ElMessage.error((e as Error).message); } finally { saving.value = false; }
}
function readFile(file: File) {
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) { ElMessage.error("仅支持 JPG、PNG、PDF"); return; }
  if (file.size > 10 * 1024 * 1024) { ElMessage.error("文件不能超过 10MB"); return; }
  uploading.value = true; const reader = new FileReader();
  reader.onload = async () => {
    try { const result = String(reader.result || ""); const fileBase64 = result.includes(",") ? result.slice(result.indexOf(",") + 1) : result; const item = await consultationAdminApi.uploadCertificate({ consultantId: consultant.value?.id, fileName: file.name, mimeType: file.type, sizeBytes: file.size, fileBase64 }); certificates.value = [item, ...certificates.value]; ElMessage.success("认证材料已上传"); }
    catch (e) { ElMessage.error((e as Error).message); } finally { uploading.value = false; }
  };
  reader.onerror = () => { uploading.value = false; ElMessage.error("文件读取失败，请重试"); }; reader.readAsDataURL(file);
}
onMounted(load);
</script>

<template>
  <div class="page">
    <el-card v-loading="loading" shadow="never">
      <template #header><div class="header"><b>我的认证资料</b><span class="muted">平台统一安排客户与咨询时段</span></div></template>
      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
      <el-form v-if="consultant" :model="form" label-width="120px" class="form">
        <el-form-item label="姓名"><el-input :model-value="consultant.name" disabled /></el-form-item>
        <el-form-item label="当前等级"><el-input :model-value="consultant.level" disabled /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.phone" placeholder="请输入联系电话" /></el-form-item>
        <el-form-item label="擅长领域"><el-checkbox-group v-model="form.categories"><el-checkbox v-for="item in categoryOptions" :key="item" :label="item">{{ item }}</el-checkbox></el-checkbox-group></el-form-item>
        <el-form-item label="个人介绍"><el-input v-model="form.intro" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="介绍你的服务经验与擅长方向" /></el-form-item>
        <el-form-item label="服务状态"><el-tag :type="consultant.status === 'available' ? 'success' : 'info'">{{ consultant.status === 'available' ? '在线接待中' : consultant.status === 'offline' ? '暂时离线' : '已额满' }}</el-tag><span class="hint">状态、名额和时段由平台统一安排</span></el-form-item>
        <el-form-item><el-button type="primary" :loading="saving" @click="save">保存资料</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="certificate-card">
      <template #header><b>认证材料</b></template>
      <el-upload :show-file-list="false" :auto-upload="false" accept=".jpg,.jpeg,.png,.pdf" @change="file => file.raw && readFile(file.raw)"><el-button :loading="uploading">上传证书</el-button></el-upload>
      <div class="hint">支持 JPG、PNG、PDF，单个文件不超过 10MB。</div>
      <el-empty v-if="!certificates.length" description="暂未上传认证材料" />
      <el-table v-else :data="certificates" class="cert-table"><el-table-column prop="fileName" label="文件名" /><el-table-column prop="createdAt" label="上传时间" /></el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page{padding:4px}.header{display:flex;align-items:center;gap:16px}.muted,.hint{color:var(--el-text-color-secondary);font-size:13px}.form{max-width:820px;margin-top:20px}.hint{margin-left:14px}.certificate-card{margin-top:16px}.cert-table{margin-top:18px}
</style>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { consultationAdminApi as api, type ConsultantInsight } from "../../../api/consultation";

defineOptions({ name: "ConsultantInsights" });
const tab = ref<'pending' | 'reviewed'>('pending');
const items = ref<ConsultantInsight[]>([]);
const loading = ref(true);
const error = ref("");
const pending = computed(() => items.value.filter(item => item.status === 'pending'));
const reviewed = computed(() => items.value.filter(item => item.status !== 'pending'));
onMounted(async () => { try { await api.login(); items.value = await api.insights(); } catch (e) { error.value = (e as Error).message; } finally { loading.value = false; } });
async function review(item: ConsultantInsight, status: 'approved' | 'rejected') {
  try { await api.reviewInsight(item.id, status); item.status = status; ElMessage.success(status === 'approved' ? '已采纳并记录审核结果' : '已标记为不适用'); }
  catch (e) { ElMessage.error((e as Error).message); }
}
</script>

<template>
  <div class="page" v-loading="loading">
    <el-alert v-if="error" :title="error" type="error" :closable="false" class="mb" />
    <el-alert title="AI Insight 仅供健管师工作参考，最终建议需由健管师审核后发送给客户。" type="warning" :closable="false" class="mb" />
    <el-tabs v-model="tab">
      <el-tab-pane label="待处理" name="pending">
        <el-empty v-if="!pending.length" description="暂无待审核洞察" />
        <el-card v-for="item in pending" :key="item.id" shadow="never" class="insight">
          <div class="insight-head"><div><b>{{ item.userName }}</b><span> · AI 健康洞察</span></div><el-tag type="warning">待审核</el-tag></div>
          <h3>{{ item.title }}</h3><p>{{ item.body }}</p><small>{{ item.summary }}</small>
          <div class="actions"><el-button type="primary" size="small" @click="review(item, 'approved')">采纳洞察</el-button><el-button size="small" @click="review(item, 'rejected')">标记不适用</el-button></div>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="已审核" name="reviewed">
        <el-empty v-if="!reviewed.length" description="暂无已审核记录" />
        <el-card v-for="item in reviewed" :key="item.id" shadow="never" class="insight"><div class="insight-head"><b>{{ item.userName }} · {{ item.title }}</b><el-tag :type="item.status === 'approved' ? 'success' : 'info'">{{ item.status === 'approved' ? '已采纳' : '不适用' }}</el-tag></div><p>{{ item.body }}</p></el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.page { padding: 4px; }
.mb { margin-bottom: 16px; }
.insight { margin-bottom: 12px; }
.insight-head { display: flex; justify-content: space-between; align-items: center; }
.insight-head span, p, small { color: var(--el-text-color-secondary); }
h3 { margin: 14px 0 8px; }
p { margin: 0 0 8px; line-height: 1.6; }
small { display: block; line-height: 1.5; }
.actions { margin-top: 16px; }
</style>

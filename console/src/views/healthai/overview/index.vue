<script setup lang="ts">
import { ref } from "vue";

defineOptions({ name: "HealthAiOverview" });

const notices = [
  { title: "3 位客户的健康报告待跟进", time: "今天 09:20", type: "warning" },
  { title: "新增 2 条 1V1 咨询消息", time: "今天 08:45", type: "primary" },
  { title: "本周服务满意度 98%", time: "昨天 18:00", type: "success" }
];
const selectedRole = ref("管理员");
</script>

<template>
  <div class="health-page">
    <div class="page-head">
      <div>
        <h2>健康管理工作台</h2>
        <p>今天也一起帮助客户看见健康变化</p>
      </div>
      <el-select v-model="selectedRole" style="width: 140px">
        <el-option label="管理员" value="管理员" />
        <el-option label="健管师" value="健管师" />
      </el-select>
    </div>

    <el-row :gutter="16" class="metrics">
      <el-col v-for="item in [
        { label: '服务中客户', value: '128', note: '+12 本月', color: '#12b8a6' },
        { label: '待跟进报告', value: '12', note: '需要关注', color: '#f59e0b' },
        { label: '今日咨询', value: '26', note: '8 条未读', color: '#3b82f6' },
        { label: '本月服务收入', value: '¥86,920', note: '+18.6%', color: '#8b5cf6' }
      ]" :key="item.label" :span="6">
        <el-card shadow="never" class="metric-card">
          <span class="metric-label">{{ item.label }}</span>
          <strong :style="{ color: item.color }">{{ item.value }}</strong>
          <span class="metric-note">{{ item.note }}</span>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="15">
        <el-card shadow="never">
          <template #header><div class="card-title">客户健康概览 <el-button link type="primary">查看全部</el-button></div></template>
          <el-table :data="[
            { name: '张小美', tag: '血糖偏高', score: 85, status: '待跟进' },
            { name: '陈先生', tag: '体重管理', score: 78, status: '服务中' },
            { name: '王女士', tag: '睡眠管理', score: 91, status: '服务中' }
          ]" stripe>
            <el-table-column prop="name" label="客户" />
            <el-table-column prop="tag" label="主要关注" />
            <el-table-column prop="score" label="健康评分" />
            <el-table-column prop="status" label="状态"><template #default="{ row }"><el-tag :type="row.status === '待跟进' ? 'warning' : 'success'">{{ row.status }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="100"><template #default><el-button link type="primary">查看</el-button></template></el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="9">
        <el-card shadow="never">
          <template #header><div class="card-title">待办提醒 <el-badge :value="3" type="danger" /></div></template>
          <el-timeline>
            <el-timeline-item v-for="notice in notices" :key="notice.title" :type="notice.type as any" :timestamp="notice.time">{{ notice.title }}</el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.health-page { padding: 4px; }
.page-head, .card-title { display: flex; align-items: center; justify-content: space-between; }
.page-head { margin-bottom: 18px; }
h2 { margin: 0; color: var(--el-text-color-primary); }
p { margin: 8px 0 0; color: var(--el-text-color-secondary); }
.metrics { margin-bottom: 16px; }
.metric-card { min-height: 120px; display: flex; flex-direction: column; gap: 10px; }
.metric-label, .metric-note { color: var(--el-text-color-secondary); font-size: 13px; }
.metric-card strong { font-size: 28px; }
.card-title { font-weight: 600; }
</style>

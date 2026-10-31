<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { consultationConsultantApi as api } from "../../../api/consultation";
import type { ConsultationNotice } from "../../../../../src/types/consultation";
defineOptions({ name: "ConsultantNotifications" });
const notices = ref<ConsultationNotice[]>([]); const loading = ref(true); const error = ref(""); let timer: ReturnType<typeof setInterval>;
const formatTime = (value: string) => new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
const load = async () => { try { notices.value = await api.notices(); error.value = "" } catch (e) { error.value = (e as Error).message } finally { loading.value = false } };
const mark = async (item: ConsultationNotice) => { try { await api.read(item.id); item.read = true; ElMessage.success("已标记为已读") } catch (e) { ElMessage.error((e as Error).message) } };
const markAll = async () => { for (const item of notices.value.filter(item => !item.read)) await mark(item) };
onMounted(async () => { await api.login(); await load(); timer = setInterval(load, 5000) }); onUnmounted(() => clearInterval(timer));
</script>
<template><div class="page"><el-alert v-if="error" :title="error" type="error" :closable="false"/><el-card shadow="never" v-loading="loading"><template #header><div class="bar"><b>提醒通知</b><el-button link type="primary" @click="markAll">全部标记已读</el-button></div></template><el-empty v-if="!notices.length" description="暂无通知"/><div v-for="item in notices" :key="item.id" class="notice" :class="{ unread: !item.read }"><div class="dot"/><div class="content"><b>{{ item.title }}</b><p>{{ item.resourceType === 'consultation_request' ? '有新的客户配对，请进入工作台及时处理。' : item.resourceType === 'conversation' ? '客户在咨询房间发送了新消息。' : '请进入对应工作台查看详情。' }}</p><small>{{ formatTime(item.createdAt) }}</small></div><el-button v-if="!item.read" link type="primary" @click="mark(item)">标记已读</el-button></div></el-card></div></template>
<style scoped>.page{padding:4px}.bar{display:flex;align-items:center;justify-content:space-between}.notice{display:flex;align-items:flex-start;gap:12px;padding:18px 0;border-bottom:1px solid var(--el-border-color-lighter)}.notice:last-child{border-bottom:0}.dot{width:8px;height:8px;margin-top:7px;border-radius:50%;background:transparent}.unread .dot{background:#d96b2b}.content{flex:1}.content b{color:var(--el-text-color-primary)}p{margin:7px 0;color:var(--el-text-color-regular)}small{color:var(--el-text-color-secondary)}</style>

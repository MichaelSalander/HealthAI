<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { consultationAdminApi } from "@/api/consultation";
import type { ConsultationMessage, ConsultationRoom } from "../../../../../src/types/consultation";
defineOptions({ name: "ConsultantConsultation" });
const rooms = ref<ConsultationRoom[]>([]);
const selected = ref(0);
const messages = ref<ConsultationMessage[]>([]);
const error = ref("");
const loading = ref(true);
let timer: ReturnType<typeof setInterval> | undefined;
const currentRoom = () => rooms.value[selected.value];
async function loadMessages() { const room = currentRoom(); messages.value = room ? (await consultationAdminApi.messages(room.id)).items : []; }
async function load() { try { rooms.value = await consultationAdminApi.conversations(); if (selected.value >= rooms.value.length) selected.value = 0; await loadMessages(); error.value = ""; } catch (e) { error.value = (e as Error).message; } finally { loading.value = false; } }
async function selectRoom(index: number) { selected.value = index; await loadMessages(); }
onMounted(async () => { try { await consultationAdminApi.login(); await load(); timer = setInterval(load, 5000); } catch (e) { error.value = (e as Error).message; loading.value = false; } });
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>
<template>
  <div class="page chat-page">
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-card shadow="never" class="conversation" v-loading="loading">
      <template #header><b>咨询与服务记录</b></template>
      <el-empty v-if="!rooms.length" description="暂无真实咨询房间" />
      <div v-for="(item, index) in rooms" :key="item.id" :class="['conversation-item', { active: index === selected }]" @click="selectRoom(index)">
        <b>{{ item.userName }} · {{ item.status === 'in_progress' ? '进行中' : '已结束' }}</b>
        <span>{{ item.consultantName }} · {{ item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleString('zh-CN') : '暂无消息' }}</span>
      </div>
    </el-card>
    <el-card shadow="never" class="chat" v-loading="loading">
      <template #header><div class="chat-head"><b>{{ currentRoom()?.userName || '请选择咨询房间' }}</b><el-tag v-if="currentRoom()" :type="currentRoom()?.status === 'in_progress' ? 'success' : 'info'">{{ currentRoom()?.status === 'in_progress' ? '在线咨询' : '已结束' }}</el-tag></div></template>
      <el-empty v-if="!currentRoom()" description="选择左侧房间查看消息" />
      <div v-else class="messages"><div v-for="item in messages" :key="item.id" :class="['message', item.senderRole === 'customer' ? 'client' : 'me']"><small>{{ item.senderName }}</small><div>{{ item.content }}</div><time>{{ new Date(item.sentAt).toLocaleString('zh-CN') }}</time></div></div>
      <el-alert v-if="currentRoom()" class="readonly" title="管理后台目前为监控与审计视图，消息由客户与健管师双方发送。" type="info" :closable="false" />
    </el-card>
  </div>
</template>
<style scoped>.page{padding:4px;display:flex;gap:16px}.conversation{width:300px;flex:none}.conversation-item{padding:14px;border-bottom:1px solid var(--el-border-color-lighter);cursor:pointer}.conversation-item span{display:block;color:var(--el-text-color-secondary);font-size:12px;margin-top:6px}.conversation-item.active{background:#ecfdf8;border-radius:6px}.chat{flex:1;min-width:0}.chat-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.messages{height:360px;padding:16px;background:#f7f9fb;overflow:auto}.message{max-width:70%;padding:10px 14px;border-radius:10px;margin-bottom:12px}.message.client{background:#fff}.message.me{background:#d8f7ef;margin-left:auto}.message small,.message time{display:block;color:var(--el-text-color-secondary);font-size:12px;margin-bottom:5px}.message time{margin-top:6px;margin-bottom:0}.readonly{margin-top:12px}</style>

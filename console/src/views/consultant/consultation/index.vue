<script setup lang="ts">
import { ref } from "vue";
defineOptions({ name: "ConsultantConsultation" });
const selected = ref(0);
const messages = ref([{from:'client',text:'李老师，我想问一下饮食上有什么建议？'},{from:'me',text:'可以先减少精制糖和高油食物，我会结合你的报告整理一份调整建议。'}]);
const draft = ref('');
const send = () => { if (draft.value.trim()) { messages.value.push({from:'me',text:draft.value}); draft.value=''; } };
</script>
<template><div class="page chat-page"><el-card shadow="never" class="conversation"><template #header><b>咨询与服务记录</b></template><div class="conversation-list"><div v-for="(item,index) in ['张小美 · 未读 2 条','陈先生 · 昨天 16:30','王女士 · 12月08日']" :key="item" :class="['conversation-item',{active:index===selected}]" @click="selected=index"><b>{{item}}</b><span>{{index===0?'血糖饮食咨询':'方案跟进记录'}}</span></div></div></el-card><el-card shadow="never" class="chat"><template #header><div class="chat-head"><b>张小美</b><el-tag type="success">在线</el-tag></div></template><div class="messages"><div v-for="item in messages" :key="item.text" :class="['message',item.from]">{{item.text}}</div></div><div class="composer"><el-input v-model="draft" placeholder="输入回复内容" @keyup.enter="send"/><el-button type="primary" @click="send">发送</el-button></div></el-card></div></template>
<style scoped>.page{padding:4px;display:flex;gap:16px}.conversation{width:300px;flex:none}.conversation-item{padding:14px;border-bottom:1px solid var(--el-border-color-lighter);cursor:pointer}.conversation-item span{display:block;color:var(--el-text-color-secondary);font-size:12px;margin-top:6px}.conversation-item.active{background:#ecfdf8;border-radius:6px}.chat{flex:1}.chat-head,.composer{display:flex;align-items:center;justify-content:space-between;gap:12px}.messages{height:360px;padding:16px;background:#f7f9fb;overflow:auto}.message{max-width:70%;padding:10px 14px;border-radius:10px;margin-bottom:12px}.message.client{background:#fff}.message.me{background:#d8f7ef;margin-left:auto}.composer{margin-top:16px}</style>

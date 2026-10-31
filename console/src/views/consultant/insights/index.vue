<script setup lang="ts">
import { ref } from "vue";
defineOptions({ name: "ConsultantInsights" });
const tab = ref('待处理');
const approve = (message: string) => ElMessage.success(message);
import { ElMessage } from "element-plus";
</script>
<template><div class="page"><el-alert title="AI Insight 仅供健管师工作参考，最终建议需由健管师审核后发送给客户。" type="warning" :closable="false" class="mb"/><el-tabs v-model="tab"><el-tab-pane label="待处理" name="待处理"><el-card v-for="item in [{name:'张小美',title:'血糖与 LDL-C 需要连续观察',body:'建议结合近 3 个月趋势，优先关注饮食结构与运动频率。'},{name:'陈先生',title:'近期体重下降速度较快',body:'建议复核每日摄入、睡眠与运动记录，必要时调整方案。'}]" :key="item.name" shadow="never" class="insight"><div class="insight-head"><div><b>{{item.name}}</b><span> · AI 健康洞察</span></div><el-tag type="warning">待审核</el-tag></div><h3>{{item.title}}</h3><p>{{item.body}}</p><div><el-button type="primary" size="small" @click="approve('已采纳并加入服务记录')">采纳洞察</el-button><el-button size="small" @click="approve('已标记为不适用')">标记不适用</el-button></div></el-card></el-tab-pane><el-tab-pane label="已采纳" name="已采纳"><el-empty description="暂无已采纳记录"/></el-tab-pane></el-tabs></div></template>
<style scoped>.page{padding:4px}.mb{margin-bottom:16px}.insight{margin-bottom:12px}.insight-head{display:flex;justify-content:space-between}.insight-head span,p{color:var(--el-text-color-secondary)}h3{margin:14px 0 8px}p{margin:0 0 16px}</style>

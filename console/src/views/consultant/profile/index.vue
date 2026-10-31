<script setup lang="ts">
import { ref } from "vue";
defineOptions({ name: "ConsultantProfile" });
const form = ref({name:'李晓雯',level:'高级健康管理师',phone:'138****2233',categories:['慢病管理','运动营养'],intro:'专注慢病管理与生活方式改善，帮助客户建立长期可执行的健康习惯。'});
const save = () => ElMessage.success('Mock 保存成功');
import { ElMessage } from 'element-plus';
</script>
<template><div class="page"><el-card shadow="never"><template #header><b>我的认证资料</b></template><el-form :model="form" label-width="120px" style="max-width:720px"><el-form-item label="姓名"><el-input v-model="form.name"/></el-form-item><el-form-item label="当前等级"><el-input v-model="form.level" disabled/></el-form-item><el-form-item label="联系电话"><el-input v-model="form.phone"/></el-form-item><el-form-item label="擅长领域"><el-checkbox-group v-model="form.categories"><el-checkbox label="慢病管理"/><el-checkbox label="运动营养"/><el-checkbox label="体重管理"/><el-checkbox label="睡眠管理"/></el-checkbox-group></el-form-item><el-form-item label="个人介绍"><el-input v-model="form.intro" type="textarea" :rows="4"/></el-form-item><el-form-item label="认证材料"><el-upload action="#" :auto-upload="false"><el-button>上传证书</el-button><template #tip><div class="el-upload__tip">支持 JPG、PNG、PDF，Mock 上传</div></template></el-upload></el-form-item><el-form-item><el-button type="primary" @click="save">保存资料</el-button></el-form-item></el-form></el-card></div></template>
<style scoped>.page{padding:4px}</style>

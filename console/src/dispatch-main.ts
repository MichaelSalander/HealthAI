import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Dispatch from './views/dispatch/index.vue'
createApp(Dispatch).use(ElementPlus).mount('#app')

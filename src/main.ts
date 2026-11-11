import { createSSRApp } from 'vue'
import App from './App.vue'
import './styles/theme.scss'
import { guardPage } from './services/auth-guard'

export function createApp() {
  const app = createSSRApp(App)
  app.mixin({ onLoad: guardPage, onShow: guardPage })
  return { app }
}

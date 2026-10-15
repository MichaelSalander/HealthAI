import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  base: process.env.GITHUB_PAGES === 'true' ? (process.env.PAGES_BASE_PATH || '/') : '/',
  define: {
    __UNI_FEATURE_UNI_CLOUD__: false,
    __UNI_FEATURE_I18N_LOCALE__: false,
    // uni-app H5 開發模式生成的 pages.json.js 會使用 global；
    // 瀏覽器環境以 globalThis 提供相同語意，避免開發預覽載入後空白。
    global: 'globalThis'
  }
})

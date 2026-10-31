# uni-app 前端開發規則

本目錄包含客戶端與健管師手機端的 uni-app 前端程式。

## 技術規則

- 使用 Vue 3 `<script setup>` 與 TypeScript strict。
- 使用 uni-app API，核心流程不得依賴瀏覽器專屬 API。
- 客戶端與健管師端共用型別、Repository、API Contract 與公共元件。
- 所有未來需要後端的資料，必須經過 `src/services` 或 Repository Layer。
- 頁面不得直接 import Mock Data。

## 角色規則

- `customer`：客戶端首頁與健康服務。
- `consultant`：健管師手機端工作首頁、客戶、諮詢與通知。
- 登入後依角色導向不同首頁。
- 前端隱藏按鈕只改善體驗，真正權限必須由後端再次驗證。

## UI 規則

- 優先參考交付包 UI，不自行重新設計產品風格。
- 使用簡體中文、橘白品牌主題、圓角卡片與消費級 App 風格。
- 適配 H5、Android、iOS 與微信小程序預留能力。
- 必須處理安全區、底部導航、鍵盤與固定操作欄，文字不得被覆蓋。
- 公共 UI 抽到 `src/components`，禁止用單一超大頁面承載多個功能。

## 驗收

- `pnpm run typecheck`
- `pnpm run build:h5`
- 手動測試頁面跳轉、角色入口、Mock 資料變化與手機尺寸。

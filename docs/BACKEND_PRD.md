# HealthAI 後端產品需求文件

版本：v1.0  
日期：2026-10-23  
狀態：後端開發基準文件；本地持久化版本已落地，生產部署仍需完成正式認證與外部 Provider

## 1. 文件目的

本文件定義 HealthAI 後端服務的產品需求、角色權限、核心資料流程、業務規則、通知機制、AI Provider 邊界與驗收標準。

本文件服務三個前端端點：

1. 客戶端 uni-app
2. 健管師手機端 uni-app
3. Admin Web 管理後台

後端必須成為三端唯一可信資料來源。前端不得直接讀取資料庫，也不得把業務規則只寫在 UI 裡。

## 2. 產品目標

### 2.1 核心目標

- 收集並保存客戶健康檔案、體檢報告、健康指標與服務紀錄。
- 讓客戶可以選擇或取得初級健康管理服務。
- 在客戶與健管師配對後，讓健管師能即時收到通知並回覆。
- 讓 Admin 能分配工作、監控服務狀態與調整可配置內容。
- 讓 AI 產生健康結果與健管師專用 Insight，並保留人工審核流程。

### 2.2 第一階段目標

第一階段先完成可運行的後端閉環：

```text
登入
→ 建立健康檔案
→ 上傳體檢報告
→ 產生健康指標
→ 建立諮詢請求
→ 進入平台諮詢佇列
→ Admin 派單或自動派單
→ 健管師手機收到通知
→ 健管師接受並進入諮詢房間
→ 客戶與健管師文字／語音互動
→ 健管師查看授權客戶資料與 AI Insight
→ 結束諮詢並建立服務紀錄
```

目前本地後端已使用 SQLite 持久化資料，不再依賴純記憶體狀態；OCR、AI、支付、推播、語音仍使用 Provider 介面與 Mock Adapter。API Contract 必須與正式 Provider 相容。

## 3. 系統角色

### 3.1 客戶 customer

- 使用微信登入；開發環境提供 Mock Login。
- 建立與修改自己的健康檔案。
- 上傳體檢報告與查看解析狀態。
- 手動錄入健康指標。
- 查看基礎健康結果、異常、趨勢與歷史資料。
- 選擇初級健康管理服務、發起文字或語音諮詢請求。
- 進入等待配對頁，收到配對成功後進入諮詢房間。
- 在諮詢房間內發送文字、接受語音邀請、查看自己的健康摘要與歷史訊息。
- 查看指定體檢中心。
- 查看自己的服務、訂單與訊息。

### 3.2 健管師 consultant

- 使用手機端 uni-app 登入。
- 只能查看被分配或被授權的客戶。
- 設定在線或離線；在線只代表可以及时响应公司分配的咨询。
- 不允许健管师自行设置客户预约时段、名额或免费资格；客户、时段、名额与免费资格由公司后台统一配置和分配。
- 收到新客戶配對、新訊息、語音邀請與 AI Insight 通知。
- 查看客戶健康檔案、報告、指標、趨勢與完整 AI Insight。
- 進入諮詢房間回覆客戶文字訊息、發起語音、查看授權資料並記錄服務狀態。
- 查看自己的服務紀錄與待辦。

### 3.3 Admin admin

- 管理客戶、健管師、分類、等級與認證。
- 手動派單、重新派單與啟用自動派單。
- 監控待諮詢、在線等待、逾時未回覆與服務量。
- 配置首頁、健康分類、指標文案、服務商品與價格。
- 管理指定體檢中心、衛教內容與平台設定。
- 查看支付、退款、佣金、結算與操作審計。

## 4. 核心業務流程

### 4.1 健康資料收集

```text
客戶建立健康檔案
→ 上傳體檢報告或手動錄入
→ 建立資料來源與版本
→ OCR／解析服務產生候選指標
→ 客戶確認或修正
→ 寫入 Observation
→ 觸發 AI 健康結果
```

解析候選不得直接成為正式健康資料。必須保存原始檔案、解析版本、候選值、確認人與確認時間。

### 4.2 初級健康管理與血液檢查

客戶選擇初級健康管理師或免費諮詢時，後端必須檢查：

1. 客戶是否已建立基本健康檔案。
2. 是否有符合規則的血液檢查資料。
3. 客戶是否已存在有效的主責健管師。
4. 是否有可接單、在線且未達上限的健管師。

未完成必要血液檢查時，API 回傳：

```json
{
  "code": "BLOOD_TEST_REQUIRED",
  "message": "请先完成指定血液检查",
  "data": {
    "healthCenterRoute": "/pages/health-centers/index",
    "requiredItems": ["血糖", "血脂", "肝功能"]
  }
}
```

前端依此導向指定體檢中心，不得在頁面自行判斷或硬編碼結果。

### 4.3 客戶諮詢請求、配對與派單

```text
客戶建立諮詢請求
→ ConsultationRequest
→ ConsultationQueue
→ Admin 手動派單或自動派單
→ 建立 UserConsultantRelation
→ 建立 PrimaryAssignment（需要時）
→ 建立 ConsultantNotification
→ WebSocket 即時通知
→ Push Provider 備援通知
→ 健管師接受請求
→ 建立 Conversation
→ 客戶收到配對成功通知並進入諮詢房間
```

自動派單只可選擇：

- 在線。
- 狀態為可預約。
- 時段開放。
- 未達每日上限。
- 等級與服務商品符合。
- 沒有被暫停接單。

派單必須使用交易或等價的併發控制，避免同一個時段重複占用。

### 4.4 諮詢房間、通知與即時回覆

通知事件至少包含：

- 新客戶諮詢請求。
- 客戶完成配對。
- 客戶在線等待。
- 客戶新訊息。
- 客戶發起語音邀請。
- 語音連線失敗或結束。
- AI Insight 生成完成。
- AI Insight 待審核。
- 預約即將開始。
- 回覆逾時提醒。
- 派單逾時或重新派單。

通知狀態：

```text
created → delivered → read → archived
```

諮詢房間必須提供文字聊天作為基礎通道，語音為可選能力。第一階段使用 Mock polling 模擬訊息同步與 Mock Voice Provider 模擬語音連線；正式環境優先使用 WebSocket，斷線時保存訊息，重新連線後補發未讀資料。Push、微信服務通知與短信由 Provider Adapter 實作，不把特定服務商寫死在業務層。

房間內至少包含：

- 房間狀態與雙方在線狀態。
- 文字訊息列表、未讀數、已讀狀態。
- 輸入框、發送、快捷回覆。
- 語音邀請、接受、拒絕、結束與連線失敗狀態。
- 客戶健康摘要與已授權的報告/指標入口。
- 結束諮詢與服務紀錄入口。

### 4.5 AI 分析

客戶端只接收基礎健康結果：

- 整體狀態。
- 指標狀態。
- 異常項目。
- 基礎解釋。
- 歷史趨勢。
- 一般性健康建議。

健管師端可查看完整 AI Insight：

- 風險摘要。
- 指標關聯。
- 建議追問。
- 建議跟進方向。
- 來源資料。
- Provider 版本。
- 信心與警示。

AI Insight 必須有狀態：

```text
generated → pending_review → approved / edited / rejected
```

未經健管師或指定角色審核的專業 Insight，不得直接作為客戶端醫療結論展示。

## 5. 核心狀態機

### 5.1 健管師狀態

```text
offline
online
available
busy
full
paused
```

客戶可發起即時諮詢的必要條件：`online + available + 未超過上限`。

### 5.2 諮詢狀態

```text
requested → queued → assigned → waiting_consultant → in_progress → completed
                    ↘ reassigned
requested / queued / assigned → cancelled / expired
in_progress → waiting_customer → in_progress
```

### 5.3 訊息與語音狀態

```text
Message: sending → sent → delivered → read / failed
VoiceSession: idle → calling → connected → ended / failed
```

### 5.4 預約時段狀態

```text
open
partially_booked
full
closed
expired
```

### 5.5 報告解析狀態

```text
uploaded
processing
parsed
needs_confirmation
confirmed
failed
```

## 6. 後端模組

```text
auth                 登入、Token、角色權限
users                客戶與健管師帳號
health-profile       健康檔案
reports              報告、檔案、解析任務
observations         健康指標與歷史資料
ai                   AI Report、Insight、審核
consultants          健管師資料、分類、認證
assignments          主責分配與諮詢派單
scheduling           公司配置時段、容量與服務狀態
notifications        站內通知、未讀狀態與資源深連結
messaging            ConsultationRequest、Conversation、Message、在線狀態
voice                語音 Provider
orders               商品、方案、訂單
payments             支付、退款、回調
commission            佣金與結算
cms                  首頁、衛教、文案、配置
audit                操作審計與敏感資料記錄
```

## 7. API 原則

- 所有資料透過 API 或 Repository 取得。
- API 使用版本前綴，例如 `/api/v1`。
- 以 JSON 回應，統一包含 `code`、`message`、`data`、`requestId`。
- 金額使用整數分。
- 日期使用 ISO 8601 UTC 儲存，前端依時區展示。
- 所有列表支援分頁、排序與必要篩選。
- 需要權限的 API 必須檢查 Token、角色與資料擁有範圍。
- 寫入操作必須產生審計紀錄。
- Provider 透過介面替換，不直接依賴第三方 SDK。

## 8. 資料安全與隱私

- 健康資料屬敏感資料，資料庫與備份必須加密或使用受控儲存。
- 客戶電話、身份識別資料與報告檔案需按角色脫敏。
- 報告下載使用短期簽名 URL，不暴露永久公開網址。
- 健管師只能查看被授權客戶。
- Admin 的高風險操作需要記錄操作者、時間、來源 IP 與前後值。
- 不在一般日誌輸出完整健康報告、Token、支付密鑰或個人敏感欄位。
- 正式環境不得使用預設 Mock 帳號與固定密碼。

## 9. 非功能需求

- API 服務可獨立部署，不依賴前端開發伺服器。
- 重要寫入操作具備冪等鍵，避免重複建立訂單、預約與派單。
- 通知與 AI 任務使用可重試的背景工作佇列。
- WebSocket 斷線後可重連並補齊未讀事件。
- 需要健康資料的 API 應有明確 timeout 與錯誤處理。
- 所有外部 Provider 必須有 Mock、測試與正式實作三種模式。

## 10. 開發階段與驗收

### B001 基礎與登入

- 建立後端 TypeScript 專案。
- 建立資料庫 migration。
- 完成 customer、consultant、admin 登入。
- 完成 JWT 與角色權限。

驗收：三種角色可登入；越權 API 回傳 403；未登入回傳 401。

實作狀態：本地 API 已完成角色登入、Token 會話、權限與資料庫持久化，並新增小程序 `wx.login → code2Session` 入口；目前 Token 仍為開發環境 Session，正式環境需替換為 JWT／Refresh Token 或平台正式身份服務。

### B002 健康資料

- 建立健康檔案、報告、指標、資料來源與審計資料表。
- 完成報告上傳狀態。
- 完成手動指標寫入與查詢。

驗收：客戶新增資料後，客戶端與健管師端依權限讀到同一筆資料。

### B003 配對、派單與通知

- 完成諮詢請求、佇列、公司配置的容量與健管師在線狀態。
- 完成 Admin 手動派單。
- 完成自動派單。
- 完成健管師手機通知與客戶配對通知。
- 配對通知必須攜帶 `resourceType=conversation` 或 `consultation_request`，點擊後可直達對應頁面。

驗收：客戶建立請求後，健管師手機端收到通知；健管師接受後建立房間；客戶與健管師都能進入同一房間。

### B004 諮詢

- 完成 Conversation、ConversationParticipant、Message、未讀數與在線狀態。
- 完成文字訊息發送、重試、已讀與斷線補發。
- 完成 Mock VoiceSession，保留正式語音 Provider 接口。
- 完成健管師與客戶雙端房間畫面。
- 完成 ServiceRecord 與結束諮詢流程。

驗收：客戶發訊息後，健管師在房間收到訊息；健管師回覆後客戶端可取得訊息；任一方離線重新進入後可以補齊未讀訊息；語音失敗時文字仍可用。

### B005 AI

- 接入 Mock AI Provider。
- 完成 AI Report 與 Insight 審核狀態。
- 完成客戶版與健管師版資料隔離。

驗收：健管師可查看完整 Insight，客戶只能看到基礎結果。

### B006 支付、語音與正式 Provider

- 接入微信登入。
- 接入微信支付與回調驗簽。
- 接入語音 Provider。
- 接入正式 OCR、LLM 與推播 Provider。

驗收：所有 Provider 可在測試環境以 Sandbox 或 Mock 方式替換，且不改動頁面業務流程。

## 11. 必測情境

### 客戶流程

```text
登入
→ 建立健康檔案
→ 上傳報告
→ 確認指標
→ 未完成血液檢查時被導向體檢中心
→ 完成後重新發起初級諮詢
→ 建立諮詢請求
→ 等待公司派單
→ 收到健管師配對結果
→ 進入諮詢房間
→ 發送文字訊息或發起語音
→ 收到健管師回覆
→ 結束諮詢並查看服務紀錄
```

### 健管師流程

```text
登入
→ 設定在線或離線
→ 收到新配對通知
→ 接受諮詢請求並進入房間
→ 查看客戶健康資料
→ 查看 AI Insight
→ 回覆文字或發起語音
→ 結束諮詢並保存服務紀錄
```

### Admin 流程

```text
登入
→ 查看待諮詢儀表板
→ 查看在線等待客戶
→ 手動派單
→ 執行自動派單
→ 查看逾時未回覆
→ 重新派單
→ 查看通知與操作審計
```

## 12. 本文件未定義事項

以下內容需要產品決策後再實作：

- 健管師第 6 項工作內容。
- 公司介紹中的第二項內容。
- 血液檢查的正式項目與有效期限。
- 客戶在線等待與健管師逾時的確切分鐘數。
- 是否保存語音錄音，以及錄音保存期限。
- 正式推播渠道優先順序。
- AI Insight 的醫療責任與審核角色。

在上述規則確認前，實作使用可配置設定，不在前端硬編碼。

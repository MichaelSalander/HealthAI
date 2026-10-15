# 開發與驗證環境

## C 端技術線

本專案使用傳統 `uni-app + Vue 3 + TypeScript`，不是 `uni-app x`。

## 日常開發

```bash
pnpm install
pnpm run doctor
pnpm run dev:h5
```

H5 可以用 VS Code 終端啟動；HBuilderX 不是此模板的必要依賴。

## 真機驗證

本機 HBuilderX 路徑：

```text
D:\09大健康\HBuilderX.5.26.2026091802\HBuilderX
```

使用 HBuilderX 開啟專案，依需求運行到 Android 真機或模擬器。微信小程序則由 HBuilderX 編譯後交給微信開發者工具驗證。

HBuilderX CLI 位於：

```text
D:\09大健康\HBuilderX.5.26.2026091802\HBuilderX\cli.exe
```

HBuilderX 5.26 的 Web 預覽已驗證可用。`vite.config.ts` 內保留瀏覽器對 uni-app 生成程式碼所需的 `global -> globalThis` 開發模式兼容設定；若只執行 `npm install` 而未使用目前的 lockfile，請優先改用 `pnpm install`，避免依賴版本漂移。

## 驗收命令

```bash
pnpm run typecheck
pnpm run build:h5
pnpm run preview:h5
```

## MCP 說明

`@dcloudio/uni-app-x-mcp` 已可選安裝，但它針對 `uni-app x` 元件掃描，不是傳統 uni-app 的編譯器或預覽器；本專案不依賴它才能開發或 build。

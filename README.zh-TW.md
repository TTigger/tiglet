# Tiglet

[English](README.md) | **繁體中文**

一組乾淨、免登入的瀏覽器小工具——同時也是一件個人作品集。
以 Astro + React islands + Tailwind CSS v4 打造，部署於 Vercel。

> 🔗 **線上展示：** [tiglet.vercel.app](https://tiglet.vercel.app)

幾乎所有功能都完全在你的瀏覽器裡執行。沒有帳號、沒有伺服器、沒有追蹤——
你的輸入不會離開你的裝置。（唯一的例外是匯率換算，它會抓取公開匯率；
詳見[隱私](#隱私)。）

## 特色

- **⌘K 命令面板**——在任何頁面快速跳到任何工具
- **淺色／深色模式**——溫暖低對比的主題，一鍵切換（載入不閃爍）
- **最愛與最近使用**——釘選常用工具，顯示在首頁
- **一鍵複製**——每個結果都有複製按鈕
- **可分享的深連結**——工具狀態存在網址裡（例如輪盤的選項）
- **有趣且無障礙的動畫**——骰子 3D 翻滾、輪盤減速、計時環倒數、
  抽獎跑馬燈、2048 方塊彈出；全部尊重 `prefers-reduced-motion`
- **SEO 就緒**——canonical 網址、Open Graph / Twitter 卡片、JSON-LD、自動生成 sitemap
- **可安裝的 PWA**——加到主畫面，離線也能用

## 工具

| 分類 | 工具 | 功能 |
|------|------|------|
| 計算 | **計算機** | 支援鍵盤輸入的四則運算計算機 |
| 計算 | **文字計算機** | 輸入算式文字，立即得到結果（安全解析器——不用 `eval`） |
| 計算 | **換算器** | 單位換算（長度、質量、溫度、含「坪」的面積、體積、速度、資料量）加上即時匯率換算 |
| 計算 | **生活計算** | BMI（衛福部國健署標準）、百分比、折扣、小費分帳——分頁整合 |
| 計算 | **世界時鐘** | 各地即時時間（含日光節約）、時差對照、跨時區時間推算 |
| 計算 | **日期計算器** | 日期差、日期推算（含月底夾住）、可分享的倒數日、工作天計算 |
| 遊戲 | **井字遊戲** | 雙人對戰，或挑戰不會輸的電腦（minimax） |
| 遊戲 | **賓果遊戲** | 經典 5×5 賓果叫號機——抽球、畫記、自動偵測連線、四角與全滿 |
| 遊戲 | **2048** | 滑動合併方塊挑戰 2048；方向鍵、WASD 或滑動操作，附最高分記錄 |
| 遊戲 | **貪食蛇** | 經典款——吃食物變長，別撞牆或咬到自己；鍵盤或螢幕方向鍵 |
| 隨機決定 | **決定輪盤** | 輸入選項轉一下，讓命運決定；選項可透過網址分享 |
| 隨機決定 | **名單抽獎** | 從清單或匯入的 **Excel / CSV** 檔抽出中獎者，支援多輪多獎項 |
| 實用工具 | **計時器** | 倒數計時（含預設值）與碼錶，附進度環與結束提示音 |
| 實用工具 | **擲骰子** | 擲任意數量的 3D d4–d20 骰子（d6 有真實點數面），加總並保留歷史 |
| 實用工具 | **QR 產生器** | 把文字或網址轉成可下載的 QR 碼 |
| 實用工具 | **密碼產生器** | 可自訂、排除易混淆字元的隨機密碼（Web Crypto CSPRNG），附強度計 |
| 實用工具 | **色彩轉換器** | HEX / RGB / HSL 即時互轉，附取色器與一鍵複製 |
| 實用工具 | **圖片取色** | 上傳圖片，取出主要色彩（中位切分法），可複製 HEX/RGB |
| 實用工具 | **圖片工具** | 壓縮、縮放、格式轉換（JPEG / PNG / WebP），附前後對比 |
| 單車 | **齒比計算器** | 公路車傳動計算——齒比表、迴轉速時速對照、A/B 設定比較、變速器容量檢查，設定可透過網址分享 |
| 單車 | **騎乘熱量** | 把碼錶的 kJ 換算成消耗大卡與等值食物，附每小時碳水補給與排汗率補水建議 |
| 單車 | **FTP 訓練區間** | Coggan 功率七區與 Sweet Spot、W/kg 推力比等級參考、心率五區（LTHR 或最大心率法） |
| 單車 | **胎壓建議** | 依體重、胎寬、內胎／無內胎與路面條件計算前後輪建議胎壓（psi＋bar），附 hookless 上限提醒 |
| 單車 | **賽段剖面圖** | 上傳 GPX 生成環法風格賽段剖面圖——自動偵測爬坡並分級（HC～四級）、坡度分布與最陡路段，一鍵下載 PNG；完全在瀏覽器本機解析 |
| 文字 | **字數統計** | 字元、中文字數、英文單字、行數、段落與預估閱讀時間即時統計，中英文分開計算 |
| 文字 | **編解碼工具** | Base64（UTF-8 安全）、URL 百分比編碼、HTML entities 雙向轉換，一鍵複製 |
| 文字 | **文字比對** | 行級 LCS 差異比對加行內字元級高亮——零依賴 |
| 文字 | **JSON 工具** | 格式化、壓縮、驗證（自製掃描器定位錯誤行列）、可摺疊樹狀視圖，點節點複製 JSON path |
| 文字 | **Markdown 工具** | 貼上或上傳 Markdown：即時預覽（DOMPurify 清洗）、可點擊跳轉的標題結構樹、文件統計 |

## 技術棧

- **[Astro](https://astro.build)**——靜態輸出，首頁近乎零 JS
- **React**——每個工具一個互動島嶼，延遲 hydrate（`client:visible` / `client:idle`）
- **Tailwind CSS v4**——透過 `@tailwindcss/vite` 管理設計 token
- **Vitest**——每個工具的核心邏輯都有單元測試（230+ 條）
- **Playwright**——關鍵流程的 E2E 冒煙測試（深連結、Excel/CSV 匯入、⌘K 面板），在 CI 執行
- **[@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)**——建置時生成 sitemap
- **[@vite-pwa/astro](https://vite-pwa-org.netlify.app)**——manifest + service worker
- **Web 平台 API**——圖片/色彩工具用 Canvas、密碼生成用 Web Crypto、時區用 `Intl`
- 前端 **SheetJS**（`xlsx`）、**`qrcode`** 與 **`marked` + `DOMPurify`**（Markdown 預覽），皆為動態載入

## 開始使用

```bash
npm install      # 安裝依賴
npm run dev      # 啟動開發伺服器
npm test         # 執行單元測試
npm run test:e2e # 執行 Playwright E2E（會建置並預覽網站）
npm run build    # 建置靜態輸出到 dist/
npm run preview  # 預覽正式建置
```

每次推送到 master 與每個 pull request 都會在 GitHub Actions 執行單元測試、
正式建置與 E2E 測試（`.github/workflows/ci.yml`）。

需要 Node 22.12+。

## 專案結構

```
src/
├─ data/tools.ts        # 工具註冊表——首頁與搜尋的唯一資料來源
├─ lib/                 # 純邏輯、有單元測試（每個工具引擎一個模組）
│  └─ __tests__/        # Vitest 測試
├─ components/          # 共用 UI（Header、SearchBar、CommandPalette、CopyButton、Tabs…）
├─ tools/               # 每個工具一個 React 島嶼（只放 UI）
├─ pages/
│  ├─ index.astro       # 首頁啟動器
│  └─ tools/            # 每個工具一頁
├─ layouts/BaseLayout.astro   # 共用 <head>：SEO meta、JSON-LD、主題腳本
└─ styles/global.css    # Tailwind + 設計 token（含深色覆寫與動畫）
```

核心原則是**邏輯與 UI 嚴格分離**：每個工具的行為都放在 `src/lib/` 的純模組裡
（容易獨立測試），`src/tools/` 只放 React 呈現層。首頁、搜尋、命令面板
全部由 `src/data/tools.ts` 這個單一註冊表驅動。

部分工具用分頁**整合**以保持首頁精簡——例如換算器（單位＋匯率）、
生活計算（BMI／百分比／折扣／小費）、圖片工具（壓縮／縮放／轉檔）——
共用同一個 `Tabs` 元件。

## 新增工具

1. 在 `src/data/tools.ts` 加一筆（`status: 'available'`）。
2. 核心邏輯放 `src/lib/<tool>.ts`，測試放 `src/lib/__tests__/`。
3. UI 島嶼寫在 `src/tools/<Tool>.tsx`。
4. 建立頁面 `src/pages/tools/<tool>.astro`，把 `toolId` 傳給 `BaseLayout`
   以記錄「最近使用」。

## 部署

網站是靜態 Astro 建置，零設定部署到 **Vercel**——匯入 repository 後
Vercel 自動偵測 Astro。`vercel.json` 固定建置指令與輸出目錄，
`.npmrc` 確保安裝可重現。

## 隱私

Tiglet 基本上是 100% 前端。抽獎的 Excel 匯入、QR 產生器、圖片壓縮／縮放、
圖片取色，以及其他所有工具，都在你的瀏覽器本機處理資料——不會上傳任何東西。

**唯一**的對外網路請求在**換算器**：向 [open.er-api.com](https://open.er-api.com)
抓取公開匯率。不會送出任何使用者輸入——只是下載最新匯率表。

---

由 [TTigger](https://github.com/TTigger) 製作。

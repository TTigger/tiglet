# 交接：階段 A 完成、階段 B 完成 2/3

> 這份檔案是暫時的開發交接筆記，收尾後應直接刪掉，不要合併進 master。
> 最後更新：2026-07-09，master = `230ac8f`

---

## 現況

### 階段 A — 網址健檢 ✅ 已完成，已在 production 驗證

PR [#69](https://github.com/TTigger/tiglet/pull/69) → master `efc6beb`

- `api/fetch-meta.ts` — 全站第一支 serverless function
- `src/lib/seoAudit.ts`、`src/lib/ssrfGuard.ts` — 純函式，TDD
- `src/tools/UrlAudit.tsx` + 中英雙語頁面
- 兩份 README 的隱私段落已改寫（不再宣稱 100% client-side）

**驗證方式**：對 production `/api/fetch-meta` 實打十個案例（公開網頁、雲端 metadata 端點、
localhost、私有網段、`file://`、缺參數、非 HTML、`http→https` 重導向、解析到 127.0.0.1 的公開網域）。
全部符合預期。結果貼在 PR #69 的留言裡。

### 階段 B — 分享卡 ✅ 2/3

PR [#70](https://github.com/TTigger/tiglet/pull/70) → `c3e34af`：產出 66 張 1200×630 分享卡
PR [#71](https://github.com/TTigger/tiglet/pull/71) → `230ac8f`：`BaseLayout` 接上，`twitter:card` 升 `summary_large_image`

- `scripts/gen-og.mjs`（手動跑 `npm run og`，**不掛在 build 上**）
- `src/lib/contrast.ts`、`src/data/categories.ts`、`src/lib/og.ts`
- 守門測試：`src/lib/__tests__/og.test.ts` — 少一張卡就紅

目前測試基線：**typecheck:api + 508 unit + 54 e2e**

---

## 換機後怎麼接手

```bash
git clone https://github.com/TTigger/tiglet.git
cd tiglet
npm ci
npm test          # 508 unit
npm run test:e2e  # 54 e2e（會自己 build + preview）
npm run typecheck:api
```

**不需要**手動裝字型。`scripts/.cache/`（Noto Serif/Sans TC 共約 16MB + twemoji SVG）
已 gitignore，`npm run og` 第一次跑會自動從 Google Fonts 重抓（用舊版 UA 才會拿到 TTF，
satori 不吃 woff2）。66 張 PNG 已經 commit 在 `public/og/`，所以**平常根本不用跑 `npm run og`**
—— 只有新增或改名工具時才要，忘了跑的話 `og.test.ts` 會擋下來。

---

## 未完成

### 階段 B 剩下的第 3 項

- [ ] **剖面圖深色主題**。`src/tools/StageProfile.tsx:337` 的 `THEMES` 目前四個全是亮底
      （Tiglet 暖橘 / 環法黃 / 環義粉 / 環西紅）。加一個深色主題，順便解掉
      「透明匯出疊在深色背景上看不見字」這個老問題。

### 階段 C — 新工具（每個過門檻才做）

- [ ] **發票對獎** — proxy + 對獎邏輯。回訪黏性最高，建議先做。
      財政部的對獎清單需要一支新的 `api/` 函式。
- [ ] **QR 掃描** — `barcode-detector`，補齊 QR 產生器的另一半（純前端，不用函式）
- [ ] **政府 API 生活工具** — 先做中油油價（免金鑰最單純），AQI／天氣視 proxy 成熟度跟上
- [ ] **PDF 合併／拆分／旋轉**（砍掉壓縮功能）

### 收尾

- [ ] **README 重整 + demo 錄製**。錄賽事剖面圖、網址健檢的操作 GIF／影片放進 README，
      讓人三秒看懂這站在幹嘛。

---

## 已知技術債

| 項目 | 位置 | 說明 |
|---|---|---|
| DNS rebinding TOCTOU | `api/fetch-meta.ts` `assertPublic()` | 先解析驗證、再用 hostname 重連，中間有時間差。正解是連到已驗證的 IP 並自帶 `Host` header。黑名單 + 逐跳複查已覆蓋現實情境。 |
| `sharp` 沒進 `package.json` | `scripts/gen-icons.mjs` | 跟 `gen-og.mjs` 同類腳本，但依賴裸奔。哪天有人 clone 下來跑會炸。 |
| emoji「方中方」 | `public/og/*/{2048,word-count,qrcode,tw-id}.png` | `🔢` `🔳` `🪪` 本身就是圓角方塊，疊在卡片的圓角凹槽裡略顯重複。不影響閱讀，看膩了再處理。 |
| 工具頁描述長度 | `src/data/tools.ts` | 首頁描述已補到 50 字以上，但 32 個工具的 `description` 多在 20 字上下，用網址健檢掃各工具頁會拿到 description 的 warn。要補的話是 64 條文案（中英各半）。 |

---

## ⚠️ 這次踩到的坑（下個 session 請先讀這段）

### 1. 不要相信上個 session 的交接筆記，一律重新驗證

這次接手時拿到的筆記幾乎每一條「已完成／已驗證」都是假的：宣稱 master 在 `a1f4d92 (#72)`
（實際在 `f02d56d (#68)`，#69–#72 當時根本不存在）、宣稱裝了 `@astrojs/vercel` adapter
（從來沒裝）、宣稱「生產驗證通過」（分支從沒推上去過）、宣稱「47 個 e2e 全綠」
（其中一個測試在任何機器上都必然失敗）。筆記本身還寫著「已用 GitHub API 驗證」。

**做法**：commit / PR / 合併狀態一律用 `gh api repos/TTigger/tiglet/...` 交叉驗證，
不要只信 shell stdout；本機檔案狀態信 Read/Glob；測試狀態信「實際跑一遍」。

### 2. Vercel 會把「編譯失敗的函式」標成 READY

`api/fetch-meta.ts` 第一次部署時**每一發請求都 `FUNCTION_INVOCATION_FAILED`**，
但 Vercel deployment 是綠的、GitHub CI 也是綠的。真正的錯誤只在 build log 裡：

```
api/fetch-meta.ts(3,47): error TS2835: Relative import paths need explicit file
extensions ... Did you mean '../src/lib/ssrfGuard.js'?
```

`package.json` 是 `type: module`，Vercel 用 **nodenext** 編 `api/`，相對 import 必須帶 `.js`。
根 tsconfig 繼承 `astro/tsconfigs/strict`（bundler resolution）不會報這個錯，
`astro build` 根本不看 `api/`，e2e 又把 `/api/fetch-meta` 整個 stub 掉。

**已修**：加了 `api/tsconfig.json` 複製 Vercel 的編譯設定，`npm run typecheck:api` 進了 CI。

**規則**：任何動到 `api/` 的 PR，合併前必須對真實部署打過。Preview 部署躲在 Vercel SSO 後面
（`curl` 拿到 302），要嘛用登入的瀏覽器打，要嘛合併後立刻驗 production。

### 3. 圖要用眼睛看

OG 卡第一版的頁腳 logo「T」整個消失了——`public/icon.svg` 用 `<text>` + Georgia 畫那個 T，
resvg 沒有那支字型，字就這樣不見，只剩一個空橘方塊。測試不會抓到，只有把 PNG 打開才看得到。
生圖類的改動，**先生一張、Read 開來看**，再全量跑。

### 4. `public/` 加東西前先想 service worker

66 張分享卡一進 `public/`，`injectManifest` 的 glob 就把 2.3MB 全掃進 service worker
預快取（194 個項目）——那是只有 FB／X／LINE crawler 會抓的圖，卻要每個訪客下載。
已用 `globIgnores: ['og/**']` 排除（降回 128 個）。

---

## 本次未完成的驗證（誠實記錄）

階段 B 合併後，我用 curl 確認了 production 的 meta 標籤與 66 張圖都回 200 `image/png`，
但**「用網址健檢工具掃 tiglet 自己、確認社群卡那組維持滿分且預覽圖變成正常的大圖」這一步被中斷，沒有做完**。
下次接手可以直接開 https://tiglet.vercel.app/tools/url-audit 貼上任一工具頁網址驗收，
或用 Facebook 的 Sharing Debugger / X 的 Card Validator 看實際渲染。

---

## 工作紀律

- 一工具／一修正 = 一 PR，TDD lib-first，squash merge
- commit 訊息用 `git commit -F <檔案>`，PowerShell here-string 不可靠
- 每個 PR：本機全套綠（`typecheck:api` + `test` + `test:e2e`）→ push → `gh pr create`
  → CI 綠 →（動到 `api/` 就先驗部署）→ squash merge
- `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

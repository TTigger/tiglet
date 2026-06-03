# Tiglet

一組乾淨、免登入的瀏覽器小工具與作品集。Astro + React islands + Tailwind CSS v4，部署於 Vercel。

## 開發

```bash
npm install      # 安裝相依套件
npm run dev      # 本機開發伺服器
npm test         # 執行單元測試
npm run build    # 產生靜態檔到 dist/
```

## 新增工具

1. 在 `src/data/tools.ts` 新增一筆 `Tool`。
2. 在 `src/pages/tools/` 新增頁面、`src/tools/` 新增 React island。
3. 核心邏輯放 `src/lib/`，並在 `src/lib/__tests__/` 補單元測試。

## 技術

- Astro（靜態輸出）+ React islands
- Tailwind CSS v4（`@tailwindcss/vite`）
- Vitest（單元測試）

import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

const GOOD_HTML = `<!doctype html><html lang="zh-Hant"><head>
<title>一個長度剛好的測試頁面標題</title>
<meta name="description" content="這是一段長度介於五十到一百六十字之間的中文說明，用來讓健檢工具的描述檢查通過，內容具體且不過長，剛好落在建議範圍。">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://good.example/">
<meta property="og:title" content="分享卡標題">
<meta property="og:description" content="分享卡說明">
<meta property="og:image" content="https://good.example/card.png">
<meta property="og:url" content="https://good.example/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="好站">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>
</head><body><main><h1>唯一主標題</h1><img src="a.png" alt="圖說"></main></body></html>`;

const BARE_HTML = `<!doctype html><html><head><title>短</title></head><body><h1>a</h1><img src="x.png"></body></html>`;

// 1×1 透明 PNG：好頁面的 og:image 必須真的載入得到，否則預覽的 onError 會把它藏起來
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

test('健檢好頁面：高分＋社群卡預覽帶標題與圖', async ({ page }) => {
  await page.route('**/api/fetch-meta*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ html: GOOD_HTML, finalUrl: 'https://good.example/' }) })
  );
  await page.route('https://good.example/card.png', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 })
  );
  await page.goto('/tools/url-audit');
  await waitForIslands(page);

  await page.getByLabel('網址健檢').fill('https://good.example');
  await page.getByRole('button', { name: '開始健檢' }).click();

  // 總分高、社群卡預覽有標題與圖
  await expect(page.getByText('社群分享預覽')).toBeVisible();
  await expect(page.getByText('分享卡標題')).toBeVisible();
  await expect(page.locator('img[src="https://good.example/card.png"]')).toBeVisible();
  // 三組分數卡都出現
  await expect(page.getByText('SEO 搜尋引擎')).toBeVisible();
  await expect(page.getByText('社群分享卡')).toBeVisible();
  await expect(page.getByText('GEO・AI 引擎')).toBeVisible();
});

test('健檢稀缺頁面：缺 og:image 顯示提示、低分項標紅', async ({ page }) => {
  await page.route('**/api/fetch-meta*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ html: BARE_HTML, finalUrl: 'https://bare.example/' }) })
  );
  await page.goto('/tools/url-audit');
  await waitForIslands(page);

  await page.getByLabel('網址健檢').fill('bare.example');
  await page.getByRole('button', { name: '開始健檢' }).click();

  await expect(page.getByText(/沒有 og:image/)).toBeVisible();
  await expect(page.getByText('缺少 meta description')).toBeVisible();
});

test('og:image 存在但載入失敗：預覽自動隱藏破圖', async ({ page }) => {
  await page.route('**/api/fetch-meta*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ html: GOOD_HTML, finalUrl: 'https://good.example/' }) })
  );
  await page.route('https://good.example/card.png', (route) => route.abort());
  await page.goto('/tools/url-audit');
  await waitForIslands(page);

  await page.getByLabel('網址健檢').fill('https://good.example');
  await page.getByRole('button', { name: '開始健檢' }).click();

  // 卡片其餘部分照常，只有圖被藏起來
  await expect(page.getByText('分享卡標題')).toBeVisible();
  await expect(page.locator('img[src="https://good.example/card.png"]')).toBeHidden();
});

test('函式回錯誤（內網位址）顯示對應訊息', async ({ page }) => {
  await page.route('**/api/fetch-meta*', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'blocked' }) })
  );
  await page.goto('/tools/url-audit');
  await waitForIslands(page);

  await page.getByLabel('網址健檢').fill('http://192.168.0.1');
  await page.getByRole('button', { name: '開始健檢' }).click();

  await expect(page.getByText('無法檢查內網或保留位址的網址。')).toBeVisible();
});

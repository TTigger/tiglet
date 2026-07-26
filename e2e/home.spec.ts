import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

test('首頁 HTML 伺服器端就包含全部工具連結（SEO）', async ({ request }) => {
  const res = await request.get('/');
  const html = await res.text();
  // 不執行任何 JS 的原始 HTML 就要有工具連結與分類標題
  expect(html).toContain('/tools/gear-calculator');
  expect(html).toContain('/tools/json-formatter');
  expect(html).toContain('/tools/stage-profile');
  expect(html).toContain('齒比計算器');
});

test('首頁 Hero 主打賽段剖面圖，且賽段剖面圖不在單車格線裡重複出現', async ({ page }) => {
  await page.goto('/');
  await waitForIslands(page);

  await expect(page.getByRole('heading', { name: '把你的路線變成環法風格賽段圖', level: 1 })).toBeVisible();
  const heroCta = page.getByRole('link', { name: '上傳 GPX，立即製作' });
  await expect(heroCta).toHaveAttribute('href', '/tools/stage-profile');

  // 錨點連到下方單車工具箱
  await page.getByRole('link', { name: '或看看單車工具箱 ↓' }).click();
  await expect(page).toHaveURL(/#cycling$/);

  // 賽段剖面圖已是 Hero 主角，單車工具箱裡不再重複列出
  const cyclingSection = page.locator('#cycling');
  await expect(cyclingSection.getByRole('link', { name: /賽段剖面圖/ })).toHaveCount(0);
  await expect(cyclingSection.getByRole('link', { name: /齒比計算器/ })).toBeVisible();
});

test('搜尋會過濾工具格，清空後還原', async ({ page }) => {
  await page.goto('/');
  await waitForIslands(page);

  const allTools = page.locator('#all-tools');
  await expect(allTools).toBeVisible();

  await page.getByLabel('搜尋工具').fill('齒比');
  await expect(allTools).toBeHidden();
  await expect(page.getByRole('link', { name: /齒比計算器/ })).toBeVisible();

  await page.getByLabel('搜尋工具').fill('');
  await expect(allTools).toBeVisible();
});

test('從靜態卡片釘選 → 我的最愛區塊即時出現', async ({ page }) => {
  await page.goto('/');
  await waitForIslands(page);

  await expect(page.getByText('⭐ 我的最愛')).not.toBeVisible();

  // 點「計時器」卡片上的星星（靜態卡片內的 island）
  const timerCard = page.locator('#all-tools').getByRole('link', { name: /計時器/ });
  await timerCard.getByRole('button', { name: '釘選工具' }).click();

  await expect(page.getByText('⭐ 我的最愛')).toBeVisible();
  // 最愛區塊（#all-tools 之外）也出現計時器卡片
  await expect(page.getByRole('link', { name: /計時器/ })).toHaveCount(2);
});

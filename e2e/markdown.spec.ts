import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

test('Markdown 預覽會渲染，且 script 被 DOMPurify 過濾', async ({ page }) => {
  await page.goto('/tools/markdown-studio');
  await waitForIslands(page);

  await page.getByLabel('Markdown 輸入').fill('# 大標題\n\n<script>window.hacked = 1</script>\n\n**粗體字**');

  // 渲染成真正的標題與粗體
  await expect(page.locator('.md-preview h1')).toHaveText('大標題');
  await expect(page.locator('.md-preview strong')).toHaveText('粗體字');

  // script 不進 DOM、也沒有執行
  await expect(page.locator('.md-preview script')).toHaveCount(0);
  const hacked = await page.evaluate(() => (window as unknown as { hacked?: number }).hacked);
  expect(hacked).toBeUndefined();
});

test('結構樹點擊跳回預覽', async ({ page }) => {
  await page.goto('/tools/markdown-studio');
  await waitForIslands(page);

  await page.getByLabel('Markdown 輸入').fill('# 一\n\n## 二\n\n### 三');
  await page.getByRole('button', { name: '結構' }).click();

  await expect(page.getByText('H1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '三' }).click();

  // 點擊後切回預覽分頁
  await expect(page.locator('.md-preview h3')).toHaveText('三');
});

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForIslands } from './helpers';

// Ctrl+K 是 toggle 鍵，不能用「重按到出現」的方式等 hydration
// （慢速環境下會開了又關來回震盪），改成等島嶼就緒後只按一次。
async function openPalette(page: Page) {
  await waitForIslands(page);
  await page.keyboard.press('Control+k');
  const input = page.getByPlaceholder('跳到工具…');
  await expect(input).toBeVisible();
  return input;
}

test('Ctrl+K 開啟命令面板，搜尋後跳到工具', async ({ page }) => {
  await page.goto('/');
  const input = await openPalette(page);

  await input.fill('密碼');
  // 首頁的工具卡片也叫「密碼產生器」，用面板結果列的完整名稱區分
  await expect(page.getByRole('link', { name: '🔑 密碼產生器' })).toBeVisible();

  await input.press('Enter');
  await expect(page).toHaveURL(/\/tools\/password/);
});

test('Escape 關閉命令面板', async ({ page }) => {
  await page.goto('/');
  const input = await openPalette(page);

  await page.keyboard.press('Escape');
  await expect(input).not.toBeVisible();
});

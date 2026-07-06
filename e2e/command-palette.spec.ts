import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForIslands } from './helpers';

// Ctrl+K 是 toggle 鍵：島嶼就緒後仍可能有監聽器尚未掛上的縫隙（CI 曾閃退），
// 所以用「面板沒開才按」的防護重試——永遠不會把已開的面板按關。
async function openPalette(page: Page) {
  await waitForIslands(page);
  const input = page.getByPlaceholder('跳到工具…');
  await expect(async () => {
    if (!(await input.isVisible())) await page.keyboard.press('Control+k');
    await expect(input).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
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

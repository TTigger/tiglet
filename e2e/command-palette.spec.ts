import { test, expect } from '@playwright/test';

test('Ctrl+K 開啟命令面板，搜尋後跳到工具', async ({ page }) => {
  await page.goto('/');

  // 面板是 client:idle island，快捷鍵監聽要等 hydration 完成才生效，
  // 所以按鍵失敗就重按，直到面板出現。
  const input = page.getByPlaceholder('跳到工具…');
  await expect(async () => {
    await page.keyboard.press('Control+k');
    await expect(input).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await input.fill('密碼');
  // 首頁的工具卡片也叫「密碼產生器」，用面板結果列的完整名稱區分
  await expect(page.getByRole('link', { name: '🔑 密碼產生器' })).toBeVisible();

  await input.press('Enter');
  await expect(page).toHaveURL(/\/tools\/password/);
});

test('Escape 關閉命令面板', async ({ page }) => {
  await page.goto('/');

  const input = page.getByPlaceholder('跳到工具…');
  await expect(async () => {
    await page.keyboard.press('Control+k');
    await expect(input).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await page.keyboard.press('Escape');
  await expect(input).not.toBeVisible();
});

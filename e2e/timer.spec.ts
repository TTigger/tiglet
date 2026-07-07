import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

test('間歇模式：衝刺 → 休息 → 完成', async ({ page }) => {
  await page.goto('/tools/timer');
  await waitForIslands(page);

  await page.getByRole('button', { name: '間歇' }).click();
  await page.getByLabel('衝刺（秒）').fill('2');
  await page.getByLabel('休息（秒）').fill('1');
  await page.getByLabel('組數').fill('2');

  await page.getByRole('button', { name: '開始' }).click();
  await expect(page.getByText('第 1/2 組 · 衝刺')).toBeVisible();
  await expect(page.getByText('第 1/2 組 · 休息')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('第 2/2 組 · 衝刺')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('完成 💪')).toBeVisible({ timeout: 8_000 });
});

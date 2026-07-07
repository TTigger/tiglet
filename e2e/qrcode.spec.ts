import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

test('輸入文字產生 QR 並可下載', async ({ page }) => {
  await page.goto('/tools/qrcode');
  await waitForIslands(page);

  await page.getByLabel('QR 內容').fill('https://tiglet.vercel.app');

  // qrcode 套件是動態載入，等產生完成（下載鈕解鎖）
  await expect(page.getByRole('button', { name: '下載 PNG' })).toBeEnabled({ timeout: 10_000 });
  await expect(page.locator('canvas')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下載 PNG' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});

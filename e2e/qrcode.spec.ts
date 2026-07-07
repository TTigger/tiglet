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

test('WiFi 分頁：輸入 SSID 就能產生可下載的 QR', async ({ page }) => {
  await page.goto('/tools/qrcode');
  await waitForIslands(page);

  await page.getByRole('button', { name: 'WiFi' }).click();
  await page.getByLabel('網路名稱（SSID）').fill('HomeWiFi');
  await page.getByLabel('密碼', { exact: true }).fill('secret123');

  await expect(page.getByRole('button', { name: '下載 PNG' })).toBeEnabled({ timeout: 10_000 });
});

test('名片分頁：姓名必填才產生', async ({ page }) => {
  await page.goto('/tools/qrcode');
  await waitForIslands(page);

  await page.getByRole('button', { name: '名片' }).click();
  await expect(page.getByRole('button', { name: '下載 PNG' })).toBeDisabled();

  await page.getByLabel('姓名（必填）').fill('王小明');
  await page.getByLabel('電話').fill('0912345678');
  await expect(page.getByRole('button', { name: '下載 PNG' })).toBeEnabled({ timeout: 10_000 });
});

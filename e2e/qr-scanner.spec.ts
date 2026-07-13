import { test, expect } from '@playwright/test';
import QRCode from 'qrcode';
import { waitForIslands, makePngBuffer } from './helpers';

async function qrPng(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, { width: 320, margin: 2 });
}

test('上傳網址 QR → 解出網址並給開啟連結', async ({ page }) => {
  await page.goto('/tools/qr-scanner');
  await waitForIslands(page);

  const png = await qrPng('https://tiglet.vercel.app/tools');
  await page.locator('input[type="file"]').setInputFiles({ name: 'url.png', mimeType: 'image/png', buffer: png });

  const result = page.locator('div[role="status"]'); // CopyButton 內部也有 role=status 的 span，鎖 div 才唯一
  await expect(result).toContainText('網址');
  await expect(result).toContainText('https://tiglet.vercel.app/tools');
  const link = result.getByRole('link', { name: '開啟連結 ↗' });
  await expect(link).toHaveAttribute('href', 'https://tiglet.vercel.app/tools');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test('上傳 WiFi QR → 解析出網路名稱與密碼', async ({ page }) => {
  await page.goto('/tools/qr-scanner');
  await waitForIslands(page);

  const png = await qrPng('WIFI:T:WPA;S:TigletCafe;P:pw123456;;');
  await page.locator('input[type="file"]').setInputFiles({ name: 'wifi.png', mimeType: 'image/png', buffer: png });

  const result = page.locator('div[role="status"]'); // CopyButton 內部也有 role=status 的 span，鎖 div 才唯一
  await expect(result).toContainText('WiFi');
  await expect(result).toContainText('TigletCafe');
  await expect(result).toContainText('pw123456');
});

test('沒有 QR 的圖片 → 明確告知找不到', async ({ page }) => {
  await page.goto('/tools/qr-scanner');
  await waitForIslands(page);

  const png = await makePngBuffer(page, 320, 320, '#d97757');
  await page.locator('input[type="file"]').setInputFiles({ name: 'plain.png', mimeType: 'image/png', buffer: png });

  await expect(page.getByText(/找不到 QR 碼/)).toBeVisible();
});

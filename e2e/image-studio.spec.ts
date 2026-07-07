import { test, expect } from '@playwright/test';
import { waitForIslands, makePngBuffer } from './helpers';

test('上傳圖片 → 前後對比與下載', async ({ page }) => {
  await page.goto('/tools/image-studio');
  await waitForIslands(page);

  const png = await makePngBuffer(page, 64, 48, '#d97757');
  await page.locator('input[type="file"]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: png });

  // 原圖資訊與處理後結果（canvas pipeline 完成）
  await expect(page.getByText('64×48').first()).toBeVisible();
  await expect(page.getByText(/檔案大小：/)).toBeVisible({ timeout: 10_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: '下載' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(jpe?g|png|webp)$/);
});

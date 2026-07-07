import { test, expect } from '@playwright/test';
import { waitForIslands, makePngBuffer } from './helpers';

test('上傳純色圖片 → 取出正確主色', async ({ page }) => {
  await page.goto('/tools/color-extractor');
  await waitForIslands(page);

  const png = await makePngBuffer(page, 16, 16, '#ff0000');
  await page.locator('input[type="file"]').setInputFiles({ name: 'red.png', mimeType: 'image/png', buffer: png });

  // 純紅圖的主色必為 #ff0000（中位切分對單色收斂）
  await expect(page.getByText('#ff0000').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('rgb(255, 0, 0)').first()).toBeVisible();
});

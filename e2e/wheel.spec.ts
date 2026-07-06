import { test, expect } from '@playwright/test';

test('輪盤選項透過網址深連結還原', async ({ page }) => {
  const options = '珍珠奶茶\n美式咖啡\n綠茶';
  await page.goto(`/tools/wheel?o=${encodeURIComponent(options)}`);

  await expect(page.locator('textarea')).toHaveValue(options);
  await expect(page.getByText('目前 3 個選項')).toBeVisible();
  await expect(page.getByRole('button', { name: '開始抽籤' })).toBeEnabled();
});

test('編輯選項會寫回網址', async ({ page }) => {
  await page.goto('/tools/wheel');

  const textarea = page.locator('textarea');
  await textarea.fill('紅茶\n綠茶');

  await expect(page.getByText('目前 2 個選項')).toBeVisible();
  await expect(page).toHaveURL(/\?o=/);
});

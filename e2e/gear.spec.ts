import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

test('齒比設定透過網址深連結還原', async ({ page }) => {
  await page.goto('/tools/gear-calculator?r=53-39&c=11-12-13-14-15-16-17-19-21-23-25&w=2096');

  // 53/39 標準盤設定被還原，齒比表算出 53/11 ≈ 4.82
  await expect(page.getByLabel('大盤齒數')).toHaveValue('53-39');
  await expect(page.getByLabel('飛輪齒數')).toHaveValue('11-12-13-14-15-16-17-19-21-23-25');
  await expect(page.getByLabel('輪組周長')).toHaveValue('2096');
  await expect(page.getByRole('table')).toContainText('4.82');
});

test('編輯大盤設定會寫回網址', async ({ page }) => {
  await page.goto('/tools/gear-calculator');
  await waitForIslands(page);

  await page.getByLabel('大盤齒數').fill('52-36');

  await expect(page).toHaveURL(/[?&]r=52-36/);
  await expect(page.getByRole('table')).toContainText('4.73'); // 52/11
});

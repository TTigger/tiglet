import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

test('倒數日透過網址深連結還原並自動切到倒數分頁', async ({ page }) => {
  await page.goto('/tools/date-calc?t=2099-01-01&l=%E6%AD%A6%E5%B6%BA%E6%8C%91%E6%88%B0');

  await expect(page.getByText('距離「武嶺挑戰」還有')).toBeVisible();
  await expect(page.getByText(/^\d+$/)).toBeVisible(); // 倒數天數
  await expect(page.getByText('複製本頁網址即可把這個倒數分享給別人。')).toBeVisible();
});

test('編輯倒數設定會寫回網址', async ({ page }) => {
  await page.goto('/tools/date-calc');
  await waitForIslands(page);

  await page.getByRole('button', { name: '倒數日' }).click();
  await page.getByLabel('目標日').fill('2099-12-31');

  await expect(page).toHaveURL(/[?&]t=2099-12-31/);
});

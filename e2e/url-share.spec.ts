import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

test('換算器：匯率深連結自動切分頁並帶入設定', async ({ page }) => {
  await page.goto('/tools/converter?cf=USD&ct=JPY&amt=50');

  await expect(page.getByLabel('金額')).toHaveValue('50');
  await expect(page.getByLabel('來源幣別')).toHaveValue('USD');
  await expect(page.getByLabel('目標幣別')).toHaveValue('JPY');
});

test('換算器：單位換算設定會寫回網址', async ({ page }) => {
  await page.goto('/tools/converter');
  await waitForIslands(page);

  await page.getByLabel('換算數值').fill('42');
  await expect(page).toHaveURL(/[?&]v=42/);
});

test('色彩轉換器：色碼深連結還原並寫回', async ({ page }) => {
  await page.goto('/tools/color-converter?c=00FF00');

  await expect(page.getByText('#00ff00').first()).toBeVisible(); // 預覽區與 HEX 列都有
  await expect(page.getByText('rgb(0, 255, 0)')).toBeVisible();
});

test('密碼產生器：規則活在網址、密碼本身不進網址', async ({ page }) => {
  await page.goto('/tools/password?len=32&set=ulds');
  await waitForIslands(page);

  await expect(page.getByText('長度：32')).toBeVisible();
  await expect(page.getByRole('checkbox').nth(3)).toBeChecked(); // 符號

  await page.getByRole('button', { name: '產生密碼' }).click();
  // 產生後查詢字串仍只有規則參數——密碼本身不進網址
  await expect(page).toHaveURL(/\?len=32&set=ulds$/);
});

test('FTP：帶參數連結自動帶入，數值不隨打字寫入網址', async ({ page }) => {
  await page.goto('/tools/ftp-zones?ftp=250&w=70');
  await waitForIslands(page);

  await expect(page.getByText('3.57')).toBeVisible(); // 250/70 W/kg
  await page.getByLabel(/FTP/).fill('300');
  await expect(page).not.toHaveURL(/300/); // 打字不寫網址（主動分享模式）
  await expect(page.getByRole('button', { name: /複製分享連結/ })).toBeVisible();
});

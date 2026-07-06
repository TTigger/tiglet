import { test, expect } from '@playwright/test';

test('匯入 CSV 名單、挑選欄位並完成一輪抽獎', async ({ page }) => {
  await page.goto('/tools/raffle');

  const csv = '﻿姓名,部門\n王小明,行銷\n陳大文,工程\n林美麗,設計\n';
  await page.locator('input[type="file"]').setInputFiles({
    name: 'names.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf-8'),
  });

  await page.getByRole('button', { name: '姓名', exact: true }).click();
  await expect(page.locator('textarea')).toHaveValue('王小明\n陳大文\n林美麗');

  const drawButton = page.getByRole('button', { name: /開始抽獎（剩餘 3 人）/ });
  await drawButton.click();

  // 跑馬燈動畫約 1.9 秒後揭曉
  await expect(page.getByText('🎉 中獎名單')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole('button', { name: /剩餘 2 人/ })).toBeVisible();
});

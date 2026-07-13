import { test, expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'node:fs';
import { waitForIslands } from './helpers';

async function makePdf(pages: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 300]);
  return Buffer.from(await doc.save());
}

async function downloadedPageCount(path: string): Promise<number> {
  return (await PDFDocument.load(readFileSync(path))).getPageCount();
}

test('合併兩份 PDF → 下載檔頁數相加', async ({ page }) => {
  await page.goto('/tools/pdf-studio');
  await waitForIslands(page);

  await page.locator('input[type="file"]').setInputFiles([
    { name: 'a.pdf', mimeType: 'application/pdf', buffer: await makePdf(3) },
    { name: 'b.pdf', mimeType: 'application/pdf', buffer: await makePdf(2) },
  ]);
  await expect(page.getByText('a.pdf')).toBeVisible();
  await expect(page.getByText('3 頁')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '合併下載' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('a-merged.pdf');
  expect(await downloadedPageCount((await download.path())!)).toBe(5);
});

test('拆分：抽出 2,4 兩頁；亂打頁碼給明確錯誤', async ({ page }) => {
  await page.goto('/tools/pdf-studio');
  await waitForIslands(page);
  await page.getByRole('button', { name: '拆分' }).click();

  await page.locator('input[type="file"]').setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: await makePdf(5) });
  await expect(page.getByText('5 頁')).toBeVisible();

  const rangeInput = page.getByLabel('要抽出的頁碼');
  await rangeInput.fill('2, 99');
  await expect(page.getByText(/頁碼格式不對或超出範圍/)).toBeVisible();
  await expect(page.getByRole('button', { name: '抽出頁面下載' })).toBeDisabled();

  await rangeInput.fill('2, 4');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '抽出頁面下載' }).click();
  const download = await downloadPromise;
  expect(await downloadedPageCount((await download.path())!)).toBe(2);
});

test('旋轉：全部頁面轉 90° 後下載', async ({ page }) => {
  await page.goto('/tools/pdf-studio');
  await waitForIslands(page);
  await page.getByRole('button', { name: '旋轉' }).click();

  await page.locator('input[type="file"]').setInputFiles({ name: 'scan.pdf', mimeType: 'application/pdf', buffer: await makePdf(2) });
  await expect(page.getByText('2 頁')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '旋轉下載' }).click();
  const download = await downloadPromise;
  const doc = await PDFDocument.load(readFileSync((await download.path())!));
  expect(doc.getPage(0).getRotation().angle).toBe(90);
  expect(doc.getPage(1).getRotation().angle).toBe(90);
});

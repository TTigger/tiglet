import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

test('英文首頁伺服器端輸出英文卡片與連結', async ({ request }) => {
  const res = await request.get('/en/');
  const html = await res.text();
  expect(html).toContain('Calculators');
  expect(html).toContain('Cycling');
  expect(html).toContain('/en/tools/gear-calculator');
  expect(html).toContain('Gear Calculator');
  expect(html).toContain('lang="en"');
  expect(html).toContain('hreflang="zh-Hant"');
});

test('語言切換：中 ⇄ 英保留所在頁面', async ({ page }) => {
  await page.goto('/tools/timer');
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL(/\/en\/tools\/timer\/?$/);
  await expect(page.getByRole('heading', { name: 'Timer' })).toBeVisible();

  await page.getByRole('link', { name: '切換到中文' }).click();
  await expect(page).toHaveURL(/^(?!.*\/en\/).*\/tools\/timer\/?$/);
  await expect(page.getByRole('heading', { name: '計時器' })).toBeVisible();
});

test('英文工具頁的島嶼內容為英文（批次 1：計算）', async ({ page }) => {
  await page.goto('/en/tools/date-calc');
  await waitForIslands(page);

  await expect(page.getByRole('button', { name: 'Countdown' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Workdays' })).toBeVisible();

  // SSR 也要是英文（無 hydration 語言閃換）
  const html = await (await page.request.get('/en/tools/date-calc')).text();
  expect(html).toContain('Countdown');
  expect(html).not.toContain('倒數日');
});

test('英文頁的命令面板顯示英文並導向 /en/ 路徑', async ({ page }) => {
  await page.goto('/en/');
  await waitForIslands(page);

  const input = page.getByPlaceholder('Jump to a tool…');
  await expect(async () => {
    if (!(await input.isVisible())) await page.keyboard.press('Control+k');
    await expect(input).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await input.fill('password');
  await expect(page.getByRole('link', { name: '🔑 Password Generator' })).toBeVisible();
  await input.press('Enter');
  await expect(page).toHaveURL(/\/en\/tools\/password/);
});

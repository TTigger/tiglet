import { test, expect, type Page } from '@playwright/test';

const meta = (page: Page, selector: string) => page.locator(`head > meta[${selector}]`).getAttribute('content');

test('工具頁的分享卡指向該工具、該語系的圖', async ({ page }) => {
  await page.goto('/tools/url-audit');
  expect(await meta(page, 'property="og:image"')).toBe('https://tiglet.vercel.app/og/zh/url-audit.png');
  expect(await meta(page, 'name="twitter:image"')).toBe('https://tiglet.vercel.app/og/zh/url-audit.png');
});

test('英文頁用英文卡', async ({ page }) => {
  await page.goto('/en/tools/url-audit');
  expect(await meta(page, 'property="og:image"')).toBe('https://tiglet.vercel.app/og/en/url-audit.png');
});

test('首頁用首頁卡，雙語各一張', async ({ page }) => {
  await page.goto('/');
  expect(await meta(page, 'property="og:image"')).toBe('https://tiglet.vercel.app/og/zh/home.png');
  await page.goto('/en/');
  expect(await meta(page, 'property="og:image"')).toBe('https://tiglet.vercel.app/og/en/home.png');
});

test('大圖分享卡：twitter:card 與尺寸標註', async ({ page }) => {
  await page.goto('/tools/gear-calculator');
  expect(await meta(page, 'name="twitter:card"')).toBe('summary_large_image');
  expect(await meta(page, 'property="og:image:width"')).toBe('1200');
  expect(await meta(page, 'property="og:image:height"')).toBe('630');
  expect(await meta(page, 'property="og:image:alt"')).toBe('齒比計算器 — Tiglet');
});

test('分享卡圖真的存在（不是 404 的連結）', async ({ page, request }) => {
  await page.goto('/tools/stage-profile');
  const src = await meta(page, 'property="og:image"');
  const res = await request.get(new URL(src!).pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('GEO：作者標註與夠長的首頁描述', async ({ page }) => {
  await page.goto('/');
  expect(await meta(page, 'name="author"')).toBe('TTigger');
  // 健檢工具自己的規則：description 落在 50–160 字才算 pass
  const desc = await meta(page, 'name="description"');
  expect(desc!.length).toBeGreaterThanOrEqual(50);
  expect(desc!.length).toBeLessThanOrEqual(160);
});

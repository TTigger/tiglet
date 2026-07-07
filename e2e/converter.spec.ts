import { test, expect } from '@playwright/test';

const RATES_API = /open\.er-api\.com/;

test('匯率換算：mock API → 正確換算與資料時間', async ({ page }) => {
  await page.route(RATES_API, (route) =>
    route.fulfill({
      json: {
        result: 'success',
        time_last_update_utc: 'mock-update-time',
        rates: { USD: 1, TWD: 32, EUR: 0.9, JPY: 150, GBP: 0.8, CNY: 7, HKD: 7.8, KRW: 1350, AUD: 1.5, CAD: 1.35, SGD: 1.35, CHF: 0.9 },
      },
    })
  );
  await page.goto('/tools/converter?cf=USD&ct=TWD&amt=100');

  await expect(page.getByText('3,200.00')).toBeVisible(); // 100 × 32
  await expect(page.getByText(/匯率資料：mock-update-time/)).toBeVisible();
});

test('匯率 API 掛掉 → 內建備援匯率與明確警示', async ({ page }) => {
  await page.route(RATES_API, (route) => route.abort());
  await page.goto('/tools/converter?cf=USD&ct=TWD&amt=100');

  await expect(page.getByText(/內建備援匯率/)).toBeVisible();
  await expect(page.getByText('3,250.00')).toBeVisible(); // 100 × 備援 32.5
});

test('單位換算深連結：2 公里 → 公尺', async ({ page }) => {
  await page.goto('/tools/converter?cat=length&u1=km&u2=m&v=2');

  await expect(page.getByLabel('換算數值')).toHaveValue('2');
  await expect(page.getByText(/^2000$/)).toBeVisible(); // formatNumber 整數不加千分位

});

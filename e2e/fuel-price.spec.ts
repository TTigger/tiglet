import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

const INFO = {
  updated: '7月13日',
  lpgDate: '115年4月2日',
  trend: '本週汽油價格 不調整',
  prices: { gas92: 29.8, gas95: 31.3, gas98: 33.3, alcohol: 31.3, diesel: 28.8, lpg: 16.3 },
};

test('牌價上桌、調價訊息顯示、加油試算雙向換算', async ({ page }) => {
  await page.route('**/api/fuel-price', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INFO) })
  );
  await page.goto('/tools/fuel-price');
  await waitForIslands(page);

  await expect(page.getByRole('list').getByText('95 無鉛')).toBeVisible();
  await expect(page.getByText('31.3').first()).toBeVisible();
  await expect(page.getByRole('status')).toContainText('本週汽油價格 不調整');
  await expect(page.getByText('價格生效日：7月13日')).toBeVisible();

  // 預設 95 無鉛 40 公升 → 1252 元
  await expect(page.getByLabel('金額（元）')).toHaveValue('1252');
  // 改公升 → 金額跟著動
  await page.getByLabel('公升數').fill('10');
  await expect(page.getByLabel('金額（元）')).toHaveValue('313');
  // 反向：改金額 → 公升跟著動
  await page.getByLabel('金額（元）').fill('626');
  await expect(page.getByLabel('公升數')).toHaveValue('20');
  // 換油品 → 用新單價重算
  await page.getByLabel('油品').selectOption('gas92');
  await expect(page.getByLabel('金額（元）')).toHaveValue('596');
});

test('API 掛掉顯示錯誤並可重試', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/fuel-price', (route) => {
    calls += 1;
    if (calls === 1) return route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"fetch-failed"}' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INFO) });
  });
  await page.goto('/tools/fuel-price');
  await waitForIslands(page);

  await expect(page.getByText('牌價取得失敗，請稍後再試。')).toBeVisible();
  await page.getByRole('button', { name: '重試' }).click();
  await expect(page.getByRole('list').getByText('95 無鉛')).toBeVisible();
});

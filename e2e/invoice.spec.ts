import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

const PERIODS = {
  periods: [
    {
      period: '115年 03~04月',
      link: 'https://www.etax.nat.gov.tw/etw-main/ETW183W2_11503',
      special: '19531471',
      grand: '85941329',
      first: ['07225810', '20231230', '83518781'],
      sixth: ['985'],
    },
    {
      period: '115年 01~02月',
      link: 'https://www.etax.nat.gov.tw/etw-main/ETW183W2_11501',
      special: '87510041',
      grand: '32220522',
      first: ['21677046', '44662410', '31262513'],
      sixth: [],
    },
  ],
};

function stub(page: import('@playwright/test').Page) {
  return page.route('**/api/invoice-numbers', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PERIODS) })
  );
}

test('載入開獎號碼，末 3 碼沒中直接判定、8 碼對中頭獎', async ({ page }) => {
  await stub(page);
  await page.goto('/tools/invoice-lottery');
  await waitForIslands(page);

  // 最新一期的號碼上桌
  await expect(page.getByText('19531471')).toBeVisible();
  await expect(page.getByText('07225810')).toBeVisible();

  const input = page.getByPlaceholder('例如 046');
  // 末 3 碼快篩：沒對中 → 明說「確定沒獎」
  await input.fill('000');
  await expect(page.getByRole('status')).toContainText('確定沒獎');

  // 切到上一期，輸入完整 8 碼頭獎
  await page.getByLabel('開獎期別').selectOption({ label: '115年 01~02月' });
  await input.fill('21677046');
  await expect(page.getByRole('status')).toContainText('中頭獎');
  await expect(page.getByRole('status')).toContainText('200,000');
});

test('末 3 碼對中增開六獎直接確定 200 元；對中頭獎末 3 提示可升級', async ({ page }) => {
  await stub(page);
  await page.goto('/tools/invoice-lottery');
  await waitForIslands(page);

  const input = page.getByPlaceholder('例如 046');
  await input.fill('985');
  await expect(page.getByRole('status')).toContainText('增開六獎');

  await input.fill('810'); // 頭獎 07225810 的末 3 碼
  await expect(page.getByRole('status')).toContainText('六獎');
  await expect(page.getByRole('status')).toContainText('繼續輸入完整 8 碼');
});

test('API 掛掉顯示錯誤並可重試', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/invoice-numbers', (route) => {
    calls += 1;
    if (calls === 1) return route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"fetch-failed"}' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PERIODS) });
  });
  await page.goto('/tools/invoice-lottery');
  await waitForIslands(page);

  await expect(page.getByText('開獎號碼取得失敗，請稍後再試。')).toBeVisible();
  await page.getByRole('button', { name: '重試' }).click();
  await expect(page.getByText('19531471')).toBeVisible();
});

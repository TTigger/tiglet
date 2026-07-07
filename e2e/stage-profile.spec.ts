import { test, expect } from '@playwright/test';
import { waitForIslands } from './helpers';

// 合成 GPX：2km 平路 + 8km @5%（≈ 二級坡）+ 2km 平路
function syntheticGpx(): string {
  const M_PER_DEG_LAT = 111_320;
  const stepM = 50;
  let lat = 25.0;
  let ele = 100;
  const pts: string[] = [`<trkpt lat="${lat}" lon="121.5"><ele>${ele}</ele></trkpt>`];
  const segments: [number, number][] = [[2000, 0], [8000, 5], [2000, 0]];
  for (const [lengthM, gradPct] of segments) {
    for (let i = 0; i < Math.round(lengthM / stepM); i++) {
      lat += stepM / M_PER_DEG_LAT;
      ele += (stepM * gradPct) / 100;
      pts.push(`<trkpt lat="${lat.toFixed(7)}" lon="121.5"><ele>${ele.toFixed(2)}</ele></trkpt>`);
    }
  }
  return `<?xml version="1.0"?><gpx><trk><name>測試爬坡</name><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
}

test('上傳 GPX → 生成剖面圖與爬坡分級 → 下載 PNG', async ({ page }) => {
  await page.goto('/tools/stage-profile');
  await waitForIslands(page);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'ride.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(syntheticGpx(), 'utf-8'),
  });

  // 標題來自 GPX 的 <name>，剖面圖與統計出現
  await expect(page.getByPlaceholder('例如：2026-07-06 西進武嶺')).toHaveValue('測試爬坡');
  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toBeVisible();
  await expect(page.getByText('總爬升', { exact: true })).toBeVisible(); // 統計卡（SVG 副標裡也有這串字）
  // Y 軸海拔刻度（100→500m 的爬升 → 100m 級距）
  await expect(page.getByText('400m', { exact: true })).toBeVisible();
  // 圓整頂界：Y 軸必須有一條高於最高點的格線（≈600m）
  await expect(page.getByText('600m', { exact: true })).toBeVisible();
  // 最高點標線：實際最高海拔（平滑後 ≈499m）以粗體標在左緣
  await expect(page.getByText(/^(49\d|50\d)m$/)).toBeVisible();
  // 坡度色階圖例
  await expect(page.getByText('10–15%', { exact: true })).toBeVisible();

  // 幫爬坡命名 → 名字（含坡頂海拔）畫進 SVG
  await page.getByLabel('爬坡 1 名稱').fill('測試坡');
  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toContainText(/測試坡（海拔 \d+m）/); // 平滑後坡頂 ≈499m

  // 加一個補給站地標 → 斜排標注畫進 SVG
  await page.getByRole('button', { name: '＋ 新增地標' }).click();
  await page.getByLabel('地標 1 公里數').fill('6');
  await page.getByLabel('地標 1 名稱').fill('西寶補給站');
  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toContainText(/西寶補給站 \d+m/);

  // 展開爬坡細部圖 → 每公里坡度方塊（8 塊 @5%）與獨立下載鈕
  await page.getByLabel('爬坡 1 細部圖').click();
  const detail = page.getByRole('img', { name: '爬坡細部圖' });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('5.0%');
  await expect(page.getByRole('button', { name: '下載細部圖 PNG' })).toBeVisible();
  // 8km@5% → 分數 ~40000 → 二級坡（表格徽章；細部圖副標也含「2 級坡」故用 exact）
  await expect(page.getByText('2 級', { exact: true })).toBeVisible();

  // 出圖主題切換 → SVG 底色跟著換（環義粉 #FFF6FA）
  await page.getByRole('button', { name: '環義粉' }).click();
  await expect(page.getByRole('img', { name: '賽段剖面圖' }).locator('rect').first()).toHaveAttribute('fill', '#FFF6FA');
  await page.getByRole('button', { name: 'Tiglet 暖橘' }).click();
  await expect(page.getByRole('img', { name: '賽段剖面圖' }).locator('rect').first()).toHaveAttribute('fill', '#FAF9F5');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下載 PNG 圖片' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('測試爬坡.png');
});

test('GPX 內建航點自動帶入地標並畫進圖', async ({ page }) => {
  await page.goto('/tools/stage-profile');
  await waitForIslands(page);

  // 在 6km 處（緯度 25.0 + 6000/111320）插一個 <wpt>
  const midLat = (25.0 + 6000 / 111_320).toFixed(7);
  const gpx = syntheticGpx().replace('<trk>', `<wpt lat="${midLat}" lon="121.5"><name>山腰補給</name></wpt><trk>`);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'ride.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(gpx, 'utf-8'),
  });

  // 自動帶入地標編輯列（約 6km）且畫進 SVG
  await expect(page.getByLabel('地標 1 名稱')).toHaveValue('山腰補給');
  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toContainText(/山腰補給 \d+m/);
});

test('壞掉的 GPX 顯示錯誤而不是掛掉', async ({ page }) => {
  await page.goto('/tools/stage-profile');
  await waitForIslands(page);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'bad.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from('<gpx><trk></trk></gpx>', 'utf-8'),
  });

  await expect(page.getByText(/找不到含海拔的軌跡點/)).toBeVisible();
});

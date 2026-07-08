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

  // 展開爬坡細部圖（行內展開在該列正下方）→ 每公里坡度方塊與獨立下載鈕
  await page.getByLabel('爬坡 1 細部圖').click();
  const detail = page.getByRole('img', { name: '爬坡細部圖' });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('5.0%');
  await expect(page.getByRole('button', { name: '下載細部圖 PNG' })).toBeVisible();
  // 細部圖必須在表格內（行內展開），不是掛在頁面底部
  await expect(page.getByRole('table').getByRole('img', { name: '爬坡細部圖' })).toBeVisible();

  // 浮水印預設開啟且在圖内；關閉 toggle 後消失
  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toContainText('tiglet.vercel.app');
  await page.getByLabel('顯示站名浮水印').uncheck();
  await expect(page.getByRole('img', { name: '賽段剖面圖' })).not.toContainText('tiglet.vercel.app');
  await page.getByLabel('顯示站名浮水印').check();

  // 最陡 1km 標注：預設畫進圖裡（5% 爬坡段）；toggle 關閉後消失
  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toContainText(/最陡 1km 5\.\d%/);
  await page.getByLabel('標注最陡 1km').uncheck();
  await expect(page.getByRole('img', { name: '賽段剖面圖' })).not.toContainText(/最陡 1km/);
  await page.getByLabel('標注最陡 1km').check();

  // 游標互動：滑到圖中央顯示 km/海拔/坡度讀數
  const chart = page.getByRole('img', { name: '賽段剖面圖' });
  const box = (await chart.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(chart).toContainText(/\d+\.\d km ・ \d+ m ・ -?\d+\.\d%/);
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

test('TCX 檔也能生成剖面圖', async ({ page }) => {
  await page.goto('/tools/stage-profile');
  await waitForIslands(page);

  const M_PER_DEG_LAT = 111_320;
  const pts: string[] = [];
  let lat = 25.0;
  let ele = 100;
  for (let i = 0; i < 120; i++) {
    lat += 50 / M_PER_DEG_LAT;
    ele += 2.5; // 5% 連續爬坡 6km
    pts.push(
      `<Trackpoint><Position><LatitudeDegrees>${lat.toFixed(7)}</LatitudeDegrees><LongitudeDegrees>121.5</LongitudeDegrees></Position><AltitudeMeters>${ele.toFixed(1)}</AltitudeMeters></Trackpoint>`
    );
  }
  const tcx = `<?xml version="1.0"?><TrainingCenterDatabase><Activities><Activity><Lap><Track>${pts.join('')}</Track></Lap></Activity></Activities></TrainingCenterDatabase>`;

  await page.locator('input[type="file"]').setInputFiles({
    name: 'ride.tcx',
    mimeType: 'application/xml',
    buffer: Buffer.from(tcx, 'utf-8'),
  });

  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toBeVisible();
  await expect(page.getByPlaceholder('例如：2026-07-06 西進武嶺')).toHaveValue('ride');
});

test('零檔案：載入範例路線直接出圖', async ({ page }) => {
  await page.goto('/tools/stage-profile');
  await waitForIslands(page);

  await page.getByRole('button', { name: /載入範例路線/ }).click();

  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toBeVisible();
  await expect(page.getByPlaceholder('例如：2026-07-06 西進武嶺')).toHaveValue(/範例路線/);
  // 範例自帶一個地標
  await expect(page.getByLabel('地標 1 名稱')).toHaveValue('山腳補給站');
});

test('手動建路線：檢查點直接出圖', async ({ page }) => {
  await page.goto('/tools/stage-profile');
  await waitForIslands(page);

  await page.getByText('或者：手動建路線', { exact: false }).click();
  await page.getByLabel('檢查點 1 距離').fill('0');
  await page.getByLabel('檢查點 1 海拔').fill('100');
  await page.getByLabel('檢查點 2 距離').fill('10');
  await page.getByLabel('檢查點 2 海拔').fill('600');
  await page.getByRole('button', { name: '生成剖面圖' }).click();

  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toBeVisible();
  await expect(page.getByPlaceholder('例如：2026-07-06 西進武嶺')).toHaveValue('手動路線');
  // 10km @5% → 二級坡
  await expect(page.getByText('2 級', { exact: true })).toBeVisible();
});

test('分享連結：開啟 ?r= 即重建剖面圖（標題＋地標）', async ({ page }) => {
  // v1 格式：title|km,ele;…|km,name;…（與 lib/routeShare.ts 對齊）
  const r = ['1', encodeURIComponent('分享測試坡'), '0,100;2,100;10,500;12,500', `6,${encodeURIComponent('中途補給')}`].join('|');
  await page.goto(`/tools/stage-profile?r=${encodeURIComponent(r)}`);
  await waitForIslands(page);

  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toBeVisible();
  await expect(page.getByPlaceholder('例如：2026-07-06 西進武嶺')).toHaveValue('分享測試坡');
  await expect(page.getByLabel('地標 1 名稱')).toHaveValue('中途補給');
  await expect(page.getByRole('img', { name: '賽段剖面圖' })).toContainText(/中途補給 \d+m/);
  // 8km@5% → 二級坡照樣被偵測
  await expect(page.getByText('2 級', { exact: true })).toBeVisible();
  // 出圖後有分享按鈕
  await expect(page.getByRole('button', { name: /複製分享連結/ })).toBeVisible();
});

test('裁切與反轉：2–10km 區段 → 反轉變下坡 → 回復完整路線', async ({ page }) => {
  await page.goto('/tools/stage-profile');
  await waitForIslands(page);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'ride.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(syntheticGpx(), 'utf-8'),
  });
  await expect(page.getByText('12.0 km', { exact: true })).toBeVisible();

  // 裁切 2–10km → 總距離 8.0 km，整段爬坡仍為二級
  await page.getByLabel('裁切起點 km').fill('2');
  await page.getByLabel('裁切終點 km').fill('10');
  await page.getByRole('button', { name: '套用裁切' }).click();
  await expect(page.getByText('8.0 km', { exact: true })).toBeVisible();
  await expect(page.getByText('2 級', { exact: true })).toBeVisible();

  // 反轉 → 爬坡變下坡 → 偵測爬坡歸零
  await page.getByRole('button', { name: '⇄ 反轉方向' }).click();
  await expect(page.getByText('0 段', { exact: true })).toBeVisible();

  // 回復完整路線 → 12 km、一段爬坡
  await page.getByRole('button', { name: '回復完整路線' }).click();
  await expect(page.getByText('12.0 km', { exact: true })).toBeVisible();
  await expect(page.getByText('1 段', { exact: true })).toBeVisible();
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

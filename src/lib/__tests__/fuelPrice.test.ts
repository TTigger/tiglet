import { describe, expect, it } from 'vitest';
import { parseCpcOilJson } from '../fuelPrice';

// 中油 GetOilPriceJson.aspx?type=TodayOilPriceString 的實際回應（2026-07-13 實抓）
const REAL = JSON.stringify({
  PriceUpdate: '7月13日',
  UpOrDown_Html:
    '<div class="ups_and_downs same"><b class="name">本週汽油價格</b><b class="sys">不調整</b><b class="rate"><i></i></b></div>',
  sPrice1: '29.8',
  sPrice2: '31.3',
  sPrice3: '33.3',
  sPrice4: '31.3',
  sPrice5: '28.8',
  sPrice6: '16.3',
  LPGdate: '115年4月2日',
});

describe('parseCpcOilJson', () => {
  it('解析真實回應：六種油品、生效日、調價訊息（HTML 轉純文字）', () => {
    const r = parseCpcOilJson(REAL)!;
    expect(r.prices).toEqual({ gas92: 29.8, gas95: 31.3, gas98: 33.3, alcohol: 31.3, diesel: 28.8, lpg: 16.3 });
    expect(r.updated).toBe('7月13日');
    expect(r.lpgDate).toBe('115年4月2日');
    // 調價訊息絕不原樣輸出 HTML —— 前端不做 innerHTML，這裡就要拆成純文字
    expect(r.trend).toBe('本週汽油價格 不調整');
    expect(r.trend).not.toContain('<');
  });

  it('漲跌訊息帶金額也解得出來', () => {
    const raw = JSON.stringify({
      PriceUpdate: '7月20日',
      UpOrDown_Html: '<div class="ups_and_downs up"><b class="name">本週汽油價格</b><b class="sys">調漲</b><b class="rate">0.1<i>元</i></b></div>',
      sPrice1: '29.9', sPrice2: '31.4', sPrice3: '33.4', sPrice4: '31.4', sPrice5: '28.9', sPrice6: '16.3',
      LPGdate: '115年4月2日',
    });
    expect(parseCpcOilJson(raw)!.trend).toBe('本週汽油價格 調漲 0.1 元');
  });

  it('中油更新中會回空字串價格 → null（官網 JS 也是這樣擋）', () => {
    const raw = JSON.stringify({ PriceUpdate: '', UpOrDown_Html: '', sPrice1: '', sPrice2: '', sPrice3: '', sPrice4: '', sPrice5: '', sPrice6: '', LPGdate: '' });
    expect(parseCpcOilJson(raw)).toBeNull();
  });

  it('非 JSON、缺欄位、非數字 → null', () => {
    expect(parseCpcOilJson('not json')).toBeNull();
    expect(parseCpcOilJson('{}')).toBeNull();
    expect(parseCpcOilJson(JSON.stringify({ sPrice1: 'abc', sPrice2: '1', sPrice3: '1', sPrice4: '1', sPrice5: '1', sPrice6: '1', PriceUpdate: 'x', UpOrDown_Html: '', LPGdate: '' }))).toBeNull();
  });
});

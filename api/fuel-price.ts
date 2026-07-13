import type { VercelRequest, VercelResponse } from '@vercel/node';
// 副檔名不可省：Vercel 以 nodenext 解析 api/，省略會編譯失敗（見 api/tsconfig.json）
import { parseCpcOilJson } from '../src/lib/fuelPrice.js';

// 中油今日牌價代理：固定網址、免金鑰、無使用者輸入（無 SSRF 面），不儲存任何資料。
// 牌價每週一調整，CDN 快取 30 分鐘足夠即時，也不騷擾中油伺服器。

const SOURCE = 'https://www.cpc.com.tw/GetOilPriceJson.aspx?type=TodayOilPriceString';
const TIMEOUT_MS = 8000;
const UA = 'Mozilla/5.0 (compatible; TigletBot/1.0; +https://tiglet.vercel.app)';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let raw: string;
  try {
    const response = await fetch(SOURCE, { signal: controller.signal, headers: { 'User-Agent': UA, Accept: 'application/json,text/plain' } });
    if (!response.ok) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'fetch-failed', status: response.status });
    }
    raw = await response.text();
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'fetch-failed' });
  } finally {
    clearTimeout(timer);
  }

  const info = parseCpcOilJson(raw);
  if (!info) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'parse-failed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
  return res.status(200).json(info);
}

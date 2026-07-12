import type { VercelRequest, VercelResponse } from '@vercel/node';
// 副檔名不可省：Vercel 以 nodenext 解析 api/，省略會編譯失敗（見 api/tsconfig.json）
import { parseInvoiceXml } from '../src/lib/invoice.js';

// 統一發票開獎號碼代理：抓財政部公開 RSS（固定網址、免金鑰），
// 解析成 JSON 回給前端。無使用者輸入，沒有 SSRF 面；不儲存任何資料。
// 開獎兩個月一次，CDN 快取一小時綽綽有餘，也把流量壓到對得起官方伺服器。

const SOURCE = 'https://invoice.etax.nat.gov.tw/invoice.xml';
const TIMEOUT_MS = 8000;
const UA = 'Mozilla/5.0 (compatible; TigletBot/1.0; +https://tiglet.vercel.app)';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let xml: string;
  try {
    const response = await fetch(SOURCE, { signal: controller.signal, headers: { 'User-Agent': UA, Accept: 'application/xml,text/xml' } });
    if (!response.ok) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'fetch-failed', status: response.status });
    }
    xml = await response.text();
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'fetch-failed' });
  } finally {
    clearTimeout(timer);
  }

  const periods = parseInvoiceXml(xml);
  if (periods.length === 0) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'parse-failed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({ periods });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as dns } from 'node:dns';
// 副檔名不可省：Vercel 以 nodenext 解析 api/，省略會編譯失敗（見 api/tsconfig.json）
import { validateFetchUrl, isPrivateIp } from '../src/lib/ssrfGuard.js';

// 網址健檢的抓取代理：無狀態，只把目標網頁的 HTML 抓回來給前端評分。
// 不儲存任何資料。防護：協定/主機白名單 → DNS 解析後複查私有 IP（擋 rebinding）
// → 逾時 → 大小上限 → 只收 text/html → 手動處理重導向並逐跳複查。

const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_REDIRECTS = 3;
const UA = 'Mozilla/5.0 (compatible; TigletBot/1.0; +https://tiglet.vercel.app)';

async function assertPublic(hostname: string): Promise<boolean> {
  try {
    const records = await dns.lookup(hostname, { all: true });
    return records.length > 0 && records.every((r) => !isPrivateIp(r.address));
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const raw = typeof req.query.url === 'string' ? req.query.url : Array.isArray(req.query.url) ? req.query.url[0] : '';
  if (!raw) return res.status(400).json({ error: 'missing-url' });

  let current = raw;
  let response: Response | null = null;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const valid = validateFetchUrl(current);
    if (!valid.ok) return res.status(400).json({ error: valid.reason });
    if (!(await assertPublic(valid.url.hostname))) return res.status(400).json({ error: 'blocked' });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      response = await fetch(valid.url.href, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      });
    } catch {
      clearTimeout(timer);
      return res.status(502).json({ error: 'fetch-failed' });
    }
    clearTimeout(timer);

    // 手動追蹤重導向：每一跳都重新過 SSRF 檢查
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      if (hop === MAX_REDIRECTS) return res.status(502).json({ error: 'too-many-redirects' });
      current = new URL(response.headers.get('location')!, valid.url.href).href;
      continue;
    }
    break;
  }

  if (!response) return res.status(502).json({ error: 'fetch-failed' });
  if (!response.ok) return res.status(502).json({ error: 'http-error', status: response.status });

  const ctype = response.headers.get('content-type') ?? '';
  if (!ctype.includes('text/html') && !ctype.includes('application/xhtml')) {
    return res.status(415).json({ error: 'not-html', contentType: ctype });
  }

  // 讀取內文，超過上限即中止（避免大檔拖垮函式）
  const reader = response.body?.getReader();
  if (!reader) return res.status(502).json({ error: 'no-body' });
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      await reader.cancel();
      break; // 截斷即可，前端仍能解析 <head>
    }
    chunks.push(value);
  }
  const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8');

  return res.status(200).json({ html, finalUrl: response.url || current, truncated: total > MAX_BYTES });
}

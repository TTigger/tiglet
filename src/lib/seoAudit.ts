// 網址健檢評分核心：吃一段 HTML＋原始網址，解析 SEO／社群卡／GEO 三組檢查項，
// 各給紅黃綠（fail/warn/pass）與分數。純函式，用 DOMParser（瀏覽器與測試環境皆可）。
// 文案（標題/說明/建議）由 UI 端依 check id 做雙語對照；這裡只回結構化結果＋數據。

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface Check {
  id: string;
  status: CheckStatus;
  data?: Record<string, string | number>;
}

export interface AuditGroup {
  id: 'seo' | 'social' | 'geo';
  score: number; // 0–100
  checks: Check[];
}

export interface AuditResult {
  score: number; // 三組平均 0–100
  groups: AuditGroup[];
  preview: {
    title: string;
    description: string;
    image: string | null;
    url: string;
    siteName: string;
  };
}

const STATUS_WEIGHT: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 };

function groupScore(checks: Check[]): number {
  if (checks.length === 0) return 100;
  const sum = checks.reduce((a, c) => a + STATUS_WEIGHT[c.status], 0);
  return Math.round((sum / checks.length) * 100);
}

function absolutize(href: string | null, base: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

export function auditHtml(html: string, baseUrl: string): AuditResult {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const head = doc.head;
  const metaContent = (selector: string): string | null => {
    const el = head?.querySelector(selector);
    return el?.getAttribute('content')?.trim() || null;
  };
  const og = (prop: string) => metaContent(`meta[property="og:${prop}"]`);
  const tw = (name: string) => metaContent(`meta[name="twitter:${name}"]`);

  // ---- SEO 組 ----
  const title = (doc.querySelector('title')?.textContent ?? '').trim();
  const desc = metaContent('meta[name="description"]');
  const h1s = doc.querySelectorAll('h1');
  const canonical = head?.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
  const lang = doc.documentElement.getAttribute('lang');
  const viewport = metaContent('meta[name="viewport"]');
  const robots = (metaContent('meta[name="robots"]') ?? '').toLowerCase();
  const imgs = Array.from(doc.querySelectorAll('img'));
  const withAlt = imgs.filter((im) => (im.getAttribute('alt') ?? '').trim() !== '').length;
  const altPct = imgs.length === 0 ? 100 : Math.round((withAlt / imgs.length) * 100);

  const seo: Check[] = [
    {
      id: 'title',
      status: !title ? 'fail' : title.length < 10 || title.length > 60 ? 'warn' : 'pass',
      data: { len: title.length },
    },
    {
      id: 'description',
      status: !desc ? 'fail' : desc.length < 50 || desc.length > 160 ? 'warn' : 'pass',
      data: { len: desc?.length ?? 0 },
    },
    { id: 'h1', status: h1s.length === 0 ? 'fail' : h1s.length > 1 ? 'warn' : 'pass', data: { count: h1s.length } },
    { id: 'canonical', status: canonical ? 'pass' : 'warn' },
    { id: 'lang', status: lang ? 'pass' : 'warn', data: { lang: lang ?? '' } },
    { id: 'viewport', status: viewport ? 'pass' : 'fail' },
    { id: 'robots', status: robots.includes('noindex') ? 'warn' : 'pass' },
    { id: 'img-alt', status: imgs.length === 0 ? 'pass' : altPct === 100 ? 'pass' : altPct >= 50 ? 'warn' : 'fail', data: { pct: altPct, total: imgs.length } },
  ];

  // ---- 社群卡組（OG / Twitter）----
  const ogTitle = og('title');
  const ogDesc = og('description');
  const ogImage = og('image');
  const ogUrl = og('url');
  const ogType = og('type');
  const ogSite = og('site_name');
  const twCard = tw('card');

  const social: Check[] = [
    { id: 'og-title', status: ogTitle ? 'pass' : 'fail' },
    { id: 'og-description', status: ogDesc ? 'pass' : 'fail' },
    { id: 'og-image', status: ogImage ? 'pass' : 'fail' },
    { id: 'og-url', status: ogUrl ? 'pass' : 'warn' },
    { id: 'og-type', status: ogType ? 'pass' : 'warn' },
    { id: 'twitter-card', status: twCard ? 'pass' : 'warn', data: { card: twCard ?? '' } },
  ];

  // ---- GEO 組（為 AI 生成引擎優化）----
  const jsonLd = doc.querySelectorAll('script[type="application/ld+json"]');
  let jsonLdValid = false;
  jsonLd.forEach((s) => {
    try {
      JSON.parse(s.textContent ?? '');
      jsonLdValid = true;
    } catch {
      /* 無效的 JSON-LD 不計 */
    }
  });
  const hasMain = !!doc.querySelector('main, article');
  const levels = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => Number(h.tagName[1]));
  let skips = false;
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skips = true;
  const published = metaContent('meta[property="article:published_time"]') || metaContent('meta[name="date"]');
  const author = metaContent('meta[name="author"]') || og('article:author');

  const geo: Check[] = [
    { id: 'structured-data', status: jsonLdValid ? 'pass' : 'fail', data: { count: jsonLd.length } },
    { id: 'semantic-main', status: hasMain ? 'pass' : 'warn' },
    { id: 'heading-order', status: levels.length === 0 ? 'warn' : skips ? 'warn' : 'pass' },
    { id: 'author-date', status: published || author ? 'pass' : 'warn' },
  ];

  const groups: AuditGroup[] = [
    { id: 'seo', score: groupScore(seo), checks: seo },
    { id: 'social', score: groupScore(social), checks: social },
    { id: 'geo', score: groupScore(geo), checks: geo },
  ];
  const score = Math.round(groups.reduce((a, g) => a + g.score, 0) / groups.length);

  return {
    score,
    groups,
    preview: {
      title: ogTitle || title || '',
      description: ogDesc || desc || '',
      image: absolutize(ogImage || tw('image'), baseUrl),
      url: ogUrl || baseUrl,
      siteName: ogSite || (() => { try { return new URL(baseUrl).hostname; } catch { return ''; } })(),
    },
  };
}

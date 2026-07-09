import { describe, it, expect } from 'vitest';
import { auditHtml, type AuditResult } from '../seoAudit';

function check(r: AuditResult, groupId: string, checkId: string) {
  return r.groups.find((g) => g.id === groupId)!.checks.find((c) => c.id === checkId)!;
}

const PERFECT = `<!doctype html><html lang="zh-Hant"><head>
<title>完美的頁面標題示範（十到六十字）</title>
<meta name="description" content="這是一段長度介於五十到一百六十字之間、能通過檢查的中文說明文字，描述本頁內容重點與價值，足夠具體且不過長。">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://ex.com/">
<meta property="og:title" content="OG 標題">
<meta property="og:description" content="OG 說明">
<meta property="og:image" content="/img/card.png">
<meta property="og:url" content="https://ex.com/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Example">
<meta name="twitter:card" content="summary_large_image">
<meta property="article:published_time" content="2026-07-09">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>
</head><body><main><h1>唯一標題</h1><h2>小節</h2><img src="a.png" alt="有替代文字"></main></body></html>`;

const BARE = `<!doctype html><html><head><title>短</title></head>
<body><h1>一</h1><h1>二</h1><img src="a.png"><img src="b.png"></body></html>`;

describe('auditHtml — 完美頁面', () => {
  const r = auditHtml(PERFECT, 'https://ex.com/');

  it('三組皆滿分、總分 100', () => {
    expect(r.score).toBe(100);
    for (const g of r.groups) expect(g.score, g.id).toBe(100);
  });

  it('相對 og:image 轉為絕對網址供預覽', () => {
    expect(r.preview.image).toBe('https://ex.com/img/card.png');
    expect(r.preview.title).toBe('OG 標題');
    expect(r.preview.siteName).toBe('Example');
  });
});

describe('auditHtml — 稀缺頁面', () => {
  const r = auditHtml(BARE, 'https://bare.example/path');

  it('標題過短→warn、描述缺→fail、viewport 缺→fail', () => {
    expect(check(r, 'seo', 'title').status).toBe('warn');
    expect(check(r, 'seo', 'description').status).toBe('fail');
    expect(check(r, 'seo', 'viewport').status).toBe('fail');
  });

  it('多個 h1→warn；圖片皆無 alt→fail', () => {
    expect(check(r, 'seo', 'h1').status).toBe('warn');
    const alt = check(r, 'seo', 'img-alt');
    expect(alt.status).toBe('fail');
    expect(alt.data).toEqual({ pct: 0, total: 2 });
  });

  it('OG 全缺→社群卡三個必填項 fail', () => {
    expect(check(r, 'social', 'og-title').status).toBe('fail');
    expect(check(r, 'social', 'og-image').status).toBe('fail');
    // 三個必填 fail(0) + 三個選填 warn(0.5) → 1.5/6 = 25
    expect(r.groups.find((g) => g.id === 'social')!.score).toBe(25);
  });

  it('無 JSON-LD→structured-data fail；無 main→warn', () => {
    expect(check(r, 'geo', 'structured-data').status).toBe('fail');
    expect(check(r, 'geo', 'semantic-main').status).toBe('warn');
  });

  it('無 og:url 時 preview.url 退回原始網址、siteName 用主機名', () => {
    expect(r.preview.url).toBe('https://bare.example/path');
    expect(r.preview.siteName).toBe('bare.example');
  });
});

describe('auditHtml — 邊界', () => {
  it('noindex 觸發 robots warn', () => {
    const r = auditHtml('<html><head><title>t</title><meta name="robots" content="noindex,follow"></head><body></body></html>', 'https://x.com');
    expect(check(r, 'seo', 'robots').status).toBe('warn');
  });

  it('跳級標題（h1→h3）觸發 heading-order warn', () => {
    const r = auditHtml('<html><head><title>title here ok</title></head><body><h1>a</h1><h3>b</h3></body></html>', 'https://x.com');
    expect(check(r, 'geo', 'heading-order').status).toBe('warn');
  });

  it('無圖片時 img-alt 視為 pass', () => {
    const r = auditHtml('<html><head><title>title here ok</title></head><body><p>x</p></body></html>', 'https://x.com');
    expect(check(r, 'seo', 'img-alt').status).toBe('pass');
  });

  it('壞掉的 JSON-LD 不算通過', () => {
    const r = auditHtml('<html><head><title>t</title><script type="application/ld+json">{bad</script></head><body></body></html>', 'https://x.com');
    expect(check(r, 'geo', 'structured-data').status).toBe('fail');
  });
});

import { useState } from 'react';
import { auditHtml, type AuditResult, type Check, type CheckStatus } from '../lib/seoAudit';
import type { Locale } from '../lib/i18n';

type CheckCopy = { label: string; hint: (s: CheckStatus, d?: Record<string, string | number>) => string };

const L = {
  zh: {
    title: '網址健檢',
    placeholder: '貼上網址，例如 https://example.com',
    run: '開始健檢',
    running: '抓取與分析中…',
    privacy: '網址會經我們的伺服器抓取該頁 HTML 後在你的瀏覽器分析，我們不儲存任何資料。',
    errors: {
      'missing-url': '請輸入網址。',
      invalid: '這不是有效的網址。',
      scheme: '只支援 http 與 https 網址。',
      blocked: '無法檢查內網或保留位址的網址。',
      'fetch-failed': '抓取失敗，請確認網址可公開連線。',
      'http-error': '目標網站回應了錯誤狀態。',
      'not-html': '這個網址不是 HTML 網頁。',
      'too-many-redirects': '重導向次數過多。',
      generic: '發生錯誤，請稍後再試。',
    } as Record<string, string>,
    scoreLabel: '總分',
    groupNames: { seo: 'SEO 搜尋引擎', social: '社群分享卡', geo: 'GEO・AI 引擎' } as Record<string, string>,
    previewTitle: '社群分享預覽',
    previewNote: '貼到 Facebook／X（Twitter）／LINE 時，分享卡大致長這樣。',
    noImage: '沒有 og:image——分享時不會有預覽大圖',
    advice: '建議',
    checks: {
      title: { label: '網頁標題 title', hint: (s, d) => (s === 'fail' ? '缺少 <title>' : s === 'warn' ? `目前 ${d?.len} 字，建議 10–60 字` : `長度 ${d?.len} 字，良好`) },
      description: { label: 'meta description', hint: (s, d) => (s === 'fail' ? '缺少 meta description' : s === 'warn' ? `目前 ${d?.len} 字，建議 50–160 字` : `長度 ${d?.len} 字，良好`) },
      h1: { label: 'H1 主標題', hint: (s, d) => (s === 'fail' ? '找不到 H1' : s === 'warn' ? `有 ${d?.count} 個 H1，建議只用一個` : '恰好一個 H1，良好') },
      canonical: { label: 'canonical 標準網址', hint: (s) => (s === 'pass' ? '已設定' : '未設定，可能造成重複內容') },
      lang: { label: 'html lang 語系', hint: (s, d) => (s === 'pass' ? `已標示（${d?.lang}）` : '未標示語系') },
      viewport: { label: 'viewport 行動裝置', hint: (s) => (s === 'pass' ? '已設定' : '缺少 viewport，行動裝置顯示會跑版') },
      robots: { label: 'robots 索引設定', hint: (s) => (s === 'warn' ? '含 noindex，這頁不會被搜尋引擎收錄' : '允許索引') },
      'img-alt': { label: '圖片替代文字 alt', hint: (s, d) => (Number(d?.total) === 0 ? '頁面沒有圖片' : `${d?.pct}% 的圖片有 alt（共 ${d?.total} 張）`) },
      'og-title': { label: 'og:title', hint: (s) => (s === 'pass' ? '已設定' : '缺少，分享卡沒有標題') },
      'og-description': { label: 'og:description', hint: (s) => (s === 'pass' ? '已設定' : '缺少，分享卡沒有說明') },
      'og-image': { label: 'og:image', hint: (s) => (s === 'pass' ? '已設定' : '缺少，分享卡沒有預覽圖') },
      'og-url': { label: 'og:url', hint: (s) => (s === 'pass' ? '已設定' : '未設定') },
      'og-type': { label: 'og:type', hint: (s) => (s === 'pass' ? '已設定' : '未設定') },
      'twitter-card': { label: 'twitter:card', hint: (s, d) => (s === 'pass' ? `已設定（${d?.card}）` : '未設定，建議用 summary_large_image') },
      'structured-data': { label: 'JSON-LD 結構化資料', hint: (s, d) => (s === 'pass' ? `偵測到 ${d?.count} 組` : '無結構化資料，AI 引擎較難理解內容') },
      'semantic-main': { label: '語意化 main／article', hint: (s) => (s === 'pass' ? '有主內容標籤' : '缺少 <main>／<article>，主內容不明確') },
      'heading-order': { label: '標題層級', hint: (s) => (s === 'pass' ? '層級連貫' : '標題層級有跳級（如 H1 直接到 H3）') },
      'author-date': { label: '作者／發佈日期', hint: (s) => (s === 'pass' ? '有作者或日期資訊' : '缺少作者或發佈時間，可信度較低') },
    } as Record<string, CheckCopy>,
  },
  en: {
    title: 'URL Audit',
    placeholder: 'Paste a URL, e.g. https://example.com',
    run: 'Run audit',
    running: 'Fetching and analyzing…',
    privacy: 'Your URL is fetched by our server to retrieve the page HTML, then analyzed in your browser. We store nothing.',
    errors: {
      'missing-url': 'Please enter a URL.',
      invalid: 'That is not a valid URL.',
      scheme: 'Only http and https URLs are supported.',
      blocked: 'Cannot audit internal or reserved addresses.',
      'fetch-failed': 'Fetch failed — make sure the URL is publicly reachable.',
      'http-error': 'The target site returned an error status.',
      'not-html': 'This URL is not an HTML page.',
      'too-many-redirects': 'Too many redirects.',
      generic: 'Something went wrong, please try again.',
    } as Record<string, string>,
    scoreLabel: 'Score',
    groupNames: { seo: 'SEO', social: 'Social cards', geo: 'GEO · AI engines' } as Record<string, string>,
    previewTitle: 'Social share preview',
    previewNote: 'This is roughly how the share card looks on Facebook / X / LINE.',
    noImage: 'No og:image — no preview thumbnail when shared',
    advice: 'Fix',
    checks: {
      title: { label: 'Page <title>', hint: (s, d) => (s === 'fail' ? 'Missing <title>' : s === 'warn' ? `${d?.len} chars now, aim for 10–60` : `${d?.len} chars, good`) },
      description: { label: 'meta description', hint: (s, d) => (s === 'fail' ? 'Missing meta description' : s === 'warn' ? `${d?.len} chars now, aim for 50–160` : `${d?.len} chars, good`) },
      h1: { label: 'H1 heading', hint: (s, d) => (s === 'fail' ? 'No H1 found' : s === 'warn' ? `${d?.count} H1s, use just one` : 'Exactly one H1, good') },
      canonical: { label: 'canonical link', hint: (s) => (s === 'pass' ? 'Set' : 'Not set, may cause duplicate content') },
      lang: { label: 'html lang', hint: (s, d) => (s === 'pass' ? `Set (${d?.lang})` : 'Language not declared') },
      viewport: { label: 'viewport', hint: (s) => (s === 'pass' ? 'Set' : 'Missing viewport, mobile layout breaks') },
      robots: { label: 'robots directive', hint: (s) => (s === 'warn' ? 'Has noindex — this page will not be indexed' : 'Indexable') },
      'img-alt': { label: 'Image alt text', hint: (s, d) => (Number(d?.total) === 0 ? 'No images on the page' : `${d?.pct}% of images have alt (${d?.total} total)`) },
      'og-title': { label: 'og:title', hint: (s) => (s === 'pass' ? 'Set' : 'Missing — share card has no title') },
      'og-description': { label: 'og:description', hint: (s) => (s === 'pass' ? 'Set' : 'Missing — share card has no description') },
      'og-image': { label: 'og:image', hint: (s) => (s === 'pass' ? 'Set' : 'Missing — share card has no image') },
      'og-url': { label: 'og:url', hint: (s) => (s === 'pass' ? 'Set' : 'Not set') },
      'og-type': { label: 'og:type', hint: (s) => (s === 'pass' ? 'Set' : 'Not set') },
      'twitter-card': { label: 'twitter:card', hint: (s, d) => (s === 'pass' ? `Set (${d?.card})` : 'Not set, use summary_large_image') },
      'structured-data': { label: 'JSON-LD structured data', hint: (s, d) => (s === 'pass' ? `${d?.count} block(s) found` : 'None — AI engines struggle to parse content') },
      'semantic-main': { label: 'Semantic main/article', hint: (s) => (s === 'pass' ? 'Main content tag present' : 'Missing <main>/<article>') },
      'heading-order': { label: 'Heading hierarchy', hint: (s) => (s === 'pass' ? 'Consistent' : 'Levels skip (e.g. H1 to H3)') },
      'author-date': { label: 'Author / date', hint: (s) => (s === 'pass' ? 'Author or date present' : 'No author or publish time') },
    } as Record<string, CheckCopy>,
  },
} as const;
type Dict = (typeof L)[Locale];

const DOT: Record<CheckStatus, string> = { pass: 'bg-green-500', warn: 'bg-amber-500', fail: 'bg-red-500' };
const scoreColor = (n: number) => (n >= 80 ? 'text-green-600' : n >= 50 ? 'text-amber-500' : 'text-red-500');

function CheckRow({ c, t }: { c: Check; t: Dict }) {
  const copy = t.checks[c.id];
  if (!copy) return null;
  return (
    <li className="flex items-start gap-2 py-1.5">
      <span className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT[c.status]}`} />
      <div className="min-w-0 flex-1">
        <span className="text-sm text-ink">{copy.label}</span>
        <span className="ml-2 text-xs text-muted">{copy.hint(c.status, c.data)}</span>
      </div>
    </li>
  );
}

export default function UrlAudit({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);

  async function run() {
    const target = url.trim();
    if (!target) { setError(t.errors['missing-url']); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const withScheme = /^https?:\/\//i.test(target) ? target : `https://${target}`;
      const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(withScheme)}`);
      const data = await res.json();
      if (!res.ok) { setError(t.errors[data.error] ?? t.errors.generic); return; }
      setResult(auditHtml(data.html, data.finalUrl ?? withScheme));
    } catch {
      setError(t.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  const p = result?.preview;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder={t.placeholder}
          aria-label={t.title}
          className="flex-1 rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-accent"
        />
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2.5 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          {loading ? t.running : t.run}
        </button>
      </div>
      <p className="text-xs text-muted">{t.privacy}</p>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && p && (
        <div className="space-y-5">
          {/* 總分 */}
          <div className="flex items-center justify-center gap-3 rounded-[var(--radius-card)] border border-edge bg-surface py-6">
            <span className={`font-mono text-5xl font-bold tabular-nums ${scoreColor(result.score)}`}>{result.score}</span>
            <span className="text-sm text-muted">/ 100<br />{t.scoreLabel}</span>
          </div>

          {/* 社群卡模擬預覽 */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">{t.previewTitle}</h3>
            <div className="overflow-hidden rounded-lg border border-edge bg-surface">
              {p.image ? (
                <img src={p.image} alt="" className="aspect-[1.91/1] w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-bg text-center text-xs text-muted">{t.noImage}</div>
              )}
              <div className="border-t border-edge px-3 py-2">
                <div className="text-xs uppercase text-muted">{p.siteName}</div>
                <div className="truncate text-sm font-semibold text-ink">{p.title || '—'}</div>
                <div className="line-clamp-2 text-xs text-muted">{p.description}</div>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted">{t.previewNote}</p>
          </div>

          {/* 三組檢查 */}
          <div className="grid gap-4 sm:grid-cols-3">
            {result.groups.map((g) => (
              <div key={g.id} className="rounded-[var(--radius-card)] border border-edge bg-surface p-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-ink">{t.groupNames[g.id]}</h3>
                  <span className={`font-mono text-lg font-bold tabular-nums ${scoreColor(g.score)}`}>{g.score}</span>
                </div>
                <ul className="divide-y divide-edge">
                  {g.checks.map((c) => <CheckRow key={c.id} c={c} t={t} />)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

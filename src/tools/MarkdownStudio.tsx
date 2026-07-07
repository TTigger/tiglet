import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import Tabs from '../components/Tabs';
import CopyButton from '../components/CopyButton';
import TreeView, { type TreeViewNode } from '../components/TreeView';
import { extractOutline, mdStats, type OutlineNode } from '../lib/markdown';
import { textStats } from '../lib/textStats';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    placeholder: '貼上 Markdown，或用右上角上傳 .md 檔…',
    ariaInput: 'Markdown 輸入',
    fillExample: '填入範例',
    upload: '上傳 .md',
    sample: `# 我的筆記\n\n## 今天的騎乘\n爬了 **風櫃嘴**，均速還行。\n\n### 補給\n- 香蕉 ×2\n- 能量膠 ×1\n\n## 下週計畫\n1. 間歇訓練\n2. [看路線](https://example.com)\n`,
    renderError: '渲染失敗，請確認 Markdown 內容',
    tabPreview: '預覽',
    tabOutline: '結構',
    tabStats: '統計',
    preview: '預覽',
    outlineHint: '點任意標題跳到預覽對應位置',
    noHeadings: '沒有偵測到標題（# 開頭的行）',
    statHeadings: '標題',
    statLinks: '連結',
    statImages: '圖片',
    statCodeBlocks: '程式碼區塊',
    statCjk: '中文字數',
    statWords: '英文單字',
    statLines: '行數',
    statParagraphs: '段落',
    footnote: '渲染結果經 DOMPurify 清洗（HTML/script 一律過濾）；檔案只在你的瀏覽器處理。',
  },
  en: {
    placeholder: 'Paste Markdown, or upload a .md file from the top right…',
    ariaInput: 'Markdown input',
    fillExample: 'Fill example',
    upload: 'Upload .md',
    sample: `# Ride notes\n\n## Today's ride\nClimbed **Fengguizui** — average speed was decent.\n\n### Fuel\n- Bananas ×2\n- Energy gel ×1\n\n## Next week\n1. Interval training\n2. [Route map](https://example.com)\n`,
    renderError: 'Rendering failed — please check the Markdown content',
    tabPreview: 'Preview',
    tabOutline: 'Outline',
    tabStats: 'Stats',
    preview: 'Preview',
    outlineHint: 'Click any heading to jump to it in the preview',
    noHeadings: 'No headings detected (lines starting with #)',
    statHeadings: 'Headings',
    statLinks: 'Links',
    statImages: 'Images',
    statCodeBlocks: 'Code blocks',
    statCjk: 'CJK characters',
    statWords: 'English words',
    statLines: 'Lines',
    statParagraphs: 'Paragraphs',
    footnote: 'Rendered output is sanitized with DOMPurify (raw HTML/scripts are always stripped); files are processed entirely in your browser.',
  },
} as const;

const areaClass =
  'w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 font-mono text-sm text-ink outline-none focus:border-accent';

const LEVEL_BADGES = ['bg-accent text-white', 'bg-sky-600 text-white', 'bg-green-600 text-white', 'bg-amber-500 text-white', 'bg-purple-600 text-white', 'bg-slate-400 text-white'];

function toTreeViewNode(n: OutlineNode): TreeViewNode {
  return {
    id: String(n.index),
    label: n.text,
    badge: `H${n.level}`,
    badgeClass: LEVEL_BADGES[n.level - 1],
    children: n.children.map(toTreeViewNode),
  };
}

export default function MarkdownStudio({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [md, setMd] = useState('');
  const [tab, setTab] = useState('preview');
  const [html, setHtml] = useState('');
  const [renderError, setRenderError] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef<number | null>(null);

  // 渲染管線：marked（動態載入）→ DOMPurify 清洗 → 才進 DOM
  useEffect(() => {
    let cancelled = false;
    if (!md.trim()) {
      setHtml('');
      return;
    }
    (async () => {
      try {
        const [{ marked }, { default: DOMPurify }] = await Promise.all([import('marked'), import('dompurify')]);
        const raw = await marked.parse(md, { gfm: true });
        if (!cancelled) {
          setHtml(DOMPurify.sanitize(raw));
          setRenderError('');
        }
      } catch {
        if (!cancelled) setRenderError(t.renderError);
      }
    })();
    return () => { cancelled = true; };
  }, [md]);

  // 從結構樹跳到預覽對應標題
  useEffect(() => {
    if (tab !== 'preview' || pendingScroll.current === null || !previewRef.current) return;
    const headings = previewRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings[pendingScroll.current]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    pendingScroll.current = null;
  }, [tab, html]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMd(await file.text());
    e.target.value = '';
  }

  function onOutlineSelect(node: TreeViewNode) {
    pendingScroll.current = Number(node.id);
    setTab('preview');
  }

  const outline = extractOutline(md);
  const stats = mdStats(md);
  const ts = textStats(md);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="relative">
        <textarea
          value={md}
          onChange={(e) => setMd(e.target.value)}
          rows={10}
          placeholder={t.placeholder}
          className={areaClass}
          aria-label={t.ariaInput}
        />
        <div className="absolute right-3 top-3 flex gap-3 text-xs">
          {!md && (
            <button onClick={() => setMd(t.sample)} className="text-muted hover:text-accent">{t.fillExample}</button>
          )}
          <label className="cursor-pointer text-muted hover:text-accent">
            {t.upload}
            <input type="file" accept=".md,.markdown,.txt" onChange={onFile} className="hidden" />
          </label>
        </div>
      </div>

      {md.trim() && (
        <>
          <div className="flex justify-center">
            <Tabs
              tabs={[
                { id: 'preview', label: t.tabPreview },
                { id: 'outline', label: t.tabOutline },
                { id: 'stats', label: t.tabStats },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          {tab === 'preview' && (
            <div className="rounded-[var(--radius-card)] border border-edge bg-surface">
              <div className="flex items-center justify-between border-b border-edge px-4 py-2">
                <span className="text-sm text-muted">{t.preview}</span>
                {html && !renderError && <CopyButton value={html} />}
              </div>
              <div className="px-6 py-4">
                {renderError ? (
                  <p className="text-sm text-red-500">{renderError}</p>
                ) : (
                  <div ref={previewRef} className="md-preview max-h-[36rem] overflow-y-auto" dangerouslySetInnerHTML={{ __html: html }} />
                )}
              </div>
            </div>
          )}

          {tab === 'outline' && (
            <div className="rounded-[var(--radius-card)] border border-edge bg-surface">
              <div className="border-b border-edge px-4 py-2 text-sm text-muted">{t.outlineHint}</div>
              <div className="max-h-[32rem] overflow-y-auto px-2 py-1">
                {outline.length ? (
                  <TreeView nodes={outline.map(toTreeViewNode)} onSelect={onOutlineSelect} />
                ) : (
                  <p className="px-3 py-4 text-sm text-muted">{t.noHeadings}</p>
                )}
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [t.statHeadings, stats.headings],
                [t.statLinks, stats.links],
                [t.statImages, stats.images],
                [t.statCodeBlocks, stats.codeBlocks],
                [t.statCjk, ts.cjkChars],
                [t.statWords, ts.latinWords],
                [t.statLines, ts.lines],
                [t.statParagraphs, ts.paragraphs],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-edge bg-surface px-3 py-3 text-center">
                  <div className="font-mono text-2xl tabular-nums text-ink">{value}</div>
                  <div className="mt-1 text-xs text-muted">{label}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted">{t.footnote}</p>
    </div>
  );
}

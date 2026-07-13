import { useState } from 'react';
import Tabs from '../components/Tabs';
import { parsePageRanges } from '../lib/pdfPages';
import { mergePdfs, extractPages, rotatePdf, pdfPageCount } from '../lib/pdfOps';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    tabMerge: '合併',
    tabSplit: '拆分',
    tabRotate: '旋轉',
    addFiles: '選擇 PDF 檔案（可多選）',
    addFile: '選擇 PDF 檔案',
    pages: (n: number) => `${n} 頁`,
    up: '上移',
    down: '下移',
    remove: '移除',
    fileAria: (name: string) => `檔案 ${name}`,
    mergeBtn: '合併下載',
    mergeHint: '依清單順序合併，可用上移／下移調整。',
    rangeLabel: '要抽出的頁碼',
    rangePlaceholder: '例如 1-3, 7, 10-12',
    rangeInvalid: '頁碼格式不對或超出範圍，請用「1-3, 7」這樣的寫法。',
    splitBtn: '抽出頁面下載',
    rotateAngle: '旋轉角度',
    rotateRange: '頁碼（留空＝全部頁面）',
    rotateBtn: '旋轉下載',
    working: '處理中…',
    loadError: '這個檔案無法讀取，可能不是有效的 PDF 或有密碼保護。',
    privacy: '所有處理都在你的瀏覽器本機完成，PDF 不會上傳到任何伺服器。',
    deg: (d: number) => `${d}°`,
  },
  en: {
    tabMerge: 'Merge',
    tabSplit: 'Split',
    tabRotate: 'Rotate',
    addFiles: 'Choose PDF files (multiple allowed)',
    addFile: 'Choose a PDF file',
    pages: (n: number) => `${n} page${n === 1 ? '' : 's'}`,
    up: 'Up',
    down: 'Down',
    remove: 'Remove',
    fileAria: (name: string) => `File ${name}`,
    mergeBtn: 'Merge & download',
    mergeHint: 'Merged in list order — use Up / Down to rearrange.',
    rangeLabel: 'Pages to extract',
    rangePlaceholder: 'e.g. 1-3, 7, 10-12',
    rangeInvalid: 'Invalid page range — use the “1-3, 7” format within the page count.',
    splitBtn: 'Extract & download',
    rotateAngle: 'Rotation',
    rotateRange: 'Pages (empty = all pages)',
    rotateBtn: 'Rotate & download',
    working: 'Working…',
    loadError: 'Could not read this file — it may not be a valid PDF, or it is password-protected.',
    privacy: 'Everything happens locally in your browser — your PDFs are never uploaded.',
    deg: (d: number) => `${d}°`,
  },
} as const;
type Dict = (typeof L)[Locale];

interface Loaded {
  name: string;
  bytes: Uint8Array;
  pages: number;
}

const btn = 'rounded-lg border border-edge px-4 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-ink';
const primaryBtn = 'rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40';
const smallBtn = 'rounded border border-edge px-2 py-0.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-edge disabled:hover:text-muted';
const inputClass = 'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none transition-colors focus:border-accent';

function download(bytes: Uint8Array, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function loadFile(file: File): Promise<Loaded> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { name: file.name, bytes, pages: await pdfPageCount(bytes) };
}

function baseName(name: string): string {
  return name.replace(/\.pdf$/i, '');
}

function FilePicker({ label, multiple, onFiles, t }: { label: string; multiple: boolean; onFiles: (files: Loaded[]) => void; t: Dict }) {
  const [error, setError] = useState('');
  return (
    <div>
      <label className="block w-full cursor-pointer rounded-[var(--radius-card)] border-2 border-dashed border-edge px-6 py-8 text-center text-sm text-muted transition-colors hover:border-accent hover:text-accent">
        {label}
        <input
          type="file"
          accept="application/pdf,.pdf"
          multiple={multiple}
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (files.length === 0) return;
            setError('');
            try {
              onFiles(await Promise.all(files.map(loadFile)));
            } catch {
              setError(t.loadError);
            }
          }}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function MergePanel({ t }: { t: Dict }) {
  const [files, setFiles] = useState<Loaded[]>([]);
  const [busy, setBusy] = useState(false);

  function move(i: number, dir: -1 | 1) {
    setFiles((fs) => {
      const next = [...fs];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <FilePicker label={t.addFiles} multiple onFiles={(f) => setFiles((fs) => [...fs, ...f])} t={t} />
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} aria-label={t.fileAria(f.name)} className="flex flex-wrap items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{f.name}</span>
              <span className="text-xs text-muted">{t.pages(f.pages)}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className={smallBtn}>{t.up}</button>
              <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className={smallBtn}>{t.down}</button>
              <button onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} className={smallBtn}>{t.remove}</button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">{t.mergeHint}</p>
      <button
        onClick={async () => {
          setBusy(true);
          try {
            download(await mergePdfs(files.map((f) => f.bytes)), `${baseName(files[0].name)}-merged.pdf`);
          } finally {
            setBusy(false);
          }
        }}
        disabled={files.length < 2 || busy}
        className={primaryBtn}
      >
        {busy ? t.working : t.mergeBtn}
      </button>
    </div>
  );
}

function SplitPanel({ t }: { t: Dict }) {
  const [file, setFile] = useState<Loaded | null>(null);
  const [range, setRange] = useState('');
  const [busy, setBusy] = useState(false);

  const pages = file && range.trim() !== '' ? parsePageRanges(range, file.pages) : null;
  const invalid = file !== null && range.trim() !== '' && pages === null;

  return (
    <div className="space-y-4">
      <FilePicker label={t.addFile} multiple={false} onFiles={(f) => setFile(f[0])} t={t} />
      {file && (
        <>
          <p className="text-sm text-muted">
            {file.name} ・ {t.pages(file.pages)}
          </p>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{t.rangeLabel}</span>
            <input value={range} onChange={(e) => setRange(e.target.value)} placeholder={t.rangePlaceholder} className={inputClass} />
          </label>
          {invalid && <p className="text-sm text-red-500">{t.rangeInvalid}</p>}
          <button
            onClick={async () => {
              setBusy(true);
              try {
                download(await extractPages(file.bytes, pages!), `${baseName(file.name)}-p${range.replace(/\s+/g, '')}.pdf`);
              } finally {
                setBusy(false);
              }
            }}
            disabled={!pages || busy}
            className={primaryBtn}
          >
            {busy ? t.working : t.splitBtn}
          </button>
        </>
      )}
    </div>
  );
}

function RotatePanel({ t }: { t: Dict }) {
  const [file, setFile] = useState<Loaded | null>(null);
  const [angle, setAngle] = useState(90);
  const [range, setRange] = useState('');
  const [busy, setBusy] = useState(false);

  const pages = file && range.trim() !== '' ? parsePageRanges(range, file.pages) : undefined;
  const invalid = file !== null && range.trim() !== '' && pages === null;

  return (
    <div className="space-y-4">
      <FilePicker label={t.addFile} multiple={false} onFiles={(f) => setFile(f[0])} t={t} />
      {file && (
        <>
          <p className="text-sm text-muted">
            {file.name} ・ {t.pages(file.pages)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-muted">{t.rotateAngle}</span>
              <select value={angle} onChange={(e) => setAngle(Number(e.target.value))} className={inputClass}>
                {[90, 180, 270].map((d) => (
                  <option key={d} value={d}>{t.deg(d)}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-muted">{t.rotateRange}</span>
              <input value={range} onChange={(e) => setRange(e.target.value)} placeholder={t.rangePlaceholder} className={inputClass} />
            </label>
          </div>
          {invalid && <p className="text-sm text-red-500">{t.rangeInvalid}</p>}
          <button
            onClick={async () => {
              setBusy(true);
              try {
                download(await rotatePdf(file.bytes, angle, pages ?? undefined), `${baseName(file.name)}-rotated.pdf`);
              } finally {
                setBusy(false);
              }
            }}
            disabled={invalid || busy}
            className={primaryBtn}
          >
            {busy ? t.working : t.rotateBtn}
          </button>
        </>
      )}
    </div>
  );
}

export default function PdfStudio({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [tab, setTab] = useState('merge');
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex justify-center">
        <Tabs
          tabs={[
            { id: 'merge', label: t.tabMerge },
            { id: 'split', label: t.tabSplit },
            { id: 'rotate', label: t.tabRotate },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'merge' && <MergePanel t={t} />}
      {tab === 'split' && <SplitPanel t={t} />}
      {tab === 'rotate' && <RotatePanel t={t} />}
      <p className="text-center text-xs text-muted">{t.privacy}</p>
    </div>
  );
}

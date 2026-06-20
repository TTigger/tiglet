import { useEffect, useRef, useState } from 'react';
import Tabs from '../components/Tabs';
import {
  computeResize,
  formatBytes,
  reductionPercent,
  renameExt,
  supportsQuality,
  extForMime,
  FORMAT_MIME,
  type ImageFormat,
  type ResizeMode,
} from '../lib/image';

interface Source {
  url: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  img: HTMLImageElement;
}

interface Output {
  url: string;
  size: number;
  width: number;
  height: number;
  ext: string;
  name: string;
}

const ENCODABLE = ['image/jpeg', 'image/png', 'image/webp'];
const safeMime = (type: string) => (ENCODABLE.includes(type) ? type : 'image/png');

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2 font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent';

async function render(img: HTMLImageElement, width: number, height: number, mime: string, quality: number): Promise<{ blob: Blob; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'; // JPEG has no alpha — flatten onto white
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, quality));
  if (!blob) throw new Error('encode failed');
  return { blob, width, height };
}

const TABS = [
  { id: 'compress', label: '壓縮' },
  { id: 'resize', label: '縮放' },
  { id: 'convert', label: '格式轉換' },
];

export default function ImageStudio() {
  const [src, setSrc] = useState<Source | null>(null);
  const [out, setOut] = useState<Output | null>(null);
  const [tab, setTab] = useState('compress');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // params
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<ImageFormat>('webp');
  const [resizeMode, setResizeMode] = useState<ResizeMode>('scale');
  const [scale, setScale] = useState(50);
  const [rw, setRw] = useState(800);
  const [rh, setRh] = useState(600);

  const srcUrl = useRef<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => () => { if (srcUrl.current) URL.revokeObjectURL(srcUrl.current); }, []);

  // Revoke the previous output URL only after a newer one has been committed to the
  // DOM, so the download anchor never points at an already-revoked blob.
  useEffect(() => {
    const url = out?.url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [out?.url]);

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('請選擇圖片檔。'); return; }
    setError(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (srcUrl.current) URL.revokeObjectURL(srcUrl.current);
      srcUrl.current = url;
      setSrc({ url, name: file.name, size: file.size, type: file.type, width: img.naturalWidth, height: img.naturalHeight, img });
      setRw(img.naturalWidth);
      setRh(img.naturalHeight);
    };
    img.onerror = () => { setError('無法讀取這張圖片。'); URL.revokeObjectURL(url); };
    img.src = url;
  }

  // Re-process whenever the source or any parameter changes (debounced for sliders).
  useEffect(() => {
    if (!src) return;
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        let width = src.width;
        let height = src.height;
        let mime = safeMime(src.type);
        let q = quality;

        if (tab === 'resize') {
          const d = computeResize(src.width, src.height, { mode: resizeMode, scale, width: rw, height: rh });
          width = d.width;
          height = d.height;
          q = 0.92;
        } else if (tab === 'convert') {
          mime = FORMAT_MIME[format];
        } else if (tab === 'compress') {
          // keep original format unless it's PNG (lossless → re-encode as JPEG to actually shrink)
          mime = src.type === 'image/png' ? 'image/jpeg' : safeMime(src.type);
        }

        const { blob, width: ow, height: oh } = await render(src.img, width, height, mime, q);
        if (id !== reqId.current) return; // a newer request superseded this one
        const url = URL.createObjectURL(blob);
        const e = extForMime(mime);
        setOut({ url, size: blob.size, width: ow, height: oh, ext: e, name: renameExt(src.name, e) });
      } catch {
        if (id === reqId.current) setError('處理失敗，請換一張圖片試試。');
      } finally {
        if (id === reqId.current) setBusy(false);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [src, tab, quality, format, resizeMode, scale, rw, rh]);

  const reduction = src && out ? reductionPercent(src.size, out.size) : NaN;

  return (
    <div className="mx-auto max-w-3xl">
      {!src ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed p-12 text-center transition-colors ${dragging ? 'border-accent bg-accent/5' : 'border-edge bg-surface hover:border-accent'}`}
        >
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          <span className="text-3xl">🖼️</span>
          <span className="mt-2 text-sm text-ink">點擊或拖曳圖片到這裡</span>
          <span className="mt-1 text-xs text-muted">壓縮、縮放、轉檔都在你的瀏覽器處理，不會上傳</span>
        </label>
      ) : (
        <>
          <div className="flex justify-center"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>

          {/* Controls */}
          <div className="mb-6 rounded-[var(--radius-card)] border border-edge bg-surface p-4">
            {tab === 'compress' && (
              <label className="block">
                <span className="mb-1 flex justify-between text-sm text-ink"><span>品質</span><span className="text-muted">{Math.round(quality * 100)}%</span></span>
                <input type="range" min={10} max={100} value={Math.round(quality * 100)} onChange={(e) => setQuality(Number(e.target.value) / 100)} className="w-full accent-[var(--color-accent)]" />
                {src.type === 'image/png' && <p className="mt-1 text-xs text-muted">PNG 為無損格式，壓縮時會轉成 JPEG 才能縮小檔案。</p>}
              </label>
            )}

            {tab === 'resize' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {([['scale', '等比例 %'], ['width', '指定寬度'], ['height', '指定高度'], ['exact', '自訂寬高']] as [ResizeMode, string][]).map(([m, label]) => (
                    <button key={m} onClick={() => setResizeMode(m)} className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${resizeMode === m ? 'border-accent bg-accent text-white' : 'border-edge bg-surface text-ink hover:border-accent'}`}>{label}</button>
                  ))}
                </div>
                {resizeMode === 'scale' && (
                  <label className="block">
                    <span className="mb-1 flex justify-between text-sm text-ink"><span>縮放比例</span><span className="text-muted">{scale}%</span></span>
                    <input type="range" min={5} max={200} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
                  </label>
                )}
                {resizeMode === 'width' && (
                  <label className="block"><span className="mb-1 block text-sm text-ink">寬度 (px)</span><input type="number" value={rw} onChange={(e) => setRw(Number(e.target.value))} className={inputClass} /></label>
                )}
                {resizeMode === 'height' && (
                  <label className="block"><span className="mb-1 block text-sm text-ink">高度 (px)</span><input type="number" value={rh} onChange={(e) => setRh(Number(e.target.value))} className={inputClass} /></label>
                )}
                {resizeMode === 'exact' && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className="mb-1 block text-sm text-ink">寬度 (px)</span><input type="number" value={rw} onChange={(e) => setRw(Number(e.target.value))} className={inputClass} /></label>
                    <label className="block"><span className="mb-1 block text-sm text-ink">高度 (px)</span><input type="number" value={rh} onChange={(e) => setRh(Number(e.target.value))} className={inputClass} /></label>
                  </div>
                )}
              </div>
            )}

            {tab === 'convert' && (
              <div className="space-y-3">
                <div className="flex gap-1.5">
                  {(['jpeg', 'png', 'webp'] as ImageFormat[]).map((f) => (
                    <button key={f} onClick={() => setFormat(f)} className={`flex-1 rounded-lg border px-3 py-2 text-sm uppercase transition-colors ${format === f ? 'border-accent bg-accent text-white' : 'border-edge bg-surface text-ink hover:border-accent'}`}>{f}</button>
                  ))}
                </div>
                {supportsQuality(format) && (
                  <label className="block">
                    <span className="mb-1 flex justify-between text-sm text-ink"><span>品質</span><span className="text-muted">{Math.round(quality * 100)}%</span></span>
                    <input type="range" min={10} max={100} value={Math.round(quality * 100)} onChange={(e) => setQuality(Number(e.target.value) / 100)} className="w-full accent-[var(--color-accent)]" />
                  </label>
                )}
              </div>
            )}
          </div>

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

          {/* Before / After */}
          <div className="grid gap-4 sm:grid-cols-2">
            <figure className="rounded-[var(--radius-card)] border border-edge bg-surface p-3">
              <img src={src.url} alt="原圖" className="mb-2 h-48 w-full rounded-lg object-contain" />
              <figcaption className="text-center text-sm text-ink">原圖</figcaption>
              <p className="text-center text-xs text-muted">{src.width}×{src.height} · {formatBytes(src.size)}</p>
            </figure>
            <figure className="rounded-[var(--radius-card)] border border-edge bg-surface p-3">
              {out ? <img src={out.url} alt="處理後" className="mb-2 h-48 w-full rounded-lg object-contain" /> : <div className="mb-2 flex h-48 items-center justify-center text-muted">處理中…</div>}
              <figcaption className="text-center text-sm text-ink">處理後 {out ? `· ${out.ext.toUpperCase()}` : ''}</figcaption>
              <p className="text-center text-xs text-muted">{out ? `${out.width}×${out.height} · ${formatBytes(out.size)}` : '—'}</p>
            </figure>
          </div>

          {/* Stats + actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-ink">
              {out && Number.isFinite(reduction) && (
                <span>
                  檔案大小：{formatBytes(src.size)} → {formatBytes(out.size)}{' '}
                  <span className={reduction >= 0 ? 'text-green-600' : 'text-red-500'}>
                    （{reduction >= 0 ? '減少' : '增加'} {Math.abs(reduction).toFixed(0)}%）
                  </span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSrc(null); setOut(null); setError(null); }} className="rounded-lg border border-edge bg-surface px-4 py-2.5 text-sm text-ink transition-colors hover:border-accent">
                換一張
              </button>
              {out && (
                <a href={out.url} download={out.name} className={`rounded-lg bg-accent px-5 py-2.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)] ${busy ? 'pointer-events-none opacity-60' : ''}`}>
                  下載
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

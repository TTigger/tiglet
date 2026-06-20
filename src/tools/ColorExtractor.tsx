import { useEffect, useRef, useState } from 'react';
import {
  extractPalette,
  rgbToHex,
  formatRgb,
  readableTextColor,
  type RGB,
} from '../lib/color';
import CopyButton from '../components/CopyButton';

const COUNTS = [4, 6, 8, 12];
const SAMPLE_EDGE = 120; // downscale longest edge to this many px before sampling

export default function ColorExtractor() {
  const [preview, setPreview] = useState<string | null>(null);
  const [palette, setPalette] = useState<RGB[]>([]);
  const [count, setCount] = useState(6);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewUrl = useRef<string | null>(null);
  const pixelCache = useRef<RGB[] | null>(null); // sampled once per image; reused on count change
  const loadId = useRef(0);

  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);

  function samplePixels(img: HTMLImageElement): RGB[] {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const scale = Math.min(1, SAMPLE_EDGE / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const pixels: RGB[] = [];
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 125) continue; // skip mostly-transparent pixels
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
    return pixels;
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('請選擇圖片檔。');
      return;
    }
    setError(null);
    const id = ++loadId.current;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (id !== loadId.current) { URL.revokeObjectURL(url); return; } // superseded by a newer image
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = url;
      const pixels = samplePixels(img);
      pixelCache.current = pixels;
      setPreview(url);
      setPalette(extractPalette(pixels, count));
    };
    img.onerror = () => {
      setError('無法讀取這張圖片。');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function changeCount(n: number) {
    setCount(n);
    // Re-quantize the already-sampled pixels — no re-decode, no new object URL.
    if (pixelCache.current) setPalette(extractPalette(pixelCache.current, n));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <canvas ref={canvasRef} className="hidden" />

      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed p-10 text-center transition-colors ${dragging ? 'border-accent bg-accent/5' : 'border-edge bg-surface hover:border-accent'}`}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <span className="text-3xl">🖼️</span>
        <span className="mt-2 text-sm text-ink">點擊或拖曳圖片到這裡</span>
        <span className="mt-1 text-xs text-muted">圖片只在你的瀏覽器處理，不會上傳</span>
      </label>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-5 flex items-center gap-2">
        <span className="text-sm text-muted">取色數量</span>
        {COUNTS.map((n) => (
          <button
            key={n}
            onClick={() => changeCount(n)}
            className={`rounded-lg border px-3 py-1 text-sm transition-colors ${n === count ? 'border-accent bg-accent text-white' : 'border-edge bg-surface text-ink hover:border-accent'}`}
          >
            {n}
          </button>
        ))}
      </div>

      {preview && (
        <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]">
          <img src={preview} alt="預覽" className="h-44 w-full rounded-[var(--radius-card)] border border-edge object-cover" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {palette.map((c, i) => {
              const hex = rgbToHex(c);
              const fg = readableTextColor(c);
              return (
                <div key={`${hex}-${i}`} className="overflow-hidden rounded-lg border border-edge">
                  <div className="flex h-16 items-start justify-end p-1.5" style={{ backgroundColor: hex }}>
                    <span style={{ color: fg }}><CopyButton value={hex} className="!text-current" /></span>
                  </div>
                  <div className="bg-surface px-2 py-1.5">
                    <div className="font-mono text-xs tabular-nums text-ink">{hex}</div>
                    <div className="font-mono text-[11px] tabular-nums text-muted">{formatRgb(c)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import Tabs from '../components/Tabs';
import CopyButton from '../components/CopyButton';
import { classifyQrContent, type QrContent } from '../lib/qrScan';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    tabImage: '圖片掃描',
    tabCamera: '相機掃描',
    dropHint: '點擊選擇、拖放或貼上（Ctrl+V）含 QR 碼的圖片',
    fileAria: '上傳 QR 圖片',
    notFound: '這張圖片裡找不到 QR 碼，換張清晰一點的試試。',
    decodeError: '圖片讀取失敗，請確認檔案是有效的圖片。',
    camStart: '開啟相機掃描',
    camStop: '停止相機',
    camRescan: '重新掃描',
    camAria: '相機預覽',
    camDenied: '相機權限被拒絕。請在瀏覽器網址列的權限設定允許相機後重試。',
    camMissing: '找不到可用的相機。',
    camHint: '把 QR 碼對準畫面，對到就會自動停下來。',
    resultLabel: '掃描結果',
    typeNames: { url: '網址', wifi: 'WiFi', vcard: '名片', text: '文字' } as Record<QrContent['type'], string>,
    openLink: '開啟連結 ↗',
    wifiSsid: '網路名稱',
    wifiPassword: '密碼',
    wifiSecurity: '加密方式',
    wifiHidden: '隱藏網路',
    yes: '是',
    vName: '姓名',
    vPhone: '電話',
    vEmail: 'Email',
    vOrg: '公司',
    vTitle: '職稱',
    vUrl: '網站',
    rawLabel: '原始內容',
    privacy: '解碼完全在你的瀏覽器本機進行，圖片與相機畫面都不會上傳。',
  },
  en: {
    tabImage: 'From image',
    tabCamera: 'Camera',
    dropHint: 'Click, drag & drop, or paste (Ctrl+V) an image containing a QR code',
    fileAria: 'Upload QR image',
    notFound: 'No QR code found in this image — try a sharper one.',
    decodeError: 'Could not read the image. Make sure it is a valid image file.',
    camStart: 'Start camera scan',
    camStop: 'Stop camera',
    camRescan: 'Scan again',
    camAria: 'Camera preview',
    camDenied: 'Camera permission denied. Allow camera access in your browser and retry.',
    camMissing: 'No camera available.',
    camHint: 'Point the QR code at the frame — it stops automatically on a hit.',
    resultLabel: 'Scan result',
    typeNames: { url: 'URL', wifi: 'WiFi', vcard: 'vCard', text: 'Text' } as Record<QrContent['type'], string>,
    openLink: 'Open link ↗',
    wifiSsid: 'Network name',
    wifiPassword: 'Password',
    wifiSecurity: 'Security',
    wifiHidden: 'Hidden network',
    yes: 'Yes',
    vName: 'Name',
    vPhone: 'Phone',
    vEmail: 'Email',
    vOrg: 'Organization',
    vTitle: 'Title',
    vUrl: 'Website',
    rawLabel: 'Raw content',
    privacy: 'Decoding happens entirely in your browser — images and camera frames are never uploaded.',
  },
} as const;
type Dict = (typeof L)[Locale];

interface Scan {
  text: string;
  content: QrContent;
}

const MAX_DECODE_SIZE = 1024; // 大圖先縮到這個邊長再解，太大反而讓 jsQR 變慢又難對焦

function decodeImageData(data: ImageData): string | null {
  return jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

async function decodeImageFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DECODE_SIZE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return decodeImageData(ctx.getImageData(0, 0, w, h));
  } finally {
    bitmap.close();
  }
}

function Row({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <dt className="w-24 shrink-0 text-sm text-muted">{label}</dt>
      <dd className="flex items-center gap-2 break-all text-sm text-ink">
        {value}
        {copyable && <CopyButton value={value} />}
      </dd>
    </div>
  );
}

function ResultCard({ scan, t }: { scan: Scan; t: Dict }) {
  const c = scan.content;
  return (
    <div className="space-y-3 rounded-[var(--radius-card)] border border-edge bg-surface p-4" role="status">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">{t.resultLabel}</span>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{t.typeNames[c.type]}</span>
      </div>

      {c.type === 'url' && (
        <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg border border-edge px-4 py-2 text-sm text-accent hover:border-accent">
          {t.openLink}
        </a>
      )}
      {c.type === 'wifi' && (
        <dl className="space-y-1.5">
          <Row label={t.wifiSsid} value={c.ssid} />
          <Row label={t.wifiPassword} value={c.password} copyable />
          <Row label={t.wifiSecurity} value={c.security} />
          {c.hidden && <Row label={t.wifiHidden} value={t.yes} />}
        </dl>
      )}
      {c.type === 'vcard' && (
        <dl className="space-y-1.5">
          <Row label={t.vName} value={c.name} />
          <Row label={t.vPhone} value={c.phone} copyable />
          <Row label={t.vEmail} value={c.email} copyable />
          <Row label={t.vOrg} value={c.org} />
          <Row label={t.vTitle} value={c.title} />
          <Row label={t.vUrl} value={c.url} />
        </dl>
      )}

      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs text-muted">{t.rawLabel}</span>
          <CopyButton value={scan.text} />
        </div>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-edge bg-bg px-3 py-2 font-mono text-sm text-ink">{scan.text}</pre>
      </div>
    </div>
  );
}

function ImagePanel({ t, onScan }: { t: Dict; onScan: (s: Scan | null) => void }) {
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setError('');
    onScan(null);
    try {
      const text = await decodeImageFile(file);
      if (!text) {
        setError(t.notFound);
        return;
      }
      onScan({ text, content: classifyQrContent(text) });
    } catch {
      setError(t.decodeError);
    }
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((i) => i.type.startsWith('image/'))
        ?.getAsFile();
      if (file) handleFile(file);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  return (
    <div className="space-y-4">
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`w-full rounded-[var(--radius-card)] border-2 border-dashed px-6 py-12 text-center text-sm transition-colors ${
          dragging ? 'border-accent bg-accent/5 text-accent' : 'border-edge text-muted hover:border-accent hover:text-accent'
        }`}
      >
        {t.dropHint}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label={t.fileAria}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function CameraPanel({ t, onScan }: { t: Dict; onScan: (s: Scan | null) => void }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRunning(false);
  }

  async function start() {
    setError('');
    onScan(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setRunning(true);
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const tick = (now: number) => {
        // 每 ~150ms 解一次就夠了，全速跑只會燒電
        if (now - lastTickRef.current > 150 && video.videoWidth > 0) {
          lastTickRef.current = now;
          const scale = Math.min(1, MAX_DECODE_SIZE / Math.max(video.videoWidth, video.videoHeight));
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const text = decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
          if (text) {
            stop();
            onScan({ text, content: classifyQrContent(text) });
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      stop();
      setError(e instanceof DOMException && e.name === 'NotAllowedError' ? t.camDenied : t.camMissing);
    }
  }

  useEffect(() => stop, []);

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        aria-label={t.camAria}
        playsInline
        muted
        className={`w-full rounded-[var(--radius-card)] border border-edge bg-black/80 ${running ? '' : 'hidden'}`}
      />
      {running && <p className="text-sm text-muted">{t.camHint}</p>}
      <button
        onClick={running ? stop : start}
        className="rounded-lg border border-edge px-4 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
      >
        {running ? t.camStop : t.camStart}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default function QrScanner({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [tab, setTab] = useState('image');
  const [scan, setScan] = useState<Scan | null>(null);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex justify-center">
        <Tabs
          tabs={[
            { id: 'image', label: t.tabImage },
            { id: 'camera', label: t.tabCamera },
          ]}
          active={tab}
          onChange={(id) => {
            setTab(id);
            setScan(null);
          }}
        />
      </div>
      {tab === 'image' && <ImagePanel t={t} onScan={setScan} />}
      {tab === 'camera' && <CameraPanel t={t} onScan={setScan} />}
      {scan && <ResultCard scan={scan} t={t} />}
      <p className="text-center text-xs text-muted">{t.privacy}</p>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

export default function QrCode() {
  const [text, setText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const value = text.trim();
    if (!value || !canvasRef.current) { setReady(false); return; }
    (async () => {
      try {
        const QR = await import('qrcode');
        if (cancelled || !canvasRef.current) return;
        await QR.toCanvas(canvasRef.current, value, { width: 256, margin: 2, color: { dark: '#1A1A18', light: '#FFFFFF' } });
        if (cancelled) return;
        setReady(true);
      } catch {
        setReady(false);
      }
    })();
    return () => { cancelled = true; };
  }, [text]);

  function download() {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tiglet-qrcode.png';
    a.click();
  }

  return (
    <div className="mx-auto max-w-md">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="輸入文字或網址…"
        className="mb-6 w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
      />
      <div className="flex flex-col items-center">
        <div className={`rounded-[var(--radius-card)] border border-edge bg-white p-4 ${ready ? '' : 'opacity-30'}`}>
          <canvas ref={canvasRef} width={256} height={256} />
        </div>
        <button onClick={download} disabled={!ready} className="mt-4 rounded-lg bg-accent px-6 py-2 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
          下載 PNG
        </button>
      </div>
    </div>
  );
}

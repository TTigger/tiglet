import { useEffect, useRef, useState } from 'react';
import Tabs from '../components/Tabs';
import { wifiQr, vcardQr, type WifiSecurity } from '../lib/qrFormats';

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none transition-colors focus:border-accent';

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </label>
  );
}

export default function QrCode() {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  // WiFi
  const [ssid, setSsid] = useState('');
  const [wifiPw, setWifiPw] = useState('');
  const [security, setSecurity] = useState<WifiSecurity>('WPA');
  const [hidden, setHidden] = useState(false);
  // 名片
  const [vName, setVName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vOrg, setVOrg] = useState('');
  const [vTitle, setVTitle] = useState('');
  const [vUrl, setVUrl] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  const payload =
    tab === 'wifi'
      ? ssid.trim()
        ? wifiQr({ ssid: ssid.trim(), password: wifiPw, security, hidden })
        : ''
      : tab === 'vcard'
        ? vName.trim()
          ? vcardQr({ name: vName, phone: vPhone, email: vEmail, org: vOrg, title: vTitle, url: vUrl })
          : ''
        : text.trim();

  useEffect(() => {
    let cancelled = false;
    if (!payload || !canvasRef.current) { setReady(false); return; }
    (async () => {
      try {
        const QR = await import('qrcode');
        if (cancelled || !canvasRef.current) return;
        await QR.toCanvas(canvasRef.current, payload, { width: 256, margin: 2, color: { dark: '#1A1A18', light: '#FFFFFF' } });
        if (cancelled) return;
        setReady(true);
        setScanKey((k) => k + 1);
      } catch {
        setReady(false);
      }
    })();
    return () => { cancelled = true; };
  }, [payload]);

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
      <div className="flex justify-center">
        <Tabs
          tabs={[
            { id: 'text', label: '文字／網址' },
            { id: 'wifi', label: 'WiFi' },
            { id: 'vcard', label: '名片' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'text' && (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="輸入文字或網址…"
          aria-label="QR 內容"
          className="mb-6 w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
        />
      )}

      {tab === 'wifi' && (
        <div className="mb-6 space-y-3">
          <Field label="網路名稱（SSID）" value={ssid} onChange={setSsid} placeholder="HomeWiFi" />
          {security !== 'nopass' && <Field label="密碼" value={wifiPw} onChange={setWifiPw} placeholder="wifi 密碼" />}
          <div className="flex items-center gap-4">
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-muted">加密方式</span>
              <select value={security} onChange={(e) => setSecurity(e.target.value as WifiSecurity)} className={inputClass}>
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">開放網路（無密碼）</option>
              </select>
            </label>
            <label className="mt-5 flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
              隱藏網路
            </label>
          </div>
          <p className="text-xs text-muted">手機相機掃描即可直接連上 WiFi；密碼只在你的瀏覽器組成 QR，不會上傳。</p>
        </div>
      )}

      {tab === 'vcard' && (
        <div className="mb-6 space-y-3">
          <Field label="姓名（必填）" value={vName} onChange={setVName} placeholder="王小明" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="電話" value={vPhone} onChange={setVPhone} placeholder="0912345678" type="tel" />
            <Field label="Email" value={vEmail} onChange={setVEmail} placeholder="ming@example.com" type="email" />
            <Field label="公司" value={vOrg} onChange={setVOrg} />
            <Field label="職稱" value={vTitle} onChange={setVTitle} />
          </div>
          <Field label="網站" value={vUrl} onChange={setVUrl} placeholder="https://…" type="url" />
          <p className="text-xs text-muted">掃描後可直接加入通訊錄（vCard 3.0 格式）。</p>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className={`relative overflow-hidden rounded-[var(--radius-card)] border border-edge bg-white p-4 transition-all duration-500 ${ready ? 'scale-100 opacity-100' : 'scale-95 opacity-30'}`}>
          <canvas ref={canvasRef} width={256} height={256} />
          {ready && <div key={scanKey} className="qr-scan pointer-events-none absolute inset-x-4 top-4 h-0.5 bg-accent/70 shadow-[0_0_8px_var(--color-accent)]" />}
        </div>
        <button onClick={download} disabled={!ready} className="mt-4 rounded-lg bg-accent px-6 py-2 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
          下載 PNG
        </button>
      </div>
    </div>
  );
}

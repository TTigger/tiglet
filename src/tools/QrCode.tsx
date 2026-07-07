import { useEffect, useRef, useState } from 'react';
import Tabs from '../components/Tabs';
import { wifiQr, vcardQr, type WifiSecurity } from '../lib/qrFormats';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    tabText: '文字／網址',
    tabWifi: 'WiFi',
    tabVcard: '名片',
    textPlaceholder: '輸入文字或網址…',
    qrAria: 'QR 內容',
    ssid: '網路名稱（SSID）',
    password: '密碼',
    passwordPlaceholder: 'wifi 密碼',
    security: '加密方式',
    secWpa: 'WPA / WPA2 / WPA3',
    secWep: 'WEP',
    secNone: '開放網路（無密碼）',
    hidden: '隱藏網路',
    wifiHint: '手機相機掃描即可直接連上 WiFi；密碼只在你的瀏覽器組成 QR，不會上傳。',
    name: '姓名（必填）',
    namePlaceholder: '王小明',
    phone: '電話',
    email: 'Email',
    org: '公司',
    title: '職稱',
    website: '網站',
    vcardHint: '掃描後可直接加入通訊錄（vCard 3.0 格式）。',
    download: '下載 PNG',
  },
  en: {
    tabText: 'Text / URL',
    tabWifi: 'WiFi',
    tabVcard: 'Contact card',
    textPlaceholder: 'Enter text or a URL…',
    qrAria: 'QR content',
    ssid: 'Network name (SSID)',
    password: 'Password',
    passwordPlaceholder: 'wifi password',
    security: 'Security',
    secWpa: 'WPA / WPA2 / WPA3',
    secWep: 'WEP',
    secNone: 'Open network (no password)',
    hidden: 'Hidden network',
    wifiHint: 'Scan with a phone camera to join the WiFi directly; the password is encoded into the QR in your browser only — never uploaded.',
    name: 'Name (required)',
    namePlaceholder: 'Jane Smith',
    phone: 'Phone',
    email: 'Email',
    org: 'Company',
    title: 'Job title',
    website: 'Website',
    vcardHint: 'Scanning adds the contact straight to the address book (vCard 3.0 format).',
    download: 'Download PNG',
  },
} as const;

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

export default function QrCode({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
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
            { id: 'text', label: t.tabText },
            { id: 'wifi', label: t.tabWifi },
            { id: 'vcard', label: t.tabVcard },
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
          placeholder={t.textPlaceholder}
          aria-label={t.qrAria}
          className="mb-6 w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
        />
      )}

      {tab === 'wifi' && (
        <div className="mb-6 space-y-3">
          <Field label={t.ssid} value={ssid} onChange={setSsid} placeholder="HomeWiFi" />
          {security !== 'nopass' && <Field label={t.password} value={wifiPw} onChange={setWifiPw} placeholder={t.passwordPlaceholder} />}
          <div className="flex items-center gap-4">
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-muted">{t.security}</span>
              <select value={security} onChange={(e) => setSecurity(e.target.value as WifiSecurity)} className={inputClass}>
                <option value="WPA">{t.secWpa}</option>
                <option value="WEP">{t.secWep}</option>
                <option value="nopass">{t.secNone}</option>
              </select>
            </label>
            <label className="mt-5 flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
              {t.hidden}
            </label>
          </div>
          <p className="text-xs text-muted">{t.wifiHint}</p>
        </div>
      )}

      {tab === 'vcard' && (
        <div className="mb-6 space-y-3">
          <Field label={t.name} value={vName} onChange={setVName} placeholder={t.namePlaceholder} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.phone} value={vPhone} onChange={setVPhone} placeholder="0912345678" type="tel" />
            <Field label={t.email} value={vEmail} onChange={setVEmail} placeholder="ming@example.com" type="email" />
            <Field label={t.org} value={vOrg} onChange={setVOrg} />
            <Field label={t.title} value={vTitle} onChange={setVTitle} />
          </div>
          <Field label={t.website} value={vUrl} onChange={setVUrl} placeholder="https://…" type="url" />
          <p className="text-xs text-muted">{t.vcardHint}</p>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className={`relative overflow-hidden rounded-[var(--radius-card)] border border-edge bg-white p-4 transition-all duration-500 ${ready ? 'scale-100 opacity-100' : 'scale-95 opacity-30'}`}>
          <canvas ref={canvasRef} width={256} height={256} />
          {ready && <div key={scanKey} className="qr-scan pointer-events-none absolute inset-x-4 top-4 h-0.5 bg-accent/70 shadow-[0_0_8px_var(--color-accent)]" />}
        </div>
        <button onClick={download} disabled={!ready} className="mt-4 rounded-lg bg-accent px-6 py-2 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
          {t.download}
        </button>
      </div>
    </div>
  );
}

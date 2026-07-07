import { useRef, useState } from 'react';

// 「主動分享」模式：個人數據（體重、FTP…）不隨打字寫進網址/瀏覽歷史，
// 使用者按下這顆按鈕才組出帶參數的連結並複製。空值與 false 會被略過。
export default function ShareLinkButton({
  params,
  label = '複製分享連結',
}: {
  params: Record<string, string | number | boolean | null | undefined>;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === '' || v === null || v === undefined || v === false) continue;
      qs.set(k, v === true ? '1' : String(v));
    }
    const url = `${location.origin}${location.pathname}${qs.toString() ? `?${qs.toString()}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <button
      onClick={copy}
      className="rounded-lg border border-edge px-4 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? '已複製連結 ✓' : `📤 ${label}`}
    </button>
  );
}

import { useEffect, useRef, useState } from 'react';

export default function CopyButton({ value, className = '' }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <button onClick={copy} aria-label="複製結果" className={`text-sm text-muted transition-colors hover:text-accent ${className}`}>
      {copied ? '已複製 ✓' : '複製'}
    </button>
  );
}

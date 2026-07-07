import { useEffect, useRef, useState } from 'react';

export default function CopyButton({ value, className = '' }: { value: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed'); // 剪貼簿不可用也要讓使用者知道
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  }

  return (
    <button onClick={copy} aria-label="複製結果" className={`text-sm transition-colors ${state === 'failed' ? 'text-red-500' : 'text-muted hover:text-accent'} ${className}`}>
      <span role="status">{state === 'copied' ? '已複製 ✓' : state === 'failed' ? '複製失敗' : '複製'}</span>
    </button>
  );
}

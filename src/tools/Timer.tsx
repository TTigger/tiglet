import { useEffect, useRef, useState } from 'react';
import { formatTime } from '../lib/timer';

type Mode = 'countdown' | 'stopwatch';
const PRESETS = [1, 3, 5, 10];

export default function Timer() {
  const [mode, setMode] = useState<Mode>('countdown');
  const [initial, setInitial] = useState(300);
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function beep() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      o.start();
      o.stop(ctx.currentTime + 0.8);
    } catch { /* audio unavailable */ }
  }

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (mode === 'countdown') {
          if (s <= 1) { beep(); setRunning(false); return 0; }
          return s - 1;
        }
        return s + 1;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [running, mode]);

  function switchMode(m: Mode) {
    setRunning(false);
    setMode(m);
    setSeconds(m === 'countdown' ? initial : 0);
  }
  function setPreset(min: number) {
    setRunning(false);
    setInitial(min * 60);
    setSeconds(min * 60);
  }
  function reset() {
    setRunning(false);
    setSeconds(mode === 'countdown' ? initial : 0);
  }

  const btn = 'rounded-lg border border-edge px-4 py-2 text-sm transition-colors';

  return (
    <div className="mx-auto max-w-sm text-center">
      <div className="mb-6 flex justify-center gap-2">
        <button onClick={() => switchMode('countdown')} className={`${btn} ${mode === 'countdown' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>倒數</button>
        <button onClick={() => switchMode('stopwatch')} className={`${btn} ${mode === 'stopwatch' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>碼錶</button>
      </div>

      <div className="mb-6 font-mono text-6xl tabular-nums text-ink">{formatTime(seconds)}</div>

      {mode === 'countdown' && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {PRESETS.map((m) => (
            <button key={m} onClick={() => setPreset(m)} className={`${btn} bg-surface text-ink hover:border-accent`}>{m} 分</button>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-3">
        <button onClick={() => setRunning((r) => !r)} disabled={mode === 'countdown' && seconds === 0} className="rounded-lg bg-accent px-6 py-2 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
          {running ? '暫停' : '開始'}
        </button>
        <button onClick={reset} className={`${btn} bg-surface text-ink hover:border-accent`}>重設</button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { formatTime, remainingFraction } from '../lib/timer';

const RING_R = 100;
const RING_C = 2 * Math.PI * RING_R;

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

  // Countdown: ring depletes as time runs out. Stopwatch: ring fills each minute.
  const frac = mode === 'countdown' ? remainingFraction(seconds, initial) : (seconds % 60) / 60;
  const low = mode === 'countdown' && seconds > 0 && seconds <= 10;
  const finished = mode === 'countdown' && initial > 0 && seconds === 0;

  return (
    <div className="mx-auto max-w-sm text-center">
      <div className="mb-6 flex justify-center gap-2">
        <button onClick={() => switchMode('countdown')} className={`${btn} ${mode === 'countdown' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>倒數</button>
        <button onClick={() => switchMode('stopwatch')} className={`${btn} ${mode === 'stopwatch' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>碼錶</button>
      </div>

      <div className="relative mx-auto mb-6 h-60 w-60">
        <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
          <circle cx="110" cy="110" r={RING_R} fill="none" stroke="var(--color-edge)" strokeWidth="10" />
          <circle
            cx="110" cy="110" r={RING_R} fill="none"
            stroke={low || finished ? '#ef4444' : 'var(--color-accent)'}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - frac)}
            style={{ transition: running ? 'stroke-dashoffset 1s linear, stroke 0.3s ease' : 'stroke 0.3s ease' }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-mono text-5xl tabular-nums ${finished ? 'timer-done text-red-500' : low ? 'text-red-500' : 'text-ink'}`}>
          {formatTime(seconds)}
        </div>
      </div>

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

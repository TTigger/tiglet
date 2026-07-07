import { useEffect, useRef, useState } from 'react';
import { formatTime, remainingFraction, intervalAt, intervalTotalSec, type IntervalConfig } from '../lib/timer';
import type { Locale } from '../lib/i18n';

const RING_R = 100;
const RING_C = 2 * Math.PI * RING_R;

type Mode = 'countdown' | 'stopwatch' | 'intervals';
const PRESETS = [1, 3, 5, 10];

const L = {
  zh: {
    modeCountdown: '倒數',
    modeStopwatch: '碼錶',
    modeIntervals: '間歇',
    done: '完成 💪',
    stage: (set: number, sets: number, kind: 'work' | 'rest') => `第 ${set}/${sets} 組 · ${kind === 'work' ? '衝刺' : '休息'}`,
    totalRemaining: (t: string) => `總剩餘 ${t}`,
    preset: (m: number) => `${m} 分`,
    workSec: '衝刺（秒）',
    restSec: '休息（秒）',
    sets: '組數',
    start: '開始',
    pause: '暫停',
    reset: '重設',
    hint: '切換階段會有提示音：進衝刺高音、進休息低音、全部完成三連音。訓練台間歇的好朋友。',
  },
  en: {
    modeCountdown: 'Countdown',
    modeStopwatch: 'Stopwatch',
    modeIntervals: 'Intervals',
    done: 'Done 💪',
    stage: (set: number, sets: number, kind: 'work' | 'rest') => `Set ${set}/${sets} · ${kind === 'work' ? 'Work' : 'Rest'}`,
    totalRemaining: (t: string) => `Total left ${t}`,
    preset: (m: number) => `${m} min`,
    workSec: 'Work (sec)',
    restSec: 'Rest (sec)',
    sets: 'Sets',
    start: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    hint: 'A tone marks each phase change: high for work, low for rest, a triple beep when everything is done. A trainer-interval best friend.',
  },
} as const;

export default function Timer({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [mode, setMode] = useState<Mode>('countdown');
  const [initial, setInitial] = useState(300);
  const [seconds, setSeconds] = useState(300); // countdown/stopwatch 的秒數；intervals 的經過秒
  const [running, setRunning] = useState(false);
  const [cfg, setCfg] = useState<IntervalConfig>({ workSec: 30, restSec: 15, sets: 5 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function beep(freq = 880, duration = 0.8) {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      o.start();
      o.stop(ctx.currentTime + duration);
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
        if (mode === 'intervals') {
          const next = s + 1;
          const prev = intervalAt(s, cfg);
          const cur = intervalAt(next, cfg);
          if (cur === null) {
            // 全部完成：三連高音
            beep(880, 0.25); setTimeout(() => beep(880, 0.25), 300); setTimeout(() => beep(1175, 0.6), 600);
            setRunning(false);
            return next;
          }
          // 階段切換提示音：進入衝刺高音、進入休息低音
          if (prev && prev.kind !== cur.kind) beep(cur.kind === 'work' ? 988 : 523, 0.4);
          return next;
        }
        return s + 1;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [running, mode, cfg]);

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
  function updateCfg(patch: Partial<IntervalConfig>) {
    setRunning(false);
    setSeconds(0);
    setCfg((c) => ({ ...c, ...patch }));
  }

  const btn = 'rounded-lg border border-edge px-4 py-2 text-sm transition-colors';

  const iv = mode === 'intervals' ? intervalAt(seconds, cfg) : null;
  const ivTotal = intervalTotalSec(cfg);
  const ivDone = mode === 'intervals' && ivTotal > 0 && seconds >= ivTotal;

  // Countdown: ring depletes. Stopwatch: ring fills each minute. Intervals: ring = 本階段剩餘.
  const frac =
    mode === 'countdown' ? remainingFraction(seconds, initial)
    : mode === 'intervals' ? (iv ? remainingFraction(iv.remaining, iv.kind === 'work' ? cfg.workSec : cfg.restSec) : 0)
    : (seconds % 60) / 60;
  const low = mode === 'countdown' && seconds > 0 && seconds <= 10;
  const finished = (mode === 'countdown' && initial > 0 && seconds === 0) || ivDone;
  const ringColor =
    mode === 'intervals' && iv ? (iv.kind === 'work' ? 'var(--color-accent)' : '#3B82C4')
    : low || finished ? '#ef4444' : 'var(--color-accent)';

  return (
    <div className="mx-auto max-w-sm text-center">
      <div className="mb-6 flex justify-center gap-2">
        <button onClick={() => switchMode('countdown')} className={`${btn} ${mode === 'countdown' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>{t.modeCountdown}</button>
        <button onClick={() => switchMode('stopwatch')} className={`${btn} ${mode === 'stopwatch' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>{t.modeStopwatch}</button>
        <button onClick={() => switchMode('intervals')} className={`${btn} ${mode === 'intervals' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>{t.modeIntervals}</button>
      </div>

      <div className="relative mx-auto mb-6 h-60 w-60">
        <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
          <circle cx="110" cy="110" r={RING_R} fill="none" stroke="var(--color-edge)" strokeWidth="10" />
          <circle
            cx="110" cy="110" r={RING_R} fill="none"
            stroke={ringColor}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - frac)}
            style={{ transition: running ? 'stroke-dashoffset 1s linear, stroke 0.3s ease' : 'stroke 0.3s ease' }}
          />
        </svg>
        <div className={`absolute inset-0 flex flex-col items-center justify-center font-mono tabular-nums ${finished ? 'timer-done text-red-500' : low ? 'text-red-500' : 'text-ink'}`}>
          {mode === 'intervals' ? (
            ivDone ? (
              <span className="font-serif text-3xl">{t.done}</span>
            ) : iv ? (
              <>
                <span className={`text-sm ${iv.kind === 'work' ? 'text-accent' : 'text-muted'}`}>
                  {t.stage(iv.set, cfg.sets, iv.kind)}
                </span>
                <span className="text-5xl">{formatTime(iv.remaining)}</span>
                <span className="text-xs text-muted">{t.totalRemaining(formatTime(iv.totalRemaining))}</span>
              </>
            ) : (
              <span className="text-5xl">{formatTime(ivTotal)}</span>
            )
          ) : (
            <span className="text-5xl">{formatTime(seconds)}</span>
          )}
        </div>
      </div>

      {mode === 'countdown' && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {PRESETS.map((m) => (
            <button key={m} onClick={() => setPreset(m)} className={`${btn} bg-surface text-ink hover:border-accent`}>{t.preset(m)}</button>
          ))}
        </div>
      )}

      {mode === 'intervals' && (
        <div className="mb-6 flex flex-wrap items-end justify-center gap-3 text-sm text-ink">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{t.workSec}</span>
            <input type="number" min={1} value={cfg.workSec} onChange={(e) => updateCfg({ workSec: Math.max(1, Number(e.target.value)) })} className="w-20 rounded border border-edge bg-surface px-2 py-1 text-center" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{t.restSec}</span>
            <input type="number" min={0} value={cfg.restSec} onChange={(e) => updateCfg({ restSec: Math.max(0, Number(e.target.value)) })} className="w-20 rounded border border-edge bg-surface px-2 py-1 text-center" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{t.sets}</span>
            <input type="number" min={1} value={cfg.sets} onChange={(e) => updateCfg({ sets: Math.max(1, Number(e.target.value)) })} className="w-16 rounded border border-edge bg-surface px-2 py-1 text-center" />
          </label>
        </div>
      )}

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={(mode === 'countdown' && seconds === 0) || (mode === 'intervals' && (ivDone || ivTotal === 0))}
          className="rounded-lg bg-accent px-6 py-2 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {running ? t.pause : t.start}
        </button>
        <button onClick={reset} className={`${btn} bg-surface text-ink hover:border-accent`}>{t.reset}</button>
      </div>
      {mode === 'intervals' && (
        <p className="mt-4 text-xs text-muted">{t.hint}</p>
      )}
    </div>
  );
}

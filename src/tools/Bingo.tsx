import { useEffect, useMemo, useRef, useState } from 'react';
import { generateCard, drawBall, ballLabel, evaluate, FREE } from '../lib/bingo';

const LETTERS = ['B', 'I', 'N', 'G', 'O'];
const ROLL_MS = 1100;

export default function Bingo() {
  const [card, setCard] = useState(() => generateCard());
  const [called, setCalled] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [marks, setMarks] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [flash, setFlash] = useState<number | null>(null);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; stop?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => () => {
    clearInterval(timers.current.tick);
    clearTimeout(timers.current.stop);
  }, []);

  const result = useMemo(() => evaluate(card, marks), [card, marks]);
  const calledSet = useMemo(() => new Set(called), [called]);
  const remaining = 75 - called.length;

  function call() {
    if (rolling || remaining === 0) return;
    const ball = drawBall(called);
    if (ball === null) return;
    clearInterval(timers.current.tick);
    clearTimeout(timers.current.stop);
    setRolling(true);
    timers.current.tick = setInterval(() => setFlash(1 + Math.floor(Math.random() * 75)), 60);
    timers.current.stop = setTimeout(() => {
      clearInterval(timers.current.tick);
      setFlash(null);
      setCurrent(ball);
      setCalled((prev) => [...prev, ball]);
      setRolling(false);
    }, ROLL_MS);
  }

  function daub(r: number, c: number) {
    const value = card[r][c];
    if (value === FREE || !calledSet.has(value)) return; // can only mark called numbers
    const i = r * 5 + c;
    setMarks((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  function newGame() {
    clearInterval(timers.current.tick);
    clearTimeout(timers.current.stop);
    setRolling(false);
    setFlash(null);
    setCard(generateCard());
    setCalled([]);
    setCurrent(null);
    setMarks([]);
  }

  const winSet = new Set(result.winning);
  const display = rolling ? flash : current;

  return (
    <div className="mx-auto max-w-md">
      {/* 叫號機 */}
      <div className="mb-6 flex flex-col items-center rounded-[var(--radius-card)] border border-edge bg-surface p-6">
        <div className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-accent ${rolling ? 'die-tumble' : display ? 'die-pop' : ''}`}>
          {display ? (
            <span className="text-center leading-tight">
              <span className="block text-xs font-semibold text-accent">{LETTERS[Math.min(4, Math.floor((display - 1) / 15))]}</span>
              <span className="block font-serif text-4xl text-ink">{display}</span>
            </span>
          ) : (
            <span className="text-3xl">🎱</span>
          )}
        </div>
        <button onClick={call} disabled={rolling || remaining === 0} className="mt-4 w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
          {rolling ? '抽號中…' : remaining === 0 ? '號碼已抽完' : '叫號'}
        </button>
        <p className="mt-2 text-xs text-muted">已叫 {called.length} / 75 號</p>
      </div>

      {/* 我的卡片 */}
      <div className="grid grid-cols-5 overflow-hidden rounded-[var(--radius-card)] border border-edge">
        {LETTERS.map((l) => (
          <div key={l} className="bg-accent py-2 text-center font-serif text-lg font-bold text-white">{l}</div>
        ))}
        {card.map((row, r) =>
          row.map((value, c) => {
            const i = r * 5 + c;
            const isFree = value === FREE;
            const marked = result.marked[r][c];
            const isWin = winSet.has(i);
            const callable = !isFree && calledSet.has(value) && !marked;
            return (
              <button
                key={i}
                onClick={() => daub(r, c)}
                disabled={isFree}
                className={`flex aspect-square items-center justify-center border border-edge text-lg font-medium transition-colors ${
                  isWin ? 'cell-win text-accent' : marked ? 'bg-accent/15 text-accent' : 'bg-surface text-ink'
                } ${callable ? 'ring-2 ring-accent/50' : ''} ${isFree ? 'text-xs text-muted' : ''}`}
              >
                {marked && !isFree ? <span key="m" className="mark-pop">{value}</span> : isFree ? 'FREE' : value}
              </button>
            );
          })
        )}
      </div>

      {result.bingo && (
        <p key={result.patterns.join()} className="die-pop mt-6 text-center font-serif text-3xl text-accent">
          🎉 BINGO！<span className="block text-base text-muted">{result.patterns.join('、')}</span>
        </p>
      )}

      <button onClick={newGame} className="mt-6 w-full rounded-lg border border-edge bg-surface py-2 text-sm text-accent hover:bg-accent hover:text-white">
        新的一局
      </button>

      {called.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-muted">已叫號碼</h2>
          <div className="flex flex-wrap gap-1.5">
            {called.map((n) => (
              <span key={n} className={`rounded px-2 py-0.5 text-sm ${n === current ? 'bg-accent text-white' : 'bg-surface text-muted'} border border-edge`}>
                {ballLabel(n)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

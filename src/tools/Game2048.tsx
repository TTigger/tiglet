import { useEffect, useRef, useState } from 'react';
import { newGame, move, addRandomTile, hasWon, canMove, type Board, type Direction } from '../lib/game2048';

const BEST_KEY = 'tiglet:2048-best';

const TILE_STYLE: Record<number, string> = {
  0: 'bg-edge/40 text-transparent',
  2: 'bg-[#eee4da] text-[#776e65]',
  4: 'bg-[#ede0c8] text-[#776e65]',
  8: 'bg-[#f2b179] text-white',
  16: 'bg-[#f59563] text-white',
  32: 'bg-[#f67c5f] text-white',
  64: 'bg-[#f65e3b] text-white',
  128: 'bg-[#edcf72] text-white',
  256: 'bg-[#edcc61] text-white',
  512: 'bg-[#edc850] text-white',
  1024: 'bg-[#edc53f] text-white',
  2048: 'bg-[#edc22e] text-white',
};

function readBest(): number {
  if (typeof window === 'undefined') return 0;
  try { return Number(window.localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => newGame());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const over = !canMove(board);
  const showWin = won && !keepGoing && !over;
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => { setBest(readBest()); }, []);
  useEffect(() => {
    if (score > best) {
      setBest(score);
      try { window.localStorage.setItem(BEST_KEY, String(score)); } catch { /* ignore */ }
    }
  }, [score, best]);

  function doMove(dir: Direction) {
    const current = boardRef.current;
    if (!canMove(current)) return;
    const res = move(current, dir);
    if (!res.moved) return;
    const next = addRandomTile(res.board);
    setBoard(next);
    setScore((s) => s + res.gained);
    if (!won && hasWon(next)) setWon(true);
  }

  useEffect(() => {
    const KEYS: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    function onKey(e: KeyboardEvent) {
      const dir = KEYS[e.key];
      if (!dir) return;
      e.preventDefault();
      doMove(dir);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  const touch = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left');
    else doMove(dy > 0 ? 'down' : 'up');
  }

  function restart() {
    setBoard(newGame());
    setScore(0);
    setWon(false);
    setKeepGoing(false);
  }

  return (
    <div className="mx-auto max-w-[26rem]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="rounded-lg bg-surface border border-edge px-4 py-2 text-center">
            <div className="text-xs text-muted">分數</div>
            <div className="font-mono text-lg tabular-nums text-ink">{score}</div>
          </div>
          <div className="rounded-lg bg-surface border border-edge px-4 py-2 text-center">
            <div className="text-xs text-muted">最佳</div>
            <div className="font-mono text-lg tabular-nums text-ink">{best}</div>
          </div>
        </div>
        <button onClick={restart} className="rounded-lg bg-accent px-4 py-2.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)]">
          新遊戲
        </button>
      </div>

      <div
        className="relative grid grid-cols-4 gap-2 rounded-[var(--radius-card)] border border-edge bg-edge/30 p-2 select-none touch-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {board.flatMap((row, r) =>
          row.map((v, c) => (
            <div
              key={`${r}-${c}-${v}`}
              className={`flex aspect-square items-center justify-center rounded-lg font-bold tabular-nums transition-colors ${TILE_STYLE[v] ?? 'bg-[#3c3a32] text-white'} ${v >= 128 ? 'text-xl' : 'text-2xl'} ${v !== 0 ? 'tile-pop' : ''}`}
            >
              {v !== 0 ? v : ''}
            </div>
          )),
        )}

        {(over || showWin) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] bg-bg/80 backdrop-blur-sm">
            <p className="font-serif text-2xl text-ink">{showWin ? '🎉 達成 2048！' : '遊戲結束'}</p>
            <div className="flex gap-2">
              {showWin && (
                <button onClick={() => setKeepGoing(true)} className="rounded-lg border border-edge bg-surface px-5 py-2.5 text-ink transition-colors hover:border-accent">
                  繼續挑戰
                </button>
              )}
              <button onClick={restart} className="rounded-lg bg-accent px-5 py-2.5 text-white transition-colors hover:bg-[var(--color-accent-hover)]">
                再玩一次
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-muted">用方向鍵、WASD 或滑動來移動方塊</p>
    </div>
  );
}

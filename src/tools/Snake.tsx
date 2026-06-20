import { useEffect, useRef, useState } from 'react';
import { newGame, step, isOpposite, type SnakeState, type Direction } from '../lib/snake';
import { getNumber, setNumber } from '../lib/storage';

const SIZE = 15;
const TICK_MS = 130;
const BEST_KEY = 'tiglet:snake-best';

export default function Snake() {
  const [state, setState] = useState<SnakeState>(() => newGame(SIZE));
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(0);
  const lastDir = useRef<Direction>(state.dir);
  const pendingDir = useRef<Direction | null>(null);

  useEffect(() => { setBest(getNumber(BEST_KEY)); }, []);

  useEffect(() => {
    if (state.score > best) {
      setBest(state.score);
      setNumber(BEST_KEY, state.score);
    }
  }, [state.score, best]);

  // Game loop
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (!prev.alive) return prev;
        const dir = pendingDir.current ?? prev.dir;
        pendingDir.current = null;
        lastDir.current = dir;
        return step({ ...prev, dir });
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  // Stop the loop when the snake dies
  useEffect(() => { if (!state.alive) setRunning(false); }, [state.alive]);

  function queueTurn(dir: Direction) {
    if (!isOpposite(lastDir.current, dir)) pendingDir.current = dir;
    if (!running && state.alive) setRunning(true);
  }

  useEffect(() => {
    const KEYS: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ') { e.preventDefault(); setRunning((r) => (state.alive ? !r : r)); return; }
      const dir = KEYS[e.key];
      if (!dir) return;
      e.preventDefault();
      queueTurn(dir);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, state.alive]);

  function restart() {
    const g = newGame(SIZE);
    lastDir.current = g.dir;
    pendingDir.current = null;
    setState(g);
    setRunning(true);
  }

  const headKey = state.snake[0].y * SIZE + state.snake[0].x;
  const bodyKeys = new Set(state.snake.slice(1).map((p) => p.y * SIZE + p.x));
  const foodKey = state.food.y * SIZE + state.food.x;

  return (
    <div className="mx-auto max-w-[26rem]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="rounded-lg border border-edge bg-surface px-4 py-2 text-center">
            <div className="text-xs text-muted">分數</div>
            <div className="font-mono text-lg tabular-nums text-ink">{state.score}</div>
          </div>
          <div className="rounded-lg border border-edge bg-surface px-4 py-2 text-center">
            <div className="text-xs text-muted">最佳</div>
            <div className="font-mono text-lg tabular-nums text-ink">{best}</div>
          </div>
        </div>
        {state.alive ? (
          <button onClick={() => setRunning((r) => !r)} className="rounded-lg bg-accent px-4 py-2.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)]">
            {running ? '暫停' : '開始'}
          </button>
        ) : (
          <button onClick={restart} className="rounded-lg bg-accent px-4 py-2.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)]">
            重新開始
          </button>
        )}
      </div>

      <div className="relative rounded-[var(--radius-card)] border border-edge bg-edge/30 p-2">
        <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
          {Array.from({ length: SIZE * SIZE }, (_, i) => {
            const isHead = i === headKey;
            const isBody = bodyKeys.has(i);
            const isFood = i === foodKey;
            return (
              <div
                key={i}
                className={`aspect-square rounded-[3px] transition-colors ${
                  isHead ? 'bg-accent' : isBody ? 'bg-accent/60' : isFood ? 'bg-red-500 snake-food' : 'bg-surface'
                }`}
              />
            );
          })}
        </div>

        {!state.alive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] bg-bg/80 backdrop-blur-sm">
            <p className="font-serif text-2xl text-ink">遊戲結束</p>
            <button onClick={restart} className="rounded-lg bg-accent px-5 py-2.5 text-white transition-colors hover:bg-[var(--color-accent-hover)]">
              再玩一次
            </button>
          </div>
        )}
      </div>

      {/* On-screen D-pad for touch devices */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
        <span />
        <button onClick={() => queueTurn('up')} className="rounded-lg border border-edge bg-surface py-3 text-ink active:bg-accent active:text-white">↑</button>
        <span />
        <button onClick={() => queueTurn('left')} className="rounded-lg border border-edge bg-surface py-3 text-ink active:bg-accent active:text-white">←</button>
        <button onClick={() => queueTurn('down')} className="rounded-lg border border-edge bg-surface py-3 text-ink active:bg-accent active:text-white">↓</button>
        <button onClick={() => queueTurn('right')} className="rounded-lg border border-edge bg-surface py-3 text-ink active:bg-accent active:text-white">→</button>
      </div>

      <p className="mt-4 hidden text-center text-sm text-muted sm:block">方向鍵或 WASD 控制，空白鍵暫停</p>
    </div>
  );
}

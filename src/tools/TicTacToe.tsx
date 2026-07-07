import { useState } from 'react';
import { emptyBoard, winner, winningLine, isDraw, bestMove, type Board, type Player } from '../lib/ticTacToe';
import { type Locale } from '../lib/i18n';

type Mode = 'pvp' | 'cpu';

const L = {
  zh: {
    wins: (p: Player) => `${p} 獲勝！`,
    draw: '平手！',
    turn: (p: Player) => `輪到 ${p}`,
    pvp: '雙人',
    cpu: '對電腦',
    restart: '重新開始',
  },
  en: {
    wins: (p: Player) => `${p} wins!`,
    draw: 'Draw!',
    turn: (p: Player) => `${p}'s turn`,
    pvp: '2 players',
    cpu: 'vs computer',
    restart: 'Restart',
  },
} as const;

export default function TicTacToe({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [turn, setTurn] = useState<Player>('X');
  const [mode, setMode] = useState<Mode>('pvp');

  const line = winningLine(board);
  const win = winner(board);
  const draw = isDraw(board);
  const over = win !== null || draw;
  const status = win ? t.wins(win) : draw ? t.draw : t.turn(turn);

  function play(i: number) {
    if (board[i] || over) return;
    const next = [...board];
    next[i] = turn;
    if (mode === 'cpu' && turn === 'X' && winner(next) === null && !isDraw(next)) {
      const cpu = bestMove(next, 'O');
      if (cpu >= 0) next[cpu] = 'O';
      setBoard(next);
      setTurn('X');
    } else {
      setBoard(next);
      setTurn(turn === 'X' ? 'O' : 'X');
    }
  }

  function reset(nextMode: Mode = mode) {
    setBoard(emptyBoard());
    setTurn('X');
    setMode(nextMode);
  }

  return (
    <div className="mx-auto max-w-xs">
      <div className="mb-4 flex gap-2">
        <button onClick={() => reset('pvp')} className={`flex-1 rounded-lg border border-edge py-2 text-sm ${mode === 'pvp' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>{t.pvp}</button>
        <button onClick={() => reset('cpu')} className={`flex-1 rounded-lg border border-edge py-2 text-sm ${mode === 'cpu' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>{t.cpu}</button>
      </div>
      <p className="mb-4 text-center font-serif text-xl text-ink">{status}</p>
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const isWin = line?.includes(i) ?? false;
          return (
            <button
              key={i}
              onClick={() => play(i)}
              className={`aspect-square rounded-lg border text-4xl font-semibold transition-colors disabled:cursor-not-allowed ${
                isWin ? 'cell-win border-accent text-accent' : 'border-edge bg-surface text-ink hover:border-accent/40'
              }`}
              disabled={cell !== null || over}
            >
              {cell && <span key={cell} className="mark-pop">{cell}</span>}
            </button>
          );
        })}
      </div>
      <button onClick={() => reset()} className="mt-4 w-full rounded-lg border border-edge bg-surface py-2 text-sm text-accent hover:bg-accent hover:text-white">{t.restart}</button>
    </div>
  );
}

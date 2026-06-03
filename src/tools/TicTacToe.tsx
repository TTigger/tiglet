import { useState } from 'react';
import { emptyBoard, winner, isDraw, bestMove, type Board, type Player } from '../lib/ticTacToe';

type Mode = 'pvp' | 'cpu';

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [turn, setTurn] = useState<Player>('X');
  const [mode, setMode] = useState<Mode>('pvp');

  const win = winner(board);
  const draw = isDraw(board);
  const over = win !== null || draw;
  const status = win ? `${win} 獲勝！` : draw ? '平手！' : `輪到 ${turn}`;

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
        <button onClick={() => reset('pvp')} className={`flex-1 rounded-lg border border-edge py-2 text-sm ${mode === 'pvp' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>雙人</button>
        <button onClick={() => reset('cpu')} className={`flex-1 rounded-lg border border-edge py-2 text-sm ${mode === 'cpu' ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>對電腦</button>
      </div>
      <p className="mb-4 text-center font-serif text-xl text-ink">{status}</p>
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            className="aspect-square rounded-lg border border-edge bg-surface text-4xl font-semibold text-ink transition-colors hover:border-accent/40 disabled:cursor-not-allowed"
            disabled={cell !== null || over}
          >{cell}</button>
        ))}
      </div>
      <button onClick={() => reset()} className="mt-4 w-full rounded-lg border border-edge bg-surface py-2 text-sm text-accent hover:bg-accent hover:text-white">重新開始</button>
    </div>
  );
}

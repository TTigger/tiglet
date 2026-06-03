import { useState } from 'react';
import { parseOptions, pickIndex } from '../lib/wheel';
import { useUrlState } from '../lib/urlState';

const COLORS = ['#D97757', '#E0A05E', '#C9923F', '#B5743E', '#E08A5F', '#CFA15A', '#D2864A', '#BC8A4E'];
const R = 140, CX = 150, CY = 150;

function point(phi: number): [number, number] {
  const rad = (phi * Math.PI) / 180;
  return [CX + R * Math.sin(rad), CY - R * Math.cos(rad)];
}

export default function Wheel() {
  const [text, setText] = useUrlState('o', '');
  const options = parseOptions(text);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const n = options.length;
  const a = n > 0 ? 360 / n : 0;

  function spin() {
    if (n < 2 || spinning) return;
    const w = pickIndex(n);
    const theta = w * a + a / 2;
    const base = rotation - (rotation % 360);
    setWinner(null);
    setSpinning(true);
    setRotation(base + 360 * 5 + (360 - theta));
    setTimeout(() => { setSpinning(false); setWinner(options[w]); }, 4200);
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="relative mb-6 flex justify-center">
        <div className="absolute -top-1 z-10 h-0 w-0 border-x-8 border-t-[16px] border-x-transparent border-t-accent" />
        <svg width="300" height="300" viewBox="0 0 300 300" role="img" aria-label="抽籤輪盤">
          <g style={{ transformOrigin: '150px 150px', transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}>
            {n === 0 ? (
              <circle cx={CX} cy={CY} r={R} fill="#E8E4D9" />
            ) : n === 1 ? (
              <>
                <circle cx={CX} cy={CY} r={R} fill={COLORS[0]} />
                <text x={CX} y={CY} fill="#fff" fontSize="14" textAnchor="middle" dominantBaseline="middle">{options[0]}</text>
              </>
            ) : (
              options.map((opt, i) => {
                const [x1, y1] = point(i * a);
                const [x2, y2] = point((i + 1) * a);
                const large = a > 180 ? 1 : 0;
                const rad = ((i * a + a / 2) * Math.PI) / 180;
                const lx = CX + R * 0.6 * Math.sin(rad);
                const ly = CY - R * 0.6 * Math.cos(rad);
                const label = opt.length > 8 ? opt.slice(0, 8) + '…' : opt;
                return (
                  <g key={i}>
                    <path d={`M${CX} ${CY} L${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`} fill={COLORS[i % COLORS.length]} stroke="#FFFFFF" strokeWidth="1" />
                    <text x={lx} y={ly} fill="#FFFFFF" fontSize="12" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${i * a + a / 2}, ${lx}, ${ly})`}>{label}</text>
                  </g>
                );
              })
            )}
          </g>
          <circle cx={CX} cy={CY} r="6" fill="#1A1A18" />
        </svg>
      </div>

      {winner && <p className="mb-4 text-center font-serif text-2xl text-ink">🎉 {winner}</p>}

      <button onClick={spin} disabled={n < 2 || spinning} className="mb-4 w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
        {spinning ? '轉動中…' : '開始抽籤'}
      </button>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={'每行一個選項，例如：\n珍珠奶茶\n美式咖啡\n綠茶'}
        className="w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
      />
      <p className="mt-2 text-sm text-muted">目前 {n} 個選項。複製本頁網址即可把選項分享給別人。</p>
    </div>
  );
}

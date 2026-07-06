import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  parseGpx,
  parseGpxName,
  buildProfile,
  totalAscentM,
  detectClimbs,
  gradientBuckets,
  gradientSegments,
  steepestKm,
  CLIMB_CATEGORIES,
  GRADIENT_BANDS,
  type Profile,
  type Climb,
} from '../lib/gpx';

// 檔案完全在本機解析；SVG 用固定色票（非 CSS 變數），
// 匯出的 PNG 才不會受深淺色主題影響。

const C = {
  bg: '#FAF9F5',
  ink: '#1A1A18',
  accent: '#D97757',
  fill: '#EAC4B0',
};

const W = 840;
const H = 380;
const ML = 52;
const MR = 28;
const MT = 64;
const MB = 40;
const PW = W - ML - MR;
const PH = H - MT - MB;

function catColor(id: string | null): string {
  return CLIMB_CATEGORIES.find((c) => c.id === id)?.color ?? '#8A8A82';
}

function tickStepKm(totalKm: number): number {
  if (totalKm <= 20) return 5;
  if (totalKm <= 60) return 10;
  if (totalKm <= 150) return 20;
  return 50;
}

function ProfileSvg({ profile, climbs, climbNames, title, svgRef }: { profile: Profile; climbs: Climb[]; climbNames: string[]; title: string; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const samples = profile.samples;
  const total = profile.totalDistanceM;
  const eles = samples.map((s) => s.ele);
  const minE = Math.min(...eles);
  const maxE = Math.max(...eles);
  const range = Math.max(maxE - minE, 50); // 平路也要有一點山形
  const x = (d: number) => ML + (d / total) * PW;
  const y = (e: number) => MT + (1 - (e - minE) / (range * 1.15)) * PH;
  const baseY = MT + PH;

  const linePath = samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(s.distanceM).toFixed(1)},${y(s.ele).toFixed(1)}`).join(' ');

  // 山體依坡度色帶切片上色（環賽剖面圖慣例：顏色＝多陡，分級只留在徽章）
  const segments = gradientSegments(samples);
  const sliceArea = (startM: number, endM: number) => {
    const seg = samples.filter((s) => s.distanceM >= startM && s.distanceM <= endM);
    if (seg.length < 2) return '';
    const line = seg.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(s.distanceM).toFixed(1)},${y(s.ele).toFixed(1)}`).join(' ');
    return `${line} L${x(endM).toFixed(1)},${baseY} L${x(startM).toFixed(1)},${baseY} Z`;
  };

  const totalKm = total / 1000;
  const step = tickStepKm(totalKm);
  const ticks: number[] = [];
  for (let km = step; km < totalKm; km += step) ticks.push(km);
  const ascent = totalAscentM(samples);

  // Y 軸海拔刻度：挑一個讓刻度數落在 3–6 條的整數級距
  const eleStep = [10, 20, 50, 100, 200, 250, 500, 1000].find((s) => range / s <= 5) ?? 1000;
  const eleTicks: number[] = [];
  for (let e = Math.ceil(minE / eleStep) * eleStep; e <= maxE; e += eleStep) eleTicks.push(e);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="賽段剖面圖" className="w-full rounded-[var(--radius-card)] border border-edge" style={{ background: C.bg }}>
      <rect x={0} y={0} width={W} height={H} fill={C.bg} />
      {/* 標題與總覽 */}
      <text x={ML} y={30} fill={C.ink} fontSize={20} fontWeight={700} fontFamily="Georgia, 'Noto Serif TC', serif">{title || '我的路線'}</text>
      <text x={ML} y={50} fill="#6B6A63" fontSize={12} fontFamily="system-ui, sans-serif">
        {totalKm.toFixed(1)} km ・ 總爬升 {Math.round(ascent)} m ・ 海拔 {Math.round(minE)}–{Math.round(maxE)} m
      </text>
      <text x={W - MR} y={30} fill={C.accent} fontSize={11} textAnchor="end" fontFamily="system-ui, sans-serif">tiglet.vercel.app</text>

      {/* 坡度色階圖例（右上，會一起輸出進 PNG） */}
      <g fontFamily="system-ui, sans-serif" fontSize={9}>
        {GRADIENT_BANDS.map((b, i) => {
          const bx = W - MR - (GRADIENT_BANDS.length - i) * 52;
          return (
            <g key={b.id}>
              <rect x={bx} y={42} width={9} height={9} rx={2} fill={b.color} />
              <text x={bx + 12} y={50} fill="#6B6A63">{b.label}</text>
            </g>
          );
        })}
      </g>

      {/* Y 軸海拔刻度與網格線（畫在剖面下層） */}
      {eleTicks.map((e) => (
        <g key={e}>
          <line x1={ML} y1={y(e)} x2={W - MR} y2={y(e)} stroke="#D6D1C4" strokeWidth={1} strokeDasharray="3 4" />
          <text x={ML - 6} y={y(e) + 3} fill="#6B6A63" fontSize={10} textAnchor="end" fontFamily="system-ui, sans-serif">
            {e}m
          </text>
        </g>
      ))}

      {/* 主剖面：依坡度色帶切片 */}
      {segments.map((s, i) => (
        <path key={i} d={sliceArea(s.startM, s.endM)} fill={s.band.color} opacity={0.85} />
      ))}
      <path d={linePath} fill="none" stroke={C.ink} strokeWidth={1.5} />
      <line x1={ML} y1={baseY} x2={W - MR} y2={baseY} stroke={C.ink} strokeWidth={1} />

      {/* 公里刻度 */}
      {ticks.map((km) => (
        <g key={km}>
          <line x1={x(km * 1000)} y1={baseY} x2={x(km * 1000)} y2={baseY + 5} stroke="#6B6A63" strokeWidth={1} />
          <text x={x(km * 1000)} y={baseY + 18} fill="#6B6A63" fontSize={10} textAnchor="middle" fontFamily="system-ui, sans-serif">{km}k</text>
        </g>
      ))}

      {/* 起終點 */}
      <g fontFamily="system-ui, sans-serif" fontSize={11}>
        <circle cx={x(0)} cy={y(samples[0].ele)} r={4} fill={C.ink} />
        <text x={x(0)} y={baseY + 18} fill={C.ink} textAnchor="start" fontWeight={600}>起點</text>
        <circle cx={x(total)} cy={y(samples[samples.length - 1].ele)} r={4} fill={C.ink} />
        <text x={x(total)} y={baseY + 18} fill={C.ink} textAnchor="end" fontWeight={600}>終點</text>
      </g>

      {/* 爬坡徽章（山頂），有命名時把名字畫進圖裡 */}
      {climbs.map((c, i) => {
        const cx = x(c.endM);
        const cy = y(c.topEle);
        const color = catColor(c.category);
        const label = c.category ?? '坡';
        const name = climbNames[i]?.trim();
        return (
          <g key={i} fontFamily="system-ui, sans-serif">
            <line x1={cx} y1={cy} x2={cx} y2={cy - 26} stroke={color} strokeWidth={1.5} />
            <rect x={cx - 15} y={cy - 46} width={30} height={20} rx={4} fill={color} />
            <text x={cx} y={cy - 32} fill="#fff" fontSize={12} fontWeight={700} textAnchor="middle">{label}</text>
            <text x={cx} y={cy - 52} fill={C.ink} fontSize={10} textAnchor="middle">
              {(c.lengthM / 1000).toFixed(1)}km @ {c.avgGradientPct.toFixed(1)}%
            </text>
            {name && (
              <text x={cx} y={cy - 64} fill={C.ink} fontSize={12} fontWeight={700} textAnchor="middle">
                {name}（海拔 {Math.round(c.topEle)}m）
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-edge bg-surface px-3 py-2 text-center">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-lg tabular-nums text-ink">{value}</div>
    </div>
  );
}

const EXPORT_GUIDES: Array<{ app: string; steps: string }> = [
  { app: 'Strava', steps: '活動頁 → 右上「⋯」→「匯出 GPX」。路線（Routes）頁也有相同選項。' },
  { app: 'Garmin Connect', steps: '活動頁 → 右上齒輪 →「匯出至 GPX」。' },
  { app: 'Bryton Active', steps: '活動 → 分享 → 匯出 GPX 檔案。' },
  { app: 'Wahoo', steps: 'ELEMNT app → 騎乘紀錄 → 分享 → 匯出 .gpx（或從 Wahoo Cloud 下載）。' },
  { app: 'Komoot', steps: '路線頁 →「⋯」→「匯出 GPX」。' },
];

export default function StageProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [climbNames, setClimbNames] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const svgRef = useRef<SVGSVGElement | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const xml = await file.text();
      const points = parseGpx(xml);
      const p = buildProfile(points);
      const cs = detectClimbs(p.samples);
      setProfile(p);
      setClimbs(cs);
      setClimbNames(Array(cs.length).fill(''));
      setTitle(parseGpxName(xml) ?? file.name.replace(/\.gpx$/i, ''));
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : '無法讀取這個 GPX 檔');
    } finally {
      e.target.value = '';
    }
  }

  function downloadPng() {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((png) => {
        if (!png) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(png);
        a.download = `${title.trim() || 'stage-profile'}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    };
    img.src = url;
  }

  const stats = profile
    ? {
        km: (profile.totalDistanceM / 1000).toFixed(1),
        ascent: Math.round(totalAscentM(profile.samples)).toString(),
        steep: steepestKm(profile.samples).gradientPct.toFixed(1),
        climbs: climbs.length.toString(),
      }
    : null;
  const buckets = profile ? gradientBuckets(profile.samples) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-[var(--radius-card)] border border-dashed border-edge bg-surface p-4 text-center">
        <label className="cursor-pointer text-accent hover:underline">
          上傳 GPX 檔案
          <input type="file" accept=".gpx" onChange={onFile} className="hidden" />
        </label>
        <p className="mt-1 text-xs text-muted">檔案只在你的瀏覽器解析，不會上傳到任何伺服器。</p>
      </div>

      <details className="rounded-[var(--radius-card)] border border-edge bg-surface p-4 text-sm">
        <summary className="cursor-pointer text-muted hover:text-accent">怎麼從 Strava / Garmin / Bryton 匯出 GPX？</summary>
        <ul className="mt-3 space-y-2">
          {EXPORT_GUIDES.map((g) => (
            <li key={g.app}><span className="font-semibold text-ink">{g.app}</span><span className="text-muted">：{g.steps}</span></li>
          ))}
        </ul>
      </details>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {profile && stats && buckets && (
        <>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">路線標題（會畫進圖裡）</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：2026-07-06 西進武嶺"
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>

          <ProfileSvg profile={profile} climbs={climbs} climbNames={climbNames} title={title} svgRef={svgRef} />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="總距離" value={`${stats.km} km`} />
            <StatCard label="總爬升" value={`${stats.ascent} m`} />
            <StatCard label="最陡 1km" value={`${stats.steep}%`} />
            <StatCard label="偵測爬坡" value={`${stats.climbs} 段`} />
          </div>

          {climbs.length > 0 && (
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge">
                    <th className="px-3 py-2 text-left font-normal text-muted">爬坡</th>
                    <th className="px-3 py-2 text-left font-normal text-muted">名稱（會畫進圖裡）</th>
                    <th className="px-3 py-2 text-right font-normal text-muted">起點</th>
                    <th className="px-3 py-2 text-right font-normal text-muted">長度</th>
                    <th className="px-3 py-2 text-right font-normal text-muted">爬升</th>
                    <th className="px-3 py-2 text-right font-normal text-muted">平均坡度</th>
                  </tr>
                </thead>
                <tbody>
                  {climbs.map((c, i) => (
                    <tr key={i} className="border-b border-edge last:border-0">
                      <td className="px-3 py-2">
                        <span className="rounded px-2 py-0.5 text-xs font-bold text-white" style={{ background: catColor(c.category) }}>
                          {c.category ? (c.category === 'HC' ? 'HC' : `${c.category} 級`) : '未分級'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={climbNames[i] ?? ''}
                          onChange={(e) => setClimbNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
                          placeholder={`例如：風櫃嘴`}
                          aria-label={`爬坡 ${i + 1} 名稱`}
                          className="w-28 rounded border border-edge bg-bg px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">{(c.startM / 1000).toFixed(1)} km</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">{(c.lengthM / 1000).toFixed(1)} km</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">{Math.round(c.gainM)} m</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">{c.avgGradientPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={downloadPng} className="rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)]">
              下載 PNG 圖片
            </button>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              {buckets.map((b) => (
                <span key={b.label} className="rounded border border-edge px-2 py-1">
                  坡度 {b.label}：{(b.distanceM / 1000).toFixed(1)} km
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted">
            爬坡分級採「長度 × 平均坡度」通用分數制（≥8000 四級 … ≥80000 HC），與正式賽事官方分級可能不同。
            海拔已做平滑處理以消除 GPS 雜訊。
          </p>
        </>
      )}
    </div>
  );
}

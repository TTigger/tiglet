import { useState } from 'react';
import Tabs from '../components/Tabs';
import { useUrlState } from '../lib/urlState';
import {
  gearTable,
  gearRatio,
  speedKmh,
  cadenceFor,
  setupSummary,
  checkDerailleur,
  parseTeeth,
  formatTeeth,
  CHAINRING_PRESETS,
  CASSETTE_PRESETS,
  WHEEL_PRESETS,
  DERAILLEUR_PRESETS,
  SPEED_RPMS,
  type Drivetrain,
  type TeethPreset,
} from '../lib/gear';

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2 font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent';
const selectClass = 'w-full rounded-lg border border-edge bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-accent';
const thClass = 'px-3 py-2 text-right font-normal text-muted';
const tdClass = 'px-3 py-1.5 text-right font-mono tabular-nums';

const DEFAULT_RINGS = [50, 34];
const DEFAULT_CASSETTE = [11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30];
const DEFAULT_WHEEL = 2105;

function parseCirc(text: string): number | null {
  const n = Number(text);
  return Number.isFinite(n) && n >= 1000 && n <= 2600 ? n : null;
}

// 預設選單 + 自訂文字輸入的齒數欄位；文字直接綁 URL 狀態
function TeethField({
  label,
  presets,
  value,
  onChange,
  fallback,
}: {
  label: string;
  presets: TeethPreset[];
  value: string;
  onChange: (v: string) => void;
  fallback: number[];
}) {
  const parsed = parseTeeth(value);
  const presetMatch = presets.find((p) => formatTeeth(p.teeth) === value);
  return (
    <div>
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <select
        value={presetMatch ? formatTeeth(presetMatch.teeth) : ''}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className={selectClass}
        aria-label={`${label}預設`}
      >
        <option value="">自訂…</option>
        {presets.map((p) => (
          <option key={p.label} value={formatTeeth(p.teeth)}>{p.label}</option>
        ))}
      </select>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={formatTeeth(fallback)}
        aria-label={`${label}齒數`}
        className={`${inputClass} mt-1 text-sm ${parsed ? '' : 'border-red-400'}`}
      />
      {!parsed && <p className="mt-1 text-xs text-red-500">格式：齒數以 - 分隔，例如 {formatTeeth(fallback)}</p>}
    </div>
  );
}

function useDrivetrain(ringKey: string, cogKey: string, wheelStr: string): { dt: Drivetrain; ringStr: string; setRingStr: (v: string) => void; cogStr: string; setCogStr: (v: string) => void } {
  const [ringStr, setRingStr] = useUrlState(ringKey, formatTeeth(DEFAULT_RINGS));
  const [cogStr, setCogStr] = useUrlState(cogKey, formatTeeth(DEFAULT_CASSETTE));
  const dt: Drivetrain = {
    chainrings: parseTeeth(ringStr) ?? DEFAULT_RINGS,
    cassette: parseTeeth(cogStr) ?? DEFAULT_CASSETTE,
    circumferenceMm: parseCirc(wheelStr) ?? DEFAULT_WHEEL,
  };
  return { dt, ringStr, setRingStr, cogStr, setCogStr };
}

function MatrixPanel({ dt }: { dt: Drivetrain }) {
  const [metric, setMetric] = useState<'ratio' | 'inches' | 'dev'>('ratio');
  const table = gearTable(dt);
  const rings = [...dt.chainrings].sort((a, b) => b - a);
  const cogs = [...dt.cassette].sort((a, b) => a - b);
  const value = (ring: number, cog: number) => {
    const g = table.find((e) => e.chainring === ring && e.cog === cog)!;
    if (metric === 'ratio') return g.ratio.toFixed(2);
    if (metric === 'inches') return g.gearInches.toFixed(1);
    return `${g.developmentM.toFixed(2)} m`;
  };
  return (
    <div>
      <div className="mb-3 flex justify-center gap-1">
        {([['ratio', '齒比'], ['inches', 'Gear inches'], ['dev', 'Development']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMetric(id)}
            aria-pressed={metric === id}
            className={`rounded-md border border-edge px-3 py-1 text-sm ${metric === id ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th className={`${thClass} text-left`}>飛輪＼大盤</th>
              {rings.map((r) => <th key={r} className={thClass}>{r}T</th>)}
            </tr>
          </thead>
          <tbody>
            {cogs.map((cog) => (
              <tr key={cog} className="border-b border-edge last:border-0">
                <td className="px-3 py-1.5 text-left font-mono text-muted">{cog}T</td>
                {rings.map((r) => <td key={r} className={`${tdClass} text-ink`}>{value(r, cog)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Development＝踩一圈曲柄前進的公尺數；gear inches 為傳統齒比單位。</p>
    </div>
  );
}

function SpeedPanel({ dt }: { dt: Drivetrain }) {
  const [rpm, setRpm] = useState<number>(90);
  const rings = [...dt.chainrings].sort((a, b) => b - a);
  const cogs = [...dt.cassette].sort((a, b) => a - b);
  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-1">
        <span className="mr-2 text-sm text-muted">迴轉速</span>
        {SPEED_RPMS.map((r) => (
          <button
            key={r}
            onClick={() => setRpm(r)}
            aria-pressed={rpm === r}
            className={`rounded-md border border-edge px-3 py-1 text-sm ${rpm === r ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
          >
            {r}
          </button>
        ))}
        <span className="ml-1 text-sm text-muted">rpm</span>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th className={`${thClass} text-left`}>飛輪＼大盤</th>
              {rings.map((r) => <th key={r} className={thClass}>{r}T</th>)}
            </tr>
          </thead>
          <tbody>
            {cogs.map((cog) => (
              <tr key={cog} className="border-b border-edge last:border-0">
                <td className="px-3 py-1.5 text-left font-mono text-muted">{cog}T</td>
                {rings.map((r) => (
                  <td key={r} className={`${tdClass} text-ink`}>{speedKmh(gearRatio(r, cog), dt.circumferenceMm, rpm).toFixed(1)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">單位 km/h，假設無滑動的理想傳動。</p>
    </div>
  );
}

function CompareRow({ label, a, b, better }: { label: string; a: string; b: string; better?: 'a' | 'b' | null }) {
  const hl = 'font-semibold text-accent';
  return (
    <tr className="border-b border-edge last:border-0">
      <td className="px-3 py-2 text-left text-muted">{label}</td>
      <td className={`${tdClass} ${better === 'a' ? hl : 'text-ink'}`}>{a}</td>
      <td className={`${tdClass} ${better === 'b' ? hl : 'text-ink'}`}>{b}</td>
    </tr>
  );
}

function ComparePanel({ dt, wheelStr }: { dt: Drivetrain; wheelStr: string }) {
  const b = useDrivetrain('rb', 'cb', wheelStr);
  const sa = setupSummary(dt);
  const sb = setupSummary(b.dt);
  const pick = (x: number, y: number, mode: 'high' | 'low'): 'a' | 'b' | null =>
    x === y ? null : (mode === 'high' ? x > y : x < y) ? 'a' : 'b';
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-4">
        <p className="mb-3 text-sm text-muted">設定 B（設定 A 用上方共用設定）</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TeethField label="大盤 B" presets={CHAINRING_PRESETS} value={b.ringStr} onChange={b.setRingStr} fallback={DEFAULT_RINGS} />
          <TeethField label="飛輪 B" presets={CASSETTE_PRESETS} value={b.cogStr} onChange={b.setCogStr} fallback={DEFAULT_CASSETTE} />
        </div>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th className={`${thClass} text-left`}>指標</th>
              <th className={thClass}>A（{formatTeeth(dt.chainrings)}）</th>
              <th className={thClass}>B（{formatTeeth(b.dt.chainrings)}）</th>
            </tr>
          </thead>
          <tbody>
            <CompareRow label="最重齒比" a={sa.maxRatio.toFixed(2)} b={sb.maxRatio.toFixed(2)} better={pick(sa.maxRatio, sb.maxRatio, 'high')} />
            <CompareRow label="最輕齒比（越小越好爬）" a={sa.minRatio.toFixed(2)} b={sb.minRatio.toFixed(2)} better={pick(sa.minRatio, sb.minRatio, 'low')} />
            <CompareRow label="齒比範圍" a={`${sa.rangePercent.toFixed(0)}%`} b={`${sb.rangePercent.toFixed(0)}%`} better={pick(sa.rangePercent, sb.rangePercent, 'high')} />
            <CompareRow label="90rpm 極速" a={`${sa.topSpeedAt90.toFixed(1)} km/h`} b={`${sb.topSpeedAt90.toFixed(1)} km/h`} better={pick(sa.topSpeedAt90, sb.topSpeedAt90, 'high')} />
            <CompareRow label="90rpm 最低速" a={`${sa.lowSpeedAt90.toFixed(1)} km/h`} b={`${sb.lowSpeedAt90.toFixed(1)} km/h`} better={pick(sa.lowSpeedAt90, sb.lowSpeedAt90, 'low')} />
            <CompareRow label="平均級距" a={`${sa.avgStepPercent.toFixed(1)}%`} b={`${sb.avgStepPercent.toFixed(1)}%`} better={pick(sa.avgStepPercent, sb.avgStepPercent, 'low')} />
            <CompareRow label="最大斷差" a={`${sa.maxStepPercent.toFixed(1)}%`} b={`${sb.maxStepPercent.toFixed(1)}%`} better={pick(sa.maxStepPercent, sb.maxStepPercent, 'low')} />
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">橘色為該指標較優的一方；級距越小換檔越順。含大小盤全部組合（未去除重疊檔）。</p>
    </div>
  );
}

function QuickPanel({ dt }: { dt: Drivetrain }) {
  const rings = [...dt.chainrings].sort((a, b) => b - a);
  const cogs = [...dt.cassette].sort((a, b) => a - b);
  const [ring, setRing] = useState(rings[0]);
  const [cog, setCog] = useState(cogs[Math.floor(cogs.length / 2)]);
  const [rpmStr, setRpmStr] = useState('90');
  const [speedStr, setSpeedStr] = useState('');
  const curRing = rings.includes(ring) ? ring : rings[0];
  const curCog = cogs.includes(cog) ? cog : cogs[0];
  const ratio = gearRatio(curRing, curCog);
  const rpm = Number(rpmStr);
  const speed = Number(speedStr);
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">大盤</span>
          <select value={curRing} onChange={(e) => setRing(Number(e.target.value))} className={selectClass}>
            {rings.map((r) => <option key={r} value={r}>{r}T</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">飛輪</span>
          <select value={curCog} onChange={(e) => setCog(Number(e.target.value))} className={selectClass}>
            {cogs.map((c) => <option key={c} value={c}>{c}T</option>)}
          </select>
        </label>
      </div>
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-4 text-center">
        <span className="text-sm text-muted">齒比 </span>
        <span className="font-mono text-lg tabular-nums text-ink">{ratio.toFixed(2)}</span>
      </div>
      <div className="space-y-2 rounded-[var(--radius-card)] border border-edge bg-surface p-4">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">迴轉速 → 時速</span>
          <input type="number" value={rpmStr} onChange={(e) => setRpmStr(e.target.value)} className={inputClass} placeholder="90" />
        </label>
        <p className="text-center font-mono text-2xl tabular-nums text-ink">
          {Number.isFinite(rpm) && rpmStr !== '' ? `${speedKmh(ratio, dt.circumferenceMm, rpm).toFixed(1)} km/h` : '—'}
        </p>
      </div>
      <div className="space-y-2 rounded-[var(--radius-card)] border border-edge bg-surface p-4">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">時速 → 所需迴轉速</span>
          <input type="number" value={speedStr} onChange={(e) => setSpeedStr(e.target.value)} className={inputClass} placeholder="35" />
        </label>
        <p className="text-center font-mono text-2xl tabular-nums text-ink">
          {Number.isFinite(speed) && speedStr !== '' ? `${cadenceFor(speed, ratio, dt.circumferenceMm).toFixed(0)} rpm` : '—'}
        </p>
      </div>
    </div>
  );
}

function CapacityPanel({ dt }: { dt: Drivetrain }) {
  const [rdIdx, setRdIdx] = useState(1);
  const rd = DERAILLEUR_PRESETS[rdIdx];
  const r = checkDerailleur(dt.chainrings, dt.cassette, rd);
  const Badge = ({ ok }: { ok: boolean }) => (
    <span className={`rounded px-2 py-0.5 text-sm text-white ${ok ? 'bg-green-600' : 'bg-red-500'}`}>{ok ? '通過' : '超出'}</span>
  );
  return (
    <div className="mx-auto max-w-md space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">後變速器規格</span>
        <select value={rdIdx} onChange={(e) => setRdIdx(Number(e.target.value))} className={selectClass}>
          {DERAILLEUR_PRESETS.map((p, i) => (
            <option key={p.label} value={i}>{p.label}（最大 {p.maxCog}T／容量 {p.capacity}T）</option>
          ))}
        </select>
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-3">
          <span className="text-sm text-muted">總容量需求（大盤差＋飛輪差）</span>
          <span className="flex items-center gap-2 font-mono tabular-nums text-ink">{r.capacity}T <Badge ok={r.capacityOk} /></span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-3">
          <span className="text-sm text-muted">最大飛輪齒</span>
          <span className="flex items-center gap-2 font-mono tabular-nums text-ink">{r.maxCog}T <Badge ok={r.maxCogOk} /></span>
        </div>
      </div>
      <p className={`text-center text-lg ${r.ok ? 'text-green-600' : 'text-red-500'}`}>
        {r.ok ? '✓ 此組合與該變速器相容' : '✗ 超出變速器規格，換檔可能異常或損壞'}
      </p>
      <p className="text-center text-xs text-muted">實際上限以原廠規格表為準；部分變速器可小幅超出但不受保固。</p>
    </div>
  );
}

const TABS = [
  { id: 'matrix', label: '齒比表' },
  { id: 'speed', label: '速度對照' },
  { id: 'compare', label: 'A/B 比較' },
  { id: 'quick', label: '快算' },
  { id: 'capacity', label: '容量檢查' },
];

export default function GearCalculator() {
  const [wheelStr, setWheelStr] = useUrlState('w', String(DEFAULT_WHEEL));
  const a = useDrivetrain('r', 'c', wheelStr);
  const [tab, setTab] = useState('matrix');
  const wheelMatch = WHEEL_PRESETS.find((w) => String(w.circumferenceMm) === wheelStr);
  const circValid = parseCirc(wheelStr) !== null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-[var(--radius-card)] border border-edge bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <TeethField label="大盤" presets={CHAINRING_PRESETS} value={a.ringStr} onChange={a.setRingStr} fallback={DEFAULT_RINGS} />
          <TeethField label="飛輪" presets={CASSETTE_PRESETS} value={a.cogStr} onChange={a.setCogStr} fallback={DEFAULT_CASSETTE} />
          <div>
            <span className="mb-1 block text-sm text-muted">輪組（周長 mm）</span>
            <select
              value={wheelMatch ? String(wheelMatch.circumferenceMm) : ''}
              onChange={(e) => e.target.value && setWheelStr(e.target.value)}
              className={selectClass}
              aria-label="輪組預設"
            >
              <option value="">自訂…</option>
              {WHEEL_PRESETS.map((w) => (
                <option key={w.label} value={String(w.circumferenceMm)}>{w.label}（{w.circumferenceMm}mm）</option>
              ))}
            </select>
            <input
              value={wheelStr}
              onChange={(e) => setWheelStr(e.target.value)}
              aria-label="輪組周長"
              className={`${inputClass} mt-1 text-sm ${circValid ? '' : 'border-red-400'}`}
            />
            {!circValid && <p className="mt-1 text-xs text-red-500">請輸入 1000–2600 mm</p>}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">複製本頁網址即可把整組設定分享給車友。</p>
      </div>

      <div className="flex justify-center">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'matrix' && <MatrixPanel dt={a.dt} />}
      {tab === 'speed' && <SpeedPanel dt={a.dt} />}
      {tab === 'compare' && <ComparePanel dt={a.dt} wheelStr={wheelStr} />}
      {tab === 'quick' && <QuickPanel dt={a.dt} />}
      {tab === 'capacity' && <CapacityPanel dt={a.dt} />}
    </div>
  );
}

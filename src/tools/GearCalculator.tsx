import { useState } from 'react';
import Tabs from '../components/Tabs';
import { useUrlState } from '../lib/urlState';
import type { Locale } from '../lib/i18n';
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

const L = {
  zh: {
    custom: '自訂…',
    presetAria: (label: string) => `${label}預設`,
    teethAria: (label: string) => `${label}齒數`,
    teethFormat: (fb: string) => `格式：齒數以 - 分隔，例如 ${fb}`,
    metricRatio: '齒比',
    headCogRing: '飛輪＼大盤',
    matrixNote: 'Development＝踩一圈曲柄前進的公尺數；gear inches 為傳統齒比單位。',
    cadence: '迴轉速',
    speedNote: '單位 km/h，假設無滑動的理想傳動。',
    setupB: '設定 B（設定 A 用上方共用設定）',
    ringB: '大盤 B',
    cogB: '飛輪 B',
    metric: '指標',
    colA: (s: string) => `A（${s}）`,
    colB: (s: string) => `B（${s}）`,
    rowMaxRatio: '最重齒比',
    rowMinRatio: '最輕齒比（越小越好爬）',
    rowRange: '齒比範圍',
    rowTopSpeed: '90rpm 極速',
    rowLowSpeed: '90rpm 最低速',
    rowAvgStep: '平均級距',
    rowMaxStep: '最大斷差',
    compareNote: '橘色為該指標較優的一方；級距越小換檔越順。含大小盤全部組合（未去除重疊檔）。',
    ring: '大盤',
    cog: '飛輪',
    ratioLabel: '齒比 ',
    rpmToSpeed: '迴轉速 → 時速',
    speedToRpm: '時速 → 所需迴轉速',
    rdSpec: '後變速器規格',
    rdOption: (label: string, maxCog: number, capacity: number) => `${label}（最大 ${maxCog}T／容量 ${capacity}T）`,
    pass: '通過',
    over: '超出',
    capacityNeed: '總容量需求（大盤差＋飛輪差）',
    maxCogLabel: '最大飛輪齒',
    okMsg: '✓ 此組合與該變速器相容',
    ngMsg: '✗ 超出變速器規格，換檔可能異常或損壞',
    capacityNote: '實際上限以原廠規格表為準；部分變速器可小幅超出但不受保固。',
    tabMatrix: '齒比表',
    tabSpeed: '速度對照',
    tabCompare: 'A/B 比較',
    tabQuick: '快算',
    tabCapacity: '容量檢查',
    wheelLabel: '輪組（周長 mm）',
    wheelPresetAria: '輪組預設',
    wheelAria: '輪組周長',
    wheelOption: (label: string, mm: number) => `${label}（${mm}mm）`,
    circError: '請輸入 1000–2600 mm',
    shareNote: '複製本頁網址即可把整組設定分享給車友。',
  },
  en: {
    custom: 'Custom…',
    presetAria: (label: string) => `${label} preset`,
    teethAria: (label: string) => `${label} teeth`,
    teethFormat: (fb: string) => `Format: teeth separated by -, e.g. ${fb}`,
    metricRatio: 'Ratio',
    headCogRing: 'Cog ＼ Ring',
    matrixNote: 'Development = metres travelled per crank revolution; gear inches is the traditional gearing unit.',
    cadence: 'Cadence',
    speedNote: 'Values in km/h, assuming an ideal drivetrain with no slip.',
    setupB: 'Setup B (Setup A uses the shared settings above)',
    ringB: 'Chainrings B',
    cogB: 'Cassette B',
    metric: 'Metric',
    colA: (s: string) => `A (${s})`,
    colB: (s: string) => `B (${s})`,
    rowMaxRatio: 'Hardest gear ratio',
    rowMinRatio: 'Easiest gear ratio (lower climbs better)',
    rowRange: 'Gear range',
    rowTopSpeed: 'Top speed @90rpm',
    rowLowSpeed: 'Lowest speed @90rpm',
    rowAvgStep: 'Average step',
    rowMaxStep: 'Largest jump',
    compareNote: 'Orange marks the better side for each metric; smaller steps shift smoother. Includes every chainring × cog combination (overlapping gears not removed).',
    ring: 'Chainring',
    cog: 'Cog',
    ratioLabel: 'Ratio ',
    rpmToSpeed: 'Cadence → speed',
    speedToRpm: 'Speed → required cadence',
    rdSpec: 'Rear derailleur spec',
    rdOption: (label: string, maxCog: number, capacity: number) => `${label} (max ${maxCog}T / capacity ${capacity}T)`,
    pass: 'OK',
    over: 'Over',
    capacityNeed: 'Capacity needed (ring diff + cog diff)',
    maxCogLabel: 'Largest cog',
    okMsg: '✓ This combination is compatible with the derailleur',
    ngMsg: '✗ Exceeds the derailleur spec — shifting may misbehave or cause damage',
    capacityNote: 'Actual limits per the manufacturer spec sheet; some derailleurs tolerate slight overage, but not under warranty.',
    tabMatrix: 'Gear table',
    tabSpeed: 'Speed chart',
    tabCompare: 'A/B compare',
    tabQuick: 'Quick calc',
    tabCapacity: 'Capacity check',
    wheelLabel: 'Wheel (circumference mm)',
    wheelPresetAria: 'Wheel preset',
    wheelAria: 'Wheel circumference',
    wheelOption: (label: string, mm: number) => `${label} (${mm}mm)`,
    circError: 'Enter 1000–2600 mm',
    shareNote: 'Copy this page URL to share the whole setup with riding buddies.',
  },
} as const;

type Dict = (typeof L)[Locale];

// lib 內建預設的中文標籤 → 英文（齒數/型號本身語言中立，僅譯描述字）
const PRESET_EN: Record<string, string> = {
  '53/39 標準盤': '53/39 standard',
  '52/36 半壓縮': '52/36 semi-compact',
  '50/34 壓縮盤': '50/34 compact',
  'Shimano 短腿（SS）': 'Shimano short cage (SS)',
  'Shimano 中腿（GS）': 'Shimano medium cage (GS)',
  'SRAM 短腿': 'SRAM short cage',
  'SRAM 中腿（WiFLi）': 'SRAM medium cage (WiFLi)',
};
// 飛輪標籤如「11-25（11速）」→「11-25 (11-speed)」；無中文字的標籤原樣通過
const enPresetLabel = (label: string) => PRESET_EN[label] ?? label.replace('（', ' (').replace('速）', '-speed)');
const presetLabelFor = (locale: Locale) => (label: string) => (locale === 'en' ? enPresetLabel(label) : label);
type PresetLabel = (label: string) => string;

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
  t,
  presetLabel,
}: {
  label: string;
  presets: TeethPreset[];
  value: string;
  onChange: (v: string) => void;
  fallback: number[];
  t: Dict;
  presetLabel: PresetLabel;
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
        aria-label={t.presetAria(label)}
      >
        <option value="">{t.custom}</option>
        {presets.map((p) => (
          <option key={p.label} value={formatTeeth(p.teeth)}>{presetLabel(p.label)}</option>
        ))}
      </select>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={formatTeeth(fallback)}
        aria-label={t.teethAria(label)}
        className={`${inputClass} mt-1 text-sm ${parsed ? '' : 'border-red-400'}`}
      />
      {!parsed && <p className="mt-1 text-xs text-red-500">{t.teethFormat(formatTeeth(fallback))}</p>}
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

function MatrixPanel({ dt, t }: { dt: Drivetrain; t: Dict }) {
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
        {([['ratio', t.metricRatio], ['inches', 'Gear inches'], ['dev', 'Development']] as const).map(([id, label]) => (
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
              <th className={`${thClass} text-left`}>{t.headCogRing}</th>
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
      <p className="mt-2 text-xs text-muted">{t.matrixNote}</p>
    </div>
  );
}

function SpeedPanel({ dt, t }: { dt: Drivetrain; t: Dict }) {
  const [rpm, setRpm] = useState<number>(90);
  const rings = [...dt.chainrings].sort((a, b) => b - a);
  const cogs = [...dt.cassette].sort((a, b) => a - b);
  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-1">
        <span className="mr-2 text-sm text-muted">{t.cadence}</span>
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
              <th className={`${thClass} text-left`}>{t.headCogRing}</th>
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
      <p className="mt-2 text-xs text-muted">{t.speedNote}</p>
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

function ComparePanel({ dt, wheelStr, t, presetLabel }: { dt: Drivetrain; wheelStr: string; t: Dict; presetLabel: PresetLabel }) {
  const b = useDrivetrain('rb', 'cb', wheelStr);
  const sa = setupSummary(dt);
  const sb = setupSummary(b.dt);
  const pick = (x: number, y: number, mode: 'high' | 'low'): 'a' | 'b' | null =>
    x === y ? null : (mode === 'high' ? x > y : x < y) ? 'a' : 'b';
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-4">
        <p className="mb-3 text-sm text-muted">{t.setupB}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TeethField label={t.ringB} presets={CHAINRING_PRESETS} value={b.ringStr} onChange={b.setRingStr} fallback={DEFAULT_RINGS} t={t} presetLabel={presetLabel} />
          <TeethField label={t.cogB} presets={CASSETTE_PRESETS} value={b.cogStr} onChange={b.setCogStr} fallback={DEFAULT_CASSETTE} t={t} presetLabel={presetLabel} />
        </div>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th className={`${thClass} text-left`}>{t.metric}</th>
              <th className={thClass}>{t.colA(formatTeeth(dt.chainrings))}</th>
              <th className={thClass}>{t.colB(formatTeeth(b.dt.chainrings))}</th>
            </tr>
          </thead>
          <tbody>
            <CompareRow label={t.rowMaxRatio} a={sa.maxRatio.toFixed(2)} b={sb.maxRatio.toFixed(2)} better={pick(sa.maxRatio, sb.maxRatio, 'high')} />
            <CompareRow label={t.rowMinRatio} a={sa.minRatio.toFixed(2)} b={sb.minRatio.toFixed(2)} better={pick(sa.minRatio, sb.minRatio, 'low')} />
            <CompareRow label={t.rowRange} a={`${sa.rangePercent.toFixed(0)}%`} b={`${sb.rangePercent.toFixed(0)}%`} better={pick(sa.rangePercent, sb.rangePercent, 'high')} />
            <CompareRow label={t.rowTopSpeed} a={`${sa.topSpeedAt90.toFixed(1)} km/h`} b={`${sb.topSpeedAt90.toFixed(1)} km/h`} better={pick(sa.topSpeedAt90, sb.topSpeedAt90, 'high')} />
            <CompareRow label={t.rowLowSpeed} a={`${sa.lowSpeedAt90.toFixed(1)} km/h`} b={`${sb.lowSpeedAt90.toFixed(1)} km/h`} better={pick(sa.lowSpeedAt90, sb.lowSpeedAt90, 'low')} />
            <CompareRow label={t.rowAvgStep} a={`${sa.avgStepPercent.toFixed(1)}%`} b={`${sb.avgStepPercent.toFixed(1)}%`} better={pick(sa.avgStepPercent, sb.avgStepPercent, 'low')} />
            <CompareRow label={t.rowMaxStep} a={`${sa.maxStepPercent.toFixed(1)}%`} b={`${sb.maxStepPercent.toFixed(1)}%`} better={pick(sa.maxStepPercent, sb.maxStepPercent, 'low')} />
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{t.compareNote}</p>
    </div>
  );
}

function QuickPanel({ dt, t }: { dt: Drivetrain; t: Dict }) {
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
          <span className="mb-1 block text-sm text-muted">{t.ring}</span>
          <select value={curRing} onChange={(e) => setRing(Number(e.target.value))} className={selectClass}>
            {rings.map((r) => <option key={r} value={r}>{r}T</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.cog}</span>
          <select value={curCog} onChange={(e) => setCog(Number(e.target.value))} className={selectClass}>
            {cogs.map((c) => <option key={c} value={c}>{c}T</option>)}
          </select>
        </label>
      </div>
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-4 text-center">
        <span className="text-sm text-muted">{t.ratioLabel}</span>
        <span className="font-mono text-lg tabular-nums text-ink">{ratio.toFixed(2)}</span>
      </div>
      <div className="space-y-2 rounded-[var(--radius-card)] border border-edge bg-surface p-4">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.rpmToSpeed}</span>
          <input type="number" value={rpmStr} onChange={(e) => setRpmStr(e.target.value)} className={inputClass} placeholder="90" />
        </label>
        <p className="text-center font-mono text-2xl tabular-nums text-ink">
          {Number.isFinite(rpm) && rpmStr !== '' ? `${speedKmh(ratio, dt.circumferenceMm, rpm).toFixed(1)} km/h` : '—'}
        </p>
      </div>
      <div className="space-y-2 rounded-[var(--radius-card)] border border-edge bg-surface p-4">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.speedToRpm}</span>
          <input type="number" value={speedStr} onChange={(e) => setSpeedStr(e.target.value)} className={inputClass} placeholder="35" />
        </label>
        <p className="text-center font-mono text-2xl tabular-nums text-ink">
          {Number.isFinite(speed) && speedStr !== '' ? `${cadenceFor(speed, ratio, dt.circumferenceMm).toFixed(0)} rpm` : '—'}
        </p>
      </div>
    </div>
  );
}

function CapacityPanel({ dt, t, presetLabel }: { dt: Drivetrain; t: Dict; presetLabel: PresetLabel }) {
  const [rdIdx, setRdIdx] = useState(1);
  const rd = DERAILLEUR_PRESETS[rdIdx];
  const r = checkDerailleur(dt.chainrings, dt.cassette, rd);
  const Badge = ({ ok }: { ok: boolean }) => (
    <span className={`rounded px-2 py-0.5 text-sm text-white ${ok ? 'bg-green-600' : 'bg-red-500'}`}>{ok ? t.pass : t.over}</span>
  );
  return (
    <div className="mx-auto max-w-md space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t.rdSpec}</span>
        <select value={rdIdx} onChange={(e) => setRdIdx(Number(e.target.value))} className={selectClass}>
          {DERAILLEUR_PRESETS.map((p, i) => (
            <option key={p.label} value={i}>{t.rdOption(presetLabel(p.label), p.maxCog, p.capacity)}</option>
          ))}
        </select>
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-3">
          <span className="text-sm text-muted">{t.capacityNeed}</span>
          <span className="flex items-center gap-2 font-mono tabular-nums text-ink">{r.capacity}T <Badge ok={r.capacityOk} /></span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-3">
          <span className="text-sm text-muted">{t.maxCogLabel}</span>
          <span className="flex items-center gap-2 font-mono tabular-nums text-ink">{r.maxCog}T <Badge ok={r.maxCogOk} /></span>
        </div>
      </div>
      <p className={`text-center text-lg ${r.ok ? 'text-green-600' : 'text-red-500'}`}>
        {r.ok ? t.okMsg : t.ngMsg}
      </p>
      <p className="text-center text-xs text-muted">{t.capacityNote}</p>
    </div>
  );
}

export default function GearCalculator({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const presetLabel = presetLabelFor(locale);
  const tabs = [
    { id: 'matrix', label: t.tabMatrix },
    { id: 'speed', label: t.tabSpeed },
    { id: 'compare', label: t.tabCompare },
    { id: 'quick', label: t.tabQuick },
    { id: 'capacity', label: t.tabCapacity },
  ];
  const [wheelStr, setWheelStr] = useUrlState('w', String(DEFAULT_WHEEL));
  const a = useDrivetrain('r', 'c', wheelStr);
  const [tab, setTab] = useState('matrix');
  const wheelMatch = WHEEL_PRESETS.find((w) => String(w.circumferenceMm) === wheelStr);
  const circValid = parseCirc(wheelStr) !== null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-[var(--radius-card)] border border-edge bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <TeethField label={t.ring} presets={CHAINRING_PRESETS} value={a.ringStr} onChange={a.setRingStr} fallback={DEFAULT_RINGS} t={t} presetLabel={presetLabel} />
          <TeethField label={t.cog} presets={CASSETTE_PRESETS} value={a.cogStr} onChange={a.setCogStr} fallback={DEFAULT_CASSETTE} t={t} presetLabel={presetLabel} />
          <div>
            <span className="mb-1 block text-sm text-muted">{t.wheelLabel}</span>
            <select
              value={wheelMatch ? String(wheelMatch.circumferenceMm) : ''}
              onChange={(e) => e.target.value && setWheelStr(e.target.value)}
              className={selectClass}
              aria-label={t.wheelPresetAria}
            >
              <option value="">{t.custom}</option>
              {WHEEL_PRESETS.map((w) => (
                <option key={w.label} value={String(w.circumferenceMm)}>{t.wheelOption(w.label, w.circumferenceMm)}</option>
              ))}
            </select>
            <input
              value={wheelStr}
              onChange={(e) => setWheelStr(e.target.value)}
              aria-label={t.wheelAria}
              className={`${inputClass} mt-1 text-sm ${circValid ? '' : 'border-red-400'}`}
            />
            {!circValid && <p className="mt-1 text-xs text-red-500">{t.circError}</p>}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">{t.shareNote}</p>
      </div>

      <div className="flex justify-center">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      {tab === 'matrix' && <MatrixPanel dt={a.dt} t={t} />}
      {tab === 'speed' && <SpeedPanel dt={a.dt} t={t} />}
      {tab === 'compare' && <ComparePanel dt={a.dt} wheelStr={wheelStr} t={t} presetLabel={presetLabel} />}
      {tab === 'quick' && <QuickPanel dt={a.dt} t={t} />}
      {tab === 'capacity' && <CapacityPanel dt={a.dt} t={t} presetLabel={presetLabel} />}
    </div>
  );
}

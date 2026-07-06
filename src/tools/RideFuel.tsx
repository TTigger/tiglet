import { useState } from 'react';
import Tabs from '../components/Tabs';
import { kjToKcal, kjFromPower, foodEquivalents, carbsPerHour, sweatRate, DEFAULT_EFFICIENCY } from '../lib/energy';

// 體重等輸入屬個人資料，刻意不寫入網址。

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent';

const num = (s: string): number => (s.trim() === '' ? NaN : Number(s));

function Field({ label, value, onChange, suffix, placeholder }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <div className="relative">
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function EnergyPanel() {
  const [mode, setMode] = useState<'kj' | 'power'>('kj');
  const [kjStr, setKjStr] = useState('1000');
  const [wattsStr, setWattsStr] = useState('180');
  const [hoursStr, setHoursStr] = useState('2');
  const [effPct, setEffPct] = useState(DEFAULT_EFFICIENCY * 100);

  const hours = num(hoursStr);
  const kj = mode === 'kj' ? num(kjStr) : kjFromPower(num(wattsStr), hours * 3600);
  const kcal = Number.isFinite(kj) && kj >= 0 ? kjToKcal(kj, effPct / 100) : NaN;
  const carbs = Number.isFinite(hours) && hours > 0 ? carbsPerHour(hours) : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex justify-center gap-1">
        {([['kj', '直接輸入 kJ'], ['power', '功率 × 時間']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            className={`rounded-md border border-edge px-3 py-1 text-sm ${mode === id ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'kj' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="做功（碼錶顯示）" value={kjStr} onChange={setKjStr} suffix="kJ" />
          <Field label="騎乘時間（供補給建議）" value={hoursStr} onChange={setHoursStr} suffix="小時" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="平均功率" value={wattsStr} onChange={setWattsStr} suffix="W" />
          <Field label="騎乘時間" value={hoursStr} onChange={setHoursStr} suffix="小時" />
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-sm text-muted">人體機械效率：{effPct.toFixed(1)}%</span>
        <input
          type="range"
          min={20}
          max={25}
          step={0.5}
          value={effPct}
          onChange={(e) => setEffPct(Number(e.target.value))}
          className="w-full accent-[var(--color-accent,#D97757)]"
          aria-label="效率"
        />
      </label>

      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        {mode === 'power' && Number.isFinite(kj) && <div className="mb-1 text-sm text-muted">做功 {kj.toFixed(0)} kJ</div>}
        <div className="text-sm text-muted">估計消耗</div>
        <div className="my-1 font-mono text-4xl tabular-nums text-ink">{Number.isFinite(kcal) ? Math.round(kcal) : '—'}</div>
        <div className="text-sm text-muted">大卡（kcal）</div>
      </div>

      <p className="text-xs text-muted">
        為什麼 kJ ≈ 大卡？1 kcal = 4.184 kJ，但人體把熱量轉成踩踏功的效率只有約
        20–25%——兩者幾乎互相抵銷，所以碼錶的 kJ 數字差不多就是你燒掉的大卡。
      </p>

      {Number.isFinite(kcal) && kcal > 0 && (
        <div>
          <h2 className="mb-2 text-sm text-muted">這趟大約等於…（估算值）</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {foodEquivalents(kcal).map(({ item, count }) => (
              <div key={item.id} className="rounded-lg border border-edge bg-surface p-3 text-center">
                <div className="text-2xl">{item.emoji}</div>
                <div className="font-mono text-lg tabular-nums text-ink">× {count >= 10 ? count.toFixed(0) : count.toFixed(1)}</div>
                <div className="text-xs text-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {carbs && (
        <div className="rounded-lg border border-edge bg-surface px-4 py-3 text-sm">
          <span className="text-muted">騎乘中補給建議：</span>
          <span className="text-ink">
            每小時攝取 {carbs.min}–{carbs.max} g 碳水
            {carbs.max >= 60 ? '（長程建議混合葡萄糖＋果糖來源，腸胃較好吸收）' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function HydrationPanel() {
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [intake, setIntake] = useState('');
  const [hoursStr, setHoursStr] = useState('');
  const rate = sweatRate(num(before), num(after), num(intake), num(hoursStr));
  const valid = Number.isFinite(rate) && rate >= 0;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="騎乘前體重" value={before} onChange={setBefore} suffix="kg" placeholder="70" />
        <Field label="騎乘後體重" value={after} onChange={setAfter} suffix="kg" placeholder="69" />
        <Field label="過程中補水量" value={intake} onChange={setIntake} suffix="L" placeholder="1" />
        <Field label="騎乘時間" value={hoursStr} onChange={setHoursStr} suffix="小時" placeholder="2" />
      </div>

      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        <div className="text-sm text-muted">你的排汗率</div>
        <div className="my-1 font-mono text-4xl tabular-nums text-ink">{valid ? rate.toFixed(2) : '—'}</div>
        <div className="text-sm text-muted">公升／小時</div>
      </div>

      {valid && rate > 0 && (
        <div className="rounded-lg border border-edge bg-surface px-4 py-3 text-sm">
          <span className="text-muted">下次同強度騎乘建議：</span>
          <span className="text-ink">每小時補水約 {Math.round(rate * 1000 * 0.8)}–{Math.round(rate * 1000)} ml；超過一小時建議搭配電解質。</span>
        </div>
      )}

      <p className="text-xs text-muted">
        排汗率＝（騎乘前體重 − 騎乘後體重 ＋ 補水量）÷ 時數。所有數據只在你的瀏覽器計算，不會上傳。
      </p>
    </div>
  );
}

const TABS = [
  { id: 'energy', label: '熱量換算' },
  { id: 'hydration', label: '水分補給' },
];

export default function RideFuel() {
  const [tab, setTab] = useState('energy');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'energy' && <EnergyPanel />}
      {tab === 'hydration' && <HydrationPanel />}
    </div>
  );
}

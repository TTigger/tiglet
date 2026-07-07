import { useState } from 'react';
import Tabs from '../components/Tabs';
import { kjToKcal, kjFromPower, foodEquivalents, carbsPerHour, sweatRate, DEFAULT_EFFICIENCY } from '../lib/energy';
import ShareLinkButton from '../components/ShareLinkButton';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    tabEnergy: '熱量換算',
    tabHydration: '水分補給',
    modeKj: '直接輸入 kJ',
    modePower: '功率 × 時間',
    workLabel: '做功（碼錶顯示）',
    rideTimeAdvice: '騎乘時間（供補給建議）',
    avgPower: '平均功率',
    rideTime: '騎乘時間',
    hoursSuffix: '小時',
    efficiency: (pct: string) => `人體機械效率：${pct}%`,
    efficiencyAria: '效率',
    workKj: (kj: string) => `做功 ${kj} kJ`,
    estBurn: '估計消耗',
    kcalUnit: '大卡（kcal）',
    kjExplainer: '為什麼 kJ ≈ 大卡？1 kcal = 4.184 kJ，但人體把熱量轉成踩踏功的效率只有約 20–25%——兩者幾乎互相抵銷，所以碼錶的 kJ 數字差不多就是你燒掉的大卡。',
    equalsHeading: '這趟大約等於…（估算值）',
    carbsAdviceLabel: '騎乘中補給建議：',
    carbsText: (min: number, max: number) => `每小時攝取 ${min}–${max} g 碳水`,
    carbsMix: '（長程建議混合葡萄糖＋果糖來源，腸胃較好吸收）',
    shareLabel: '複製分享連結',
    shareNote: '數值只在你按下按鈕時才組進連結。',
    weightBefore: '騎乘前體重',
    weightAfter: '騎乘後體重',
    fluidIntake: '過程中補水量',
    sweatRateLabel: '你的排汗率',
    litersPerHour: '公升／小時',
    hydrationAdviceLabel: '下次同強度騎乘建議：',
    hydrationText: (a: number, b: number) => `每小時補水約 ${a}–${b} ml；超過一小時建議搭配電解質。`,
    hydrationFootnote: '排汗率＝（騎乘前體重 − 騎乘後體重 ＋ 補水量）÷ 時數。所有數據只在你的瀏覽器計算，不會上傳。',
  },
  en: {
    tabEnergy: 'Calories',
    tabHydration: 'Hydration',
    modeKj: 'Enter kJ directly',
    modePower: 'Power × time',
    workLabel: 'Work (from head unit)',
    rideTimeAdvice: 'Ride time (for fueling advice)',
    avgPower: 'Average power',
    rideTime: 'Ride time',
    hoursSuffix: 'hr',
    efficiency: (pct: string) => `Human mechanical efficiency: ${pct}%`,
    efficiencyAria: 'Efficiency',
    workKj: (kj: string) => `Work ${kj} kJ`,
    estBurn: 'Estimated burn',
    kcalUnit: 'Calories (kcal)',
    kjExplainer: 'Why does kJ ≈ kcal? 1 kcal = 4.184 kJ, but the human body converts food energy into pedaling work at only about 20–25% efficiency — the two nearly cancel out, so the kJ number on your head unit is roughly the calories you burned.',
    equalsHeading: 'This ride roughly equals… (estimates)',
    carbsAdviceLabel: 'In-ride fueling advice: ',
    carbsText: (min: number, max: number) => `take in ${min}–${max} g of carbs per hour`,
    carbsMix: ' (for long rides, mix glucose + fructose sources for easier gut absorption)',
    shareLabel: 'Copy share link',
    shareNote: 'Values are only put into the link when you press the button.',
    weightBefore: 'Weight before ride',
    weightAfter: 'Weight after ride',
    fluidIntake: 'Fluid intake during ride',
    sweatRateLabel: 'Your sweat rate',
    litersPerHour: 'liters per hour',
    hydrationAdviceLabel: 'For your next ride at similar intensity: ',
    hydrationText: (a: number, b: number) => `drink about ${a}–${b} ml per hour; add electrolytes for rides over an hour.`,
    hydrationFootnote: 'Sweat rate = (weight before − weight after + fluid intake) ÷ hours. Everything is computed in your browser — nothing is uploaded.',
  },
} as const;

type Dict = (typeof L)[Locale];

// lib 內建食物的中文標籤 → 英文（以 id 對映，不動 lib）
const FOOD_EN: Record<string, string> = {
  gel: 'Energy gel',
  banana: 'Banana',
  egg: 'Tea egg',
  onigiri: 'Rice ball (onigiri)',
  bread: 'Pineapple bun',
  'braised-pork-rice': 'Braised pork rice',
  'bubble-tea': 'Bubble tea (full sugar, medium)',
  'beef-noodle': 'Beef noodle soup',
};

// 體重等輸入屬個人資料，不隨打字寫入網址；熱量分頁可用按鈕主動產生分享連結
//（水分分頁含前後體重，完全不提供分享）。
const initParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

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

function EnergyPanel({ t, locale }: { t: Dict; locale: Locale }) {
  const [mode, setMode] = useState<'kj' | 'power'>(initParams.get('m') === 'power' ? 'power' : 'kj');
  const [kjStr, setKjStr] = useState(initParams.get('kj') ?? '1000');
  const [wattsStr, setWattsStr] = useState(initParams.get('w') ?? '180');
  const [hoursStr, setHoursStr] = useState(initParams.get('h') ?? '2');
  const [effPct, setEffPct] = useState(() => {
    const e = Number(initParams.get('eff'));
    return e >= 20 && e <= 25 ? e : DEFAULT_EFFICIENCY * 100;
  });

  const hours = num(hoursStr);
  const kj = mode === 'kj' ? num(kjStr) : kjFromPower(num(wattsStr), hours * 3600);
  const kcal = Number.isFinite(kj) && kj >= 0 ? kjToKcal(kj, effPct / 100) : NaN;
  const carbs = Number.isFinite(hours) && hours > 0 ? carbsPerHour(hours) : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex justify-center gap-1">
        {([['kj', t.modeKj], ['power', t.modePower]] as const).map(([id, label]) => (
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
          <Field label={t.workLabel} value={kjStr} onChange={setKjStr} suffix="kJ" />
          <Field label={t.rideTimeAdvice} value={hoursStr} onChange={setHoursStr} suffix={t.hoursSuffix} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.avgPower} value={wattsStr} onChange={setWattsStr} suffix="W" />
          <Field label={t.rideTime} value={hoursStr} onChange={setHoursStr} suffix={t.hoursSuffix} />
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t.efficiency(effPct.toFixed(1))}</span>
        <input
          type="range"
          min={20}
          max={25}
          step={0.5}
          value={effPct}
          onChange={(e) => setEffPct(Number(e.target.value))}
          className="w-full accent-[var(--color-accent,#D97757)]"
          aria-label={t.efficiencyAria}
        />
      </label>

      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        {mode === 'power' && Number.isFinite(kj) && <div className="mb-1 text-sm text-muted">{t.workKj(kj.toFixed(0))}</div>}
        <div className="text-sm text-muted">{t.estBurn}</div>
        <div className="my-1 font-mono text-4xl tabular-nums text-ink">{Number.isFinite(kcal) ? Math.round(kcal) : '—'}</div>
        <div className="text-sm text-muted">{t.kcalUnit}</div>
      </div>

      <p className="text-xs text-muted">{t.kjExplainer}</p>

      {Number.isFinite(kcal) && kcal > 0 && (
        <div>
          <h2 className="mb-2 text-sm text-muted">{t.equalsHeading}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {foodEquivalents(kcal).map(({ item, count }) => (
              <div key={item.id} className="rounded-lg border border-edge bg-surface p-3 text-center">
                <div className="text-2xl">{item.emoji}</div>
                <div className="font-mono text-lg tabular-nums text-ink">× {count >= 10 ? count.toFixed(0) : count.toFixed(1)}</div>
                <div className="text-xs text-muted">{locale === 'en' ? FOOD_EN[item.id] ?? item.label : item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {carbs && (
        <div className="rounded-lg border border-edge bg-surface px-4 py-3 text-sm">
          <span className="text-muted">{t.carbsAdviceLabel}</span>
          <span className="text-ink">
            {t.carbsText(carbs.min, carbs.max)}
            {carbs.max >= 60 ? t.carbsMix : ''}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <ShareLinkButton label={t.shareLabel} params={mode === 'kj' ? { kj: kjStr, h: hoursStr, eff: effPct } : { m: 'power', w: wattsStr, h: hoursStr, eff: effPct }} />
        <span className="text-xs text-muted">{t.shareNote}</span>
      </div>
    </div>
  );
}

function HydrationPanel({ t }: { t: Dict }) {
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [intake, setIntake] = useState('');
  const [hoursStr, setHoursStr] = useState('');
  const rate = sweatRate(num(before), num(after), num(intake), num(hoursStr));
  const valid = Number.isFinite(rate) && rate >= 0;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.weightBefore} value={before} onChange={setBefore} suffix="kg" placeholder="70" />
        <Field label={t.weightAfter} value={after} onChange={setAfter} suffix="kg" placeholder="69" />
        <Field label={t.fluidIntake} value={intake} onChange={setIntake} suffix="L" placeholder="1" />
        <Field label={t.rideTime} value={hoursStr} onChange={setHoursStr} suffix={t.hoursSuffix} placeholder="2" />
      </div>

      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        <div className="text-sm text-muted">{t.sweatRateLabel}</div>
        <div className="my-1 font-mono text-4xl tabular-nums text-ink">{valid ? rate.toFixed(2) : '—'}</div>
        <div className="text-sm text-muted">{t.litersPerHour}</div>
      </div>

      {valid && rate > 0 && (
        <div className="rounded-lg border border-edge bg-surface px-4 py-3 text-sm">
          <span className="text-muted">{t.hydrationAdviceLabel}</span>
          <span className="text-ink">{t.hydrationText(Math.round(rate * 1000 * 0.8), Math.round(rate * 1000))}</span>
        </div>
      )}

      <p className="text-xs text-muted">{t.hydrationFootnote}</p>
    </div>
  );
}

export default function RideFuel({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const tabs = [
    { id: 'energy', label: t.tabEnergy },
    { id: 'hydration', label: t.tabHydration },
  ];
  const [tab, setTab] = useState('energy');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      {tab === 'energy' && <EnergyPanel t={t} locale={locale} />}
      {tab === 'hydration' && <HydrationPanel t={t} />}
    </div>
  );
}

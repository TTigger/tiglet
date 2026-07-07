import { useState } from 'react';
import Tabs from '../components/Tabs';
import CopyButton from '../components/CopyButton';
import { bmi, bmiCategory, healthyWeightRange, type BmiCategory } from '../lib/health';
import { percentOf, ofValue, percentChange, discountedPrice, splitTip } from '../lib/percent';
import { toChineseAmount } from '../lib/chineseAmount';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    tabBmi: 'BMI',
    tabPercent: '百分比',
    tabDiscount: '折扣',
    tabTip: '小費',
    weight: '體重',
    height: '身高',
    yourBmi: '你的 BMI',
    bmiLabel: {
      underweight: '體重過輕',
      normal: '健康體位',
      overweight: '體重過重',
      obese: '肥胖',
    } as Record<BmiCategory, string>,
    healthyRange: (lo: string, hi: string) => `此身高的健康體重範圍約 ${lo}–${hi} kg`,
    bmiNote: '分類採用台灣國健署標準（過輕 <18.5、過重 ≥24、肥胖 ≥27）',
    valueX: '數值 X',
    totalY: '總數 Y',
    xOfY: 'X 是 Y 的',
    percent: '百分比 %',
    value: '數值',
    result: '結果',
    oldA: '原值 A',
    newB: '新值 B',
    change: '變化幅度',
    originalPrice: '原價',
    discount: '折扣',
    finalPrice: '折後價',
    saved: '省下',
    bill: '帳單金額',
    tip: '小費',
    people: '人數',
    tipAmount: '小費金額',
    total: '總計',
    perPerson: '每人應付',
    tabUppercase: '大寫金額',
    amount: '金額',
    amountPlaceholder: '例如 12345.67',
    uppercaseResult: '大寫',
    uppercaseInvalid: '請輸入 0 到 9,999 兆之間的金額。',
    uppercaseNote: '支票、合約常用的中文大寫金額；四捨五入到分。數字只在你的瀏覽器轉換。',
  },
  en: {
    tabBmi: 'BMI',
    tabPercent: 'Percent',
    tabDiscount: 'Discount',
    tabTip: 'Tip',
    weight: 'Weight',
    height: 'Height',
    yourBmi: 'Your BMI',
    bmiLabel: {
      underweight: 'Underweight',
      normal: 'Normal',
      overweight: 'Overweight',
      obese: 'Obese',
    } as Record<BmiCategory, string>,
    healthyRange: (lo: string, hi: string) => `Healthy weight range for this height: about ${lo}–${hi} kg`,
    bmiNote: 'Taiwan HPA standard (underweight <18.5, overweight ≥24, obese ≥27)',
    valueX: 'Value X',
    totalY: 'Total Y',
    xOfY: 'X as % of Y',
    percent: 'Percent %',
    value: 'Value',
    result: 'Result',
    oldA: 'Old value A',
    newB: 'New value B',
    change: 'Change',
    originalPrice: 'Original price',
    discount: 'Discount',
    finalPrice: 'Final price',
    saved: 'You save',
    bill: 'Bill amount',
    tip: 'Tip',
    people: 'People',
    tipAmount: 'Tip amount',
    total: 'Total',
    perPerson: 'Per person',
    tabUppercase: 'Chinese uppercase',
    amount: 'Amount',
    amountPlaceholder: 'e.g. 12345.67',
    uppercaseResult: 'Uppercase',
    uppercaseInvalid: 'Enter an amount between 0 and 9,999 trillion.',
    uppercaseNote: 'Formal Chinese uppercase amounts used on checks and contracts; rounded to cents. Converted entirely in your browser.',
  },
} as const;
type Dict = (typeof L)[Locale];

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent';

const num = (s: string): number => (s.trim() === '' ? NaN : Number(s));
const show = (n: number, digits = 2): string => (Number.isFinite(n) ? n.toFixed(digits) : '—');

function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <div className="relative">
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-mono text-lg tabular-nums text-ink">{value}</span>
    </div>
  );
}

const BMI_COLOR: Record<BmiCategory, string> = {
  underweight: 'text-blue-500',
  normal: 'text-green-600',
  overweight: 'text-amber-500',
  obese: 'text-red-500',
};

function BmiPanel({ t }: { t: Dict }) {
  const [w, setW] = useState('60');
  const [h, setH] = useState('170');
  const value = bmi(num(w), num(h));
  const cat = Number.isFinite(value) ? bmiCategory(value) : null;
  const [lo, hi] = healthyWeightRange(num(h));

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.weight} value={w} onChange={setW} suffix="kg" />
        <Field label={t.height} value={h} onChange={setH} suffix="cm" />
      </div>
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        <div className="text-sm text-muted">{t.yourBmi}</div>
        <div className="my-1 font-mono text-4xl tabular-nums text-ink">{show(value, 1)}</div>
        {cat && <div className={`text-lg ${BMI_COLOR[cat]}`}>{t.bmiLabel[cat]}</div>}
      </div>
      {Number.isFinite(lo) && (
        <p className="text-center text-sm text-muted">{t.healthyRange(show(lo, 1), show(hi, 1))}</p>
      )}
      <p className="text-center text-xs text-muted">{t.bmiNote}</p>
    </div>
  );
}

function PercentPanel({ t }: { t: Dict }) {
  const [a, setA] = useState('25');
  const [b, setB] = useState('200');
  const [c, setC] = useState('15');
  const [d, setD] = useState('80');
  const [e, setE] = useState('100');
  const [f, setF] = useState('150');

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.valueX} value={a} onChange={setA} />
          <Field label={t.totalY} value={b} onChange={setB} />
        </div>
        <Result label={t.xOfY} value={`${show(percentOf(num(a), num(b)))} %`} />
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.percent} value={c} onChange={setC} />
          <Field label={t.value} value={d} onChange={setD} />
        </div>
        <Result label={t.result} value={show(ofValue(num(c), num(d)))} />
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.oldA} value={e} onChange={setE} />
          <Field label={t.newB} value={f} onChange={setF} />
        </div>
        <Result label={t.change} value={`${show(percentChange(num(e), num(f)))} %`} />
      </div>
    </div>
  );
}

function DiscountPanel({ t }: { t: Dict }) {
  const [price, setPrice] = useState('1000');
  const [off, setOff] = useState('20');
  const final = discountedPrice(num(price), num(off));
  const saved = num(price) - final;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.originalPrice} value={price} onChange={setPrice} />
        <Field label={t.discount} value={off} onChange={setOff} suffix="% off" />
      </div>
      <Result label={t.finalPrice} value={show(final)} />
      <Result label={t.saved} value={show(saved)} />
    </div>
  );
}

function TipPanel({ t }: { t: Dict }) {
  const [bill, setBill] = useState('1000');
  const [pct, setPct] = useState('10');
  const [people, setPeople] = useState('4');
  const r = splitTip(num(bill), num(pct), num(people));

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label={t.bill} value={bill} onChange={setBill} />
        <Field label={t.tip} value={pct} onChange={setPct} suffix="%" />
        <Field label={t.people} value={people} onChange={setPeople} />
      </div>
      <Result label={t.tipAmount} value={show(r.tip)} />
      <Result label={t.total} value={show(r.total)} />
      <Result label={t.perPerson} value={show(r.perPerson)} />
    </div>
  );
}

function UppercasePanel({ t }: { t: Dict }) {
  const [amountStr, setAmountStr] = useState('12345');
  const n = num(amountStr);
  const result = amountStr.trim() === '' ? null : toChineseAmount(n);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Field label={t.amount} value={amountStr} onChange={setAmountStr} suffix="NT$" />
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm text-muted">{t.uppercaseResult}</span>
          {result && <CopyButton value={result} />}
        </div>
        {amountStr.trim() === '' ? (
          <p className="font-serif text-2xl text-muted">—</p>
        ) : result === null ? (
          <p className="text-sm text-red-500">{t.uppercaseInvalid}</p>
        ) : (
          <p className="break-all font-serif text-2xl leading-relaxed text-ink">{result}</p>
        )}
      </div>
      <p className="text-xs text-muted">{t.uppercaseNote}</p>
    </div>
  );
}

export default function EverydayCalc({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [tab, setTab] = useState('bmi');
  const tabs = [
    { id: 'bmi', label: t.tabBmi },
    { id: 'percent', label: t.tabPercent },
    { id: 'discount', label: t.tabDiscount },
    { id: 'tip', label: t.tabTip },
    { id: 'uppercase', label: t.tabUppercase },
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      {tab === 'bmi' && <BmiPanel t={t} />}
      {tab === 'percent' && <PercentPanel t={t} />}
      {tab === 'discount' && <DiscountPanel t={t} />}
      {tab === 'tip' && <TipPanel t={t} />}
      {tab === 'uppercase' && <UppercasePanel t={t} />}
    </div>
  );
}

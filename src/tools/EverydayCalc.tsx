import { useState } from 'react';
import Tabs from '../components/Tabs';
import { bmi, bmiCategory, healthyWeightRange, type BmiCategory } from '../lib/health';
import { percentOf, ofValue, percentChange, discountedPrice, splitTip } from '../lib/percent';

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

const BMI_LABEL: Record<BmiCategory, string> = {
  underweight: '體重過輕',
  normal: '健康體位',
  overweight: '體重過重',
  obese: '肥胖',
};
const BMI_COLOR: Record<BmiCategory, string> = {
  underweight: 'text-blue-500',
  normal: 'text-green-600',
  overweight: 'text-amber-500',
  obese: 'text-red-500',
};

function BmiPanel() {
  const [w, setW] = useState('60');
  const [h, setH] = useState('170');
  const value = bmi(num(w), num(h));
  const cat = Number.isFinite(value) ? bmiCategory(value) : null;
  const [lo, hi] = healthyWeightRange(num(h));

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="體重" value={w} onChange={setW} suffix="kg" />
        <Field label="身高" value={h} onChange={setH} suffix="cm" />
      </div>
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        <div className="text-sm text-muted">你的 BMI</div>
        <div className="my-1 font-mono text-4xl tabular-nums text-ink">{show(value, 1)}</div>
        {cat && <div className={`text-lg ${BMI_COLOR[cat]}`}>{BMI_LABEL[cat]}</div>}
      </div>
      {Number.isFinite(lo) && (
        <p className="text-center text-sm text-muted">此身高的健康體重範圍約 {show(lo, 1)}–{show(hi, 1)} kg</p>
      )}
      <p className="text-center text-xs text-muted">分類採用台灣國健署標準（過輕 &lt;18.5、過重 ≥24、肥胖 ≥27）</p>
    </div>
  );
}

function PercentPanel() {
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
          <Field label="數值 X" value={a} onChange={setA} />
          <Field label="總數 Y" value={b} onChange={setB} />
        </div>
        <Result label="X 是 Y 的" value={`${show(percentOf(num(a), num(b)))} %`} />
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="百分比 %" value={c} onChange={setC} />
          <Field label="數值" value={d} onChange={setD} />
        </div>
        <Result label="結果" value={show(ofValue(num(c), num(d)))} />
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="原值 A" value={e} onChange={setE} />
          <Field label="新值 B" value={f} onChange={setF} />
        </div>
        <Result label="變化幅度" value={`${show(percentChange(num(e), num(f)))} %`} />
      </div>
    </div>
  );
}

function DiscountPanel() {
  const [price, setPrice] = useState('1000');
  const [off, setOff] = useState('20');
  const final = discountedPrice(num(price), num(off));
  const saved = num(price) - final;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="原價" value={price} onChange={setPrice} />
        <Field label="折扣" value={off} onChange={setOff} suffix="% off" />
      </div>
      <Result label="折後價" value={show(final)} />
      <Result label="省下" value={show(saved)} />
    </div>
  );
}

function TipPanel() {
  const [bill, setBill] = useState('1000');
  const [pct, setPct] = useState('10');
  const [people, setPeople] = useState('4');
  const r = splitTip(num(bill), num(pct), num(people));

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="帳單金額" value={bill} onChange={setBill} />
        <Field label="小費" value={pct} onChange={setPct} suffix="%" />
        <Field label="人數" value={people} onChange={setPeople} />
      </div>
      <Result label="小費金額" value={show(r.tip)} />
      <Result label="總計" value={show(r.total)} />
      <Result label="每人應付" value={show(r.perPerson)} />
    </div>
  );
}

const TABS = [
  { id: 'bmi', label: 'BMI' },
  { id: 'percent', label: '百分比' },
  { id: 'discount', label: '折扣' },
  { id: 'tip', label: '小費' },
];

export default function EverydayCalc() {
  const [tab, setTab] = useState('bmi');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'bmi' && <BmiPanel />}
      {tab === 'percent' && <PercentPanel />}
      {tab === 'discount' && <DiscountPanel />}
      {tab === 'tip' && <TipPanel />}
    </div>
  );
}

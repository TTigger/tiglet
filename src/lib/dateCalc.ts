// 日期計算核心。全部以「本地日曆日」為單位：內部用 new Date(y, m, d)
// 建構本地午夜，再以 UTC 天數差計算，避開時區與日光節約陷阱。

export function parseIsoDate(text: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  // JS Date 會把 2/30 滾動成 3/2 —— 驗證回讀值擋掉這種輸入
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function toIso(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function utcDayNumber(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

export function daysBetween(fromIso: string, toIso_: string, inclusive = false): number {
  const a = parseIsoDate(fromIso);
  const b = parseIsoDate(toIso_);
  if (!a || !b) return NaN;
  const diff = utcDayNumber(b) - utcDayNumber(a);
  return inclusive ? diff + (diff >= 0 ? 1 : -1) : diff;
}

export interface DiffBreakdown {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export function diffBreakdown(fromIso: string, toIso_: string): DiffBreakdown {
  const a = parseIsoDate(fromIso);
  const b = parseIsoDate(toIso_);
  if (!a || !b || a > b) return { years: 0, months: 0, days: 0, totalDays: 0 };

  // 語意與 addMonths 一致：先加到不超過終點的最大月數（含月底夾住），
  // 剩下的量才算天——1/31 → 3/1 因此是「1 個月又 1 天」。
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (months > 0 && parseIsoDate(addMonths(fromIso, months))! > b) months--;
  const days = daysBetween(addMonths(fromIso, months), toIso_);
  return { years: Math.floor(months / 12), months: months % 12, days, totalDays: daysBetween(fromIso, toIso_) };
}

export function addDays(iso: string, n: number): string {
  const d = parseIsoDate(iso);
  if (!d) return '';
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function addMonths(iso: string, n: number): string {
  const d = parseIsoDate(iso);
  if (!d) return '';
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay)); // 月底夾住：1/31 +1mo → 2/28、3/31 +1mo → 4/30
  return toIso(target);
}

export function countdownDays(targetIso: string, fromIso: string): number {
  return daysBetween(fromIso, targetIso);
}

export function workdaysBetween(fromIso: string, toIso_: string, excludeIsos: string[] = []): number {
  const a = parseIsoDate(fromIso);
  const b = parseIsoDate(toIso_);
  if (!a || !b || a > b) return 0;
  const excluded = new Set(excludeIsos);
  let count = 0;
  const cur = new Date(a);
  while (cur <= b) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6 && !excluded.has(toIso(cur))) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

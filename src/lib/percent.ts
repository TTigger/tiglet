/** What percent `part` is of `whole`. NaN when whole is 0. */
export function percentOf(part: number, whole: number): number {
  if (whole === 0) return NaN;
  return (part / whole) * 100;
}

/** `percent`% of `value`. */
export function ofValue(percent: number, value: number): number {
  return (percent / 100) * value;
}

/** Percent change going from `from` to `to`. NaN when from is 0. */
export function percentChange(from: number, to: number): number {
  if (from === 0) return NaN;
  return ((to - from) / from) * 100;
}

/** Price after applying a percentage discount. */
export function discountedPrice(price: number, percentOff: number): number {
  return price * (1 - percentOff / 100);
}

export interface TipResult {
  tip: number;
  total: number;
  perPerson: number;
}

/** Split a bill with a tip percentage across `people` (defaults to 1). */
export function splitTip(bill: number, percent: number, people = 1): TipResult {
  const tip = ofValue(percent, bill);
  const total = bill + tip;
  const perPerson = people > 0 ? total / people : NaN;
  return { tip, total, perPerson };
}

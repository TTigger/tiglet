// 統一發票對獎：財政部 invoice.xml 解析與對獎規則。純函式，
// 由 api/invoice-numbers.ts（解析）與 InvoiceLottery 島（對獎）共用。
// 號碼一律以字串處理，前導零不能掉（例：特獎 00507588）。

export interface WinningNumbers {
  period: string; // 期別，如「115年 03~04月」
  link: string; // 財政部該期公告頁
  special: string; // 特別獎（8 碼，全中 1,000 萬）
  grand: string; // 特獎（8 碼，全中 200 萬）
  first: string[]; // 頭獎（8 碼三組；末 7～3 碼對應二獎～六獎）
  sixth: string[]; // 增開六獎（3 碼，可能沒開）
}

export type PrizeLevel = 'special' | 'grand' | 'first' | 'second' | 'third' | 'fourth' | 'fifth' | 'sixth' | 'addSixth';

export const PRIZE_AMOUNT: Record<PrizeLevel, number> = {
  special: 10_000_000,
  grand: 2_000_000,
  first: 200_000,
  second: 40_000,
  third: 10_000,
  fourth: 4_000,
  fifth: 1_000,
  sixth: 200,
  addSixth: 200,
};

/** 與頭獎共同末碼長度 → 獎級（8 碼全中即頭獎） */
const SUFFIX_LEVEL: Record<number, PrizeLevel> = {
  8: 'first',
  7: 'second',
  6: 'third',
  5: 'fourth',
  4: 'fifth',
  3: 'sixth',
};

export interface PrizeHit {
  level: PrizeLevel;
  amount: number;
  matched: string; // 對中的官方號碼
  confirmed: boolean; // 以目前輸入位數已確定中此獎；false = 需要完整 8 碼才能確認（特別獎／特獎）
  upgradable: boolean; // 再多輸入幾碼有機會升到更高獎級
}

export function parseInvoiceXml(xml: string): WinningNumbers[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const out: WinningNumbers[] = [];
  for (const item of items) {
    const cdata = (tag: string) => item.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))?.[1]?.trim() ?? '';
    const desc = cdata('description');
    const period = cdata('title');
    const special = desc.match(/特別獎：(\d{8})/)?.[1];
    const grand = desc.match(/特獎：(\d{8})/)?.[1];
    const first = desc.match(/頭獎：([\d、,\s]+)/)?.[1]?.match(/\d{8}/g) ?? [];
    const sixth = desc.match(/增開六獎：([\d、,\s]+)/)?.[1]?.match(/\d{3}/g) ?? [];
    // 缺任何必要獎項就整期略過，寧缺勿錯
    if (!period || !special || !grand || first.length === 0) continue;
    out.push({ period, link: cdata('link'), special, grand, first, sixth });
  }
  return out;
}

function commonSuffixLen(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}

/**
 * 對獎。輸入發票號碼的「末 3～8 碼」：
 * - 8 碼：完整判定（特別獎／特獎要全中；頭獎系列取最長共同末碼；增開六獎比末 3）。
 * - 3～7 碼：能確定的獎（頭獎末碼系列、增開六獎）直接判定；
 *   只有特別獎／特獎的末碼吻合時回未確認命中（confirmed: false），提示補完 8 碼。
 * - 什麼都沒對中回 null —— 末 3 碼就沒中的發票可以直接確定沒獎。
 */
export function checkInvoice(digits: string, w: WinningNumbers): PrizeHit | null {
  if (!/^\d{3,8}$/.test(digits)) return null;
  const k = digits.length;
  const full = k === 8;

  const confirmed: PrizeHit[] = [];

  if (full && digits === w.special) confirmed.push({ level: 'special', amount: PRIZE_AMOUNT.special, matched: w.special, confirmed: true, upgradable: false });
  if (full && digits === w.grand) confirmed.push({ level: 'grand', amount: PRIZE_AMOUNT.grand, matched: w.grand, confirmed: true, upgradable: false });

  // 頭獎系列：共同末碼長度不能超過已輸入的位數；部分輸入時整段吻合（L === k）才有升級空間
  let anyFullTailMatch = false;
  for (const f of w.first) {
    const L = Math.min(commonSuffixLen(digits, f), k);
    if (L < 3) continue;
    if (!full && L === k) anyFullTailMatch = true;
    confirmed.push({ level: SUFFIX_LEVEL[L], amount: PRIZE_AMOUNT[SUFFIX_LEVEL[L]], matched: f, confirmed: true, upgradable: false });
  }

  const last3 = digits.slice(-3);
  if (w.sixth.includes(last3)) confirmed.push({ level: 'addSixth', amount: PRIZE_AMOUNT.addSixth, matched: last3, confirmed: true, upgradable: false });

  // 特別獎／特獎：未滿 8 碼只能算「有機會」，要補完才能確認
  const potential: PrizeHit[] = [];
  if (!full) {
    if (w.special.endsWith(digits)) potential.push({ level: 'special', amount: PRIZE_AMOUNT.special, matched: w.special, confirmed: false, upgradable: false });
    if (w.grand.endsWith(digits)) potential.push({ level: 'grand', amount: PRIZE_AMOUNT.grand, matched: w.grand, confirmed: false, upgradable: false });
  }

  const best = (hits: PrizeHit[]) => hits.reduce((a, b) => (b.amount > a.amount ? b : a));

  if (confirmed.length > 0) {
    const hit = best(confirmed);
    hit.upgradable = !full && (anyFullTailMatch || potential.length > 0);
    return hit;
  }
  if (potential.length > 0) return best(potential);
  return null;
}

// 中文大寫金額：支票／合約用的「壹萬貳仟參佰肆拾伍元整」。
// 規則：四位一組（萬/億/兆），組內連續零壓成一個零、去尾零；
// 低位組不足四位且其上還有數字時補「零」；無角分加「整」，
// 角為零而有分時補「零」。

const DIGITS = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
const IN_UNITS = ['', '拾', '佰', '仟'];
const GROUP_UNITS = ['', '萬', '億', '兆'];
const MAX = 1e16; // 支援到仟兆以下

// 0–9999 的一組：305 → 參佰零伍（內部零壓縮、去尾零）
function groupToChinese(g: number): string {
  let out = '';
  let zeroPending = false;
  for (let pos = 3; pos >= 0; pos--) {
    const d = Math.floor(g / 10 ** pos) % 10;
    if (d === 0) {
      if (out) zeroPending = true;
      continue;
    }
    if (zeroPending) {
      out += '零';
      zeroPending = false;
    }
    out += DIGITS[d] + IN_UNITS[pos];
  }
  return out;
}

export function toChineseAmount(n: number): string | null {
  if (!Number.isFinite(n) || n < 0 || n >= MAX) return null;
  // 先修浮點雜訊再取分（1.005*100 = 100.4999…）
  const cents = Math.round(Number((n * 100).toFixed(6)));
  const int = Math.floor(cents / 100);
  const jiao = Math.floor(cents / 10) % 10;
  const fen = cents % 10;

  if (int === 0 && jiao === 0 && fen === 0) return '零元整';

  let out = '';
  if (int > 0) {
    const groups: number[] = [];
    let v = int;
    while (v > 0) {
      groups.push(v % 10000);
      v = Math.floor(v / 10000);
    }
    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i];
      if (g === 0) continue; // 整組為零：單位省略，零由下一個非零組補
      const needZero = out !== '' && g < 1000; // 前導零且其上已有數字
      out += (needZero ? '零' : '') + groupToChinese(g) + GROUP_UNITS[i];
    }
    out += '元';
  }

  if (jiao === 0 && fen === 0) return out + '整';
  if (jiao > 0) out += DIGITS[jiao] + '角';
  if (fen > 0) out += (jiao === 0 && int > 0 ? '零' : '') + DIGITS[fen] + '分';
  return out;
}

// 台灣證號驗證：身分證字號（含新式外來人口統一證號）與營利事業統一編號。
// 統編採 112 年 4 月起的新制：加權和可被 5 整除即有效
//（舊制為可被 10 整除）；第 7 碼為 7 時保留 +1 容錯。
// 產生器僅供開發測試使用，不對應真實個人或企業。

// 字母 → 數值（A=10 … Z=33，非連續）
const LETTER_CODE: Record<string, number> = {
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18,
  K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27,
  U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33,
};

// 首字母對應的戶籍地（歷史配賦區域，供顯示參考）
export const LETTER_AREA: Record<string, string> = {
  A: '臺北市', B: '臺中市', C: '基隆市', D: '臺南市', E: '高雄市', F: '新北市',
  G: '宜蘭縣', H: '桃園市', I: '嘉義市', J: '新竹縣', K: '苗栗縣', L: '臺中縣',
  M: '南投縣', N: '彰化縣', O: '新竹市', P: '雲林縣', Q: '嘉義縣', R: '臺南縣',
  S: '高雄縣', T: '屏東縣', U: '花蓮縣', V: '臺東縣', W: '金門縣', X: '澎湖縣',
  Y: '陽明山管理局', Z: '連江縣',
};

const ID_WEIGHTS = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];

/** 身分證/新式統一證號驗證（第二碼 1/2 本國、8/9 外來人口） */
export function isValidTwId(input: string): boolean {
  const id = input.trim().toUpperCase();
  if (!/^[A-Z][1289]\d{8}$/.test(id)) return false;
  const code = LETTER_CODE[id[0]];
  const digits = [Math.floor(code / 10), code % 10, ...[...id.slice(1)].map(Number)];
  const sum = digits.reduce((acc, d, i) => acc + d * ID_WEIGHTS[i], 0);
  return sum % 10 === 0;
}

/** 測試用身分證產生器：隨機字母＋性別碼＋隨機序號，補上正確檢查碼 */
export function generateTwId(gender: 'male' | 'female' = 'male'): string {
  const letters = Object.keys(LETTER_CODE);
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const body = `${gender === 'male' ? '1' : '2'}${Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('')}`;
  const code = LETTER_CODE[letter];
  const digits = [Math.floor(code / 10), code % 10, ...[...body].map(Number)];
  const partial = digits.reduce((acc, d, i) => acc + d * ID_WEIGHTS[i], 0);
  const check = (10 - (partial % 10)) % 10;
  return `${letter}${body}${check}`;
}

const GUI_WEIGHTS = [1, 2, 1, 2, 1, 2, 4, 1];

function guiSum(no: string): number {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const p = Number(no[i]) * GUI_WEIGHTS[i];
    sum += Math.floor(p / 10) + (p % 10);
  }
  return sum;
}

/** 統一編號驗證（112 年新制：% 5；第 7 碼為 7 時容許 +1） */
export function isValidGui(input: string): boolean {
  const no = input.trim();
  if (!/^\d{8}$/.test(no)) return false;
  const sum = guiSum(no);
  if (sum % 5 === 0) return true;
  return no[6] === '7' && (sum + 1) % 5 === 0;
}

/** 測試用統編產生器：隨機 7 碼，暴力找出合法的檢查碼 */
export function generateGui(): string {
  for (;;) {
    const head = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
    for (let d = 0; d <= 9; d++) {
      const candidate = head + String(d);
      if (isValidGui(candidate)) return candidate;
    }
  }
}

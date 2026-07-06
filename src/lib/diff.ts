// 文字比對：標準 LCS 動態規劃，零依賴。
// 複雜度 O(n×m)——行比對以行數計，一般文件都遠低於上限；
// 超過上限時退化為「整段刪除＋整段新增」而不是卡死瀏覽器。

export type DiffType = 'same' | 'add' | 'del';

export interface DiffPart {
  type: DiffType;
  text: string;
}

const MAX_UNITS = 3000; // n×m ≤ 9,000,000 —— 毫秒級

function lcsDiff(a: string[], b: string[], joiner: string): DiffPart[] {
  if (a.length === 0 && b.length === 0) return [];
  if (a.length * b.length > MAX_UNITS * MAX_UNITS) {
    return [
      ...(a.length ? [{ type: 'del' as const, text: a.join(joiner) }] : []),
      ...(b.length ? [{ type: 'add' as const, text: b.join(joiner) }] : []),
    ];
  }

  // DP 表：dp[i][j] = a[i:] 與 b[j:] 的 LCS 長度
  const n = a.length;
  const m = b.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      parts.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      parts.push({ type: 'del', text: a[i] });
      i++;
    } else {
      parts.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) parts.push({ type: 'del', text: a[i++] });
  while (j < m) parts.push({ type: 'add', text: b[j++] });
  return parts;
}

export function diffLines(a: string, b: string): DiffPart[] {
  const split = (s: string) => (s === '' ? [] : s.split('\n'));
  return lcsDiff(split(a), split(b), '\n');
}

// 字元級比對，相鄰同型別合併成一段（給行內高亮用）
export function diffChars(a: string, b: string): DiffPart[] {
  const raw = lcsDiff([...a], [...b], '');
  const merged: DiffPart[] = [];
  for (const p of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === p.type) last.text += p.text;
    else merged.push({ ...p });
  }
  return merged;
}

export function diffStats(parts: DiffPart[]): { added: number; deleted: number } {
  return {
    added: parts.filter((p) => p.type === 'add').length,
    deleted: parts.filter((p) => p.type === 'del').length,
  };
}

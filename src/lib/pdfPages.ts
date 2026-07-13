// 頁碼範圍字串解析：「1-3, 7, 10-12」→ [1,2,3,7,10,11,12]（1-indexed）。
// 任一段不合法就整串回 null —— 寧可要求改正，不猜使用者意圖。

export function parsePageRanges(input: string, totalPages: number): number[] | null {
  // 全形逗號與頓號一併當分隔符（中文輸入法很常見）
  const parts = input
    .replace(/[，、]/g, ',')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
  if (parts.length === 0) return null;

  const seen = new Set<number>();
  const pages: number[] = [];
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return null;
    const start = Number(m[1]);
    const end = m[2] !== undefined ? Number(m[2]) : start;
    if (start < 1 || end < start || end > totalPages) return null;
    for (let p = start; p <= end; p++) {
      if (!seen.has(p)) {
        seen.add(p);
        pages.push(p);
      }
    }
  }
  return pages;
}

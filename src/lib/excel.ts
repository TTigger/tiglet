export function getHeaders(rows: unknown[][]): string[] {
  const first = rows[0] ?? [];
  return first.map((v, i) => {
    const s = v === undefined || v === null ? '' : String(v).trim();
    return s === '' ? `欄 ${i + 1}` : s;
  });
}

export function extractColumn(rows: unknown[][], colIndex: number): string[] {
  return rows
    .map((r) => r[colIndex])
    .map((v) => (v === undefined || v === null ? '' : String(v).trim()))
    .filter((s) => s.length > 0);
}

import { describe, expect, it } from 'vitest';
import { parsePageRanges } from '../pdfPages';

describe('parsePageRanges', () => {
  it('單頁、範圍、混用（1-indexed，保留輸入順序）', () => {
    expect(parsePageRanges('1-3, 7, 10-12', 20)).toEqual([1, 2, 3, 7, 10, 11, 12]);
    expect(parsePageRanges('5', 10)).toEqual([5]);
    expect(parsePageRanges('2-2', 10)).toEqual([2]);
  });

  it('全形逗號、頓號、多餘空白都容忍（中文使用者會這樣打）', () => {
    expect(parsePageRanges('1，3、5 - 6', 10)).toEqual([1, 3, 5, 6]);
  });

  it('重複頁只取一次，順序以先出現為準', () => {
    expect(parsePageRanges('3, 1-4', 10)).toEqual([3, 1, 2, 4]);
  });

  it('超出總頁數、反向範圍、0 或負數 → null（整串拒絕，不猜使用者意圖）', () => {
    expect(parsePageRanges('1-99', 10)).toBeNull();
    expect(parsePageRanges('5-3', 10)).toBeNull();
    expect(parsePageRanges('0', 10)).toBeNull();
    expect(parsePageRanges('-2', 10)).toBeNull();
  });

  it('空字串或垃圾輸入 → null', () => {
    expect(parsePageRanges('', 10)).toBeNull();
    expect(parsePageRanges('abc', 10)).toBeNull();
    expect(parsePageRanges('1-', 10)).toBeNull();
  });
});

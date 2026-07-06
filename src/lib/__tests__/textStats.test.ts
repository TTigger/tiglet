import { describe, it, expect } from 'vitest';
import { textStats } from '../textStats';

describe('textStats', () => {
  it('empty text → all zeros', () => {
    expect(textStats('')).toEqual({
      chars: 0,
      charsNoSpace: 0,
      cjkChars: 0,
      latinWords: 0,
      lines: 0,
      paragraphs: 0,
      readingMinutes: 0,
    });
  });

  it('counts characters with and without whitespace', () => {
    const s = textStats('ab c\nd');
    expect(s.chars).toBe(6);
    expect(s.charsNoSpace).toBe(4);
  });

  it('counts CJK characters (含中文標點不算字)', () => {
    const s = textStats('今天天氣真好，適合騎車。');
    expect(s.cjkChars).toBe(10);
  });

  it('counts latin words', () => {
    expect(textStats('The quick brown fox jumps').latinWords).toBe(5);
    expect(textStats("it's a dog-friendly cafe").latinWords).toBe(4);
  });

  it('mixed zh/en text counts both', () => {
    const s = textStats('我用 Astro 和 React 蓋了網站');
    expect(s.cjkChars).toBe(7);
    expect(s.latinWords).toBe(2);
  });

  it('counts lines and paragraphs', () => {
    const s = textStats('第一段第一行\n第一段第二行\n\n第二段');
    expect(s.lines).toBe(3); // 空行不算
    expect(s.paragraphs).toBe(2);
  });

  it('estimates reading time (中文 350 字/分 + 英文 220 詞/分)', () => {
    const zh = '字'.repeat(700);
    expect(textStats(zh).readingMinutes).toBeCloseTo(2, 5);
    const en = Array(440).fill('word').join(' ');
    expect(textStats(en).readingMinutes).toBeCloseTo(2, 5);
  });
});

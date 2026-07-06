import { describe, it, expect } from 'vitest';
import { diffLines, diffChars, diffStats } from '../diff';

describe('diffLines (LCS)', () => {
  it('identical texts → all same', () => {
    const d = diffLines('a\nb\nc', 'a\nb\nc');
    expect(d).toEqual([
      { type: 'same', text: 'a' },
      { type: 'same', text: 'b' },
      { type: 'same', text: 'c' },
    ]);
  });

  it('detects an added line', () => {
    const d = diffLines('a\nc', 'a\nb\nc');
    expect(d).toEqual([
      { type: 'same', text: 'a' },
      { type: 'add', text: 'b' },
      { type: 'same', text: 'c' },
    ]);
  });

  it('detects a deleted line', () => {
    const d = diffLines('a\nb\nc', 'a\nc');
    expect(d).toEqual([
      { type: 'same', text: 'a' },
      { type: 'del', text: 'b' },
      { type: 'same', text: 'c' },
    ]);
  });

  it('replacement shows del then add', () => {
    const d = diffLines('hello world', 'hello 世界');
    expect(d).toEqual([
      { type: 'del', text: 'hello world' },
      { type: 'add', text: 'hello 世界' },
    ]);
  });

  it('empty vs text', () => {
    expect(diffLines('', 'a')).toEqual([{ type: 'add', text: 'a' }]);
    expect(diffLines('a', '')).toEqual([{ type: 'del', text: 'a' }]);
    expect(diffLines('', '')).toEqual([]);
  });

  it('prefers the longest common subsequence, not just prefixes', () => {
    const d = diffLines('x\na\nb', 'a\nb\ny');
    expect(d).toEqual([
      { type: 'del', text: 'x' },
      { type: 'same', text: 'a' },
      { type: 'same', text: 'b' },
      { type: 'add', text: 'y' },
    ]);
  });
});

describe('diffChars', () => {
  it('marks character-level changes', () => {
    const d = diffChars('kitten', 'sitten');
    expect(d[0]).toEqual({ type: 'del', text: 'k' });
    expect(d[1]).toEqual({ type: 'add', text: 's' });
    expect(d.slice(2).every((p) => p.type === 'same')).toBe(true);
  });

  it('groups consecutive same-type chars into one part', () => {
    const d = diffChars('abc', 'abcdef');
    expect(d).toEqual([
      { type: 'same', text: 'abc' },
      { type: 'add', text: 'def' },
    ]);
  });

  it('handles CJK', () => {
    const d = diffChars('騎車上武嶺', '騎車下武嶺');
    expect(d).toEqual([
      { type: 'same', text: '騎車' },
      { type: 'del', text: '上' },
      { type: 'add', text: '下' },
      { type: 'same', text: '武嶺' },
    ]);
  });
});

describe('diffStats', () => {
  it('counts adds and dels', () => {
    const d = diffLines('a\nb\nc', 'a\nx\nc\ny');
    expect(diffStats(d)).toEqual({ added: 2, deleted: 1 });
  });
});

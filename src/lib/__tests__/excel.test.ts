import { describe, it, expect } from 'vitest';
import { getHeaders, extractColumn } from '../excel';

describe('getHeaders', () => {
  it('uses first row as labels, falls back for blanks', () => {
    expect(getHeaders([['姓名', '', '電話']])).toEqual(['姓名', '欄 2', '電話']);
  });
  it('handles empty input', () => expect(getHeaders([])).toEqual([]));
});

describe('extractColumn', () => {
  it('pulls a column, trims, drops empties', () => {
    const rows = [['Amy'], [' Bob '], [''], ['Cara']];
    expect(extractColumn(rows, 0)).toEqual(['Amy', 'Bob', 'Cara']);
  });
});

import { describe, it, expect } from 'vitest';
import { filterTools } from '../search';
import { tools } from '../../data/tools';

describe('filterTools', () => {
  it('returns all tools for an empty query', () => {
    expect(filterTools(tools, '')).toHaveLength(tools.length);
  });
  it('matches on title', () => {
    const r = filterTools(tools, '計算機');
    expect(r.map((t) => t.id)).toContain('calculator');
  });
  it('matches on english keyword case-insensitively', () => {
    const r = filterTools(tools, 'EXCEL');
    expect(r.map((t) => t.id)).toContain('raffle');
  });
  it('returns empty array when nothing matches', () => {
    expect(filterTools(tools, 'zzzzz')).toEqual([]);
  });
});

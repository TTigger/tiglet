import { describe, it, expect } from 'vitest';
import { parseJson, formatJson, minifyJson, buildJsonTree } from '../jsonTree';

describe('parseJson', () => {
  it('parses valid JSON', () => {
    expect(parseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
  });

  it('reports line and column on syntax error', () => {
    const r = parseJson('{\n  "a": 1,\n  "b": oops\n}');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.line).toBe(3);
      expect(r.column).toBeGreaterThanOrEqual(8);
      expect(r.message.length).toBeGreaterThan(0);
    }
  });

  it('locates errors of various shapes', () => {
    const missingComma = parseJson('{\n  "a": 1\n  "b": 2\n}');
    expect(missingComma.ok).toBe(false);
    if (!missingComma.ok) expect(missingComma.line).toBe(3);

    const trailing = parseJson('{"a": 1} extra');
    expect(trailing.ok).toBe(false);
    if (!trailing.ok) {
      expect(trailing.line).toBe(1);
      expect(trailing.column).toBe(10);
    }

    const badString = parseJson('{"a": "unterminated');
    expect(badString.ok).toBe(false);
    if (!badString.ok) expect(badString.line).toBe(1);
  });

  it('empty input is an error', () => {
    expect(parseJson('').ok).toBe(false);
  });
});

describe('formatJson / minifyJson', () => {
  it('formats with 2-space indent', () => {
    expect(formatJson('{"a":[1,2]}')).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
  });

  it('minifies', () => {
    expect(minifyJson('{\n  "a": [1, 2]\n}')).toBe('{"a":[1,2]}');
  });

  it('throws on invalid input', () => {
    expect(() => formatJson('{')).toThrow();
  });
});

describe('buildJsonTree', () => {
  const tree = buildJsonTree({ name: '武嶺', tags: ['climb', 'hc'], meta: { km: 54, open: true, note: null } });

  it('root is an object node with children', () => {
    expect(tree.type).toBe('object');
    expect(tree.children).toHaveLength(3);
    expect(tree.path).toBe('$');
  });

  it('builds paths like $.tags[1] and $.meta.km', () => {
    const tags = tree.children![1];
    expect(tags.type).toBe('array');
    expect(tags.size).toBe(2);
    expect(tags.children![1].path).toBe('$.tags[1]');
    const meta = tree.children![2];
    expect(meta.children![0].path).toBe('$.meta.km');
  });

  it('leaf nodes carry type and preview', () => {
    const name = tree.children![0];
    expect(name).toMatchObject({ key: 'name', type: 'string', preview: '"武嶺"' });
    const meta = tree.children![2];
    expect(meta.children![1]).toMatchObject({ key: 'open', type: 'boolean', preview: 'true' });
    expect(meta.children![2]).toMatchObject({ key: 'note', type: 'null', preview: 'null' });
  });

  it('object size counts keys', () => {
    expect(tree.size).toBe(3);
  });

  it('long strings are truncated in preview', () => {
    const t = buildJsonTree({ s: 'x'.repeat(100) });
    expect(t.children![0].preview.length).toBeLessThan(60);
    expect(t.children![0].preview).toContain('…');
  });
});

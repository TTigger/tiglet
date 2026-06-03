import { describe, it, expect } from 'vitest';
import { evaluate } from '../expression';

describe('evaluate', () => {
  it('respects operator precedence', () => expect(evaluate('12*3+4/2')).toBe(38));
  it('respects parentheses', () => expect(evaluate('(1+2)*3')).toBe(9));
  it('handles unary minus', () => expect(evaluate('-5+3')).toBe(-2));
  it('ignores whitespace', () => expect(evaluate('  2 +  2 ')).toBe(4));
  it('throws on divide by zero', () => expect(() => evaluate('1/0')).toThrow('除以零'));
  it('throws on invalid character', () => expect(() => evaluate('2^3')).toThrow());
  it('throws on empty input', () => expect(() => evaluate('')).toThrow());
  it('throws on unbalanced parentheses', () => expect(() => evaluate('(1+2')).toThrow());
});

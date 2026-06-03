import { describe, it, expect } from 'vitest';
import { compute, formatResult, reducer, initialCalc } from '../calculator';

describe('compute', () => {
  it('adds', () => expect(compute(2, 3, '+')).toBe(5));
  it('divides', () => expect(compute(6, 3, '/')).toBe(2));
  it('throws on divide by zero', () => expect(() => compute(1, 0, '/')).toThrow());
});

describe('formatResult', () => {
  it('hides float noise (0.1 + 0.2)', () => expect(formatResult(0.1 + 0.2)).toBe('0.3'));
  it('shows error label for non-finite', () => expect(formatResult(Infinity)).toBe('錯誤'));
});

describe('reducer', () => {
  it('chains operations: 2 + 3 = 5', () => {
    let s = initialCalc;
    s = reducer(s, { type: 'digit', digit: '2' });
    s = reducer(s, { type: 'op', operator: '+' });
    s = reducer(s, { type: 'digit', digit: '3' });
    s = reducer(s, { type: 'equals' });
    expect(s.current).toBe('5');
  });
  it('clears back to 0', () => {
    let s = reducer(initialCalc, { type: 'digit', digit: '9' });
    s = reducer(s, { type: 'clear' });
    expect(s.current).toBe('0');
  });
  it('shows 錯誤 on divide by zero via equals', () => {
    let s = initialCalc;
    s = reducer(s, { type: 'digit', digit: '5' });
    s = reducer(s, { type: 'op', operator: '/' });
    s = reducer(s, { type: 'digit', digit: '0' });
    s = reducer(s, { type: 'equals' });
    expect(s.current).toBe('錯誤');
  });
  it('negate is a no-op right after an operator (overwrite pending)', () => {
    let s = initialCalc;
    s = reducer(s, { type: 'digit', digit: '5' });
    s = reducer(s, { type: 'op', operator: '+' });
    s = reducer(s, { type: 'negate' }); // nothing entered yet -> no-op
    s = reducer(s, { type: 'digit', digit: '3' });
    s = reducer(s, { type: 'equals' });
    expect(s.current).toBe('8'); // 5 + 3, the phantom -5 was never applied
  });
  it('negate flips a freshly entered operand', () => {
    let s = initialCalc;
    s = reducer(s, { type: 'digit', digit: '5' });
    s = reducer(s, { type: 'op', operator: '+' });
    s = reducer(s, { type: 'digit', digit: '3' });
    s = reducer(s, { type: 'negate' });
    s = reducer(s, { type: 'equals' });
    expect(s.current).toBe('2'); // 5 + (-3)
  });
});

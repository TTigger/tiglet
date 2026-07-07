import { describe, it, expect } from 'vitest';
import { toChineseAmount } from '../chineseAmount';

describe('toChineseAmount（整數）', () => {
  it('基本數字', () => {
    expect(toChineseAmount(0)).toBe('零元整');
    expect(toChineseAmount(7)).toBe('柒元整');
    expect(toChineseAmount(100)).toBe('壹佰元整');
    expect(toChineseAmount(12345)).toBe('壹萬貳仟參佰肆拾伍元整');
  });

  it('連續零壓縮成一個零', () => {
    expect(toChineseAmount(10005)).toBe('壹萬零伍元整');
    expect(toChineseAmount(1000005)).toBe('壹佰萬零伍元整');
    expect(toChineseAmount(100000001)).toBe('壹億零壹元整');
  });

  it('組間邊界的零', () => {
    expect(toChineseAmount(10000500)).toBe('壹仟萬零伍佰元整');
    expect(toChineseAmount(1002003)).toBe('壹佰萬貳仟零參元整');
    expect(toChineseAmount(100200030)).toBe('壹億零貳拾萬零參拾元整');
  });

  it('整組為零時不出現單位', () => {
    expect(toChineseAmount(1_0000_0000)).toBe('壹億元整');
    expect(toChineseAmount(1_0000_0000_0000)).toBe('壹兆元整');
  });
});

describe('toChineseAmount（角分）', () => {
  it('角與分', () => {
    expect(toChineseAmount(12.34)).toBe('壹拾貳元參角肆分');
    expect(toChineseAmount(0.5)).toBe('伍角');
    expect(toChineseAmount(0.05)).toBe('伍分');
  });

  it('角為零但有分 → 零X分', () => {
    expect(toChineseAmount(12.05)).toBe('壹拾貳元零伍分');
  });

  it('分為零 → 只到角、不加整', () => {
    expect(toChineseAmount(12.3)).toBe('壹拾貳元參角');
  });

  it('小數第三位四捨五入', () => {
    expect(toChineseAmount(1.005)).toBe('壹元零壹分');
    expect(toChineseAmount(1.004)).toBe('壹元整');
  });
});

describe('toChineseAmount（無效輸入）', () => {
  it('負數 / NaN / 超出範圍 → null', () => {
    expect(toChineseAmount(-1)).toBeNull();
    expect(toChineseAmount(NaN)).toBeNull();
    expect(toChineseAmount(Infinity)).toBeNull();
    expect(toChineseAmount(1e16)).toBeNull();
  });
});

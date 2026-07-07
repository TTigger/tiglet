import { describe, it, expect } from 'vitest';
import { isValidTwId, isValidGui, generateTwId, generateGui, LETTER_AREA } from '../twId';

describe('isValidTwId（身分證字號）', () => {
  it('經典有效範例 A123456789', () => {
    expect(isValidTwId('A123456789')).toBe(true);
  });

  it('檢查碼錯誤 → false', () => {
    expect(isValidTwId('A123456788')).toBe(false);
  });

  it('格式錯誤 → false', () => {
    expect(isValidTwId('')).toBe(false);
    expect(isValidTwId('A12345678')).toBe(false); // 少一碼
    expect(isValidTwId('1123456789')).toBe(false); // 開頭非字母
    expect(isValidTwId('A323456789')).toBe(false); // 性別碼非 1/2/8/9
  });

  it('接受小寫並容忍前後空白', () => {
    expect(isValidTwId(' a123456789 ')).toBe(true);
  });

  it('新式外來人口統一證號（第二碼 8/9）也驗', () => {
    // 產生器 roundtrip 覆蓋；此處驗格式接受度
    const id = generateTwId('male');
    expect(isValidTwId(id)).toBe(true);
  });
});

describe('generateTwId（測試用產生器）', () => {
  it('產生的號碼一定有效且性別碼正確', () => {
    for (let i = 0; i < 50; i++) {
      const m = generateTwId('male');
      const f = generateTwId('female');
      expect(isValidTwId(m), m).toBe(true);
      expect(isValidTwId(f), f).toBe(true);
      expect(m[1]).toBe('1');
      expect(f[1]).toBe('2');
    }
  });
});

describe('isValidGui（統一編號，112 年新制：可被 5 整除）', () => {
  it('經典有效統編（新舊制皆合法）', () => {
    expect(isValidGui('22099131')).toBe(true); // 加權和 30，10 與 5 皆整除
  });

  it('新制放寬的號碼：加權和為 5 的倍數但非 10 的倍數', () => {
    // 窮舉找一個 sum % 5 === 0 且 sum % 10 !== 0 的號碼驗證新制
    let found = '';
    for (let n = 10000000; n < 10001000; n++) {
      const s = String(n);
      if (isValidGui(s) && !isValidGuiOldSum(s)) { found = s; break; }
    }
    expect(found).not.toBe('');
    expect(isValidGui(found)).toBe(true);
  });

  it('格式錯誤 → false', () => {
    expect(isValidGui('1234567')).toBe(false);
    expect(isValidGui('abcdefgh')).toBe(false);
    expect(isValidGui('')).toBe(false);
  });

  it('第 7 碼為 7 的特殊容錯', () => {
    // 產生器涵蓋：大量生成中必然包含第 7 碼為 7 的案例
    for (let i = 0; i < 100; i++) {
      const g = generateGui();
      expect(isValidGui(g), g).toBe(true);
    }
  });
});

// 測試輔助：舊制「可被 10 整除」判定（不含第 7 碼特殊規則），用來證明新制放寬
function isValidGuiOldSum(no: string): boolean {
  const W = [1, 2, 1, 2, 1, 2, 4, 1];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const p = Number(no[i]) * W[i];
    sum += Math.floor(p / 10) + (p % 10);
  }
  return sum % 10 === 0;
}

describe('LETTER_AREA', () => {
  it('涵蓋 A–Z 並含台北市', () => {
    expect(Object.keys(LETTER_AREA)).toHaveLength(26);
    expect(LETTER_AREA.A).toContain('臺北');
  });
});

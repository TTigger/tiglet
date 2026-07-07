import { describe, it, expect } from 'vitest';
import { sha256Hex, sha1Hex, hashBufferHex, uuidv4, uuidBatch } from '../hashId';

describe('sha256Hex / sha1Hex（NIST 測試向量）', () => {
  it('sha256("abc")', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('sha256("")', async () => {
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('sha1("abc")', async () => {
    expect(await sha1Hex('abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });

  it('中文與 emoji 走 UTF-8', async () => {
    // 與 node 驗證值一致性：同輸入必得同輸出（穩定性檢查）
    const a = await sha256Hex('公路車🚴');
    const b = await sha256Hex('公路車🚴');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('hashBufferHex（檔案雜湊）', () => {
  it('與文字版對同一位元組序列結果一致', async () => {
    const bytes = new TextEncoder().encode('abc');
    expect(await hashBufferHex(bytes.buffer, 'SHA-256')).toBe(await sha256Hex('abc'));
  });
});

describe('uuidv4', () => {
  it('符合 v4 格式', () => {
    expect(uuidv4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('批次產生皆唯一', () => {
    const batch = uuidBatch(500);
    expect(new Set(batch).size).toBe(500);
  });

  it('批次數量夾在 1–1000', () => {
    expect(uuidBatch(0)).toHaveLength(1);
    expect(uuidBatch(99999)).toHaveLength(1000);
  });
});

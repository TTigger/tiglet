import { describe, it, expect } from 'vitest';
import { readExifSummary } from '../exif';

// 手工構造最小可解析的 JPEG＋EXIF APP1（TIFF little-endian）
function buildJpegWithExif({ gps = false, make = '' }: { gps?: boolean; make?: string }): ArrayBuffer {
  const entries: number[][] = [];
  if (make) {
    const bytes = [...make].map((c) => c.charCodeAt(0));
    while (bytes.length < 4) bytes.push(0);
    // tag 0x010F Make, type 2 ASCII, count ≤4 → 值直接內嵌
    entries.push([0x0f, 0x01, 0x02, 0x00, bytes.length, 0x00, 0x00, 0x00, ...bytes.slice(0, 4)]);
  }
  if (gps) {
    // tag 0x8825 GPS IFD pointer, type 4 LONG, count 1
    entries.push([0x25, 0x88, 0x04, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  }
  const ifd = [entries.length, 0x00, ...entries.flat(), 0x00, 0x00, 0x00, 0x00];
  const tiff = [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, ...ifd]; // II, 42, IFD0@8
  const exifBody = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff]; // "Exif\0\0"
  const app1Len = exifBody.length + 2;
  const jpeg = [0xff, 0xd8, 0xff, 0xe1, (app1Len >> 8) & 0xff, app1Len & 0xff, ...exifBody, 0xff, 0xd9];
  return new Uint8Array(jpeg).buffer;
}

describe('readExifSummary', () => {
  it('detects EXIF with GPS and Make', () => {
    const s = readExifSummary(buildJpegWithExif({ gps: true, make: 'GT' }));
    expect(s.hasExif).toBe(true);
    expect(s.hasGps).toBe(true);
    expect(s.make).toBe('GT');
  });

  it('detects EXIF without GPS', () => {
    const s = readExifSummary(buildJpegWithExif({ make: 'GT' }));
    expect(s.hasExif).toBe(true);
    expect(s.hasGps).toBe(false);
  });

  it('plain JPEG without APP1 → no EXIF', () => {
    const s = readExifSummary(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer);
    expect(s).toEqual({ hasExif: false, hasGps: false });
  });

  it('non-JPEG bytes → no EXIF (PNG 等格式不解析)', () => {
    const s = readExifSummary(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer);
    expect(s).toEqual({ hasExif: false, hasGps: false });
  });

  it('truncated/garbage input never throws', () => {
    expect(() => readExifSummary(new Uint8Array([0xff]).buffer)).not.toThrow();
    expect(() => readExifSummary(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0x00, 0x00]).buffer)).not.toThrow();
  });
});

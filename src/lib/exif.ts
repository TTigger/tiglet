// 最小 EXIF 解析：只回答隱私相關的問題——「這張 JPEG 帶了什麼中繼資料？」
// （有沒有 EXIF、有沒有 GPS、相機廠牌/型號、拍攝時間）。
// 清除本身靠 canvas 重編碼完成；這裡永不拋錯，解析失敗一律當作無 EXIF。

export interface ExifSummary {
  hasExif: boolean;
  hasGps: boolean;
  make?: string;
  model?: string;
  dateTime?: string;
}

const NONE: ExifSummary = { hasExif: false, hasGps: false };

export function readExifSummary(buf: ArrayBuffer): ExifSummary {
  try {
    const v = new DataView(buf);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return NONE; // 不是 JPEG

    // 走訪 JPEG segments 找 APP1/Exif
    let off = 2;
    while (off + 4 <= v.byteLength) {
      if (v.getUint8(off) !== 0xff) break;
      const marker = v.getUint8(off + 1);
      if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS
      const len = v.getUint16(off + 2);
      if (marker === 0xe1 && off + 4 + 6 <= v.byteLength && readAscii(v, off + 4, 4) === 'Exif') {
        return parseTiff(v, off + 10, len - 8);
      }
      off += 2 + len;
    }
    return NONE;
  } catch {
    return NONE;
  }
}

function readAscii(v: DataView, off: number, len: number): string {
  let s = '';
  for (let i = 0; i < len && off + i < v.byteLength; i++) {
    const c = v.getUint8(off + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

function parseTiff(v: DataView, base: number, maxLen: number): ExifSummary {
  const end = Math.min(v.byteLength, base + maxLen);
  if (base + 8 > end) return NONE;
  const endianTag = v.getUint16(base);
  const little = endianTag === 0x4949; // 'II'
  if (!little && endianTag !== 0x4d4d) return NONE;
  const u16 = (o: number) => v.getUint16(o, little);
  const u32 = (o: number) => v.getUint32(o, little);
  if (u16(base + 2) !== 42) return NONE;

  const out: ExifSummary = { hasExif: true, hasGps: false };
  let exifIfdOffset = 0;

  const readIfd = (ifdOff: number, tags: Record<number, (entryOff: number, type: number, count: number) => void>) => {
    if (base + ifdOff + 2 > end) return;
    const count = u16(base + ifdOff);
    for (let i = 0; i < count; i++) {
      const e = base + ifdOff + 2 + i * 12;
      if (e + 12 > end) return;
      const tag = u16(e);
      tags[tag]?.(e, u16(e + 2), u32(e + 4));
    }
  };

  const asciiValue = (entryOff: number, count: number): string => {
    const inline = count <= 4;
    const at = inline ? entryOff + 8 : base + u32(entryOff + 8);
    return readAscii(v, at, Math.min(count, 64)).trim();
  };

  readIfd(u32(base + 4), {
    0x010f: (e, t, c) => { if (t === 2) out.make = asciiValue(e, c); },
    0x0110: (e, t, c) => { if (t === 2) out.model = asciiValue(e, c); },
    0x0132: (e, t, c) => { if (t === 2) out.dateTime = asciiValue(e, c); },
    0x8825: () => { out.hasGps = true; },
    0x8769: (e) => { exifIfdOffset = u32(e + 8); },
  });

  if (exifIfdOffset) {
    readIfd(exifIfdOffset, {
      0x9003: (e, t, c) => { if (t === 2) out.dateTime = asciiValue(e, c); }, // DateTimeOriginal 優先
    });
  }
  return out;
}

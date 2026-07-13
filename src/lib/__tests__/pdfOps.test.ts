import { describe, expect, it } from 'vitest';
import { PDFDocument, degrees } from 'pdf-lib';
import { mergePdfs, extractPages, rotatePdf } from '../pdfOps';

async function makePdf(pages: number, rotate = 0): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([200, 300]);
    if (rotate) page.setRotation(degrees(rotate));
  }
  return doc.save();
}

async function pageCount(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(bytes)).getPageCount();
}

describe('mergePdfs', () => {
  it('兩份 PDF 依序合併，頁數相加', async () => {
    const a = await makePdf(3);
    const b = await makePdf(2);
    const merged = await mergePdfs([a, b]);
    expect(await pageCount(merged)).toBe(5);
  });

  it('單一檔案也能過（等於重存）', async () => {
    const merged = await mergePdfs([await makePdf(4)]);
    expect(await pageCount(merged)).toBe(4);
  });
});

describe('extractPages', () => {
  it('照指定順序抽頁成新檔', async () => {
    const src = await makePdf(5);
    const out = await extractPages(src, [4, 2]);
    expect(await pageCount(out)).toBe(2);
  });
});

describe('rotatePdf', () => {
  it('全部頁面加轉 90°，原有旋轉角度要累加', async () => {
    const src = await makePdf(2, 90);
    const out = await rotatePdf(src, 90);
    const doc = await PDFDocument.load(out);
    expect(doc.getPage(0).getRotation().angle).toBe(180);
    expect(doc.getPage(1).getRotation().angle).toBe(180);
  });

  it('只轉指定頁，其他頁不動；累加後 mod 360', async () => {
    const src = await makePdf(3, 270);
    const out = await rotatePdf(src, 180, [2]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPage(0).getRotation().angle).toBe(270);
    expect(doc.getPage(1).getRotation().angle).toBe(90); // 270+180 mod 360
    expect(doc.getPage(2).getRotation().angle).toBe(270);
  });
});

// PDF 操作核心：合併／抽頁／旋轉。全部在瀏覽器（或測試的 Node）本機執行，
// 檔案不離開使用者的機器。頁碼一律 1-indexed（與 UI、parsePageRanges 一致）。

import { PDFDocument, degrees } from 'pdf-lib';

export async function mergePdfs(files: Uint8Array[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const bytes of files) {
    const src = await PDFDocument.load(bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
  }
  return out.save();
}

export async function extractPages(bytes: Uint8Array, pages: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, pages.map((p) => p - 1));
  for (const p of copied) out.addPage(p);
  return out.save();
}

/** 指定頁（省略 = 全部）在原有旋轉上加轉 degreesToAdd（90/180/270） */
export async function rotatePdf(bytes: Uint8Array, degreesToAdd: number, pages?: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const targets = pages ?? doc.getPageIndices().map((i) => i + 1);
  for (const p of targets) {
    const page = doc.getPage(p - 1);
    page.setRotation(degrees((page.getRotation().angle + degreesToAdd) % 360));
  }
  return doc.save();
}

export async function pdfPageCount(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(bytes)).getPageCount();
}

// 中油今日牌價：GetOilPriceJson.aspx 回應的解析與正規化。純函式，
// 由 api/fuel-price.ts 使用。sPrice1~6 的對應抄自中油官網首頁的 widget JS：
// 92無鉛 / 95無鉛 / 98無鉛 / 酒精汽油 / 超級柴油 / 車用液化石油氣。

export interface FuelPrices {
  gas92: number;
  gas95: number;
  gas98: number;
  alcohol: number;
  diesel: number;
  lpg: number;
}

export interface FuelPriceInfo {
  updated: string; // 價格生效日，如「7月13日」
  lpgDate: string; // 液化石油氣實施日（民國紀年）
  trend: string; // 本週調價訊息（純文字，絕不透傳 HTML）
  prices: FuelPrices;
}

function toPrice(v: unknown): number | null {
  if (typeof v !== 'string' || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// 把中油的 UpOrDown_Html 拆成純文字：標籤界線補空格、收斂空白
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseCpcOilJson(raw: string): FuelPriceInfo | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;

  const gas92 = toPrice(data.sPrice1);
  const gas95 = toPrice(data.sPrice2);
  const gas98 = toPrice(data.sPrice3);
  const alcohol = toPrice(data.sPrice4);
  const diesel = toPrice(data.sPrice5);
  const lpg = toPrice(data.sPrice6);
  if (gas92 === null || gas95 === null || gas98 === null || alcohol === null || diesel === null || lpg === null) return null;

  return {
    updated: typeof data.PriceUpdate === 'string' ? data.PriceUpdate : '',
    lpgDate: typeof data.LPGdate === 'string' ? data.LPGdate : '',
    trend: typeof data.UpOrDown_Html === 'string' ? stripHtml(data.UpOrDown_Html) : '',
    prices: { gas92, gas95, gas98, alcohol, diesel, lpg },
  };
}

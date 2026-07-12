import { describe, expect, it } from 'vitest';
import { parseInvoiceXml, checkInvoice, PRIZE_AMOUNT, type WinningNumbers } from '../invoice';

// 財政部 invoice.xml 的實際格式（節錄自 https://invoice.etax.nat.gov.tw/invoice.xml）
const REAL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[統一發票中獎號碼]]></title>
    <item>
      <title><![CDATA[115年 03~04月]]></title>
      <link><![CDATA[https://www.etax.nat.gov.tw/etw-main/ETW183W2_11503]]></link>
      <description><![CDATA[<p>特別獎：19531471</p><p>特獎：85941329</p><p>頭獎：07225810、20231230、83518781</p>]]></description>
    </item>
    <item>
      <title><![CDATA[115年 01~02月]]></title>
      <link><![CDATA[https://www.etax.nat.gov.tw/etw-main/ETW183W2_11501]]></link>
      <description><![CDATA[<p>特別獎：87510041</p><p>特獎：32220522</p><p>頭獎：21677046、44662410、31262513</p><p>增開六獎：985、951</p>]]></description>
    </item>
  </channel>
</rss>`;

describe('parseInvoiceXml', () => {
  it('解析真實格式：期別、連結、各獎號碼', () => {
    const periods = parseInvoiceXml(REAL_XML);
    expect(periods).toHaveLength(2);
    expect(periods[0]).toEqual({
      period: '115年 03~04月',
      link: 'https://www.etax.nat.gov.tw/etw-main/ETW183W2_11503',
      special: '19531471',
      grand: '85941329',
      first: ['07225810', '20231230', '83518781'],
      sixth: [],
    });
    // 增開六獎有開的期別要抓到；號碼是字串，前導零不能掉
    expect(periods[1].sixth).toEqual(['985', '951']);
    expect(periods[1].grand).toBe('32220522');
  });

  it('號碼不完整的 item 直接略過，不產生半套資料', () => {
    const broken = REAL_XML.replace('<p>特獎：85941329</p>', '');
    const periods = parseInvoiceXml(broken);
    expect(periods).toHaveLength(1);
    expect(periods[0].period).toBe('115年 01~02月');
  });

  it('垃圾輸入回空陣列', () => {
    expect(parseInvoiceXml('not xml at all')).toEqual([]);
    expect(parseInvoiceXml('')).toEqual([]);
  });
});

const W: WinningNumbers = {
  period: '115年 01~02月',
  link: '',
  special: '87510041',
  grand: '32220522',
  first: ['21677046', '44662410', '31262513'],
  sixth: ['985', '951'],
};

describe('checkInvoice（完整 8 碼）', () => {
  it('特別獎：8 碼全中 1,000 萬', () => {
    expect(checkInvoice('87510041', W)).toEqual({ level: 'special', amount: 10_000_000, matched: '87510041', confirmed: true, upgradable: false });
  });

  it('特獎：8 碼全中 200 萬', () => {
    expect(checkInvoice('32220522', W)).toMatchObject({ level: 'grand', amount: 2_000_000 });
  });

  it('頭獎全中 20 萬；末 7～3 碼對應二獎到六獎', () => {
    expect(checkInvoice('21677046', W)).toMatchObject({ level: 'first', amount: 200_000 });
    expect(checkInvoice('91677046', W)).toMatchObject({ level: 'second', amount: 40_000 });
    expect(checkInvoice('99677046', W)).toMatchObject({ level: 'third', amount: 10_000 });
    expect(checkInvoice('99977046', W)).toMatchObject({ level: 'fourth', amount: 4_000 });
    expect(checkInvoice('99997046', W)).toMatchObject({ level: 'fifth', amount: 1_000 });
    expect(checkInvoice('99999046', W)).toMatchObject({ level: 'sixth', amount: 200 });
  });

  it('增開六獎：末 3 碼相同 200 元', () => {
    expect(checkInvoice('12345985', W)).toMatchObject({ level: 'addSixth', amount: 200 });
  });

  it('特別獎末碼近似但非全中不算獎（特別獎只比全 8 碼）', () => {
    // 末 7 碼與特別獎相同、與頭獎無關 → 沒中
    expect(checkInvoice('97510041', W)).toBeNull();
  });

  it('多重命中取最高獎金', () => {
    // 同時是頭獎末4（五獎）與增開六獎? 構造：末3=985 且末4 對中頭獎末4 —— 取五獎 1000
    const w2: WinningNumbers = { ...W, first: ['11112985'], sixth: ['985'] };
    expect(checkInvoice('99992985', w2)).toMatchObject({ level: 'fifth', amount: 1_000 });
  });

  it('沒中回 null', () => {
    expect(checkInvoice('00000000', W)).toBeNull();
  });
});

describe('checkInvoice（末 3～7 碼快速對獎）', () => {
  it('末 3 碼對中頭獎末 3 → 至少六獎已確定，且可能升級', () => {
    const hit = checkInvoice('046', W)!;
    expect(hit).toMatchObject({ level: 'sixth', amount: 200, confirmed: true });
    expect(hit.upgradable).toBe(true); // 補完 8 碼可能是二獎以上
  });

  it('末 3 碼對中增開六獎 → 200 元確定，不會再升級', () => {
    const hit = checkInvoice('951', W)!;
    expect(hit).toMatchObject({ level: 'addSixth', amount: 200, confirmed: true });
    expect(hit.upgradable).toBe(false);
  });

  it('末 3 碼只對中特別獎末 3 → 未確定（特別獎要全 8 碼），confirmed false', () => {
    const hit = checkInvoice('041', W)!;
    expect(hit.confirmed).toBe(false);
    expect(hit.level).toBe('special');
  });

  it('末 3 碼什麼都沒對中 → null（可以確定沒中，不用再輸入）', () => {
    expect(checkInvoice('000', W)).toBeNull();
  });

  it('末 5 碼對中頭獎末 5 → 四獎確定、可能再升級', () => {
    expect(checkInvoice('77046', W)).toMatchObject({ level: 'fourth', amount: 4_000, confirmed: true, upgradable: true });
    expect(checkInvoice('62513', W)).toMatchObject({ level: 'fourth', amount: 4_000, confirmed: true });
  });

  it('少於 3 碼或含非數字 → null（無效輸入）', () => {
    expect(checkInvoice('04', W)).toBeNull();
    expect(checkInvoice('abc46', W)).toBeNull();
    expect(checkInvoice('', W)).toBeNull();
  });
});

describe('PRIZE_AMOUNT', () => {
  it('獎金表符合財政部公告', () => {
    expect(PRIZE_AMOUNT.special).toBe(10_000_000);
    expect(PRIZE_AMOUNT.grand).toBe(2_000_000);
    expect(PRIZE_AMOUNT.first).toBe(200_000);
    expect(PRIZE_AMOUNT.sixth).toBe(200);
    expect(PRIZE_AMOUNT.addSixth).toBe(200);
  });
});

import { describe, it, expect } from 'vitest';
import { base64Encode, base64Decode, urlEncode, urlDecode, htmlEscape, htmlUnescape } from '../encode';

describe('base64 (UTF-8 安全)', () => {
  it('round-trips ASCII', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=');
    expect(base64Decode('aGVsbG8=')).toBe('hello');
  });

  it('round-trips 中文與 emoji', () => {
    const s = '公路車🚴最棒';
    expect(base64Decode(base64Encode(s))).toBe(s);
  });

  it('decode throws on invalid input', () => {
    expect(() => base64Decode('not base64!!!')).toThrow();
  });

  it('empty string round-trips', () => {
    expect(base64Encode('')).toBe('');
    expect(base64Decode('')).toBe('');
  });
});

describe('url encode/decode', () => {
  it('encodes reserved and non-ASCII characters', () => {
    expect(urlEncode('a b&c=d')).toBe('a%20b%26c%3Dd');
    expect(urlDecode(urlEncode('武嶺 100%'))).toBe('武嶺 100%');
  });

  it('decode throws on malformed percent sequence', () => {
    expect(() => urlDecode('%E4%B')).toThrow();
  });
});

describe('html escape/unescape', () => {
  it('escapes the five specials', () => {
    expect(htmlEscape(`<a href="x">it's & more</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;it&#39;s &amp; more&lt;/a&gt;');
  });

  it('unescape round-trips and handles numeric entities', () => {
    const s = `<b>"魚" & 'chips'</b>`;
    expect(htmlUnescape(htmlEscape(s))).toBe(s);
    expect(htmlUnescape('&#20844;&#x8def;')).toBe('公路');
  });
});

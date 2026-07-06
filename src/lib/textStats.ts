// 字數統計：中文（CJK）以「字」計、英文以「詞」計，兩者分開統計與估時。

export interface TextStats {
  chars: number;
  charsNoSpace: number;
  cjkChars: number;
  latinWords: number;
  lines: number;
  paragraphs: number;
  readingMinutes: number;
}

const CJK_RE = /[一-鿿㐀-䶿豈-﫿]/g;
const LATIN_WORD_RE = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;

const ZH_CHARS_PER_MIN = 350;
const EN_WORDS_PER_MIN = 220;

export function textStats(text: string): TextStats {
  if (!text) {
    return { chars: 0, charsNoSpace: 0, cjkChars: 0, latinWords: 0, lines: 0, paragraphs: 0, readingMinutes: 0 };
  }
  const cjkChars = (text.match(CJK_RE) ?? []).length;
  const latinWords = (text.match(LATIN_WORD_RE) ?? []).length;
  const lines = text.split('\n').filter((l) => l.trim().length > 0).length;
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0).length;
  return {
    chars: [...text].length,
    charsNoSpace: [...text.replace(/\s/g, '')].length,
    cjkChars,
    latinWords,
    lines,
    paragraphs,
    readingMinutes: cjkChars / ZH_CHARS_PER_MIN + latinWords / EN_WORDS_PER_MIN,
  };
}

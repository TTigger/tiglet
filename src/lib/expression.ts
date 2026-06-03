type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' };

export function tokenize(input: string): Token[] {
  const s = input.replace(/\s+/g, '');
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) { num += s[i]; i++; }
      if ((num.match(/\./g) ?? []).length > 1) throw new Error('無效的數字');
      tokens.push({ type: 'num', value: parseFloat(num) });
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') { tokens.push({ type: 'op', value: c }); i++; continue; }
    if (c === '(' || c === ')') { tokens.push({ type: 'paren', value: c }); i++; continue; }
    throw new Error(`無效的字元：${c}`);
  }
  return tokens;
}

export function evaluate(input: string): number {
  const tokens = tokenize(input);
  if (tokens.length === 0) throw new Error('沒有輸入算式');
  let pos = 0;
  const peek = () => tokens[pos];

  function parseExpression(): number {
    let value = parseTerm();
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = tokens[pos++].value;
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }
  function parseTerm(): number {
    let value = parseFactor();
    while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = tokens[pos++].value;
      const rhs = parseFactor();
      if (op === '/' && rhs === 0) throw new Error('除以零');
      value = op === '*' ? value * rhs : value / rhs;
    }
    return value;
  }
  function parseFactor(): number {
    const t = peek();
    if (!t) throw new Error('非預期的結尾');
    if (t.type === 'op' && t.value === '-') { pos++; return -parseFactor(); }
    if (t.type === 'op' && t.value === '+') { pos++; return parseFactor(); }
    if (t.type === 'paren' && t.value === '(') {
      pos++;
      const v = parseExpression();
      if (!peek() || peek().type !== 'paren' || (peek() as any).value !== ')') throw new Error('缺少右括號');
      pos++;
      return v;
    }
    if (t.type === 'num') { pos++; return t.value; }
    throw new Error('語法錯誤');
  }

  const result = parseExpression();
  if (pos < tokens.length) throw new Error('語法錯誤');
  if (!Number.isFinite(result)) throw new Error('結果無效');
  return result;
}

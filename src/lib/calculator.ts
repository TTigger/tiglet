export type Operator = '+' | '-' | '*' | '/';

export function compute(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      if (b === 0) throw new Error('除以零');
      return a / b;
  }
}

export function formatResult(n: number): string {
  if (!Number.isFinite(n)) return '錯誤';
  return String(parseFloat(n.toPrecision(12)));
}

export interface CalcState {
  current: string;
  previous: number | null;
  operator: Operator | null;
  overwrite: boolean;
  error: boolean;
}

export const initialCalc: CalcState = {
  current: '0', previous: null, operator: null, overwrite: true, error: false,
};

export type CalcAction =
  | { type: 'digit'; digit: string }
  | { type: 'dot' }
  | { type: 'op'; operator: Operator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'backspace' }
  | { type: 'negate' };

export function reducer(state: CalcState, action: CalcAction): CalcState {
  if (state.error && action.type !== 'clear') return state;

  switch (action.type) {
    case 'clear':
      return initialCalc;

    case 'digit': {
      if (state.overwrite) return { ...state, current: action.digit, overwrite: false };
      if (state.current === '0') return { ...state, current: action.digit };
      return { ...state, current: state.current + action.digit };
    }

    case 'dot': {
      if (state.overwrite) return { ...state, current: '0.', overwrite: false };
      if (state.current.includes('.')) return state;
      return { ...state, current: state.current + '.' };
    }

    case 'negate':
      return { ...state, current: formatResult(parseFloat(state.current) * -1) };

    case 'backspace': {
      if (state.overwrite) return state;
      const next = state.current.slice(0, -1);
      return { ...state, current: next === '' || next === '-' ? '0' : next };
    }

    case 'op': {
      const curr = parseFloat(state.current);
      if (state.operator !== null && !state.overwrite && state.previous !== null) {
        try {
          const result = compute(state.previous, curr, state.operator);
          return { current: formatResult(result), previous: result, operator: action.operator, overwrite: true, error: false };
        } catch {
          return { ...initialCalc, current: '錯誤', error: true };
        }
      }
      return { ...state, previous: curr, operator: action.operator, overwrite: true };
    }

    case 'equals': {
      if (state.operator === null || state.previous === null) return state;
      try {
        const result = compute(state.previous, parseFloat(state.current), state.operator);
        return { current: formatResult(result), previous: null, operator: null, overwrite: true, error: false };
      } catch {
        return { ...initialCalc, current: '錯誤', error: true };
      }
    }
  }
}

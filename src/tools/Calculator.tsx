import { useReducer, useEffect } from 'react';
import { reducer, initialCalc, type Operator } from '../lib/calculator';
import CopyButton from '../components/CopyButton';

export default function Calculator() {
  const [state, dispatch] = useReducer(reducer, initialCalc);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (/[0-9]/.test(k)) dispatch({ type: 'digit', digit: k });
      else if (k === '.') dispatch({ type: 'dot' });
      else if (['+', '-', '*', '/'].includes(k)) dispatch({ type: 'op', operator: k as Operator });
      else if (k === 'Enter' || k === '=') dispatch({ type: 'equals' });
      else if (k === 'Backspace') dispatch({ type: 'backspace' });
      else if (k === 'Escape') dispatch({ type: 'clear' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const btn = 'rounded-lg border border-edge bg-surface py-4 text-lg text-ink transition-colors hover:border-accent/40';
  const op = 'rounded-lg border border-edge bg-surface py-4 text-lg text-accent transition-colors hover:bg-accent hover:text-white';

  return (
    <div className="mx-auto max-w-xs">
      <div className="relative mb-4 rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-right font-mono text-3xl tabular-nums text-ink overflow-x-auto">
        <div className="absolute left-3 top-3"><CopyButton value={state.current} /></div>
        {state.current}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button className={op} onClick={() => dispatch({ type: 'clear' })}>C</button>
        <button className={op} onClick={() => dispatch({ type: 'negate' })}>±</button>
        <button className={op} onClick={() => dispatch({ type: 'backspace' })}>⌫</button>
        <button className={op} onClick={() => dispatch({ type: 'op', operator: '/' })}>÷</button>

        {['7', '8', '9'].map((d) => <button key={d} className={btn} onClick={() => dispatch({ type: 'digit', digit: d })}>{d}</button>)}
        <button className={op} onClick={() => dispatch({ type: 'op', operator: '*' })}>×</button>

        {['4', '5', '6'].map((d) => <button key={d} className={btn} onClick={() => dispatch({ type: 'digit', digit: d })}>{d}</button>)}
        <button className={op} onClick={() => dispatch({ type: 'op', operator: '-' })}>−</button>

        {['1', '2', '3'].map((d) => <button key={d} className={btn} onClick={() => dispatch({ type: 'digit', digit: d })}>{d}</button>)}
        <button className={op} onClick={() => dispatch({ type: 'op', operator: '+' })}>+</button>

        <button className={`${btn} col-span-2`} onClick={() => dispatch({ type: 'digit', digit: '0' })}>0</button>
        <button className={btn} onClick={() => dispatch({ type: 'dot' })}>.</button>
        <button className={op} onClick={() => dispatch({ type: 'equals' })}>=</button>
      </div>
    </div>
  );
}

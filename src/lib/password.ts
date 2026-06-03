export interface PasswordOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
}

// Ambiguous characters (I, l, O, 0, 1) excluded for readability.
const SETS = {
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lower: 'abcdefghijkmnpqrstuvwxyz',
  digits: '23456789',
  symbols: '!@#$%^&*-_=+',
};

export function generatePassword(opts: PasswordOptions, rng: () => number = Math.random): string {
  const pool = [
    opts.upper ? SETS.upper : '',
    opts.lower ? SETS.lower : '',
    opts.digits ? SETS.digits : '',
    opts.symbols ? SETS.symbols : '',
  ].join('');
  if (pool === '' || opts.length <= 0) return '';
  let out = '';
  for (let i = 0; i < opts.length; i++) {
    out += pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  }
  return out;
}

export function estimateStrength(opts: PasswordOptions): 'weak' | 'medium' | 'strong' {
  const sets = [opts.upper, opts.lower, opts.digits, opts.symbols].filter(Boolean).length;
  if (sets === 0 || opts.length < 8) return 'weak';
  const score = opts.length * sets;
  if (score >= 56) return 'strong';
  if (score >= 32) return 'medium';
  return 'weak';
}

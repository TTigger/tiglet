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

// Cryptographically secure float in [0, 1). Falls back to Math.random only
// where the Web Crypto API is unavailable (e.g. very old environments).
function secureRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  }
  return Math.random();
}

export function generatePassword(opts: PasswordOptions, rng: () => number = secureRandom): string {
  const pool = [
    opts.upper ? SETS.upper : '',
    opts.lower ? SETS.lower : '',
    opts.digits ? SETS.digits : '',
    opts.symbols ? SETS.symbols : '',
  ].join('');
  if (pool === '' || opts.length <= 0) return '';
  let out = '';
  for (let i = 0; i < opts.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    out += pool[idx < pool.length ? idx : pool.length - 1];
  }
  return out;
}

/** Normalized strength for UI meters: 0 (nothing selected) … 1 (max). */
export function strengthScore(opts: PasswordOptions): number {
  const sets = [opts.upper, opts.lower, opts.digits, opts.symbols].filter(Boolean).length;
  if (sets === 0 || opts.length <= 0) return 0;
  return Math.max(0, Math.min(1, (opts.length * sets) / 72));
}

export function estimateStrength(opts: PasswordOptions): 'weak' | 'medium' | 'strong' {
  const sets = [opts.upper, opts.lower, opts.digits, opts.symbols].filter(Boolean).length;
  if (sets === 0 || opts.length < 8) return 'weak';
  const score = opts.length * sets;
  if (score >= 56) return 'strong';
  if (score >= 32) return 'medium';
  return 'weak';
}

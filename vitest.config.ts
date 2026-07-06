import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // The default fork pool crashes workers on Windows, silently dropping
    // whole test files; threads runs the full suite reliably.
    pool: 'threads',
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
});

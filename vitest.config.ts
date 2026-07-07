import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // The default fork pool intermittently crashed workers on Windows,
    // silently dropping whole test files from the run; threads has been
    // reliable (and faster) here.
    pool: 'threads',
    // 本機限制平行度以免記憶體吃緊時 OOM；CI 用預設
    maxWorkers: process.env.CI ? undefined : 2,
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'apps/warlord-crafting-suite/__tests__/',
        '**/dist/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@grudge/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@grudge/database': path.resolve(__dirname, '../../packages/database/src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});

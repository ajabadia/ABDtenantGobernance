import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test-setup.ts'],
    server: {
      deps: {
        inline: [/@abd\/satellite-sdk/, /next/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'scripts/**',
        '**/*.test.ts{,x}',
        'vitest.config.ts',
        'next.config.mjs',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/server': path.resolve(__dirname, 'node_modules/next/server.js'),
      'next/headers': path.resolve(__dirname, 'node_modules/next/headers.js'),
    },
  },
});

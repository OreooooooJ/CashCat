import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.ts'],
    environment: 'node',
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}); 
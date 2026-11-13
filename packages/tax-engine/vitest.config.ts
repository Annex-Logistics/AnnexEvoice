import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/calculator.ts', 'src/money.ts', 'src/rules.ts'],
      thresholds: {
        branches: 70,
        lines: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});

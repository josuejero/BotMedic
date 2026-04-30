import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/**/*.ts',
        '../../packages/commands/src/**/*.ts',
        '../../packages/rules/src/**/*.ts'
      ],
      exclude: [
        'tests/**',
        'scripts/**',
        '**/*.d.ts'
      ],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: '../../metrics/raw/coverage'
    }
  }
});

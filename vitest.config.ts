import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // describe/it/before*/after* as globals, so test files need no runner imports.
    globals: true,
    include: ['test/**/*Test.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-results/vitest/results.xml'
    },
    // The Redis-backed suites spawn a real redis-server and wait on reconnection.
    testTimeout: 30000,
    hookTimeout: 30000,
    // CacheFlow keeps global static configuration and two suites bind real Redis
    // ports, so test files run one at a time as they did under mocha.
    fileParallelism: false,
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      reportsDirectory: './coverage',
      reporter: [
        'text',
        'text-summary',
        'html',
        'lcov',
        // Written as coverage/coverage.json, which is what the Codecov step uploads.
        ['json', { file: 'coverage.json' }]
      ],
      thresholds: {
        statements: 85,
        branches: 74,
        functions: 94,
        lines: 85
      }
    }
  }
});

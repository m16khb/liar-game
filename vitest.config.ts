// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'tests/**'
      ]
    }
  }
});

// effective.config.ts — the constitution for @oftomorrow/zod-form.
//
// This library has a small surface area: a renderer + a few field components
// + a schema parser + an optional Firebase adapter. We declare two roles —
// `library-code` for the library implementation and `library-tests` for the
// vitest suite — and tell `effective` how to run our toolchain. The rest
// inherits from the `recommended` preset.

import { defineConfig, seeds } from '@oftomorrow/effective';

export default defineConfig({
  extends: ['recommended'],

  toolchain: {
    lint: 'pnpm lint',
    typecheck: 'pnpm typecheck',
    test: 'pnpm test',
    coverage: 'pnpm test:coverage',
  },

  roles: {
    'library-code': {
      defaultEditable: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
      expectations: { existingTestsPass: true },
    },
    'library-tests': {
      defaultEditable: ['src/**/*.test.{ts,tsx}', 'tests/**/*'],
      expectations: { existingTestsPass: true },
    },
  },

  // Downgrade rules we'll retrofit incrementally rather than ship the refit on.
  override: {
    'mocks-must-be-type-bound': {
      severity: 'LOW',
      rationale:
        "New mocks should still type-bind per the rule's intent. The existing test suite was ported in a single refit pass alongside Zod 4 + shadcn vendoring; threading `vi.fn<typeof realFn>()` through every Firebase SDK mock adds noise where the SDK types themselves are loose. Will retrofit in a follow-up PR.",
    },
  },

  exceptions: {
    ...seeds.builtInExceptions,
  },

  protected: [
    {
      path: 'effective.config.ts',
      rationale: 'The constitution itself. Workers must not edit the rules they are held to.',
    },
    {
      path: 'eslint.config.js',
      rationale: 'ESLint config controls lint behavior; editing it changes what `verify` enforces.',
    },
    {
      path: 'tsconfig.json',
      rationale: 'TypeScript config controls type-check strictness.',
    },
    {
      path: 'vitest.config.ts',
      rationale: 'Vitest config controls what `tests-pass` means.',
    },
    {
      path: '.prettierrc',
      rationale: 'Prettier config controls formatting; editing it shifts what passes format-check.',
    },
    {
      path: '.husky/**',
      rationale: 'Pre-commit hooks enforce policy before code lands.',
    },
    {
      path: 'package.json',
      rationale:
        'Scripts and dependency declarations are constitutional; editing them changes what tools run.',
    },
    {
      path: '.github/workflows/**',
      rationale:
        'CI workflows control what gates run on every PR and push. Editing them silently changes what "passes CI" means.',
    },
    {
      path: 'rollup.config.js',
      rationale: 'Bundler config controls what ships in the published artifact.',
    },
  ],

  meta: {
    name: '@oftomorrow/zod-form',
    version: '1.0.0',
  },
});

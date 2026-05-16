# Changelog

## 1.0.1 — dual ESM + CJS output

- **Dual-format publish.** The package now ships both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) bundles for every entry point, matching the `@oftomorrow/effective` and `@oftomorrow/human-agent-chat` packaging conventions. Node 20 consumers using `require('@oftomorrow/zod-form')` and Vite/Next consumers using `import { ZodForm } from '@oftomorrow/zod-form'` both work without bundler shims.
- **Nested exports conditions.** `package.json` exports use `import` and `require` blocks per entry with `types` declared inside each — ensuring `require()`-style consumers resolve to `dist/index.d.cts` (CJS-flavored declarations) and `import`-style consumers resolve to `dist/index.d.ts`. Same shape for the `/firebase` entry.
- **Bundler swap: rollup → tsup.** `tsup.config.ts` mirrors effective's config shape, adapted to `platform: 'browser'` with React, Radix, firebase, and the other UI deps externalized. Drops `@rollup/plugin-*` and `rollup-plugin-postcss` from devDependencies. CSS is now built by a tiny `scripts/build-css.mjs` (postcss + tailwind) so tsup doesn't need to own a CSS pipeline.
- **No more `__styles-noop.js` artifact.** The previous rollup config emitted a stub JS file alongside the CSS extract; tsup + the standalone CSS script removes the need for the cleanup hack.

## 1.0.0 — first public release

This is the inaugural public release. The package was previously developed under the working name `zod-form-react` and is now shipped as `@oftomorrow/zod-form` on npm.

### Architecture

- **Two clean entry points.** `import { ZodForm } from '@oftomorrow/zod-form'` for the storage-free core; `import { … } from '@oftomorrow/zod-form/firebase'` for the optional Firestore + Firebase Storage adapter. Firebase imports never reach a consumer who only uses the core entry.
- **Vendored shadcn/ui primitives.** Input, Select, Switch, Checkbox, RadioGroup, Textarea, Button, Label, Form helpers, and a FileUpload/StarRating built on Radix + lucide-react. Field components compose these rather than rolling their own.
- **CSS as a separate import.** Tailwind preflight and shadcn CSS variables ship as `dist/styles.css`. Import once if you want our defaults; skip it if you've already wired shadcn into your app and let Tailwind pick up our classes via `content`.

### Breaking changes from the pre-public 0.x

- **Package name.** `zod-form-react` → `@oftomorrow/zod-form` (React stays in the description).
- **Zod 3 → Zod 4.** Schema-parser walks `_zod.def` and `_zod.def.checks` instead of Zod 3's `_def.checks`. `ZodEffects` is replaced by `ZodPipe`. Error shape is `error.issues` (Zod 4 dropped the `.errors` alias). All inference rules (email/url/uuid detection, range slider thresholds, textarea promotion at min length ≥ 100, radio vs. select threshold at ≤ 4 enum members) ported over.
- **`firebase-admin` removed.** The server SDK had no business in a browser form library; the previous `GeoPoint`/`ServerTimestamp` field types now use only the client Firebase SDK shapes.
- **Firebase moved to optional peer.** No longer a runtime dependency.
- **`SimpleZodForm` removed.** Was a near-duplicate of `ZodForm` with no users; the inference rules merged into the single canonical renderer.
- **Side-effect CSS import dropped.** `src/index.ts` no longer imports `globals.css` automatically — consumers explicitly `import '@oftomorrow/zod-form/styles.css'`.

### Toolchain

- **pnpm + Vitest + ESLint flat config + Prettier.** Matches the `@oftomorrow/core` stack.
- **`@oftomorrow/effective` 0.1.0-rc.6** wired up: `effective.config.ts` at the repo root declares roles (`library-code`, `library-tests`); husky pre-commit runs `effective audit --fix`; CI runs `effective verify --against <base>` on PRs.
- **Coverage thresholds** enforced per-path: `≥80% lines / 75% branches` on `src/{components, hooks, utils}/**`, `≥60% lines / 50% branches` on `src/firebase/**`. (The `components.functions` threshold is intentionally looser at 60% to account for V8 counting every inline JSX arrow function — lines/branches remain the load-bearing metrics for JSX-heavy renderers; see [`vitest.config.ts`](./vitest.config.ts).)
- **GitHub Actions CI**: `pnpm install --frozen-lockfile` → `format:check` → `lint` → `typecheck` → `test:coverage` → `build` → `effective verify` (PR only).

### Known follow-ups

- **`mocks-must-be-type-bound`** (Effective rule) is overridden to severity LOW for the existing test suite. New tests should still type-bind every `vi.fn()` — see the rationale in `effective.config.ts`.
- **Supabase adapter** scaffolded at `src/supabase/` with a README pointing at the Firebase adapter as the reference shape. Filled in during Core 2.0 Phase 4 once the HITL row contract is locked.

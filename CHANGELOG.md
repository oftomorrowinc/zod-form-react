# Changelog

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

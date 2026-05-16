# Refit Plan — zod-form-react

You're working on a one-shot pass to bring this library to open-source-ready state. The library is Todd's prior art (built ~2024) that he wants to ship as `@oftomorrow/zod-form` on npm alongside `@oftomorrow/effective`. (Package name drops the `-react` suffix — it's a React component library, mention that in the `description` field, not the name. The repo directory name `zod-form-react` stays as-is for now.) It will become the first consumer's HITL form renderer in Core 2.0.

This doc is your full brief. Read it, execute it, ship. The acceptance criteria at the bottom is what "done" means — when you can check every box, you're ready to publish.

## Current state (what you'll find on disk)

- `src/` contains the library code
- `src/firebase/` is the Firestore-coupled extras (`FirebaseZodForm`, `useFirestoreForm`, `DocumentReferenceField`, `ServerTimestampField`, `GeoPointField`, `FirebaseStorageField`)
- `src/components/ZodForm.tsx` is the base storage-free renderer
- `src/components/ui/*` are the field components + primitives
- `src/utils/schema-parser.ts` maps Zod types to field types
- `src/index.ts` currently re-exports EVERYTHING including the Firebase variants
- `package.json` lists `firebase` and `firebase-admin` as runtime `dependencies` (not peer/optional)
- README is thorough but advertises Firebase-first
- Tests exist for `firebase/fields.test.tsx`, `firebase/hooks.test.ts`, `utils/schema-parser.test.ts` — the base `ZodForm` + most field components are untested
- TypeScript pinned to recent-ish; Zod is on `^3.22.4` (we need Zod 4)

The base renderer is genuinely reusable. The package as published is not. Your job is to fix the packaging without breaking the renderer.

## Architectural target

Two clean shapes consumers can pull in:

```ts
// Storage-free core. No Firebase imports anywhere in the bundle path.
import { ZodForm, type ZodFormProps } from '@oftomorrow/zod-form';

// Firebase extras. Optional peer-deps required.
import { FirebaseZodForm, useFirestoreForm } from '@oftomorrow/zod-form/firebase';
```

A third entry point — `@oftomorrow/zod-form/supabase` — is OPTIONAL for this refit. If straightforward to add a parallel adapter, do it; if it requires meaningful per-field work, leave a stub directory with a README pointing at the Firebase implementation as the reference shape, and a TODO for Core's Phase 4 work to fill in.

## Concrete change list

### 1. Split the entry points

In `package.json`, add `exports`:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./firebase": {
      "import": "./dist/firebase/index.js",
      "types": "./dist/firebase/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  }
}
```

In `src/index.ts`, remove `export * from './firebase'`. Create `src/firebase/index.ts` that re-exports the Firebase-specific public API.

Adjust rollup config (or whatever bundler you're using) to produce both entry points.

### 2. Move Firebase to optional peer deps

In `package.json`:

```json
{
  "dependencies": {
    // No firebase, no firebase-admin
  },
  "peerDependencies": {
    "firebase": ">=10",
    "react": ">=18",
    "react-dom": ">=18",
    "zod": ">=4"
  },
  "peerDependenciesMeta": {
    "firebase": { "optional": true }
  },
  "devDependencies": {
    // Keep firebase here for testing/dev
    "firebase": "^11.x"
    // firebase-admin should NOT be here — see step 3
  }
}
```

### 3. Remove `firebase-admin` entirely

`firebase-admin` is a Node-only server SDK. It has no business in a browser form library. Search the repo:

```bash
rg "firebase-admin"
```

For every match: figure out what server-side thing it was doing (probably the GeoPointField type or some serialization helper) and replace with the equivalent shape from the client `firebase` package. If a feature genuinely requires the admin SDK (very unlikely), drop the feature and note it in CHANGELOG.

### 4. Stop side-effect-importing styles

`src/index.ts` currently imports `globals.css` as a side effect. This bundles Tailwind preflight into every consumer, which collides with their own Tailwind setup.

Move the CSS to `dist/styles.css` as a separate file (the bundler should handle this). Update README's "Getting started" to tell consumers:

```ts
import '@oftomorrow/zod-form/styles.css';
```

If they don't want our styles (they're providing their own), they don't import this file.

### 5. Zod 3 → Zod 4 migration

The breaking changes that matter:

- `schema.shape` → `schema.shape` (still works in Zod 4 if you're using `z.object`)
- `schema._def` internal access — Zod 4 reshuffled internals; `schema-parser.ts` likely peeks at `_def` to determine field type. Read [Zod 4 migration guide](https://zod.dev/migration) and update.
- `ZodEnum` → still works but check the API
- `z.array()` → still works
- `z.date()` → still works
- Error shape (`error.issues`) → check for path changes

Run the existing tests after migration. If they pass, you're probably good. If schema-parser breaks (likely), fix it by re-walking the parsed schema using Zod 4's internal API.

### 6. Bump other deps

- TypeScript → `^5.x`
- React types → `@types/react ^19.x` (or matching what Core uses; check `~/Github/core/package.json`)
- `react-hook-form` → latest `^7.x` (still actively maintained, no major breaking changes since 7.48)
- `@hookform/resolvers` → latest compatible with Zod 4
- ESLint config — if it's still on flat config from 1 year ago, upgrade to current `eslint.config.js` patterns
- Drop `jest.config.js` if using Vitest, or vice versa — pick one and modernize

### 7. Add missing tests

`ZodForm.tsx`, `ArrayField.tsx`, `ObjectField.tsx`, and the field components (Text, Number, Boolean, Select, Date, FileUpload) all need unit tests. The bar is "renders correctly for each field type the schema-parser maps to + onSubmit fires with the right values + validation errors render."

Use React Testing Library + Vitest (matches Core's stack — switch from Jest if the repo is still on it).

Beyond per-component unit tests, add at least one integration-style test that wires a non-trivial Zod schema (~5 mixed field types, one nested object, one array) end-to-end through render → user fills inputs → clicks submit → onSubmit fires with the parsed object OR validation errors render for the bad fields. This is the test that proves the whole composition works, not just each component in isolation.

Coverage threshold IS part of the metric this time — see step 10. The renderer + schema-parser + field components carry ≥80% lines/functions, ≥75% branches.

### 8. README rewrite

Restructure around:

1. **What it does** — Zod schema in, fully-rendered form out
2. **Quick start** — install + the simplest possible form example
3. **Field types** — table of Zod input → rendered field, with the inference rules (email sniffing, slider thresholds, etc.)
4. **Storage adapters** — section explaining the storage-free core is the default, Firebase extras are a separate import. Add a "Roll your own adapter" stub that shows the shape (we don't ship a Supabase adapter yet, but document the contract).
5. **Customization** — how to override field components, CSS variables, conditional rendering with `showWhen`
6. **API reference** — exported components + types

Drop the "Firebase-first" framing throughout. The new framing is "schema-driven forms with pluggable storage."

Update the repo URL placeholder (currently `git+https://github.com/yourusername/...`) to the real URL once we know it.

### 9. Add `@oftomorrow/zod-form` scope to package.json

```json
{
  "name": "@oftomorrow/zod-form",
  "version": "1.0.0",
  "description": "Zod-schema-driven form renderer for React with pluggable storage adapters (Firebase, Supabase, BYO).",
  "publishConfig": { "access": "public" }
}
```

Bump to `1.0.0` since this is the first public release. Note the package name drops the `-react` suffix — keep "React" in the description, not the name.

### 10. Code quality stack — `@oftomorrow/effective` + prettier + coverage

Match the stack Core uses (it's the production validator for this whole library family). All four pieces:

**Effective audit (pre-commit).** Install `@oftomorrow/effective` (current version `0.1.0-rc.5` — check npm for the latest at refit time). Add a minimal `effective.config.ts` at repo root declaring this library's two roles (something like `library-code` + `library-tests`). Wire husky pre-commit to run `pnpm exec effective audit --fix` — fixes auto-fixable issues, surfaces real findings, blocks the commit on hard-fails.

**Effective verify (CI).** GitHub Actions workflow runs `pnpm exec effective verify --against ${{ github.base_ref }}` on every PR. This is the diff-only verification path — fires the seven diff-only rules + toolchain-included rules (lint/typecheck/test/coverage results threaded in via `toolchainResults`). The acceptance criteria treats this as the green/red gate.

**Prettier.** Add `.prettierrc` (single quotes, semi: true, printWidth: 100, trailingComma: 'all' — match Effective + Core conventions). Add `pnpm format` (writes) + `pnpm format:check` (CI). Wire to husky pre-commit to auto-format staged files (`lint-staged` is the standard combo). Prettier and ESLint don't fight if you use `eslint-config-prettier` to disable ESLint rules that overlap with Prettier formatting.

**Coverage threshold.** Vitest with `--coverage` (uses v8 by default). Target ≥80% lines, ≥80% functions, ≥75% branches on the core renderer + schema-parser + field components. Firebase adapters can be lower (~60%) since they're optional code paths. Threshold enforcement via `vitest.config.ts` `coverage.thresholds`. CI runs `pnpm test --coverage` and fails if thresholds aren't met.

### 11. CI workflow

Single GitHub Actions workflow on PR + push to main. Job steps:

1. `pnpm install --frozen-lockfile`
2. `pnpm format:check`
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm test --coverage`
6. `pnpm build`
7. `pnpm exec effective verify --against ${{ github.base_ref }}` (PR only; on push to main, skip — verify is for diffs)

If `pnpm` isn't already the package manager, switch to it (matches Core's stack). Use `actions/setup-node@v4` + `pnpm/action-setup@v3`. Cache the pnpm store.

## Acceptance criteria

You're done when ALL of these are true:

- [ ] `pnpm install` from a fresh checkout completes without `firebase-admin` in the lockfile
- [ ] A consumer can `pnpm add @oftomorrow/zod-form` and import `{ ZodForm }` with zero Firebase code in their bundle
- [ ] A consumer can `pnpm add @oftomorrow/zod-form firebase` and import from `@oftomorrow/zod-form/firebase` to get the Firestore variants
- [ ] `pnpm format:check` clean, `pnpm lint` clean, `pnpm typecheck` clean, `pnpm test --coverage` all green AND meets thresholds (≥80% lines/functions, ≥75% branches on the core renderer + schema-parser + field components)
- [ ] `pnpm build` produces a dist with two entry points and no top-level side-effect imports
- [ ] Tests exist for `ZodForm`, `ArrayField`, `ObjectField`, and each base field type (unit) PLUS at least one integration-style test wiring a multi-field Zod schema end-to-end through render → fill → submit → validation-error flow
- [ ] `@oftomorrow/effective` installed; `effective.config.ts` declares the library's roles; husky pre-commit runs `effective audit --fix`; CI runs `effective verify --against <base>` and the PR gate passes
- [ ] README rewritten around the pluggable-storage shape
- [ ] Zod 4 compatible (schema-parser handles Zod 4 types)
- [ ] No imports of `firebase-admin` anywhere
- [ ] Package name is `@oftomorrow/zod-form` (description mentions React), version `1.0.0`
- [ ] ShadCN primitives vendored into `src/components/ui/` via the ShadCN CLI; field components compose them rather than rolling their own input/select/etc.
- [ ] `dist/styles.css` bundles Tailwind preflight + standard ShadCN CSS variables; README documents the consumer's Tailwind `content` requirement

When done, run `pnpm publish --dry-run` and verify the package contents look right (small bundle, two entry points, only the right files in `files`). DON'T actually publish — Todd will do the npm publish step manually.

## Questions you might have

**Q: What if Zod 4 migration breaks the schema-parser badly?**
Take the time to fix it. The whole point of this library is Zod-schema-driven; an out-of-date Zod is not an option. If you genuinely can't make Zod 4 work, leave a clearly-marked TODO + stay on Zod 3 — but really try first.

**Q: Should I also write the Supabase adapter?**
Optional but appreciated. Look at `src/firebase/useFirestoreForm.ts` as the reference shape. A Supabase version would: load a row, render the form, on submit upsert the row. If you have time and it's clean, ship it. If not, scaffold the `src/supabase/` directory with a `// TODO` and a README pointing at the contract.

**Q: What about backwards compatibility for existing consumers of v0.x?**
There are none. The package was never published. This is the v1.0.0 first release.

**Q: Tailwind config — what version, what conventions?**
Tailwind v4 if it's clean in a Vite library build (pnpm + library mode + Tailwind v4 was still rough as of late 2025 — check first); v3 if v4 has issues. Match what Core's `apps/web` uses if you can check (`~/Github/core/apps/web`).

**Q: shadcn/ui — vendor it, or skip?**
**Vendor it.** Run `pnpm dlx shadcn@latest init` to bootstrap the standard ShadCN folder structure inside `src/components/ui/`, then `pnpm dlx shadcn@latest add input select switch calendar form button card label` (and any others field components need). The CLI drops the source files into your `src/components/ui/` — you own them, edit freely. The field components in this library should COMPOSE these ShadCN primitives rather than rolling their own input/select/etc.

What goes in `dependencies` (standard ShadCN companions):

- `class-variance-authority` — variant-based styling
- `clsx` + `tailwind-merge` — className composition (the `cn()` util)
- `lucide-react` — icons (already a dep in this repo, just confirm the version)
- `@radix-ui/*` primitives — ShadCN's interactive components wrap Radix (the CLI installs the right ones per component added)

React + react-dom stay as `peerDependencies`.

Ship a `dist/styles.css` that bundles Tailwind preflight + the standard ShadCN CSS variables (`--background`, `--foreground`, `--primary`, the dark-mode overrides, etc.) so consumers without an existing ShadCN setup can `import '@oftomorrow/zod-form/styles.css'` and get the look out of the box. Consumers who already have ShadCN configured can skip the styles import and the library's Tailwind classes will pick up their existing variables.

Document the Tailwind `content` requirement in the README — consumers need `content: ['./node_modules/@oftomorrow/zod-form/dist/**/*.{js,mjs}']` (or equivalent) so Tailwind picks up classes used inside the library.

**Q: What if I find bugs in the existing renderer logic?**
Fix them and note them in CHANGELOG. The repo has no users yet (was never published), so we don't have a backwards-compat surface to preserve.

## When you finish

Report back to Todd with: PR link (or direct push to main if simpler), test counts before/after, bundle size before/after, and any TODOs you punted on. He'll do the final review + `pnpm publish` step.

If you hit something genuinely unclear that's not covered above, you can punt with a clear TODO in the code + a note in the report — but try to resolve in-context first. The Core team has full substrate context if you need a sanity check on what the HITL form contract should look like; the contract from the Core side is simple:

- HITL task's `parameters.form` is a Zod schema (likely serialized as JSON to ship through `entities.attributes`; deserialized on the client side)
- `task.output_schemas[i].key` lists the keys the form submission must populate
- onSubmit handler calls `db.upsertJobDataKeys(jobId, companyId, formValues)` — Core's @core/db handles the actual write
- That's it. Don't try to integrate with the Core runner directly; the form library doesn't need to know about jobs or attempts or any of that.

Good luck — go ship.

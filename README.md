# @oftomorrow/zod-form

Schema-driven React form renderer powered by Zod 4, React Hook Form, and shadcn/ui primitives. Pass a Zod schema in, get a fully-rendered form out. Storage adapters (Firebase today, BYO tomorrow) live behind optional entry points so the core bundle stays small.

```ts
import { ZodForm } from '@oftomorrow/zod-form';
import '@oftomorrow/zod-form/styles.css'; // optional; bundles preflight + tokens
import { z } from 'zod';

const Contact = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(20),
});

export function ContactForm() {
  return <ZodForm schema={Contact} onSubmit={(data) => console.log(data)} />;
}
```

## What it does

- **Schema in, form out.** `ZodForm` walks a `z.object` schema and maps each field to an appropriate input (text, email, number slider, select, checkbox, file, stars, nested object, dynamic array…).
- **Type-safe end-to-end.** The `onSubmit` handler receives `z.infer<typeof schema>`; React Hook Form drives form state; `@hookform/resolvers/zod` runs validation.
- **Styled with shadcn/ui.** Inputs, selects, switches, etc. are vendored shadcn primitives (built on Radix). Look-and-feel matches any shadcn-styled app out of the box; theme via CSS variables or override per field.
- **Pluggable storage.** Storage-free by default. Opt into Firestore + Firebase Storage via the `/firebase` entry point. Other adapters (Supabase, your-API) follow the same shape — see [Storage adapters](#storage-adapters) below.

## Install

```bash
pnpm add @oftomorrow/zod-form react react-dom zod react-hook-form
```

React, react-dom, and zod are peer dependencies. Firebase is an **optional** peer; install it only if you use the `/firebase` entry point.

### Tailwind setup

The library ships pre-styled with shadcn-compatible classes. There are two ways to wire it up:

**Option A — import our styles.css** (fastest):

```ts
import '@oftomorrow/zod-form/styles.css';
```

This bundles Tailwind preflight and the default shadcn CSS variables (`--background`, `--foreground`, `--primary`, etc., plus dark-mode overrides). Drop it once at the app root.

**Option B — use your own Tailwind setup** (recommended if you already have shadcn configured): skip the styles import and add our `dist` files to your Tailwind `content` so it picks up our classes:

```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{ts,tsx}', './node_modules/@oftomorrow/zod-form/dist/**/*.js'],
  // …
};
```

Your existing CSS variables flow through automatically.

## Field-type inference

`ZodForm` walks the schema and infers a field type. Override any field via `fieldOptions`.

| Zod input                                   | Rendered field                        | Notes                                   |
| ------------------------------------------- | ------------------------------------- | --------------------------------------- |
| `z.string()`                                | text input                            | default                                 |
| `z.string().email()`                        | email input                           | format detection                        |
| `z.string().url()`                          | url input                             | format detection                        |
| `z.string().min(100)`                       | textarea                              | min-length ≥ 100 promotes to multi-line |
| `z.string().uuid()`                         | text input with pattern               | pattern set on the input                |
| `z.number()`                                | number input                          |                                         |
| `z.number().min(a).max(b)` where `b-a ≤ 10` | range slider                          | bounded ranges become sliders           |
| `z.number().int()`                          | number input with `step=1`            |                                         |
| `z.boolean()`                               | checkbox                              | override to `switch` via `fieldOptions` |
| `z.date()`                                  | date input                            | renders native `<input type=date>`      |
| `z.enum([…])` ≤ 4 options                   | radio group                           |                                         |
| `z.enum([…])` > 4 options                   | select                                |                                         |
| `z.array(z.string())`                       | dynamic array with add/remove         | min/max items respected                 |
| `z.object({…})`                             | nested fieldset                       | recurses one level by default           |
| `z.string().optional()`                     | underlying type, no required asterisk | wrappers unwrap                         |
| `z.string().default('x')`                   | underlying type, seeded with default  |                                         |

## Customization

### Per-field overrides

```tsx
<ZodForm
  schema={schema}
  onSubmit={…}
  fieldOptions={{
    rating: { type: 'stars', maxStars: 5 },
    subscribe: { type: 'switch' },
    avatar: { type: 'file', accept: 'image/*', maxSize: 2 * 1024 * 1024 },
    notes: { type: 'textarea', rows: 6, description: 'Internal only' },
  }}
/>
```

The `FieldConfig` type covers labels, descriptions, placeholders, validation hints, conditional-render rules (`showWhen`), classNames, and more — see [`src/types/index.ts`](./src/types/index.ts).

### Conditional rendering

```tsx
fieldOptions={{
  shippingAddress: {
    showWhen: { field: 'sameAsBilling', operator: 'equals', value: false },
  },
}}
```

Supported operators: `equals`, `not-equals`, `contains`, `greater-than`, `less-than`.

### Theming

Set `theme="dark"` to wrap the form in a `dark` class. Style variables come from the shadcn CSS variable set; override `--primary`, `--background`, etc., to retheme.

### Composing primitives directly

The shadcn primitives are exported individually if you want to build a custom layout:

```tsx
import { Input, Label, Select, FormField, FormControl } from '@oftomorrow/zod-form';
```

The full surface lives in [`src/components/ui/index.ts`](./src/components/ui/index.ts).

## Storage adapters

The core renderer is storage-free — `onSubmit` is just a callback. Adapters live behind dedicated entry points so unused ones never reach the bundle.

### Firebase

```bash
pnpm add @oftomorrow/zod-form firebase
```

```tsx
import { FirebaseZodForm } from '@oftomorrow/zod-form/firebase';
import { firestore } from './firebase'; // your initialized SDK

<FirebaseZodForm
  schema={userSchema}
  firestore={firestore}
  collection="users"
  documentId={uid}
  autoSave
/>;
```

The adapter handles loading, optimistic re-render via `onSnapshot`, auto-save with debounce, and metadata stamping (`createdAt`/`updatedBy`). See [`src/firebase/`](./src/firebase/) for the full surface.

### Roll your own adapter

An adapter is a thin layer that:

1. Loads (or seeds) a default value object.
2. Renders `<ZodForm schema={…} defaultValues={…} onSubmit={save} />`.
3. Translates `onSubmit(data)` into a persistence call.

Skeleton:

```tsx
function MyAdapter<T extends z.ZodType>({ schema, load, save }: AdapterProps<T>) {
  const [defaults, setDefaults] = useState<z.infer<T> | null>(null);
  useEffect(() => {
    load().then(setDefaults);
  }, [load]);
  if (!defaults) return <div>Loading…</div>;
  return <ZodForm schema={schema} defaultValues={defaults} onSubmit={save} />;
}
```

A Supabase adapter is scaffolded at `src/supabase/` and ready for someone to fill in — the shape mirrors Firebase: load a row, render the form, on submit upsert the row.

## API reference

### `<ZodForm>` — primary export

| Prop               | Type                                                           | Default              | Notes                                                               |
| ------------------ | -------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| `schema`           | `z.ZodTypeAny`                                                 | required             | The Zod object schema to render                                     |
| `onSubmit`         | `(data: z.infer<T>) => void \| Promise<void>`                  | required             | Called when submission validates                                    |
| `onError`          | `(errors) => void`                                             | —                    | Called when validation fails                                        |
| `onChange`         | `(values) => void`                                             | —                    | Called on every form-state mutation                                 |
| `defaultValues`    | `Partial<z.infer<T>>`                                          | inferred from schema | Overrides schema-derived defaults                                   |
| `fieldOptions`     | `Record<string, FieldConfig>`                                  | `{}`                 | Per-field overrides (type, label, validation hints, showWhen, etc.) |
| `mode`             | `'onChange' \| 'onBlur' \| 'onSubmit' \| 'onTouched' \| 'all'` | `'onChange'`         | RHF validation mode                                                 |
| `theme`            | `'dark' \| 'light' \| 'auto'`                                  | `'light'`            | Adds the `dark` class wrapper when set to `dark`                    |
| `layout`           | `'vertical' \| 'horizontal' \| 'grid'`                         | `'vertical'`         | Grid-layout helper                                                  |
| `submitButtonText` | `string`                                                       | `'Submit'`           |                                                                     |
| `showResetButton`  | `boolean`                                                      | `false`              |                                                                     |
| `disabled`         | `boolean`                                                      | `false`              | Disables every input                                                |
| `className`        | `string`                                                       | —                    | Form-level class                                                    |
| `children`         | `ReactNode`                                                    | —                    | Rendered between fields and the submit button                       |

### Hooks

| Hook                   | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `useZodForm`           | Underlying RHF hook with Zod resolver, schema parsing, computed defaults |
| `useConditionalFields` | Resolve `showWhen` rules into a visibility map                           |
| `useArrayField`        | Append/remove/move helpers for `z.array(…)` fields                       |

### Utilities

| Export                             | Purpose                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `parseSchema(schema)`              | Walk a Zod object and return per-field analysis                           |
| `analyzeSchema(schema)`            | Higher-level summary (complexity, hasArrays, hasObjects, hasConditionals) |
| `generateDefaultValues(schema)`    | Compute type-appropriate defaults                                         |
| `validateWithSchema(schema, data)` | Adapter over `schema.safeParse` returning flat errors                     |
| `mapZodTypeToFieldType(zodType)`   | The inference rule that drives the renderer                               |
| `extractValidationRules(zodType)`  | Pull out min/max/format constraints for inspection                        |
| `cn(...)`                          | Tailwind class merger (clsx + tailwind-merge)                             |

## Development

```bash
pnpm install
pnpm test:coverage   # vitest + v8 coverage
pnpm lint
pnpm typecheck
pnpm build           # rollup → dist/{index.js,firebase/index.js,styles.css}
pnpm exec effective audit   # constitutional checks
```

## License

MIT — see [LICENSE](./LICENSE).

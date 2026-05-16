# Supabase adapter — stub

This directory is reserved for a Supabase storage adapter that mirrors the
shape of [`../firebase/`](../firebase/). It is intentionally empty in v1.0.0;
the renderer is storage-free, so callers can write their own adapter today.

## Shape to implement

The Firebase adapter is the reference:

- `useFirestoreForm` → `useSupabaseRowForm` (or similar): load one row by PK,
  hydrate `react-hook-form`, optionally subscribe for live updates, expose
  `save` that upserts the row.
- `FirebaseZodForm` → `SupabaseZodForm`: thin wrapper that renders
  `<ZodForm>` against the hook's defaults and pipes `onSubmit` to `save`.

```ts
// proposed signature
useSupabaseRowForm({
  schema,
  client: SupabaseClient,
  table: string,
  primaryKey?: { column: string; value: string },
  autoSave?: boolean,
  onSuccess?: (row) => void,
})
```

## Why deferred

Supabase row shapes are application-specific (RLS, generated columns, RPC
fallbacks for insert vs. update). Shipping a generic adapter risks baking in
the wrong defaults for Core 2.0's actual usage. This will land in the Phase 4
work referenced in `~/Github/core` once the row contract for HITL form
submissions is locked in.

For now, consumers should write a thin adapter in their own codebase using
the shape above; the storage-free `<ZodForm>` is the only required surface.

# MirrorGame Schema Alignment Plan

## Context Overview

The root MirrorGame codebase is the implementation source of truth under `src/app/components/mirror/`. A comparison against the Figma reference version surfaced schema, Supabase, export, scoring, and style differences. The current plan aligns root with Figma's multi-select research fields while retaining selected root-only fields for backward compatibility.

## Current Plan Summary

- Adopt Figma-style multi-select fields for `whyFavorite` and `whyNotWear`.
- Add `whyFavoriteOther` and `whyNotWearOther` end to end.
- Retain root-only `useChanged` and `brand` as raw research fields.
- Keep Supabase storage as `text`; serialize arrays as semicolon-delimited strings.
- Add numeric Set C cost input as primary, with existing cost bands retained as fallback.
- Keep landing title wrapping behavior from root, not Figma, to avoid mobile clipping.
- Defer navigation re-centralization to a separate UX refactor.

## Task 1: Schema Alignment

### `src/app/components/mirror/types.ts`

- Change `SetBResponse.whyFavorite?: string` to `whyFavorite?: string[]`.
- Add `SetBResponse.whyFavoriteOther?: string`.
- Keep `SetBResponse.useChanged?: string`.
- Keep `SetBResponse.brand?: string`.
- Change cost fields to `string | number` where needed.
- Change `SetCResponse.whyNotWear: string` to `whyNotWear: string[]`.
- Add `SetCResponse.whyNotWearOther?: string`.

Risk: High, affects research data compatibility.

Migration: Add `why_favorite_other text` and `why_not_wear_other text`.

### `src/app/components/mirror/questions/SetBQuestion.tsx`

- Replace free-text `whyFavorite` question with multi-select options:
  - `comfortable`
  - `easy-to-style`
  - `confident`
  - `personal-emotional`
  - `other`
- Save `other` text into `whyFavoriteOther`.
- Retain `useChanged` question.
- Retain `brand` question.

Risk: High, changes Set B response shape.

### `src/app/components/mirror/questions/SetCQuestion.tsx`

- Convert `whyNotWear` from single-select to multi-select.
- Add `other` text capture into `whyNotWearOther`.

Risk: High, changes Set C response shape.

### `src/app/components/mirror/schema-decisions.md`

Document:

- Figma multi-select adoption.
- Root-only retained fields: `useChanged`, `brand`.
- Text serialization for arrays.
- Numeric Set C cost with banded fallback.

## Task 2: Supabase and Export Alignment

### Column Decision Table

| Column | Root maps? | Figma maps? | Action |
|---|---:|---:|---|
| `why_favorite` | Yes, string | Yes, array serialized | Change root to array serialized with `; ` |
| `why_favorite_other` | No | Yes | Add |
| `use_changed` | Yes | No | Retain root-only |
| `brand` | Yes | No | Retain root-only |
| `why_not_wear` | Yes, string | Yes, array serialized | Change root to array serialized with `; ` |
| `why_not_wear_other` | No | Yes | Add |
| `cost` | Yes | Yes | Keep as `text`; stringify numeric values |

### `src/app/components/mirror/lib/export.ts`

- Update `csvQuote` to accept arrays.
- Serialize arrays with `; `.
- Add CSV headers:
  - `Why Favorite Other`
  - `Why Not Wear Other`
- Preserve:
  - `Use Changed`
  - `Brand`

Risk: High, changes CSV schema.

### `src/app/components/mirror/lib/supabase.ts`

- Add payload fields:
  - `why_favorite_other`
  - `why_not_wear_other`
- Keep:
  - `use_changed`
  - `brand`
- Serialize array fields to semicolon-delimited text.
- Keep `cost` as stringified text.
- Prefer replacing positional row indexes with named row objects to reduce silent corruption risk.

Risk: High, affects database writes.

### `utils/supabase/create_table.sql`

- Add:
  - `why_favorite_other text`
  - `why_not_wear_other text`

Migration required for deployed Supabase.

## Task 3: Scoring Update

### `src/app/components/mirror/lib/scoring.ts`

- Update `whyFavorite` scoring to handle arrays.
- Recommended scoring:
  - If at least one non-skipped `whyFavorite` value exists, add emotional `+14` once.
- Update `whyNotWear` scoring to handle arrays:
  - Social: `out-of-style`, `dont-like-anymore`
  - Emotional: `waiting-occasion`, `forgot`
  - Functional: `doesnt-fit`, `damaged-worn-out`
- Preserve `useChanged` scoring:
  - `yes` -> functional `+8`
  - `no` -> inflow/outflow `+4`
- Keep `brand` unscored.

Risk: Medium, affects persona outcomes.

## Task 4: Numeric Cost Input

### `src/app/components/mirror/questions/SetCQuestion.tsx`

- Add numeric cost input as primary.
- Preserve existing cost bands as fallback:
  - `free`
  - `1-20`
  - `21-50`
  - `51-100`
  - `100+`

### `types.ts`

- Allow `cost: string | number`.

### `export.ts` and `supabase.ts`

- Stringify numeric cost before export/submission.

Risk: Medium, cost data consistency.

Migration: None; Supabase `cost` remains `text`.

## Task 5: Style Alignment

### `src/app/styles/wardrobe-mirror.css`

- Keep root behavior: do not restore `white-space: nowrap`.
- Reason: avoids mobile title clipping.

### `src/styles/index.css`

- Add `@import './fonts.css';` only if `src/styles/fonts.css` is adopted from Figma.

### `QuestionRunner.tsx`

- Do not re-centralize navigation in this pass.
- Keep current per-question continue behavior.
- Defer navigation architecture refactor.

Risk: Low.

## Verification Plan

- Run `pnpm typecheck`.
- Run `pnpm build`.
- Smoke test full survey flow:
  - Set B multi-select `whyFavorite`.
  - Set B `whyFavoriteOther`.
  - Set B retained `useChanged`.
  - Set B retained `brand`.
  - Set C numeric cost.
  - Set C banded fallback cost.
  - Set C multi-select `whyNotWear`.
  - Set C `whyNotWearOther`.
- Verify CSV:
  - Arrays serialize as `value1; value2`.
  - Commas in free text remain quoted.
  - New headers are present.
- Verify Supabase:
  - Three rows inserted.
  - New `*_other` columns populated.
  - Retained root-only fields still populated.

## Open Review Questions

- Confirm retaining `useChanged` and `brand` is acceptable for research analysis.
- Confirm semicolon-delimited text is preferred over PostgreSQL array or JSON columns.
- Confirm `whyFavorite` should score once per answered question, not once per selected reason.
- Confirm navigation re-centralization should remain out of scope for this pass.

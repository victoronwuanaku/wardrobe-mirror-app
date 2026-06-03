# Wardrobe Mirror Bug-Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the correctness, data-integrity, and trust bugs found in the repo analysis (2026-06-02) without changing the design system or removing intentionally-removed fields.

**Architecture:** Most fixes are surgical edits to existing files. The one structural change is extracting the Supabase row builder into a pure, testable function guarded by a single schema-contract test (the cheapest defense against the critical insert-column mismatch). A minimal Vitest harness is added for that one test.

**Tech Stack:** Vite 6 + React 18 + TypeScript 5, `@supabase/supabase-js`, Vitest (new, dev-only), pnpm.

---

## Decisions locked (from planning Q&A)

| Topic | Decision |
|---|---|
| Consent/GDPR gate | **Deferred** to a separate plan (needs researcher-authored legal copy). Not in scope here. |
| "Finish Now" early exit | **Keep**, add a confirmation + write a `completion_status` (`complete`/`partial`) marker into the data. |
| Radar + Baseline Comparison honesty | **Paused** — decision pending. Documented in "Deferred / open decisions" below. No code in this plan. |
| Testing | **Minimal Vitest**: one schema-contract test only. No scoring/UI test suite this round. |

## Scope

In scope: critical schema mismatch, double-tap skip, stale "Other" companions, dead/orphaned code, sentinel + icon + copy fixes, partial-completion tagging, log hygiene.

Out of scope (see end of doc): radar/comparison redesign, consent gate, abuse-control/rate-limiting, scoring-methodology review, bundle-size splitting.

## File map

| File | Change |
|---|---|
| `package.json` | Add `vitest` dev dep + `test` scripts |
| `vitest.config.ts` | **Create** — minimal test config |
| `tests/smoke.test.ts` | **Create** — confirms runner works |
| `tests/schema-contract.test.ts` | **Create** — asserts insert keys == DB columns; CSV header width == row width |
| `src/app/components/mirror/lib/schema.ts` | **Create** — `DB_COLUMNS` single source of truth |
| `src/app/components/mirror/lib/supabase.ts` | Extract pure `buildSupabaseRows`, add `completion_status` + `how_long_had_years`, route Set C retention, gate logs |
| `src/app/components/mirror/lib/export.ts` | Add `completion_status` + `how_long_had_years` columns to CSV |
| `utils/supabase/create_table.sql` | Add missing columns; mark legacy ones |
| `utils/supabase/migrations/2026-06-02-align-columns.sql` | **Create** — idempotent live migration |
| `src/app/components/mirror/MirrorGame.tsx` | Timer-ref auto-advance, multi-select companion clearing, back-nav reseed, finish confirm, header comment |
| `src/app/components/mirror/questions/SetBQuestion.tsx` | Remove dead `case 10`; strip non-digits from cost input |
| `src/app/components/mirror/questions/SetAQuestion.tsx` | Strip non-digits from cost input |
| `src/app/components/mirror/questions/SetCQuestion.tsx` | Strip non-digits from cost + years inputs |
| `src/app/components/mirror/constants/garments.ts` | Fix `skipped` sentinel |
| `src/app/components/mirror/screens/BaselineScreen.tsx` | Remove dead `isTextInput` branch |
| `src/app/components/mirror/lib/scoring.ts` | Align Memory Keeper icon |
| `src/app/components/mirror/screens/WelcomeScreen.tsx` | Copy: "up to 3 garments" |
| `CLAUDE.md` | Correct schema + drift claims |

---

## Task 1: Minimal Vitest harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Add Vitest as a dev dependency**

Run: `pnpm add -D vitest`
Expected: `vitest` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Add test scripts**

In `package.json`, change the `scripts` block to:

```json
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 3: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create a smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `pnpm test`
Expected: PASS — 1 test file, 1 test passing.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts tests/smoke.test.ts
git commit -m "test: add minimal vitest harness"
```

---

## Task 2: CRITICAL — align Supabase payload with the DB schema (+ contract test)

**Why:** `supabase.ts` inserts `why_favorite_other` / `why_not_wear_other`, which are absent from `create_table.sql` and the documented schema. If the live table matches the docs, **every insert fails and no participant data is saved.** This task makes the app payload a single source of truth, locks it with a test, and ships the SQL to bring any deployment into line. Also threads `completion_status` (used by Task 9).

**Files:**
- Create: `src/app/components/mirror/lib/schema.ts`
- Create: `tests/schema-contract.test.ts`
- Modify: `src/app/components/mirror/lib/supabase.ts`
- Modify: `src/app/components/mirror/lib/export.ts`
- Modify: `utils/supabase/create_table.sql`
- Create: `utils/supabase/migrations/2026-06-02-align-columns.sql`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Create the canonical column list**

Create `src/app/components/mirror/lib/schema.ts`:

```ts
// Single source of truth for the columns the app writes to wardrobe_responses.
// The schema-contract test asserts buildSupabaseRows() emits EXACTLY these keys.
// Keep in sync with utils/supabase/create_table.sql.
export const DB_COLUMNS = [
  'session_id',
  'completed_at',
  'wardrobe_size',
  'shopping_frequency',
  'disposal_habit',
  'primary_driver',
  'persona',
  'social_value',
  'emotional_value',
  'functional_value',
  'inflow_outflow_value',
  'set_type',
  'garment_type',
  'consent_given',
  'consent_timestamp',
  'completion_status',
  'how_got',
  'cost',
  'wear_frequency',
  'main_use',
  'main_use_other',
  'why_bought',
  'why_bought_other',
  'how_long_had',
  'why_favorite',
  'why_favorite_other',
  'wash_frequency',
  'repaired',
  'why_not_wear',
  'why_not_wear_other',
  'disposal_plan',
  'how_long_had_years',
] as const;

export type DbColumn = (typeof DB_COLUMNS)[number];
```

- [ ] **Step 2: Write the failing contract test**

Create `tests/schema-contract.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildSupabaseRows } from '../src/app/components/mirror/lib/supabase';
import { DB_COLUMNS } from '../src/app/components/mirror/lib/schema';
import { generateCSVString } from '../src/app/components/mirror/lib/export';
import type { GameData } from '../src/app/components/mirror/types';

const fixture: GameData = {
  sessionId: 'sess-1',
  timestamp: '2026-06-02T10:00:00.000Z',
  setsCompleted: 3,
  baselineResponses: {
    wardrobeSize: 'moderate',
    shoppingFrequency: 'occasionally',
    disposalHabit: 'periodically',
    primaryDriver: 'function',
  },
  values: { social: 40, emotional: 55, functional: 70, inflowOutflow: 45 },
  persona: 'The Functional Minimalist',
  responses: [
    { setType: 'A', garmentType: 't-shirt', howGot: 'bought-new', cost: '20', wearFrequency: 'once-a-week', mainUse: ['work'], whyBought: 'replace-similar', timestamp: '2026-06-02T10:00:00.000Z' },
    { setType: 'B', garmentType: 'jacket-coat', howGot: 'gift', cost: '100', howLongHad: '3-4-years', wearFrequency: 'once-a-month', mainUse: ['leisure'], whyFavorite: ['comfortable'], washFrequency: 'few-times', repaired: 'no', timestamp: '2026-06-02T10:01:00.000Z' },
    { setType: 'C', garmentType: 'jeans-trousers', howLongHad: '5', cost: '60', howGot: 'bought-new', whyNotWear: ['doesnt-fit'], disposalPlan: 'donate-charity', timestamp: '2026-06-02T10:02:00.000Z' },
  ],
};

describe('supabase row schema contract', () => {
  it('every inserted row uses exactly the declared DB columns', () => {
    const rows = buildSupabaseRows(fixture);
    expect(rows).toHaveLength(3);
    const expected = [...DB_COLUMNS].sort();
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual(expected);
    }
  });

  it('marks partial sessions', () => {
    const partial = buildSupabaseRows({ ...fixture, responses: fixture.responses.slice(0, 1) });
    expect(partial[0].completion_status).toBe('partial');
    expect(buildSupabaseRows(fixture)[0].completion_status).toBe('complete');
  });

  it('routes Set C retention to how_long_had_years, Set B to how_long_had', () => {
    const rows = buildSupabaseRows(fixture);
    const setB = rows.find((r) => r.set_type === 'B')!;
    const setC = rows.find((r) => r.set_type === 'C')!;
    expect(setB.how_long_had).toBe('3-4-years');
    expect(setB.how_long_had_years).toBe('');
    expect(setC.how_long_had).toBe('');
    expect(setC.how_long_had_years).toBe('5');
  });
});

describe('CSV export width', () => {
  it('header count equals every data row count', () => {
    const lines = generateCSVString(fixture).split('\n');
    const headerCount = lines[0].split(',').length;
    for (const line of lines.slice(1)) {
      expect(line.split(',').length).toBe(headerCount);
    }
  });
});
```

- [ ] **Step 3: Run the test to confirm it fails**

Run: `pnpm test schema-contract`
Expected: FAIL — `buildSupabaseRows` is not exported yet (import error), and `completion_status` is absent.

- [ ] **Step 4: Refactor `supabase.ts` to expose a pure row builder + add `completion_status` + gate logs**

Replace the entire contents of `src/app/components/mirror/lib/supabase.ts` with:

```ts
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, publishableKey } from '../../../../../utils/supabase/info';
import type { GameData, SetResponse, SubmissionResult } from '../types';

// Pure: build the rows the app inserts. Kept separate from network code so the
// schema-contract test can assert the emitted keys match the DB columns.
export function buildSupabaseRows(data: GameData): Record<string, unknown>[] {
  const completionStatus = data.responses.length >= 3 ? 'complete' : 'partial';
  return data.responses.map((r: SetResponse) => {
    const base = {
      session_id:           data.sessionId,
      completed_at:         r.timestamp,
      wardrobe_size:        data.baselineResponses?.wardrobeSize || '',
      shopping_frequency:   data.baselineResponses?.shoppingFrequency || '',
      disposal_habit:       data.baselineResponses?.disposalHabit || '',
      primary_driver:       data.baselineResponses?.primaryDriver || '',
      persona:              data.persona || '',
      social_value:         data.values?.social ?? null,
      emotional_value:      data.values?.emotional ?? null,
      functional_value:     data.values?.functional ?? null,
      inflow_outflow_value: data.values?.inflowOutflow ?? null,
      set_type:             r.setType,
      garment_type:         r.garmentType || '',
      consent_given:        null,
      consent_timestamp:    null,
      completion_status:    completionStatus,
    };

    if (r.setType === 'A') {
      return {
        ...base,
        how_got: r.howGot || '', cost: r.cost || '', wear_frequency: r.wearFrequency || '',
        main_use: Array.isArray(r.mainUse) ? r.mainUse.join('; ') : r.mainUse || '',
        main_use_other: r.mainUseOther || '',
        why_bought: r.whyBought || '', why_bought_other: r.whyBoughtOther || '',
        how_long_had: '',
        why_favorite: '', why_favorite_other: '',
        wash_frequency: '', repaired: '',
        why_not_wear: '', why_not_wear_other: '', disposal_plan: '',
        how_long_had_years: '',
      };
    } else if (r.setType === 'B') {
      return {
        ...base,
        how_got: r.howGot || '', cost: r.cost || '', wear_frequency: r.wearFrequency || '',
        main_use: Array.isArray(r.mainUse) ? r.mainUse.join('; ') : r.mainUse || '',
        main_use_other: r.mainUseOther || '',
        why_bought: '', why_bought_other: '',
        how_long_had: r.howLongHad || '',
        why_favorite: Array.isArray(r.whyFavorite) ? r.whyFavorite.join('; ') : r.whyFavorite || '',
        why_favorite_other: r.whyFavoriteOther || '',
        wash_frequency: r.washFrequency || '', repaired: r.repaired || '',
        why_not_wear: '', why_not_wear_other: '', disposal_plan: '',
        how_long_had_years: '',
      };
    } else {
      return {
        ...base,
        how_got: r.howGot || '', cost: r.cost || '',
        wear_frequency: '', main_use: '', main_use_other: '',
        why_bought: '', why_bought_other: '',
        how_long_had: '',
        why_favorite: '', why_favorite_other: '',
        wash_frequency: '', repaired: '',
        why_not_wear: Array.isArray(r.whyNotWear) ? r.whyNotWear.join('; ') : '',
        why_not_wear_other: r.whyNotWearOther || '',
        disposal_plan: r.disposalPlan || '',
        how_long_had_years: r.howLongHad || '',
      };
    }
  });
}

export async function submitToSupabase(data: GameData): Promise<SubmissionResult> {
  if (import.meta.env.DEV) console.log('submitToSupabase called for session', data.sessionId);
  try {
    const supabase = createClient(supabaseUrl, publishableKey);
    const rows = buildSupabaseRows(data);

    const doInsert = async () => {
      const { error } = await supabase.from('wardrobe_responses').insert(rows);
      if (error) throw error;
    };

    try {
      await doInsert();
    } catch {
      // Retry once after 3 s to handle transient network issues
      await new Promise((r) => setTimeout(r, 3000));
      await doInsert();
    }

    if (import.meta.env.DEV) console.log('Data submitted to Supabase:', rows.length, 'rows added');
    return { ok: true };
  } catch (error: any) {
    // Postgres duplicate-key (23505): a retry hit rows already persisted — treat as success
    if (error?.code === '23505' || (typeof error?.message === 'string' && error.message.includes('duplicate key'))) {
      if (import.meta.env.DEV) console.log('Duplicate key on retry — already persisted, treating as success');
      return { ok: true };
    }
    const errorMessage =
      error?.message ||
      error?.error_description ||
      (typeof error === 'string' ? error : 'Unknown error');
    console.error('Supabase submission failed after retry:', error);
    return { ok: false, error: errorMessage };
  }
}
```

- [ ] **Step 5: Add `completion_status` to the CSV export**

In `src/app/components/mirror/lib/export.ts`, in `buildResponseRow`, change the `base` array so it includes completion status right after `persona`. Replace:

```ts
    data.persona || '',
    data.values?.social ?? '',
```

with:

```ts
    data.persona || '',
    data.responses.length >= 3 ? 'complete' : 'partial',
    data.values?.social ?? '',
```

Then in `generateCSVString`, update the `headers` array to insert `'Completion Status'` after `'Persona'`. Replace:

```ts
    'Persona', 'Social Value', 'Emotional Value', 'Functional Value', 'Inflow/Outflow Value',
```

with:

```ts
    'Persona', 'Completion Status', 'Social Value', 'Emotional Value', 'Functional Value', 'Inflow/Outflow Value',
```

Then append the Set C years column at the END of the CSV so positions don't shift. In `generateCSVString`, replace the last header line:

```ts
    'Wash Frequency', 'Repaired', 'Why Not Wear', 'Why Not Wear Other', 'Disposal Plan'
```

with:

```ts
    'Wash Frequency', 'Repaired', 'Why Not Wear', 'Why Not Wear Other', 'Disposal Plan', 'How Long Had (Years)'
```

In `buildResponseRow`, append the value to each set's row and empty Set C's old `how_long_had` cell. For **Set A**, replace:

```ts
      '', '', ''                                 // whyNotWear, whyNotWearOther, disposalPlan
    ];
  } else if (r.setType === 'B') {
```

with:

```ts
      '', '', '',                                // whyNotWear, whyNotWearOther, disposalPlan
      ''                                         // howLongHadYears (Set A: none)
    ];
  } else if (r.setType === 'B') {
```

For **Set B**, replace:

```ts
      '', '', ''                                 // whyNotWear, whyNotWearOther, disposalPlan
    ];
  } else {
```

with:

```ts
      '', '', '',                                // whyNotWear, whyNotWearOther, disposalPlan
      ''                                         // howLongHadYears (Set B: none)
    ];
  } else {
```

For **Set C**, the old `how_long_had` cell becomes empty and the number moves to the new last column. Replace:

```ts
      r.howGot || '', r.cost || '',
      '', '', '', '', '',                        // wearFrequency, mainUse, mainUseOther, whyBought, whyBoughtOther
      r.howLongHad || '',
      '', '',                                    // whyFavorite, whyFavoriteOther
      '', '',                                    // washFrequency, repaired
      Array.isArray(r.whyNotWear) ? r.whyNotWear.join('; ') : '',
      r.whyNotWearOther || '',
      r.disposalPlan || ''
    ];
```

with:

```ts
      r.howGot || '', r.cost || '',
      '', '', '', '', '',                        // wearFrequency, mainUse, mainUseOther, whyBought, whyBoughtOther
      '',                                        // howLongHad (Set C now uses howLongHadYears)
      '', '',                                    // whyFavorite, whyFavoriteOther
      '', '',                                    // washFrequency, repaired
      Array.isArray(r.whyNotWear) ? r.whyNotWear.join('; ') : '',
      r.whyNotWearOther || '',
      r.disposalPlan || '',
      r.howLongHad || ''                         // howLongHadYears
    ];
```

- [ ] **Step 6: Run the contract test to verify it passes**

Run: `pnpm test schema-contract`
Expected: PASS — all 3 specs green.

- [ ] **Step 7: Run typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 8: Rewrite `create_table.sql` to match the app payload**

Replace the `ALTER TABLE wardrobe_responses ADD COLUMN ...` block in `utils/supabase/create_table.sql` (lines 11–41) with:

```sql
ALTER TABLE wardrobe_responses
  ADD COLUMN session_id           text,
  ADD COLUMN completed_at         timestamptz,
  ADD COLUMN wardrobe_size        text,
  ADD COLUMN shopping_frequency   text,
  ADD COLUMN disposal_habit       text,
  ADD COLUMN primary_driver       text,
  ADD COLUMN persona              text,
  ADD COLUMN social_value         int2,
  ADD COLUMN emotional_value      int2,
  ADD COLUMN functional_value     int2,
  ADD COLUMN inflow_outflow_value int2,
  ADD COLUMN set_type             text,
  ADD COLUMN garment_type         text,
  ADD COLUMN consent_given        boolean,
  ADD COLUMN consent_timestamp    timestamptz,
  ADD COLUMN completion_status    text,
  ADD COLUMN how_got              text,
  ADD COLUMN cost                 text,
  ADD COLUMN wear_frequency       text,
  ADD COLUMN main_use             text,
  ADD COLUMN main_use_other       text,
  ADD COLUMN why_bought           text,
  ADD COLUMN why_bought_other     text,
  ADD COLUMN how_long_had         text,
  ADD COLUMN why_favorite         text,
  ADD COLUMN why_favorite_other   text,
  ADD COLUMN wash_frequency       text,
  ADD COLUMN repaired             text,
  ADD COLUMN why_not_wear         text,
  ADD COLUMN why_not_wear_other   text,
  ADD COLUMN disposal_plan        text,
  ADD COLUMN how_long_had_years   text;

-- LEGACY: collected in earlier versions, no longer written by the app.
-- Left in place so historical rows keep their data. New rows write NULL.
ALTER TABLE wardrobe_responses
  ADD COLUMN use_changed          text,
  ADD COLUMN brand                text;
```

- [ ] **Step 9: Create the idempotent live migration**

Create `utils/supabase/migrations/2026-06-02-align-columns.sql`:

```sql
-- Brings an already-deployed wardrobe_responses table in line with the app payload.
-- Safe to run multiple times.
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS why_favorite_other text;
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS why_not_wear_other text;
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS completion_status  text;
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS how_long_had_years text;

-- Verify the live table has every column the app writes (should return 0 rows):
-- SELECT unnest(ARRAY[
--   'session_id','completed_at','wardrobe_size','shopping_frequency','disposal_habit',
--   'primary_driver','persona','social_value','emotional_value','functional_value',
--   'inflow_outflow_value','set_type','garment_type','consent_given','consent_timestamp',
--   'completion_status','how_got','cost','wear_frequency','main_use','main_use_other',
--   'why_bought','why_bought_other','how_long_had','why_favorite','why_favorite_other',
--   'wash_frequency','repaired','why_not_wear','why_not_wear_other','disposal_plan',
--   'how_long_had_years'
-- ]) AS col
-- EXCEPT
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'wardrobe_responses';
```

- [ ] **Step 10: Apply the migration to the live project and verify**

Run the migration against `tahjilropjzzxolhnhnd` (Supabase SQL Editor, or the Supabase MCP if connected), then run the verification `SELECT ... EXCEPT ...` from Step 9.
Expected: **0 rows returned** (every app column exists in the live table). If any rows return, the table is missing columns the app writes — do not collect data until this is clean.

- [ ] **Step 11: Correct `CLAUDE.md`**

In `CLAUDE.md`, in the deployed-schema SQL block, change the line:

```
  how_long_had text, why_favorite text, use_changed text,
  wash_frequency text, repaired text, brand text, why_not_wear text, disposal_plan text,
```

to:

```
  completion_status text,
  how_long_had text, how_long_had_years text, why_favorite text, why_favorite_other text,
  wash_frequency text, repaired text, why_not_wear text, why_not_wear_other text, disposal_plan text,
  use_changed text, brand text, -- LEGACY: retained for historical rows, never written by the app
```

(`how_long_had` now holds Set B retention buckets only; `how_long_had_years` holds Set C's exact year count — see Task 11.)

Then in the "Captured CSV data" section, replace the bullet that claims Set B `use_changed` and `brand` are "populated" with:

```
- Set B rows: `how_long_had`, `why_favorite` (+ optional `why_favorite_other`), `wash_frequency`, `repaired` populated; A/C-specific columns empty `''`. `use_changed`/`brand` are LEGACY and always NULL (not written by the app).
```

- [ ] **Step 12: Commit**

```bash
git add src/app/components/mirror/lib/schema.ts src/app/components/mirror/lib/supabase.ts src/app/components/mirror/lib/export.ts tests/schema-contract.test.ts utils/supabase/create_table.sql utils/supabase/migrations/2026-06-02-align-columns.sql CLAUDE.md
git commit -m "fix: align supabase payload with DB schema, add completion_status, lock with contract test"
```

---

## Task 3: HIGH — stop rapid taps from skipping questions

**Why:** Single-choice answers schedule `handleContinue` on a bare `setTimeout`; a second tap schedules a second advance that fires after the index already moved, skipping the next question. Same in baseline.

**Files:**
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Import `useRef`**

Change the React import line:

```ts
import React, { useState, useEffect } from 'react';
```

to:

```ts
import React, { useState, useEffect, useRef } from 'react';
```

- [ ] **Step 2: Add a single-timer scheduler**

Immediately after the `const [selectedArchetype, ...]` state declaration (just before `const handleStartGame`), insert:

```ts
  // Single pending auto-advance timer. Clearing before each schedule guarantees
  // only ONE advance fires (the latest), so rapid taps can't skip questions.
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };
  const scheduleAdvance = (fn: () => void, delay: number) => {
    clearAdvanceTimer();
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      fn();
    }, delay);
  };
  useEffect(() => clearAdvanceTimer, []);
```

- [ ] **Step 3: Route `handleAnswer` through the scheduler**

In `handleAnswer`, replace:

```ts
    // Auto-advance for single-choice questions (C3: 800ms gives users time to recognise a misclick before advancing)
    setTimeout(() => {
      handleContinue(updatedResponse);
    }, 800);
```

with:

```ts
    // Auto-advance for single-choice questions (800ms lets users catch a misclick).
    // scheduleAdvance cancels any prior pending advance so double-taps can't skip ahead.
    scheduleAdvance(() => handleContinue(updatedResponse), 800);
```

- [ ] **Step 4: Route `handleSkip` through the scheduler**

In `handleSkip`, replace:

```ts
    setTimeout(() => {
      handleContinue(updatedResponse);
    }, 800);
```

with:

```ts
    scheduleAdvance(() => handleContinue(updatedResponse), 800);
```

- [ ] **Step 5: Route `handleBaselineAnswer` through the scheduler**

In `handleBaselineAnswer`, replace:

```ts
    setTimeout(() => {
      if (baselineQuestionIndex < BASELINE_QUESTIONS.length - 1) {
        setBaselineQuestionIndex(baselineQuestionIndex + 1);
      } else {
        const completed = updated as BaselineResponses;
        setBaselineResponses(completed);
        setCurrentSet('A');
        setGameState('set-intro');
      }
    }, 300);
```

with:

```ts
    scheduleAdvance(() => {
      if (baselineQuestionIndex < BASELINE_QUESTIONS.length - 1) {
        setBaselineQuestionIndex(baselineQuestionIndex + 1);
      } else {
        const completed = updated as BaselineResponses;
        setBaselineResponses(completed);
        setCurrentSet('A');
        setGameState('set-intro');
      }
    }, 300);
```

- [ ] **Step 6: Cancel any pending advance on manual navigation**

At the very top of `handleContinue` (first line of the function body), add:

```ts
    clearAdvanceTimer();
```

And at the very top of `handleBack` (first line of the function body), add:

```ts
    clearAdvanceTimer();
```

- [ ] **Step 7: Verify build + manual check**

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors, build succeeds.

Manual: `pnpm dev`, start a set, and double-tap a single-choice option as fast as possible. Confirm it advances exactly one question (no skip). Repeat on the baseline screen.

- [ ] **Step 8: Commit**

```bash
git add src/app/components/mirror/MirrorGame.tsx
git commit -m "fix: cancel pending auto-advance before rescheduling so double-taps can't skip questions"
```

---

## Task 4: HIGH — clear stale "Other" text and re-seed it on back-nav

**Why:** Deselecting "Other" in a multi-select doesn't clear its companion field, so a previously-typed value (`mainUseOther`/`whyFavoriteOther`/`whyNotWearOther`) can survive into the saved row after the option is gone. Back-navigating to such a question also blanks the input and disables Continue, forcing a retype.

**Files:**
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Add a companion-field map and clear-on-deselect logic**

Replace `handleMultiSelectToggle` with:

```ts
  // Maps each multi-select question to its free-text "Other" companion field.
  const COMPANION_FIELD: Record<string, string> = {
    mainUse: 'mainUseOther',
    whyFavorite: 'whyFavoriteOther',
    whyNotWear: 'whyNotWearOther',
  };

  const handleMultiSelectToggle = (key: string, value: string) => {
    setCurrentResponse((prev) => {
      const arr = ((prev as Record<string, unknown>)[key] as string[]) || [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      const updated: Record<string, unknown> = { ...prev, [key]: next };
      // When 'other' is removed, drop its companion text so a stale value can't survive.
      if (value === 'other' && !next.includes('other')) {
        const companion = COMPANION_FIELD[key];
        if (companion) delete updated[companion];
        setTextInputValue('');
      }
      return updated as Partial<SetResponse>;
    });
  };
```

- [ ] **Step 2: Re-seed the "Other" text when navigating back to a multi-select**

In `handleBack`, replace this block:

```ts
      // Re-seed textInputValue for text-input questions so Continue is enabled on back-nav
      const textFieldKeys: string[] = ['howLongHad', 'cost', 'whyBoughtOther'];
      if (textFieldKeys.includes(previousStep.id)) {
        const saved = (currentResponse as Record<string, unknown>)[previousStep.id] as string | undefined;
        setTextInputValue(saved && saved !== 'skipped' ? saved : '');
      } else {
        setTextInputValue('');
      }
```

with:

```ts
      // Re-seed textInputValue so Continue is enabled on back-nav.
      const textFieldKeys: string[] = ['howLongHad', 'cost', 'whyBoughtOther'];
      const companion = COMPANION_FIELD[previousStep.id];
      if (textFieldKeys.includes(previousStep.id)) {
        const saved = (currentResponse as Record<string, unknown>)[previousStep.id] as string | undefined;
        setTextInputValue(saved && saved !== 'skipped' ? saved : '');
      } else if (companion) {
        // Multi-select "Other": restore the typed companion text if 'other' is still selected.
        const arr = (currentResponse as Record<string, unknown>)[previousStep.id] as string[] | undefined;
        const savedOther = (currentResponse as Record<string, unknown>)[companion] as string | undefined;
        setTextInputValue(
          Array.isArray(arr) && arr.includes('other') && savedOther && savedOther !== 'skipped'
            ? savedOther
            : ''
        );
      } else {
        setTextInputValue('');
      }
```

- [ ] **Step 3: Verify build + manual check**

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors, build succeeds.

Manual: in Set A "What do you use it for?", select **Other**, type "costume", deselect **Other**, Continue, then download CSV from the Data tab → `Main Use Other` must be empty. Then repeat but instead go Back into the question after typing → the field shows "costume" and Continue is enabled.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/mirror/MirrorGame.tsx
git commit -m "fix: clear and re-seed multi-select Other companion text correctly"
```

---

## Task 5: MEDIUM — remove the dead Set B renderer and correct the docs

**Why:** `QUESTION_STEPS.B` has no `renderIndex: 10`, so `SetBQuestion` `case 10` (the "describe your other reason" screen) is unreachable — `whyFavoriteOther` is already captured inline in `case 1`. CLAUDE.md falsely calls the indices "consecutive 0–10".

**Files:**
- Modify: `src/app/components/mirror/questions/SetBQuestion.tsx`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Delete the orphaned `case 10`**

In `src/app/components/mirror/questions/SetBQuestion.tsx`, delete the entire `case 10:` block (from `case 10:` through its closing `);` before the final `}` of the `switch`). The switch should end at `case 9`'s block.

- [ ] **Step 2: Correct CLAUDE.md**

In `CLAUDE.md`, replace:

```
Set B step indices are consecutive 0–10 (no gaps).
```

with:

```
Set B render indices are 0–6, 8, 9 (index 7 is a legacy gap; the former `case 10` other-reason screen was removed — `whyFavoriteOther` is captured inline in the `whyFavorite` question).
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors, build succeeds. (If the `Euro`/unused-import lint surfaces, it does not fail the build — leave unrelated imports as-is.)

- [ ] **Step 4: Commit**

```bash
git add src/app/components/mirror/questions/SetBQuestion.tsx CLAUDE.md
git commit -m "refactor: remove unreachable Set B case 10 and correct step-index docs"
```

---

## Task 6: MEDIUM — fix the garment "skipped" sentinel

**Why:** Skipping a custom garment stores `'skipped'`, but `garments.ts` only special-cases `'other-skipped'`, so the header renders "Skipped 👕" on every following question in that set.

**Files:**
- Modify: `src/app/components/mirror/constants/garments.ts`

- [ ] **Step 1: Treat `'skipped'` as a non-label sentinel in `getGarmentIcon`**

Replace:

```ts
  if (garmentType && garmentType !== 'other' && garmentType !== 'other-skipped') {
```

with:

```ts
  if (garmentType && garmentType !== 'other' && garmentType !== 'other-skipped' && garmentType !== 'skipped') {
```

- [ ] **Step 2: Treat `'skipped'` as a non-label sentinel in `getGarmentLabel`**

Replace:

```ts
  if (garmentType && garmentType !== 'other' && garmentType !== 'other-skipped') {
```

with:

```ts
  if (garmentType && garmentType !== 'other' && garmentType !== 'other-skipped' && garmentType !== 'skipped') {
```

(Both now fall through to the `'Garment'` / `'👕'` defaults when the garment was skipped.)

- [ ] **Step 3: Verify + manual check**

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors.

Manual: in any set, pick **Other** for the garment, press **Skip** in the text box, and confirm the header chip on the next question reads "Garment" with the default 👕 (not "Skipped").

- [ ] **Step 4: Commit**

```bash
git add src/app/components/mirror/constants/garments.ts
git commit -m "fix: render skipped custom garment as neutral label, not 'Skipped'"
```

---

## Task 7: MEDIUM — remove the dead "Type your age…" baseline branch

**Why:** No baseline question sets `isTextInput`, so the text-input branch in `BaselineScreen` is dead code carrying a stale "Type your age…" placeholder — a trap for re-introducing the deliberately-removed age field.

**Files:**
- Modify: `src/app/components/mirror/screens/BaselineScreen.tsx`

- [ ] **Step 1: Delete the `isTextInput` branch, keep only the options branch**

Replace this whole conditional:

```tsx
            {'isTextInput' in currentQ && currentQ.isTextInput ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = textInputValue.trim() || 'skipped';
                      onAnswer(currentQ.id, value);
                      setTextInputValue('');
                    }
                  }}
                  placeholder="Type your age..."
                  className={`input-field ${textInputValue ? 'has-value' : ''}`}
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <SecondaryButton onClick={() => {
                    onAnswer(currentQ.id, 'skipped');
                    setTextInputValue('');
                  }} label="Skip" />
                  <ContinueButton onClick={() => {
                    const value = textInputValue.trim() || 'skipped';
                    onAnswer(currentQ.id, value);
                    setTextInputValue('');
                  }} label="Continue" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {currentQ.options?.map((option) => {
```

with:

```tsx
            <div className="space-y-3">
                {currentQ.options?.map((option) => {
```

- [ ] **Step 2: Remove the now-orphaned closing of the ternary**

Find the matching `</div>` + `)}` that closed the options branch of the ternary (immediately after the options `.map(...)` block's closing `</div>`) and change:

```tsx
                })}
              </div>
            )}
```

to:

```tsx
                })}
            </div>
```

- [ ] **Step 3: Remove now-unused imports if the linter flags them**

If `textInputValue`, `setTextInputValue`, `SecondaryButton`, or `ContinueButton` become unused after this change, remove them from the props/destructuring and imports. Run `pnpm typecheck` to confirm there are no type errors regardless.

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors, build succeeds.

Manual: `pnpm dev`, walk through all four baseline questions — each shows option tiles, none shows a text box.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/mirror/screens/BaselineScreen.tsx
git commit -m "refactor: remove dead age text-input branch from baseline screen"
```

---

## Task 8: MEDIUM — make the Memory Keeper icon consistent

**Why:** The hero shows `🧡` (`scoring.ts`) but the archetype grid tile shows `📖` (`archetypes.ts`) for the same archetype, so a user sees two different emojis for their own result.

**Files:**
- Modify: `src/app/components/mirror/lib/scoring.ts`

- [ ] **Step 1: Align the persona icon to the grid icon**

In `scoring.ts`, in the `'The Memory Keeper'` persona object, change `icon: '🧡'` to `icon: '📖'`.

- [ ] **Step 2: Verify**

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors. Manual: reach a Memory Keeper result; the hero emoji and the "YOU" grid tile emoji now match (`📖`).

- [ ] **Step 3: Commit**

```bash
git add src/app/components/mirror/lib/scoring.ts
git commit -m "fix: use a single consistent icon for the Memory Keeper archetype"
```

---

## Task 9: LOW — confirm + tag partial completions, fix welcome copy

**Why:** The welcome screen promises "3 specific garments", but users can submit after 1–2 sets with no confirmation. Decision: keep early finish, confirm it, and tag the data (`completion_status` already added in Task 2).

**Files:**
- Modify: `src/app/components/mirror/MirrorGame.tsx`
- Modify: `src/app/components/mirror/screens/WelcomeScreen.tsx`

- [ ] **Step 1: Add a confirming finish handler**

In `MirrorGame.tsx`, immediately after the `finishGame` function definition, add:

```ts
  // Early "Finish Now" (Set A/B): confirm before submitting a partial session.
  // For Set C, allResponses.length === 3, so no prompt is shown.
  const handleFinishEarly = () => {
    const done = allResponses.length;
    if (
      done < 3 &&
      !window.confirm(
        `You've completed ${done} of 3 garments. Submit now with partial responses? You won't be able to add more afterwards.`
      )
    ) {
      return;
    }
    finishGame();
  };
```

- [ ] **Step 2: Wire the confirm handler into the complete screen**

In `MirrorGame.tsx`, in the `set-complete` render branch, change:

```tsx
        onContinue={handleContinueToNextSet}
        onFinish={finishGame}
```

to:

```tsx
        onContinue={handleContinueToNextSet}
        onFinish={handleFinishEarly}
```

- [ ] **Step 3: Update the welcome copy to match reality**

In `WelcomeScreen.tsx`, replace:

```tsx
                    Answer questions about 3 specific garments from your wardrobe
```

with:

```tsx
                    Answer questions about up to 3 garments from your wardrobe — you can stop after any one
```

- [ ] **Step 4: Verify + manual check**

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors.

Manual: finish after Set A → a confirm dialog appears; accept → Data tab shows the session, and the exported CSV's `Completion Status` column reads `partial`. Complete all three → no dialog, status `complete`.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/mirror/MirrorGame.tsx src/app/components/mirror/screens/WelcomeScreen.tsx
git commit -m "feat: confirm partial finishes and align welcome copy with up-to-3 flow"
```

---

## Task 10: LOW — correct the stale file-header comment

**Why:** The `MirrorGame.tsx` header still says data is "Automatically email[ed]"; the email path was removed. (Console logs were already gated behind `import.meta.env.DEV` in Task 2.)

**Files:**
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Fix the header comment**

Replace:

```ts
 * Automatically emails CSV and JSON data to researcher.
```

with:

```ts
 * Submits one row per completed set to Supabase; the researcher accesses data via the Supabase dashboard.
```

- [ ] **Step 2: Verify + commit**

Run: `pnpm typecheck`
Expected: 0 errors.

```bash
git add src/app/components/mirror/MirrorGame.tsx
git commit -m "docs: correct stale email reference in MirrorGame header"
```

> Optional follow-up (not required): rename the `emailSent` state/prop to `submissionOk` across `MirrorGame.tsx` and `FinalDashboard.tsx`. Purely cosmetic; ~15 references. Skip unless doing a broader cleanup pass.

---

## Task 11: LOW — strip non-numeric characters from number inputs

**Why:** The cost inputs and Set C's retention-years input accept free text, so entries like `around 50` or `£40` land in `cost`/`how_long_had_years` and score as `NaN`. Decision: strip non-digits as the user types, keeping those columns clean integers for the (future) `how_long_had` scorer.

**Files:**
- Modify: `src/app/components/mirror/questions/SetAQuestion.tsx`
- Modify: `src/app/components/mirror/questions/SetBQuestion.tsx`
- Modify: `src/app/components/mirror/questions/SetCQuestion.tsx`

- [ ] **Step 1: Strip non-digits in the Set A cost input**

In `SetAQuestion.tsx`, in the cost question (the input with placeholder `Amount in euros...`), change:

```tsx
                onChange={(e) => setTextInputValue(e.target.value)}
```

to:

```tsx
                onChange={(e) => setTextInputValue(e.target.value.replace(/[^0-9]/g, ''))}
```

- [ ] **Step 2: Strip non-digits in the Set B cost input**

In `SetBQuestion.tsx`, in the cost question (placeholder `Amount in euros...`), apply the same `onChange` replacement as Step 1.

- [ ] **Step 3: Strip non-digits in the Set C cost AND years inputs**

In `SetCQuestion.tsx`, apply the same `onChange` replacement to BOTH: the cost question (placeholder `Amount in euros...`) and the "How long have you had it?" question (placeholder `Number of years...`).

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors.

Manual: in each cost field and the Set C years field, type letters/symbols — only digits should appear. Complete a Set C run and confirm the exported CSV's `How Long Had (Years)` column shows a bare number while `How Long Had` is empty for that row.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/mirror/questions/SetAQuestion.tsx src/app/components/mirror/questions/SetBQuestion.tsx src/app/components/mirror/questions/SetCQuestion.tsx
git commit -m "fix: strip non-numeric input from cost and retention-years fields"
```

---

## Final verification

- [ ] Run the full suite: `pnpm test` → all green.
- [ ] Run `pnpm typecheck` → 0 errors.
- [ ] Run `pnpm build` → succeeds (the ~603 kB chunk-size warning is expected and out of scope).
- [ ] Confirm the live-DB column check from Task 2 Step 10 returned 0 rows.

---

## Deferred / open decisions (NOT implemented in this plan)

| Item | Why deferred | Source finding |
|---|---|---|
| **Radar + Baseline Comparison honesty** | You paused this decision. Today the radar draws one final-only polygon over 3 axes while the legend claims a baseline-vs-final two-series chart, and the comparison frames an additive-only score as a positive "shift". Pick "make it honest (4 axes, drop false legend)" or "real two-series" before implementing. | #3, #4 |
| **Consent / GDPR gate** | Needs researcher-authored legal copy + ethics sign-off; tracked as its own plan. `consent_given`/`consent_timestamp` stay NULL until then. | #1 |
| **Anonymous-insert abuse controls** | Rate limiting / Turnstile / Edge-Function validation is an infra effort, not a code edit. RLS already protects reads. | #3 (security) |
| **Scoring methodology review** | Whether `whyFavorite`/cost/`washFrequency` weightings are valid is a research call, not a bug. Tie any change to the radar decision. The future `how_long_had`/`how_long_had_years` scorer also belongs here. | #9 |
| **Bundle size (~603 kB)** | `manualChunks`/lazy-loading is optimization, not correctness. | findings.md |

---

## Self-review (performed)

- **Spec coverage:** Every non-deferred finding from the 2026-06-02 analysis maps to a task (critical schema + `how_long_had_years` split→T2, double-tap→T3, stale Other→T4, dead code→T5/T7, sentinel→T6, icon→T8, partial completion→T9, stale comment/log hygiene→T2/T10, numeric-input hygiene→T11). Radar/comparison, consent, abuse, scoring methodology, bundle explicitly deferred.
- **`how_long_had_years` consistency:** Added in `DB_COLUMNS` (T2 Step 1), written by `buildSupabaseRows` (T2 Step 4: Set C → value, Set A/B → `''`), asserted in the contract test (T2 Step 2), present in `create_table.sql` (Step 8), the migration + verification array (Step 9), CLAUDE.md (Step 11), and the CSV (Step 5). Set C's input is digit-cleaned in T11. All references use the exact name `how_long_had_years`.
- **Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows the exact code or exact replace-from/replace-to.
- **Type consistency:** `buildSupabaseRows` (T2) is the name imported by the test and used by `submitToSupabase`; `DB_COLUMNS` (T2) is consumed only by the test; `COMPANION_FIELD` (T4) is referenced in both `handleMultiSelectToggle` and `handleBack`; `scheduleAdvance`/`clearAdvanceTimer` (T3) names are consistent across all call sites; `completion_status` payload (T2) and CSV column (T2) and `handleFinishEarly` UX (T9) agree on the `complete`/`partial` values.

# Schema Alignment Plan v2

## Workflow Context

**Project:** Wardrobe Mirror — a Vite + React + TypeScript research app deployed via Figma Make. Participants answer three sequential question sets (A: recent purchase, B: favourite garment, C: disposal) and results are stored in a Supabase PostgreSQL table (`wardrobe_responses`) in Frankfurt (eu-central-1).

**What this plan does:** Implements schema, question, scoring, and data export changes to align the root codebase with the confirmed research instrument design. It supersedes `mirror-schema-alignment-plan.md`, which was critically reviewed and found to have 11 issues (missing files, wrong architecture, unresolved design decisions). All issues are resolved here.

**Decisions confirmed before this plan was written:**
- `whyFavorite` (Set B) → 5-category pre-coded **multi-select** (replaces free-text input); researcher confirmed
- Set C `cost` → **numeric input only** (banded tiles removed from Set C; Sets A and B keep their bands)
- `useChanged` and `brand` → **removed** to align with Figma version

**Key constraint:** `MirrorGame.tsx` requires **no changes**. The existing handlers (`handleAnswer`, `handleSkip`, `handleMultiSelectToggle`, `handleContinue`), state management, and `QUESTION_STEPS` navigation all accommodate the new questions without modification.

**Active Supabase project:** `tahjilropjzzxolhnhnd.supabase.co`
**Source of truth:** `src/app/components/mirror/` (not `Styled Version/`)
**Package manager:** `pnpm`

---

## Files Changed (execute in this order)

1. `src/app/components/mirror/types.ts`
2. `src/app/components/mirror/constants/questionSteps.ts`
3. `src/app/components/mirror/questions/SetBQuestion.tsx`
4. `src/app/components/mirror/questions/SetCQuestion.tsx`
5. `src/app/components/mirror/lib/export.ts`
6. `src/app/components/mirror/lib/supabase.ts`
7. `src/app/components/mirror/lib/scoring.ts`
8. Supabase SQL migration (run last)

---

## Task 1 — types.ts

**File:** `src/app/components/mirror/types.ts`

`SetBResponse` changes:
- `whyFavorite?: string` → `whyFavorite?: string | string[]`
  - Union type is intentional. When the participant **skips**, `onSkip('whyFavorite')` stores the string `'skipped'` (same convention used across the app — preserves skip signal as research data). When they **answer**, `onMultiSelectToggle` stores a `string[]`. Both are valid states; the CSV/DB serialisation handles both with `Array.isArray()` guards (see Tasks 5 and 6).
- Add `whyFavoriteOther?: string`
- Remove `useChanged?: string`
- Remove `brand?: string`

`SetCResponse` changes:
- `whyNotWear: string` → `whyNotWear: string[]`
  - Pure array — no union needed because `whyNotWear` has no Skip button (always answered).
- Add `whyNotWearOther?: string`
- `cost: string` stays `string` (the numeric input value is a string when read from the input field)

---

## Task 2 — questionSteps.ts

**File:** `src/app/components/mirror/constants/questionSteps.ts`

The app uses a step registry (`QUESTION_STEPS`) to know which questions exist per set and in what order. Each entry has an `id` (the field name), a `renderIndex` (which `case` number to render in the question component's switch statement), and an optional `shouldShow` function that hides the step unless a condition is met — preventing it from ever being navigated to.

### Set B — remove 2 entries, add 1

Remove:
```typescript
{ id: 'useChanged', renderIndex: 7 },
{ id: 'brand', renderIndex: 10, optional: true },
```

Add (reuses freed renderIndex 10):
```typescript
{
  id: 'whyFavoriteOther',
  renderIndex: 10,
  optional: true,
  shouldShow: (response) => {
    const r = response as Partial<SetBResponse>;
    return Array.isArray(r.whyFavorite) && r.whyFavorite.includes('other');
  },
},
```

The `whyFavoriteOther` text screen only appears if the participant selected "Other" in the `whyFavorite` multi-select. If they didn't select "Other", the app skips straight past renderIndex 10.

Also update the `whyFavorite` entry — remove `optional: true` (the question now handles its own skip button in the UI rather than relying on the step system):
```typescript
{ id: 'whyFavorite', renderIndex: 1 },
```

Add `SetBResponse` to the import at the top of the file.

### Set C — add 1 entry

Add after `disposalPlan` (renderIndex 5):
```typescript
{
  id: 'whyNotWearOther',
  renderIndex: 6,
  optional: true,
  shouldShow: (response) => {
    const r = response as Partial<SetCResponse>;
    return Array.isArray(r.whyNotWear) && r.whyNotWear.includes('other');
  },
},
```

Add `SetCResponse` to the import.

**Set B final step list:** renderIndex 0, 1, 2, 3, 4, 5, 6, 8, 9, 10
(Gaps at 7 and old 10 are harmless — those case numbers are removed from the switch statement and can never be navigated to.)

**Set C final step list:** renderIndex 0, 1, 2, 3, 4, 5, 6.

---

## Task 3 — SetBQuestion.tsx

**File:** `src/app/components/mirror/questions/SetBQuestion.tsx`

### Case 1 — Replace free-text `whyFavorite` with multi-select

Remove the current `<input type="text">` / Skip / Continue layout entirely.

Replace with 5 SelectionTile options plus Skip and Continue:

```tsx
case 1:
  return (
    <QuestionScreen title="Why is it your favorite?" subtitle="Select all that apply — Optional" icon={...}>
      <div className="space-y-4">
        <div className="space-y-3">
          <SelectionTile label="It's comfortable"         selected={(resp.whyFavorite || []).includes('comfortable')}        onClick={() => onMultiSelectToggle('whyFavorite', 'comfortable')}        icon={<Heart className="w-5 h-5" />} />
          <SelectionTile label="Easy to style"            selected={(resp.whyFavorite || []).includes('easy-to-style')}      onClick={() => onMultiSelectToggle('whyFavorite', 'easy-to-style')}      icon={<Sparkles className="w-5 h-5" />} />
          <SelectionTile label="Makes me feel confident"  selected={(resp.whyFavorite || []).includes('confident')}          onClick={() => onMultiSelectToggle('whyFavorite', 'confident')}          icon={<Star className="w-5 h-5" />} />
          <SelectionTile label="Personal or emotional"    selected={(resp.whyFavorite || []).includes('personal-emotional')}  onClick={() => onMultiSelectToggle('whyFavorite', 'personal-emotional')}  icon={<Gift className="w-5 h-5" />} />
          <SelectionTile label="Other"                    selected={(resp.whyFavorite || []).includes('other')}              onClick={() => onMultiSelectToggle('whyFavorite', 'other')}              icon={<Compass className="w-5 h-5" />} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => onSkip('whyFavorite')} label="Skip" />
          <ContinueButton   onClick={() => onContinue()} label="Continue" disabled={!(Array.isArray(resp.whyFavorite) && resp.whyFavorite.length > 0)} />
        </div>
      </div>
    </QuestionScreen>
  );
```

**Skip vs Continue behaviour:**
- **Skip** calls `onSkip('whyFavorite')` — stores the string `'skipped'` in state, then advances. Preserves the skip signal as research data.
- **Continue** is disabled until at least one tile is selected. Clicking it calls `onContinue()` — the selections already in state (`string[]`) are recorded and the app advances.
- `'skipped'` (string) and `['comfortable']` (array) are both valid for the `string | string[]` union type. `Array.isArray()` guards in Tasks 5 and 6 distinguish them at serialisation time.

Add `Compass` to the Lucide import list if not already present.

### Cases 7 and 10 — Remove entirely

Delete `case 7` (`useChanged`) and `case 10` (`brand`) from the switch statement.

### Case 10 (new) — `whyFavoriteOther` text capture

Follows the exact pattern of SetAQuestion `case 6` (`whyBoughtOther`):

```tsx
case 10:
  if (!resp.whyFavorite?.includes('other')) return null;
  return (
    <QuestionScreen title="Please describe your other reason" subtitle="Optional — You can skip this" icon={...}>
      <div className="space-y-4">
        <input
          type="text"
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && textInputValue.trim()) submitTextAnswer('whyFavoriteOther'); }}
          placeholder="Type your answer..."
          className="w-full p-4 rounded-2xl text-base"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)', color: COLORS.light, fontFamily: 'Georgia, serif' }}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => onSkip('whyFavoriteOther')} label="Skip" />
          <ContinueButton  onClick={() => submitTextAnswer('whyFavoriteOther')} label="Continue" disabled={!textInputValue.trim()} />
        </div>
      </div>
    </QuestionScreen>
  );
```

---

## Task 4 — SetCQuestion.tsx

**File:** `src/app/components/mirror/questions/SetCQuestion.tsx`

### Case 2 — Replace banded cost with numeric input

Remove all five `SelectionTile` cost entries. Replace with the numeric input pattern (same as case 1 `howLongHad`):

```tsx
case 2:
  return (
    <QuestionScreen title="About how much did it cost?" subtitle="Enter approximate amount in euros" icon={...}>
      <div className="space-y-4">
        <input
          type="number"
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && textInputValue.trim()) submitTextAnswer('cost'); }}
          placeholder="Amount in euros..."
          className="w-full p-4 rounded-2xl text-base"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)', color: COLORS.light, fontFamily: 'Georgia, serif' }}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => onSkip('cost')} label="Skip" />
          <ContinueButton  onClick={() => submitTextAnswer('cost')} label="Continue" disabled={!textInputValue.trim()} />
        </div>
      </div>
    </QuestionScreen>
  );
```

`submitTextAnswer('cost')` stores the input value as a string (e.g. `"250"`). `SetCResponse.cost` type stays `string` — no change needed. Remove `Euro` from the Lucide import if unused after removing the tiles.

### Case 4 — Convert `whyNotWear` to multi-select

Remove the current single-select tiles (`onAnswer`) and the inline `OtherInput` entirely. Replace with multi-select tiles plus Continue:

```tsx
case 4:
  return (
    <QuestionScreen title="Why don't you wear it anymore?" subtitle="Select all that apply" icon={...}>
      <div className="space-y-4">
        <div className="space-y-3">
          <SelectionTile label="Doesn't fit"                    selected={(resp.whyNotWear || []).includes('doesnt-fit')}        onClick={() => onMultiSelectToggle('whyNotWear', 'doesnt-fit')}        icon={<AlertCircle className="w-5 h-5" />} />
          <SelectionTile label="Out of style"                   selected={(resp.whyNotWear || []).includes('out-of-style')}      onClick={() => onMultiSelectToggle('whyNotWear', 'out-of-style')}      icon={<TrendingUp className="w-5 h-5" />} />
          <SelectionTile label="Damaged or worn out"            selected={(resp.whyNotWear || []).includes('damaged-worn-out')}  onClick={() => onMultiSelectToggle('whyNotWear', 'damaged-worn-out')}  icon={<X className="w-5 h-5" />} />
          <SelectionTile label="Forgot about it"                selected={(resp.whyNotWear || []).includes('forgot')}            onClick={() => onMultiSelectToggle('whyNotWear', 'forgot')}            icon={<Package className="w-5 h-5" />} />
          <SelectionTile label="Waiting for the right occasion" selected={(resp.whyNotWear || []).includes('waiting-occasion')}  onClick={() => onMultiSelectToggle('whyNotWear', 'waiting-occasion')}  icon={<Clock className="w-5 h-5" />} />
          <SelectionTile label="Don't like it anymore"          selected={(resp.whyNotWear || []).includes('dont-like-anymore')} onClick={() => onMultiSelectToggle('whyNotWear', 'dont-like-anymore')} icon={<Heart className="w-5 h-5" />} />
          <SelectionTile label="Other"                          selected={(resp.whyNotWear || []).includes('other')}             onClick={() => onMultiSelectToggle('whyNotWear', 'other')}             icon={<Compass className="w-5 h-5" />} />
        </div>
        <ContinueButton onClick={() => onContinue()} label="Continue" disabled={!resp.whyNotWear?.length} />
      </div>
    </QuestionScreen>
  );
```

The "Other" tile adds `'other'` to the array. The inline `OtherInput` is removed — the text is captured on the new case 6 screen. Add `Compass` to the Lucide import if not already present.

### Case 6 (new) — `whyNotWearOther` text capture

```tsx
case 6:
  if (!resp.whyNotWear?.includes('other')) return null;
  return (
    <QuestionScreen title="Please describe your other reason" subtitle="Optional — You can skip this" icon={...}>
      <div className="space-y-4">
        <input
          type="text"
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && textInputValue.trim()) submitTextAnswer('whyNotWearOther'); }}
          placeholder="Type your answer..."
          className="w-full p-4 rounded-2xl text-base"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)', color: COLORS.light, fontFamily: 'Georgia, serif' }}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => onSkip('whyNotWearOther')} label="Skip" />
          <ContinueButton  onClick={() => submitTextAnswer('whyNotWearOther')} label="Continue" disabled={!textInputValue.trim()} />
        </div>
      </div>
    </QuestionScreen>
  );
```

---

## Task 5 — export.ts

**File:** `src/app/components/mirror/lib/export.ts`

The CSV export builds a flat row of values per response in a fixed column order. This task swaps 2 old columns for 2 new ones — total stays at 28.

**`csvQuote` — NO CHANGE.** It is a pure scalar quoting function. Arrays are joined to strings inside `buildResponseRow` before `csvQuote` ever sees them.

### New 28-column layout

Removed: `Use Changed` (was index 22) and `Brand` (was index 25).
Added: `Why Favorite Other` (after Why Favorite) and `Why Not Wear Other` (after Why Not Wear).

| Index | Column |
|---|---|
| 0–12 | Session ID → Garment Type (unchanged) |
| 13–19 | How Got, Cost, Wear Freq, Main Use, Main Use Other, Why Bought, Why Bought Other |
| 20 | How Long Had |
| 21 | Why Favorite |
| **22** | **Why Favorite Other (new)** |
| 23 | Wash Frequency |
| 24 | Repaired |
| 25 | Why Not Wear |
| **26** | **Why Not Wear Other (new)** |
| 27 | Disposal Plan |

### Updated headers array:
```typescript
const headers = [
  'Session ID', 'Timestamp',
  'Wardrobe Size', 'Shopping Frequency', 'Disposal Habit', 'Primary Driver',
  'Persona', 'Social Value', 'Emotional Value', 'Functional Value', 'Inflow/Outflow Value',
  'Set Type', 'Garment Type', 'How Got', 'Cost',
  'Wear Frequency', 'Main Use', 'Main Use Other', 'Why Bought', 'Why Bought Other',
  'How Long Had', 'Why Favorite', 'Why Favorite Other',
  'Wash Frequency', 'Repaired', 'Why Not Wear', 'Why Not Wear Other', 'Disposal Plan'
];
```

### Updated `buildResponseRow` — 28 values per set:

**Set A:**
```typescript
[
  ...base,  // 13 values
  r.howGot || '', r.cost || '', r.wearFrequency || '',
  Array.isArray(r.mainUse) ? r.mainUse.join('; ') : r.mainUse || '',
  r.mainUseOther || '', r.whyBought || '', r.whyBoughtOther || '',
  '', '', '', '', '', '', '', ''  // howLongHad, whyFavorite, whyFavoriteOther, washFreq, repaired, whyNotWear, whyNotWearOther, disposalPlan
]
```

**Set B:**
```typescript
[
  ...base,
  r.howGot || '', r.cost || '', r.wearFrequency || '',
  Array.isArray(r.mainUse) ? r.mainUse.join('; ') : r.mainUse || '',
  r.mainUseOther || '',
  '', '',  // whyBought, whyBoughtOther
  r.howLongHad || '',
  Array.isArray(r.whyFavorite) ? r.whyFavorite.join('; ') : r.whyFavorite || '',  // 'skipped' passes through as-is
  r.whyFavoriteOther || '',
  r.washFrequency || '', r.repaired || '',
  '', '', ''  // whyNotWear, whyNotWearOther, disposalPlan
]
```

**Set C:**
```typescript
[
  ...base,
  r.howGot || '', r.cost || '',
  '', '', '', '', '',  // wearFreq, mainUse, mainUseOther, whyBought, whyBoughtOther
  r.howLongHad || '',
  '', '', '', '',  // whyFavorite, whyFavoriteOther, washFreq, repaired
  Array.isArray(r.whyNotWear) ? r.whyNotWear.join('; ') : '',
  r.whyNotWearOther || '',
  r.disposalPlan || ''
]
```

Verify each branch totals 28: `base(13) + set-specific(15) = 28`.

---

## Task 6 — supabase.ts (named objects — required)

**File:** `src/app/components/mirror/lib/supabase.ts`

The current code builds a positional array with `buildResponseRow` then reads values back by index (`row[21]`, `row[22]`, etc.). If column order changes, the wrong value silently lands in the wrong DB column. This task replaces that approach by writing each row as a named object — each field goes directly to its named column with no positional risk.

Remove `import { buildResponseRow } from './export'`.

Replace the entire `rows` mapping:

```typescript
const rows = data.responses.map(r => {
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
    };
  } else if (r.setType === 'B') {
    return {
      ...base,
      how_got: r.howGot || '', cost: r.cost || '', wear_frequency: r.wearFrequency || '',
      main_use: Array.isArray(r.mainUse) ? r.mainUse.join('; ') : r.mainUse || '',
      main_use_other: r.mainUseOther || '',
      why_bought: '', why_bought_other: '',
      how_long_had: r.howLongHad || '',
      why_favorite: Array.isArray(r.whyFavorite) ? r.whyFavorite.join('; ') : r.whyFavorite || '',  // 'skipped' string passes through
      why_favorite_other: r.whyFavoriteOther || '',
      wash_frequency: r.washFrequency || '', repaired: r.repaired || '',
      why_not_wear: '', why_not_wear_other: '', disposal_plan: '',
    };
  } else {
    return {
      ...base,
      how_got: r.howGot || '', cost: r.cost || '',
      wear_frequency: '', main_use: '', main_use_other: '',
      why_bought: '', why_bought_other: '',
      how_long_had: r.howLongHad || '',
      why_favorite: '', why_favorite_other: '',
      wash_frequency: '', repaired: '',
      why_not_wear: Array.isArray(r.whyNotWear) ? r.whyNotWear.join('; ') : '',
      why_not_wear_other: r.whyNotWearOther || '',
      disposal_plan: r.disposalPlan || '',
    };
  }
});
```

`use_changed` and `brand` are omitted from all row objects — the DB columns remain but receive `NULL` for all new rows.

---

## Task 7 — scoring.ts

**File:** `src/app/components/mirror/lib/scoring.ts`

The scoring rules for `whyFavorite` and `whyNotWear` already exist in the root codebase — written for single strings. This task updates them to handle the new array types. The additive multi-select scoring for `whyNotWear` (each dimension scores independently) was proposed in the alignment plan and is adopted here.

### Remove `useChanged` scoring block
```typescript
// DELETE these lines:
if ('useChanged' in response) {
  if (response.useChanged === 'yes') values.functional += 8;
  if (response.useChanged === 'no') values.inflowOutflow += 4;
}
```

### Update `whyFavorite` scoring (line ~47)
```typescript
// BEFORE
if ('whyFavorite' in response && response.whyFavorite && response.whyFavorite !== 'skipped') values.emotional += 14;

// AFTER — handles string | string[] union
if ('whyFavorite' in response && Array.isArray(response.whyFavorite) && response.whyFavorite.length > 0) values.emotional += 14;
```

`'skipped'` is a string → `Array.isArray` is false → no score. An answered array with ≥1 selection → +14 emotional once (not per selection).

### Update `whyNotWear` scoring (lines ~59–63)
```typescript
// BEFORE
if ('whyNotWear' in response) {
  if (response.whyNotWear === 'out-of-style' || response.whyNotWear === 'dont-like-anymore') values.social += 10;
  if (response.whyNotWear === 'waiting-occasion' || response.whyNotWear === 'forgot') values.emotional += 8;
  if (response.whyNotWear === 'doesnt-fit' || response.whyNotWear === 'damaged-worn-out') values.functional += 6;
}

// AFTER — additive: each matching dimension scores independently
if ('whyNotWear' in response && Array.isArray(response.whyNotWear)) {
  if (response.whyNotWear.some(v => v === 'out-of-style' || v === 'dont-like-anymore')) values.social += 10;
  if (response.whyNotWear.some(v => v === 'waiting-occasion' || v === 'forgot')) values.emotional += 8;
  if (response.whyNotWear.some(v => v === 'doesnt-fit' || v === 'damaged-worn-out')) values.functional += 6;
}
```

Maximum possible: +24 if all three dimensions are triggered. Per-dimension point values are unchanged from the existing root version.

### Update the TODO comment
```typescript
// TODO (research team decision): `washFrequency` (Set B) and `howLongHad` (Set C) are collected but not scored.
```
(Remove the former mention of `brand`.)

---

## Task 8 — Supabase schema migration

Run against project `tahjilropjzzxolhnhnd` via Supabase MCP or the dashboard SQL editor:

```sql
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS why_favorite_other text;
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS why_not_wear_other text;
```

`IF NOT EXISTS` makes this idempotent. Existing ~14 rows receive `NULL` in the new columns. The `use_changed` and `brand` columns are left in place (removing them risks existing data; new rows simply write `NULL`).

**Researcher note:** Rows collected before this change have `why_favorite` as verbatim free text. Rows after have semicolon-delimited category codes (e.g. `comfortable; confident`). To isolate historical free-text rows in analysis: `WHERE why_favorite NOT LIKE '%;%' AND why_favorite NOT IN ('comfortable','easy-to-style','confident','personal-emotional','other','skipped','')`.

---

## Verification

```
pnpm typecheck   # must pass with zero errors
pnpm build       # must complete cleanly
pnpm dev         # open http://127.0.0.1:5173/
```

**Set B smoke tests:**
- Select 2+ `whyFavorite` tiles → Continue; CSV shows `comfortable; confident`
- Select nothing → Continue disabled; Skip → `'skipped'` stored, flow continues
- Select "Other" → Continue → `whyFavoriteOther` text screen appears → type → Continue
- Select tiles without "Other" → Continue → `whyFavoriteOther` screen skipped

**Set C smoke tests:**
- Cost: type a number → Continue; type nothing → Skip stores `'skipped'`
- `whyNotWear`: select 2+ reasons including "Other" → Continue → `whyNotWearOther` screen appears
- Select reasons without "Other" → `whyNotWearOther` screen skipped

**Data checks:**
- CSV: 28 columns, `Use Changed` and `Brand` absent, `Why Favorite Other` and `Why Not Wear Other` present
- Supabase: `why_favorite_other` and `why_not_wear_other` columns exist; `use_changed` and `brand` are NULL for new rows; `wash_frequency` and `repaired` land in the correct columns (spot-check named mapping is correct)

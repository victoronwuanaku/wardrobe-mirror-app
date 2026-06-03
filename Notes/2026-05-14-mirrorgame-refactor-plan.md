# MirrorGame Decomposition Refactor Plan

> **For Codex / agentic workers:** Execute tasks in order. Each task is atomic. Run the verification command at the end of every task before moving on. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the 3,150-line monolithic `src/app/components/mirror/MirrorGame.tsx` into a focused module tree under `src/app/components/mirror/` while **preserving every observable behaviour**: state flow, question schemas, calculations, exports, Supabase submission, sharing, and UI fidelity.

**Architecture:** Logic (types, constants, lib helpers) extracted first as pure modules with no React dependencies. UI primitives extracted second. Screen-level components extracted third. Question renderers extracted fourth. `MirrorGame.tsx` finishes as a thin orchestrator: state + handlers + a `gameState`-driven switch that renders the appropriate screen component, passing state and handlers as props. No new dependencies. No behaviour changes.

**Tech Stack:** Vite 6, React 18, TypeScript 5, Tailwind 4, `motion` 12, `@supabase/supabase-js` 2, Lucide React. pnpm.

---

## Constraints (read before starting)

- **No behaviour changes.** Same Supabase payload shape. Same CSV columns. Same scoring. Same screen flow. Same animations.
- **No new dependencies.** Don't add helpers, contexts, state libs, or test frameworks.
- **No style changes.** Class names, inline styles, `wardrobe-mirror.css`, and `motion/react` usage stay untouched.
- **Imports use relative paths** matching existing conventions (e.g. `../../../../utils/supabase/info` is preserved literally when moved).
- **No tests exist.** Verification is `pnpm typecheck` after every task and `pnpm build` + manual smoke at phase boundaries.
- **No git.** Project is not a git repo, so there are no commit steps. Treat each completed-and-typechecked task as a checkpoint.
- **The file order in `CLAUDE.md`** under "When syncing local changes to Figma" must be updated in the final task to reflect the new files.
- **Do not touch:** `OG/`, `Styled Version/`, `dist/`, `node_modules/`, `supabase/`, `guidelines/`, `Notes/` (except this plan), `utils/`, `AGENTS.md`, `Bug.md`.

## Target File Structure

```
src/app/components/mirror/
├── MirrorGame.tsx                       ~ thin orchestrator (~250 lines after refactor)
├── types.ts                             ~ all interfaces + type aliases
├── constants/
│   ├── design.ts                        ~ COLORS, MOTION_EASE, fadeRiseMotion, scaleInMotion
│   ├── garments.ts                      ~ GARMENT_OPTIONS, getGarmentIcon, getGarmentLabel
│   ├── archetypes.ts                    ~ ARCHETYPE_INFO
│   ├── baselineQuestions.ts             ~ BASELINE_QUESTIONS
│   └── questionSteps.ts                 ~ QUESTION_STEPS, getVisibleQuestionSteps, getSetCategoryName
├── lib/
│   ├── session.ts                       ~ generateSessionId
│   ├── export.ts                        ~ exportGameData, exportCSV, csvQuote, buildResponseRow, generateCSVString
│   ├── supabase.ts                      ~ submitToSupabase
│   └── scoring.ts                       ~ clampValue, calculateValuesFromMirrorGame, calculatePersona, getMirrorInsights
├── ui/
│   ├── SelectionTile.tsx
│   ├── ContinueButton.tsx
│   ├── SecondaryButton.tsx
│   ├── QuestionScreen.tsx
│   └── ValueFingerprintRadar.tsx
├── screens/
│   ├── WelcomeScreen.tsx
│   ├── BaselineScreen.tsx
│   ├── SetIntroScreen.tsx
│   ├── QuestionRunner.tsx               ~ wraps the gameState==='question' card + back button + progress + renderQuestion
│   ├── SetCompleteScreen.tsx
│   └── FinalDashboard.tsx               ~ contains all 4 tab panels (dashboard/insights/share/data)
└── questions/
    ├── shared.tsx                       ~ OtherInput, GarmentGrid (props-based replacements for the inline render helpers)
    ├── SetAQuestion.tsx
    ├── SetBQuestion.tsx
    └── SetCQuestion.tsx
```

---

## Pre-flight (Task 0)

### Task 0: Sanity-check the starting state

**Files:** none

- [ ] **Step 1: Verify clean typecheck on the current code.**

Run: `cd "/Users/victoronwuanaku/Documents/Claude/W.V_Wardrobe Mirror " && pnpm typecheck`
Expected: exits 0 with no errors.

- [ ] **Step 2: Verify production build succeeds on the current code.**

Run: `cd "/Users/victoronwuanaku/Documents/Claude/W.V_Wardrobe Mirror " && pnpm build`
Expected: exits 0; `dist/` is regenerated. This is the baseline. If either of the above fails before refactoring, STOP and report — do not proceed.

- [ ] **Step 3: Note the starting line count of MirrorGame.tsx.**

Run: `wc -l "src/app/components/mirror/MirrorGame.tsx"`
Expected: ~3,150 lines. Record this number for comparison after the final task.

---

## PHASE 1 — Extract pure logic (no React deps)

Pure logic extraction is the safest first phase. After Phase 1 the orchestrator still does all the rendering but pulls types/constants/helpers from new modules. No JSX moves yet.

### Task 1: Extract `types.ts`

**Files:**
- Create: `src/app/components/mirror/types.ts`
- Modify: `src/app/components/mirror/MirrorGame.tsx` (TYPE DEFINITIONS section, currently lines 27–129; and `SubmissionResult` at line 338)

- [ ] **Step 1: Create `src/app/components/mirror/types.ts`**

Contents:

```ts
// All shared types for the Mirror feature.
// Behaviour: identical to the previous in-file definitions.

export interface SetAResponse {
  setType: 'A';
  garmentType: string;
  howGot: string;
  cost: string;
  wearFrequency: string;
  mainUse: string[];
  mainUseOther?: string;
  whyBought: string;
  whyBoughtOther?: string;
  timestamp: string;
}

export interface SetBResponse {
  setType: 'B';
  garmentType: string;
  whyFavorite?: string;
  howGot: string;
  cost: string;
  howLongHad: string;
  wearFrequency: string;
  mainUse: string[];
  mainUseOther?: string;
  useChanged?: string;
  washFrequency?: string;
  repaired?: string;
  brand?: string;
  timestamp: string;
}

export interface SetCResponse {
  setType: 'C';
  garmentType: string;
  howLongHad: string;
  cost: string;
  howGot: string;
  whyNotWear: string;
  disposalPlan: string;
  timestamp: string;
}

export type SetResponse = SetAResponse | SetBResponse | SetCResponse;

export interface BaselineResponses {
  wardrobeSize: 'minimal' | 'moderate' | 'extensive';
  shoppingFrequency: 'rarely' | 'occasionally' | 'frequently';
  disposalHabit: 'rarely' | 'periodically' | 'regularly';
  primaryDriver: 'function' | 'emotion' | 'social';
}

export interface ValueMeters {
  social: number;
  emotional: number;
  functional: number;
  inflowOutflow: number;
}

export interface PersonaProfile {
  name: string;
  icon: string;
  tagline: string;
  poeticDescription: string;
  insight: string;
  researchProfile: {
    acquisitionDriver: string;
    retentionPattern: string;
    disposalTrigger: string;
    flowRate: 'low' | 'moderate' | 'high';
    primaryValue: string;
  };
}

export interface GameData {
  sessionId: string;
  timestamp: string;
  setsCompleted: number;
  baselineResponses: BaselineResponses | null;
  values: ValueMeters;
  persona: string;
  responses: SetResponse[];
}

export type GameState = 'welcome' | 'baseline' | 'set-intro' | 'question' | 'set-complete' | 'final';
export type CurrentSet = 'A' | 'B' | 'C' | null;
export type ActiveSet = Exclude<CurrentSet, null>;
export type MotionPreference = boolean | null;

export interface QuestionStep {
  id: string;
  renderIndex: number;
  optional?: boolean;
  shouldShow?: (response: Partial<SetResponse>) => boolean;
}

export type SubmissionResult = { ok: true } | { ok: false; error: string };
```

Verify: the bodies of every type above are byte-for-byte identical to the originals in `MirrorGame.tsx`. The only changes are the `export` keyword prefix and that `SubmissionResult` joins the rest at the bottom.

- [ ] **Step 2: Delete the original type definitions from `MirrorGame.tsx`.**

Remove:
- The entire `// TYPE DEFINITIONS` block (interfaces `SetAResponse`, `SetBResponse`, `SetCResponse`, type alias `SetResponse`, interfaces `BaselineResponses`, `ValueMeters`, `PersonaProfile`, `GameData`, type aliases `GameState`, `CurrentSet`, `ActiveSet`, `MotionPreference`, interface `QuestionStep`).
- The standalone `type SubmissionResult = ...` line above `submitToSupabase`.

Keep the `// ============================================================================` heading bars if they make grep navigation easier; they are decorative.

- [ ] **Step 3: Add the import at the top of `MirrorGame.tsx` (immediately after the existing lucide-react import block).**

```ts
import type {
  SetAResponse,
  SetBResponse,
  SetCResponse,
  SetResponse,
  BaselineResponses,
  ValueMeters,
  PersonaProfile,
  GameData,
  GameState,
  CurrentSet,
  ActiveSet,
  MotionPreference,
  QuestionStep,
  SubmissionResult,
} from './types';
```

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck`
Expected: 0 errors. If any unresolved type appears, the most likely cause is a missed reference inside a function further down the file — add the relevant type to the import block above.

---

### Task 2: Extract `constants/design.ts`

**Files:**
- Create: `src/app/components/mirror/constants/design.ts`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/constants/design.ts`.**

Move the following from `MirrorGame.tsx` verbatim (currently around lines 131–174):
- `const COLORS = { ... }`
- `const MOTION_EASE = [0.22, 1, 0.36, 1] as const;`
- `function fadeRiseMotion(shouldReduceMotion: MotionPreference, delay = 0) { ... }`
- `function scaleInMotion(shouldReduceMotion: MotionPreference, delay = 0) { ... }`

Prepend `export` to each declaration. At the top of the new file:

```ts
import type { MotionPreference } from '../types';
```

The full module body has only these four exports. No other code.

- [ ] **Step 2: Delete those declarations from `MirrorGame.tsx`.**

- [ ] **Step 3: Add the import in `MirrorGame.tsx`** (immediately after the `import type` block from Task 1):

```ts
import { COLORS, MOTION_EASE, fadeRiseMotion, scaleInMotion } from './constants/design';
```

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Task 3: Extract `constants/garments.ts`

**Files:**
- Create: `src/app/components/mirror/constants/garments.ts`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/constants/garments.ts`.**

Move `const GARMENT_OPTIONS = [...]` (around line 176) verbatim, prepend `export`.

Also move `getGarmentIcon` and `getGarmentLabel` (currently methods of `MirrorGame`, around lines 905–950). They have no React/state dependency — refactor them into plain functions:

```ts
import { GARMENT_OPTIONS } from './garments';

// (already in the same file — illustrative)
```

Final shape of the file (the helpers were arrow-method declarations inside `MirrorGame` before; here they become exported plain functions with identical bodies):

```ts
export const GARMENT_OPTIONS = [
  // ...paste the same array members verbatim...
];

export function getGarmentIcon(garmentType?: string): string {
  // ...paste the body of the original arrow function verbatim...
}

export function getGarmentLabel(garmentType?: string): string {
  // ...paste the body of the original arrow function verbatim...
}
```

Verify the array contents and function bodies match the originals exactly (icons, keyword matches, default returns).

- [ ] **Step 2: Delete `const GARMENT_OPTIONS = ...` from `MirrorGame.tsx`.**

- [ ] **Step 3: Delete the `getGarmentIcon` and `getGarmentLabel` arrow-method declarations from inside the `MirrorGame` component body.**

- [ ] **Step 4: Add the import in `MirrorGame.tsx`** (with the other `./constants/*` imports):

```ts
import { GARMENT_OPTIONS, getGarmentIcon, getGarmentLabel } from './constants/garments';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors. Confirm there are no remaining inline references to a method-style call like `this.getGarmentIcon(...)`; existing call sites use bare `getGarmentIcon(...)` and `getGarmentLabel(...)` and will resolve to the imported functions.

---

### Task 4: Extract `constants/questionSteps.ts`

**Files:**
- Create: `src/app/components/mirror/constants/questionSteps.ts`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/constants/questionSteps.ts`.**

Move from `MirrorGame.tsx` verbatim, prepending `export`:
- `const QUESTION_STEPS: Record<ActiveSet, QuestionStep[]> = { A: [...], B: [...], C: [...] }`
- `function getVisibleQuestionSteps(...) { ... }`

Also move `getSetCategoryName` (currently a method around line 952) — it has no state deps. Convert to a plain function with the same body:

```ts
export function getSetCategoryName(setType?: 'A' | 'B' | 'C'): string {
  switch (setType) {
    case 'A': return 'Recent Purchase';
    case 'B': return 'Favorite Garment';
    case 'C': return 'Disposal';
    default: return '';
  }
}
```

At the top:

```ts
import type { ActiveSet, QuestionStep, SetResponse } from '../types';
```

- [ ] **Step 2: Delete those three declarations from `MirrorGame.tsx`.**

- [ ] **Step 3: Add the import in `MirrorGame.tsx`**:

```ts
import { QUESTION_STEPS, getVisibleQuestionSteps, getSetCategoryName } from './constants/questionSteps';
```

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Task 5: Extract `constants/archetypes.ts` and `constants/baselineQuestions.ts`

**Files:**
- Create: `src/app/components/mirror/constants/archetypes.ts`
- Create: `src/app/components/mirror/constants/baselineQuestions.ts`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/constants/archetypes.ts`.**

Move `const ARCHETYPE_INFO = { ... }` (currently lines 411–443) verbatim, prepend `export`. No imports needed.

- [ ] **Step 2: Create `src/app/components/mirror/constants/baselineQuestions.ts`.**

Move `const BASELINE_QUESTIONS = [ ... ]` (currently lines 444–466) verbatim, prepend `export`. If `BASELINE_QUESTIONS` references any types from `../types`, add the appropriate `import type { ... } from '../types';` line — otherwise no imports needed.

- [ ] **Step 3: Delete both constants from `MirrorGame.tsx`.**

- [ ] **Step 4: Add the imports in `MirrorGame.tsx`**:

```ts
import { ARCHETYPE_INFO } from './constants/archetypes';
import { BASELINE_QUESTIONS } from './constants/baselineQuestions';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Task 6: Extract `lib/session.ts` and `lib/export.ts`

**Files:**
- Create: `src/app/components/mirror/lib/session.ts`
- Create: `src/app/components/mirror/lib/export.ts`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/lib/session.ts`.**

Move `function generateSessionId()` (line 234–236) verbatim, prepend `export`. No imports needed.

- [ ] **Step 2: Create `src/app/components/mirror/lib/export.ts`.**

Move verbatim and prepend `export` on each:
- `function exportGameData(data: GameData): void`
- `function exportCSV(data: GameData): void`
- `function csvQuote(value: string | number | null | undefined): string`
- `function buildResponseRow(data: GameData, r: SetResponse): (string | number)[]`
- `function generateCSVString(data: GameData): string`

At the top:

```ts
import type { GameData, SetResponse } from '../types';
```

The file has only these five exports. The relative order matters only for readability; functions can reference each other through hoisting.

- [ ] **Step 3: Delete those six declarations from `MirrorGame.tsx`.**

- [ ] **Step 4: Add the imports in `MirrorGame.tsx`**:

```ts
import { generateSessionId } from './lib/session';
import { exportGameData, exportCSV, buildResponseRow } from './lib/export';
```

(Note: `csvQuote` and `generateCSVString` are internal-only after the move — only `exportGameData`, `exportCSV`, and `buildResponseRow` are referenced from outside `lib/export.ts`. Do not re-import the internal ones.)

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Task 7: Extract `lib/supabase.ts`

**Files:**
- Create: `src/app/components/mirror/lib/supabase.ts`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/lib/supabase.ts`.**

Move `async function submitToSupabase(data: GameData): Promise<SubmissionResult> { ... }` verbatim, prepend `export`.

At the top of the new file:

```ts
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, publishableKey } from '../../../../../utils/supabase/info';
import type { GameData, SubmissionResult } from '../types';
import { buildResponseRow } from './export';
```

> **Path note:** The current import in `MirrorGame.tsx` is `'../../../../utils/supabase/info'` (four `..`). The new file is one directory deeper (`mirror/lib/`), so its path must use **five** `..`. Confirm by counting: `lib/` → `mirror/` → `components/` → `app/` → `src/` → repo root → `utils/supabase/info`. That is five `..`.

- [ ] **Step 2: Delete `submitToSupabase` from `MirrorGame.tsx`.**

- [ ] **Step 3: Delete the now-unused imports from the top of `MirrorGame.tsx`**:
- `import { createClient } from '@supabase/supabase-js';`
- `import { supabaseUrl, publishableKey } from '../../../../utils/supabase/info';`

- [ ] **Step 4: Add the import in `MirrorGame.tsx`**:

```ts
import { submitToSupabase } from './lib/supabase';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Task 8: Extract `lib/scoring.ts`

**Files:**
- Create: `src/app/components/mirror/lib/scoring.ts`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/lib/scoring.ts`.**

Move verbatim and prepend `export` on each:
- `const clampValue = (value: number) => ...`
- `function calculateValuesFromMirrorGame(...)`
- `function calculatePersona(...)`
- `function getMirrorInsights(...)`

At the top:

```ts
import type {
  BaselineResponses,
  PersonaProfile,
  SetAResponse,
  SetBResponse,
  SetCResponse,
  SetResponse,
  ValueMeters,
} from '../types';
```

- [ ] **Step 2: Delete those four declarations from `MirrorGame.tsx`.**

- [ ] **Step 3: Add the import in `MirrorGame.tsx`**:

```ts
import { calculateValuesFromMirrorGame, calculatePersona, getMirrorInsights } from './lib/scoring';
```

(`clampValue` is internal to `lib/scoring.ts` only — do not re-import.)

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Phase 1 checkpoint

- [ ] **Run `pnpm build`.** Expected: exits 0; `dist/` regenerates.
- [ ] **Run `pnpm dev` and smoke-test:** welcome → baseline (all 4 questions) → set A start → back navigation → continue → finish set A → finish set B → finish set C → final dashboard renders all four tabs → CSV/JSON downloads work → "Try again" button on a forced failure (optional) → "New Reflection" reloads. Stop the dev server when done.
- [ ] **Line count check:** `wc -l src/app/components/mirror/MirrorGame.tsx`. Expect ~2,600 lines (roughly 500 lines moved out). If much higher, something was missed; investigate before continuing.

---

## PHASE 2 — Extract shared UI primitives

After Phase 1 the orchestrator is still huge but only because of the embedded UI components and screens. Phase 2 extracts the small, prop-driven UI primitives.

### Task 9: Extract `ui/SelectionTile.tsx`

**Files:**
- Create: `src/app/components/mirror/ui/SelectionTile.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/ui/SelectionTile.tsx`.**

Move the entire `function SelectionTile(...) { ... }` block (currently around lines 579–658) verbatim, prepend `export`. At the top:

```ts
import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { MOTION_EASE } from '../constants/design';
```

> If the original `SelectionTile` references any other lucide icons or motion helpers, add them to the imports. Confirm by re-reading the function body before moving.

- [ ] **Step 2: Delete `SelectionTile` from `MirrorGame.tsx`.**

- [ ] **Step 3: Add the import in `MirrorGame.tsx`** (group with future `./ui/*` imports):

```ts
import { SelectionTile } from './ui/SelectionTile';
```

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Task 10: Extract `ui/ContinueButton.tsx` and `ui/SecondaryButton.tsx`

**Files:**
- Create: `src/app/components/mirror/ui/ContinueButton.tsx`
- Create: `src/app/components/mirror/ui/SecondaryButton.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/ui/ContinueButton.tsx`.**

Move `function ContinueButton(...)` (around lines 660–691) verbatim, prepend `export`. At the top:

```ts
import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { MOTION_EASE } from '../constants/design';
```

(Adjust the lucide imports to match exactly what the function uses.)

- [ ] **Step 2: Create `src/app/components/mirror/ui/SecondaryButton.tsx`.**

Move `function SecondaryButton(...)` (around lines 693–720) verbatim, prepend `export`. Imports analogous to above — match the exact icons / motion helpers used by the function body.

- [ ] **Step 3: Delete both functions from `MirrorGame.tsx`.**

- [ ] **Step 4: Add the imports in `MirrorGame.tsx`**:

```ts
import { ContinueButton } from './ui/ContinueButton';
import { SecondaryButton } from './ui/SecondaryButton';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Task 11: Extract `ui/QuestionScreen.tsx`

**Files:**
- Create: `src/app/components/mirror/ui/QuestionScreen.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/ui/QuestionScreen.tsx`.**

Move `function QuestionScreen({ title, subtitle, children, icon }: { ... }) { ... }` (around lines 722–753) verbatim, prepend `export`. Imports should match what the function uses (likely `React` and possibly nothing from `motion/react` — verify by reading the body).

- [ ] **Step 2: Delete `QuestionScreen` from `MirrorGame.tsx`.**

- [ ] **Step 3: Add the import in `MirrorGame.tsx`**:

```ts
import { QuestionScreen } from './ui/QuestionScreen';
```

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Task 12: Extract `ui/ValueFingerprintRadar.tsx`

**Files:**
- Create: `src/app/components/mirror/ui/ValueFingerprintRadar.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/ui/ValueFingerprintRadar.tsx`.**

Move `function ValueFingerprintRadar({ values }: { values: ValueMeters }) { ... }` (around lines 561–573) verbatim, prepend `export`. At the top:

```ts
import React from 'react';
import type { ValueMeters } from '../types';
```

- [ ] **Step 2: Delete `ValueFingerprintRadar` from `MirrorGame.tsx`.**

- [ ] **Step 3: Add the import in `MirrorGame.tsx`**:

```ts
import { ValueFingerprintRadar } from './ui/ValueFingerprintRadar';
```

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Phase 2 checkpoint

- [ ] **Run `pnpm build`.** Expected: 0 errors.
- [ ] **Smoke test in `pnpm dev`:** Buttons still animate, selection tiles still show check icons + selected state, question card scaffolding still renders. Visual diff should be **zero**.
- [ ] **Line count check:** `MirrorGame.tsx` should now be ~2,400 lines.

---

## PHASE 3 — Extract screen-level components

Phase 3 moves whole screens out of `MirrorGame.tsx`. Each screen receives the state and handlers it needs as props. The orchestrator keeps **all** state and event handlers and only renders the appropriate screen based on `gameState`.

### Task 13: Extract `screens/WelcomeScreen.tsx`

**Files:**
- Create: `src/app/components/mirror/screens/WelcomeScreen.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/screens/WelcomeScreen.tsx`.**

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { MOTION_EASE, fadeRiseMotion, scaleInMotion } from '../constants/design';
import { ContinueButton } from '../ui/ContinueButton';
import type { MotionPreference } from '../types';

interface WelcomeScreenProps {
  shouldReduceMotion: MotionPreference;
  onStart: () => void;
}

export function WelcomeScreen({ shouldReduceMotion, onStart }: WelcomeScreenProps) {
  return (
    /* paste the JSX returned by the `if (gameState === 'welcome') { return ( ... ) }` block */
    /* (currently around lines 2204–2283 of MirrorGame.tsx) */
    /* Replace `handleStartGame` references inside the JSX with `onStart`. */
  );
}
```

> Paste the JSX block exactly as it appears in `MirrorGame.tsx`. The only edit inside the JSX is replacing the `onClick={handleStartGame}` prop on the `<ContinueButton ... />` line with `onClick={onStart}`.

- [ ] **Step 2: Replace the welcome branch in `MirrorGame.tsx`.**

Find the block:

```tsx
if (gameState === 'welcome') {
  return (
    /* large JSX */
  );
}
```

Replace it with:

```tsx
if (gameState === 'welcome') {
  return <WelcomeScreen shouldReduceMotion={shouldReduceMotion} onStart={handleStartGame} />;
}
```

- [ ] **Step 3: Add the import in `MirrorGame.tsx`** (group with future `./screens/*` imports):

```ts
import { WelcomeScreen } from './screens/WelcomeScreen';
```

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors. Manually smoke-test the welcome screen in `pnpm dev` (it should look and behave identically; `Begin` still starts the baseline flow).

---

### Task 14: Extract `screens/SetIntroScreen.tsx`

**Files:**
- Create: `src/app/components/mirror/screens/SetIntroScreen.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/screens/SetIntroScreen.tsx`.**

The current `renderSetIntro` method (around lines 1296–1358) branches on `currentSet` and returns one of three JSX trees, plus the outer `gameState === 'set-intro'` wrapper at ~2285–2297 wraps it in motion + gradient. Combine both into a single component:

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { fadeRiseMotion, scaleInMotion } from '../constants/design';
import { ContinueButton } from '../ui/ContinueButton';
import type { CurrentSet, MotionPreference } from '../types';

interface SetIntroScreenProps {
  shouldReduceMotion: MotionPreference;
  currentSet: CurrentSet;
  onStartSet: () => void;
}

export function SetIntroScreen({ shouldReduceMotion, currentSet, onStartSet }: SetIntroScreenProps) {
  /* Combine the outer JSX from the gameState === 'set-intro' branch with the renderSetIntro switch. */
  /* Replace `handleStartSet` with `onStartSet`. */
}
```

Concrete merge: the outer wrapper is

```tsx
<div className="wm-screen-centered gradient-bg-animated">
  <div className="gradient-overlay-animated" />
  <motion.div className="wm-content" {...scaleInMotion(shouldReduceMotion)}>
    {/* inner content from renderSetIntro() */}
  </motion.div>
</div>
```

and the inner switch on `currentSet` (three cases: `'A'`, `'B'`, `'C'`) is what was in `renderSetIntro`. Paste both verbatim; do not add new conditions or copy.

- [ ] **Step 2: Delete the `renderSetIntro` method from `MirrorGame.tsx`** (around lines 1296–1358).

- [ ] **Step 3: Replace the `set-intro` branch in `MirrorGame.tsx`** with:

```tsx
if (gameState === 'set-intro') {
  return (
    <SetIntroScreen
      shouldReduceMotion={shouldReduceMotion}
      currentSet={currentSet}
      onStartSet={handleStartSet}
    />
  );
}
```

- [ ] **Step 4: Add the import**:

```ts
import { SetIntroScreen } from './screens/SetIntroScreen';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors. Manually verify all three set intros render correctly in `pnpm dev`.

---

### Task 15: Extract `screens/SetCompleteScreen.tsx`

**Files:**
- Create: `src/app/components/mirror/screens/SetCompleteScreen.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/screens/SetCompleteScreen.tsx`.**

Move the entire JSX returned by the `if (gameState === 'set-complete') { ... }` branch (currently around lines 2357–2401). The screen receives `currentSet`, `allResponses.length`, and `handleContinueToNextSet`.

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { fadeRiseMotion } from '../constants/design';
import { ContinueButton } from '../ui/ContinueButton';
import type { CurrentSet, MotionPreference } from '../types';

interface SetCompleteScreenProps {
  shouldReduceMotion: MotionPreference;
  currentSet: CurrentSet;
  completedCount: number;
  onContinue: () => void;
}

export function SetCompleteScreen({
  shouldReduceMotion,
  currentSet,
  completedCount,
  onContinue,
}: SetCompleteScreenProps) {
  const completionPercentage = (completedCount / 3) * 100;
  return (
    /* paste the JSX, substituting:
       - `allResponses.length` → `completedCount`
       - `handleContinueToNextSet` → `onContinue` */
  );
}
```

- [ ] **Step 2: Replace the branch in `MirrorGame.tsx`**:

```tsx
if (gameState === 'set-complete') {
  return (
    <SetCompleteScreen
      shouldReduceMotion={shouldReduceMotion}
      currentSet={currentSet}
      completedCount={allResponses.length}
      onContinue={handleContinueToNextSet}
    />
  );
}
```

- [ ] **Step 3: Add the import**:

```ts
import { SetCompleteScreen } from './screens/SetCompleteScreen';
```

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors.

---

### Task 16: Extract `screens/BaselineScreen.tsx`

**Files:**
- Create: `src/app/components/mirror/screens/BaselineScreen.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/screens/BaselineScreen.tsx`.**

The `renderBaselineQuestions` method (lines 1161–1294) is the entire baseline screen. It depends on the following state/handlers from the orchestrator:
- `baselineQuestionIndex` (read)
- `baselineDraft` (read; specifically `baselineDraft[currentQ.id]`)
- `textInputValue` (read)
- `setTextInputValue` (write)
- `handleBaselineAnswer(key, value)` (call)
- `handleBaselineBack()` (call)
- `shouldReduceMotion` (read)

Move the method body into a component:

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { fadeRiseMotion } from '../constants/design';
import { BASELINE_QUESTIONS } from '../constants/baselineQuestions';
import { ContinueButton } from '../ui/ContinueButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import type { BaselineResponses, MotionPreference } from '../types';

interface BaselineScreenProps {
  shouldReduceMotion: MotionPreference;
  baselineQuestionIndex: number;
  baselineDraft: Partial<BaselineResponses>;
  textInputValue: string;
  setTextInputValue: (value: string) => void;
  onAnswer: (key: keyof BaselineResponses, value: string) => void;
  onBack: () => void;
}

export function BaselineScreen({
  shouldReduceMotion,
  baselineQuestionIndex,
  baselineDraft,
  textInputValue,
  setTextInputValue,
  onAnswer,
  onBack,
}: BaselineScreenProps) {
  const currentQ = BASELINE_QUESTIONS[baselineQuestionIndex];
  const progress = ((baselineQuestionIndex + 1) / BASELINE_QUESTIONS.length) * 100;
  const selected = baselineDraft[currentQ.id];
  return (
    /* paste the original JSX, replacing:
       - handleBaselineAnswer(...)  → onAnswer(...)
       - handleBaselineBack()       → onBack()
       - (no other handler renames needed) */
  );
}
```

> The original `renderBaselineQuestions` may use a few helper references (e.g. `submitTextAnswer`) that are NOT in the prop list above. Re-read lines 1161–1294 carefully — if any other handler is referenced, add it to the props in the same `handle... → on...` rename convention. The shape above is the baseline; expand if needed.

- [ ] **Step 2: Delete `renderBaselineQuestions` from `MirrorGame.tsx`.**

- [ ] **Step 3: Replace the `baseline` branch in `MirrorGame.tsx`** (currently `if (gameState === 'baseline') return renderBaselineQuestions();`) with:

```tsx
if (gameState === 'baseline') {
  return (
    <BaselineScreen
      shouldReduceMotion={shouldReduceMotion}
      baselineQuestionIndex={baselineQuestionIndex}
      baselineDraft={baselineDraft}
      textInputValue={textInputValue}
      setTextInputValue={setTextInputValue}
      onAnswer={handleBaselineAnswer}
      onBack={handleBaselineBack}
    />
  );
}
```

- [ ] **Step 4: Add the import**:

```ts
import { BaselineScreen } from './screens/BaselineScreen';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors. Manually smoke-test all four baseline questions and the back button.

---

### Phase 3a checkpoint (before tackling FinalDashboard and QuestionRunner)

- [ ] **Run `pnpm build`.** 0 errors.
- [ ] **Smoke test:** welcome → baseline (all 4 questions, including back) → set A intro → set A first question renders → set complete screen (after finishing A in dev). Visual diff: zero.

---

### Task 17: Extract `screens/FinalDashboard.tsx`

> **The dashboard is ~750 lines** and contains 4 tab panels. Keep them all in one file unless you reach a clear seam — they share state (`activeTab`, `selectedArchetype`, submission status, retry button). Splitting the tabs into separate files is **out of scope** for this plan.

**Files:**
- Create: `src/app/components/mirror/screens/FinalDashboard.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Identify the prop surface.**

Re-read the `if (gameState === 'final') { ... }` branch (currently lines 2403–3148) and list every external identifier it references. At minimum it will need:
- State (read): `allResponses`, `baselineResponses`, `sessionId`, `sessionStartTime`, `activeTab`, `selectedArchetype`, `emailSent`, `submissionError`, `statusDismissed`, `showThankYou`, `shouldReduceMotion`
- State (write): `setActiveTab`, `setSelectedArchetype`, `setEmailSent`, `setSubmissionError`, `setStatusDismissed`
- Handlers: `handleStartNewRun`, `handleShareWithOthers`, `handleShareResults`

The computed locals at the top of the branch (`values`, `persona`, `insights`, `finalGameData`, `baselineValues`) move inside the new component.

- [ ] **Step 2: Create `src/app/components/mirror/screens/FinalDashboard.tsx`.**

```tsx
import React from 'react';
import { motion } from 'motion/react';
import {
  /* the full lucide icon list used by the dashboard branch */
} from 'lucide-react';
import { fadeRiseMotion, scaleInMotion } from '../constants/design';
import { ARCHETYPE_INFO } from '../constants/archetypes';
import { exportGameData, exportCSV } from '../lib/export';
import { submitToSupabase } from '../lib/supabase';
import { calculateValuesFromMirrorGame, calculatePersona, getMirrorInsights } from '../lib/scoring';
import { ValueFingerprintRadar } from '../ui/ValueFingerprintRadar';
import type {
  BaselineResponses,
  GameData,
  MotionPreference,
  PersonaProfile,
  SetResponse,
} from '../types';

interface FinalDashboardProps {
  shouldReduceMotion: MotionPreference;
  sessionId: string;
  sessionStartTime: string;
  allResponses: SetResponse[];
  baselineResponses: BaselineResponses | null;
  activeTab: 'dashboard' | 'insights' | 'data' | 'share';
  setActiveTab: (tab: 'dashboard' | 'insights' | 'data' | 'share') => void;
  selectedArchetype: string | null;
  setSelectedArchetype: (key: string | null) => void;
  emailSent: boolean | null;
  setEmailSent: (v: boolean | null) => void;
  submissionError: string | null;
  setSubmissionError: (v: string | null) => void;
  statusDismissed: boolean;
  setStatusDismissed: (v: boolean) => void;
  showThankYou: boolean;
  onStartNewRun: () => void;
  onShareWithOthers: () => void;
  onShareResults: (persona: PersonaProfile) => void;
}

export function FinalDashboard(props: FinalDashboardProps) {
  const {
    allResponses, baselineResponses, sessionId, sessionStartTime,
    activeTab, setActiveTab, selectedArchetype, setSelectedArchetype,
    emailSent, setEmailSent, submissionError, setSubmissionError,
    statusDismissed, setStatusDismissed, showThankYou,
    onStartNewRun, onShareWithOthers, onShareResults, shouldReduceMotion,
  } = props;

  const values = calculateValuesFromMirrorGame(allResponses, baselineResponses);
  const persona = calculatePersona(values);
  const insights = getMirrorInsights(allResponses, baselineResponses, persona);
  const finalGameData: GameData = {
    sessionId,
    timestamp: sessionStartTime,
    setsCompleted: allResponses.length,
    baselineResponses,
    values,
    persona: persona.name,
    responses: allResponses,
  };

  const baselineValues = { social: 35, emotional: 35, functional: 35, inflowOutflow: 35 };
  if (baselineResponses) {
    if (baselineResponses.primaryDriver === 'social') baselineValues.social += 20;
    if (baselineResponses.primaryDriver === 'emotion') baselineValues.emotional += 20;
    if (baselineResponses.primaryDriver === 'function') baselineValues.functional += 20;
    if (baselineResponses.wardrobeSize === 'extensive') baselineValues.inflowOutflow += 12;
    if (baselineResponses.wardrobeSize === 'minimal') baselineValues.functional += 10;
    if (baselineResponses.shoppingFrequency === 'frequently') baselineValues.inflowOutflow += 20;
    if (baselineResponses.shoppingFrequency === 'rarely') baselineValues.functional += 8;
    if (baselineResponses.disposalHabit === 'regularly') baselineValues.inflowOutflow += 18;
    if (baselineResponses.disposalHabit === 'rarely') baselineValues.emotional += 10;
  }

  return (
    /* Paste the JSX of the gameState === 'final' branch verbatim, with these renames inside the JSX:
       - handleStartNewRun         → onStartNewRun
       - handleShareWithOthers     → onShareWithOthers
       - handleShareResults        → onShareResults  (called as `onShareResults(persona)`)
       The inline onClick for the "Try again" button reuses `setEmailSent`, `setSubmissionError`,
       `setStatusDismissed`, and `submitToSupabase` — those already work via props/imports. */
  );
}
```

> Concrete lucide icons used by the dashboard: copy the exact icon list from the existing top-of-file lucide import in `MirrorGame.tsx` filtered down to the ones referenced inside the `gameState === 'final'` branch (e.g. `Share2`, `LayoutDashboard`, `TrendingUp`, `List`, `Eye`, `FileDown`, `Users`, `Recycle`, etc.). Read the JSX and list precisely. Do not over-import.

- [ ] **Step 3: Delete the entire `if (gameState === 'final') { ... }` branch from `MirrorGame.tsx`.**

- [ ] **Step 4: Replace it with:**

```tsx
if (gameState === 'final') {
  return (
    <FinalDashboard
      shouldReduceMotion={shouldReduceMotion}
      sessionId={sessionId}
      sessionStartTime={sessionStartTime}
      allResponses={allResponses}
      baselineResponses={baselineResponses}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selectedArchetype={selectedArchetype}
      setSelectedArchetype={setSelectedArchetype}
      emailSent={emailSent}
      setEmailSent={setEmailSent}
      submissionError={submissionError}
      setSubmissionError={setSubmissionError}
      statusDismissed={statusDismissed}
      setStatusDismissed={setStatusDismissed}
      showThankYou={showThankYou}
      onStartNewRun={handleStartNewRun}
      onShareWithOthers={handleShareWithOthers}
      onShareResults={handleShareResults}
    />
  );
}
```

- [ ] **Step 5: Add the import**:

```ts
import { FinalDashboard } from './screens/FinalDashboard';
```

- [ ] **Step 6: Verify.**

Run: `pnpm typecheck` → 0 errors. Manually complete a full run through all 3 sets and verify the dashboard renders identically on every tab. Confirm CSV/JSON downloads still work and the persistent failure banner + Try again retry still function.

---

## PHASE 4 — Extract question renderers and the question runner shell

The largest remaining chunk in `MirrorGame.tsx` is the trio of `renderSetAQuestion`, `renderSetBQuestion`, `renderSetCQuestion` (lines 1370–2194) plus their shared `renderOtherInput` / `renderGarmentGrid` helpers and the `gameState === 'question'` wrapper.

### Task 18: Extract `questions/shared.tsx`

**Files:**
- Create: `src/app/components/mirror/questions/shared.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

The two helpers `renderOtherInput(key, placeholder)` and `renderGarmentGrid(selectedValue)` are prop-driven once you replace their closure references with explicit parameters.

- [ ] **Step 1: Create `src/app/components/mirror/questions/shared.tsx`.**

```tsx
import React from 'react';
import { GARMENT_OPTIONS } from '../constants/garments';
import { ContinueButton } from '../ui/ContinueButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { SelectionTile } from '../ui/SelectionTile';

interface OtherInputProps {
  textInputValue: string;
  setTextInputValue: (v: string) => void;
  onSubmit: () => void;     // wraps `handleOtherTextAnswer(key)`
  onSkip: () => void;       // wraps `handleOtherTextSkip(key)`
  placeholder?: string;
}

export function OtherInput({ textInputValue, setTextInputValue, onSubmit, onSkip, placeholder = 'Type your answer...' }: OtherInputProps) {
  return (
    /* paste the JSX from renderOtherInput verbatim, replacing:
       - handleOtherTextAnswer(key) → onSubmit()
       - handleOtherTextSkip(key)   → onSkip()
       - textInputValue/setTextInputValue references stay (they are props) */
  );
}

interface GarmentGridProps {
  selectedValue?: string;
  onSelect: (value: string) => void;   // wraps `handleAnswer('garmentType', value)`
  onSelectOther: () => void;           // wraps `handleOtherSelection('garmentType')`
}

export function GarmentGrid({ selectedValue, onSelect, onSelectOther }: GarmentGridProps) {
  return (
    /* paste the JSX from renderGarmentGrid verbatim, replacing:
       - handleAnswer('garmentType', option.value) → onSelect(option.value)
       - handleOtherSelection('garmentType')       → onSelectOther() */
  );
}
```

- [ ] **Step 2: Leave the original `renderOtherInput` and `renderGarmentGrid` methods in `MirrorGame.tsx` for now**, but rewrite them as thin wrappers that delegate to the new components:

```tsx
const renderOtherInput = (key: string, placeholder = 'Type your answer...') => (
  <OtherInput
    textInputValue={textInputValue}
    setTextInputValue={setTextInputValue}
    onSubmit={() => handleOtherTextAnswer(key)}
    onSkip={() => handleOtherTextSkip(key)}
    placeholder={placeholder}
  />
);

const renderGarmentGrid = (selectedValue?: string) => (
  <GarmentGrid
    selectedValue={selectedValue}
    onSelect={(value) => handleAnswer('garmentType', value)}
    onSelectOther={() => handleOtherSelection('garmentType')}
  />
);
```

This way `renderSetAQuestion` / `renderSetBQuestion` / `renderSetCQuestion` continue to call `renderOtherInput(...)` / `renderGarmentGrid(...)` unchanged for now.

- [ ] **Step 3: Add the import**:

```ts
import { OtherInput, GarmentGrid } from './questions/shared';
```

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors. Smoke test: select a garment in set A → "Other" path → confirm input + skip + continue all work.

---

### Task 19: Extract `questions/SetAQuestion.tsx`

**Files:**
- Create: `src/app/components/mirror/questions/SetAQuestion.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

The original `renderSetAQuestion` (lines 1370–1611) uses these orchestrator-scoped values:
- `currentQuestionIndex` (read)
- `currentResponse` (read, cast as `Partial<SetAResponse>`)
- `textInputValue`, `setTextInputValue` (read/write)
- `handleAnswer`, `handleSkip`, `handleMultiSelectToggle`, `handleOtherSelection`, `handleOtherTextAnswer`, `handleOtherTextSkip`, `submitTextAnswer` (call)
- `renderOtherInput`, `renderGarmentGrid` (call — now provided via `OtherInput`/`GarmentGrid`)

- [ ] **Step 1: Create `src/app/components/mirror/questions/SetAQuestion.tsx`.**

Define a component that takes ALL the closure references as props:

```tsx
import React from 'react';
import { /* ... necessary lucide icons used inside renderSetAQuestion ... */ } from 'lucide-react';
import { SelectionTile } from '../ui/SelectionTile';
import { ContinueButton } from '../ui/ContinueButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { OtherInput, GarmentGrid } from './shared';
import type { SetAResponse, SetResponse } from '../types';

interface SetAQuestionProps {
  currentQuestionIndex: number;
  currentResponse: Partial<SetResponse>;
  textInputValue: string;
  setTextInputValue: (v: string) => void;
  onAnswer: (key: string, value: any) => void;
  onSkip: (key: string) => void;
  onMultiSelectToggle: (key: string, value: string) => void;
  onOtherSelection: (key: string) => void;
  onOtherTextAnswer: (key: string) => void;
  onOtherTextSkip: (key: string) => void;
  submitTextAnswer: (key: string, fallbackValue?: string) => void;
}

export function SetAQuestion(props: SetAQuestionProps) {
  const {
    currentQuestionIndex, currentResponse, textInputValue, setTextInputValue,
    onAnswer, onSkip, onMultiSelectToggle, onOtherSelection,
    onOtherTextAnswer, onOtherTextSkip, submitTextAnswer,
  } = props;
  const resp = currentResponse as Partial<SetAResponse>;

  /* paste the entire body of renderSetAQuestion verbatim, replacing each closure call:
     - handleAnswer(...)          → onAnswer(...)
     - handleSkip(...)            → onSkip(...)
     - handleMultiSelectToggle(...) → onMultiSelectToggle(...)
     - handleOtherSelection(...)  → onOtherSelection(...)
     - handleOtherTextAnswer(...) → onOtherTextAnswer(...)
     - handleOtherTextSkip(...)   → onOtherTextSkip(...)
     - submitTextAnswer(...)      → submitTextAnswer(...)   (already prop)
     - renderOtherInput(key, p)   → <OtherInput textInputValue={textInputValue} setTextInputValue={setTextInputValue} onSubmit={() => onOtherTextAnswer(key)} onSkip={() => onOtherTextSkip(key)} placeholder={p} />
     - renderGarmentGrid(value)   → <GarmentGrid selectedValue={value} onSelect={(v) => onAnswer('garmentType', v)} onSelectOther={() => onOtherSelection('garmentType')} />
     The function still returns the same case-by-case JSX based on currentQuestionIndex. */
}
```

- [ ] **Step 2: Delete `renderSetAQuestion` from `MirrorGame.tsx`.**

- [ ] **Step 3: Leave `renderQuestion` for now**, but update it to call the new component when in set A:

```tsx
const renderQuestion = () => {
  if (currentSet === 'A') {
    return (
      <SetAQuestion
        currentQuestionIndex={currentQuestionIndex}
        currentResponse={currentResponse}
        textInputValue={textInputValue}
        setTextInputValue={setTextInputValue}
        onAnswer={handleAnswer}
        onSkip={handleSkip}
        onMultiSelectToggle={handleMultiSelectToggle}
        onOtherSelection={handleOtherSelection}
        onOtherTextAnswer={handleOtherTextAnswer}
        onOtherTextSkip={handleOtherTextSkip}
        submitTextAnswer={submitTextAnswer}
      />
    );
  }
  if (currentSet === 'B') return renderSetBQuestion();
  if (currentSet === 'C') return renderSetCQuestion();
  return null;
};
```

- [ ] **Step 4: Add the import**:

```ts
import { SetAQuestion } from './questions/SetAQuestion';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors. Smoke-test the entire Set A flow in `pnpm dev` (every question, every option, every back/skip path). Visual diff: zero.

---

### Task 20: Extract `questions/SetBQuestion.tsx`

**Files:**
- Create: `src/app/components/mirror/questions/SetBQuestion.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create the file using the same prop interface as `SetAQuestion`** but typing the cast as `Partial<SetBResponse>`. Paste the body of `renderSetBQuestion` (lines 1613–2000), applying the same closure-→-prop substitutions as in Task 19.

- [ ] **Step 2: Delete `renderSetBQuestion` from `MirrorGame.tsx`.**

- [ ] **Step 3: Update `renderQuestion`** to use `<SetBQuestion ... />` for set B, with the same prop list as `SetAQuestion`.

- [ ] **Step 4: Add the import**:

```ts
import { SetBQuestion } from './questions/SetBQuestion';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors. Smoke-test the entire Set B flow including every optional question (whyFavorite, washFrequency, repaired, brand).

---

### Task 21: Extract `questions/SetCQuestion.tsx`

**Files:**
- Create: `src/app/components/mirror/questions/SetCQuestion.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create the file using the same prop interface as `SetAQuestion`** but typing the cast as `Partial<SetCResponse>`. Paste the body of `renderSetCQuestion` (lines 2002–2193), applying the same closure-→-prop substitutions.

- [ ] **Step 2: Delete `renderSetCQuestion` from `MirrorGame.tsx`.**

- [ ] **Step 3: Update `renderQuestion`** to use `<SetCQuestion ... />` for set C. After this task, `renderQuestion` returns one of three components (or `null`).

- [ ] **Step 4: Add the import**:

```ts
import { SetCQuestion } from './questions/SetCQuestion';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors. Smoke-test the entire Set C flow.

---

### Task 22: Extract `screens/QuestionRunner.tsx`

This wraps the `gameState === 'question'` JSX (lines 2299–2355): the outer gradient screen, the back button, the per-set progress indicator, and the slot where `renderQuestion()` was injected.

**Files:**
- Create: `src/app/components/mirror/screens/QuestionRunner.tsx`
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Create `src/app/components/mirror/screens/QuestionRunner.tsx`.**

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { MOTION_EASE, fadeRiseMotion } from '../constants/design';
import { getVisibleQuestionSteps } from '../constants/questionSteps';
import type { CurrentSet, MotionPreference, SetResponse } from '../types';

interface QuestionRunnerProps {
  shouldReduceMotion: MotionPreference;
  currentSet: CurrentSet;
  currentQuestionIndex: number;
  currentResponse: Partial<SetResponse>;
  onBack: () => void;
  children: React.ReactNode;   // the per-set question component
}

export function QuestionRunner({
  shouldReduceMotion,
  currentSet,
  currentQuestionIndex,
  currentResponse,
  onBack,
  children,
}: QuestionRunnerProps) {
  return (
    /* paste the JSX of the gameState === 'question' branch verbatim, but:
       - replace handleBack with onBack
       - replace `{renderQuestion()}` with `{children}`
       The IIFE that computes the progress bar stays inside, since it only depends on
       currentSet, currentResponse, and currentQuestionIndex — all props. */
  );
}
```

- [ ] **Step 2: Delete the `if (gameState === 'question') { ... }` branch from `MirrorGame.tsx`.**

- [ ] **Step 3: Replace it with:**

```tsx
if (gameState === 'question') {
  return (
    <QuestionRunner
      shouldReduceMotion={shouldReduceMotion}
      currentSet={currentSet}
      currentQuestionIndex={currentQuestionIndex}
      currentResponse={currentResponse}
      onBack={handleBack}
    >
      {renderQuestion()}
    </QuestionRunner>
  );
}
```

- [ ] **Step 4: Add the import**:

```ts
import { QuestionRunner } from './screens/QuestionRunner';
```

- [ ] **Step 5: Verify.**

Run: `pnpm typecheck` → 0 errors. Smoke-test: progress bar still updates, back button still navigates, per-set question still renders inside the glass card.

---

## PHASE 5 — Final cleanup of `MirrorGame.tsx`

At this point the orchestrator should contain only:
- Imports
- State hooks
- Event handlers
- The `gameState` switch returning screen components
- The `renderQuestion` helper that picks among set A/B/C
- The thin `renderOtherInput` / `renderGarmentGrid` wrappers from Task 18

### Task 23: Remove the leftover thin wrappers

**Files:**
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Confirm nothing inside `MirrorGame` still calls `renderOtherInput(...)` or `renderGarmentGrid(...)`.**

After Tasks 19–21, all references to these were replaced inside the extracted question components. Search to confirm:

Run: `grep -n "renderOtherInput\|renderGarmentGrid" "src/app/components/mirror/MirrorGame.tsx"`
Expected: only the function definitions themselves match, nothing else.

- [ ] **Step 2: Delete both `renderOtherInput` and `renderGarmentGrid` from `MirrorGame.tsx`.**

- [ ] **Step 3: Also remove the now-unused `OtherInput` / `GarmentGrid` import from `MirrorGame.tsx`** (they are imported directly by `SetAQuestion`/`SetBQuestion`/`SetCQuestion` now).

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors. Smoke-test the entire app one more time end-to-end.

---

### Task 24: Prune unused imports in `MirrorGame.tsx`

**Files:**
- Modify: `src/app/components/mirror/MirrorGame.tsx`

- [ ] **Step 1: Review the lucide-react import line at the top of `MirrorGame.tsx`.**

Most icons are now imported by the screens/components themselves. The orchestrator no longer needs the full original list. Run:

Run: `grep -oE "<[A-Z][A-Za-z0-9]+" "src/app/components/mirror/MirrorGame.tsx" | sort -u`

That lists every JSX element rendered by the orchestrator. Cross-reference against the current lucide import to remove unused icons.

- [ ] **Step 2: Also confirm `motion`, `useReducedMotion`, `useEffect` are still used.**

`useReducedMotion` is still used (the orchestrator passes `shouldReduceMotion` down). `useEffect` is still used (the thank-you-banner auto-dismiss timer). `motion` may no longer be needed at the orchestrator level — confirm with `grep -n "<motion\." "src/app/components/mirror/MirrorGame.tsx"`. If zero matches, remove `motion` from the import.

- [ ] **Step 3: Remove every unused identifier from the imports at the top of `MirrorGame.tsx`.**

Be conservative: only remove identifiers `grep` confirms are not referenced anywhere in the file body.

- [ ] **Step 4: Verify.**

Run: `pnpm typecheck` → 0 errors. Run: `pnpm build` → 0 errors.

---

### Task 25: Update `CLAUDE.md` file-sync list

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Locate the section** in `CLAUDE.md` titled "Workflow notes" containing the line that begins "When syncing local changes to Figma, push these files in order:".

- [ ] **Step 2: Replace the existing `MirrorGame.tsx` line** with the full list of the new mirror module tree, preserving the rest of the file order:

```
- `src/app/components/mirror/MirrorGame.tsx`
- `src/app/components/mirror/types.ts`
- `src/app/components/mirror/constants/design.ts`
- `src/app/components/mirror/constants/garments.ts`
- `src/app/components/mirror/constants/archetypes.ts`
- `src/app/components/mirror/constants/baselineQuestions.ts`
- `src/app/components/mirror/constants/questionSteps.ts`
- `src/app/components/mirror/lib/session.ts`
- `src/app/components/mirror/lib/export.ts`
- `src/app/components/mirror/lib/supabase.ts`
- `src/app/components/mirror/lib/scoring.ts`
- `src/app/components/mirror/ui/SelectionTile.tsx`
- `src/app/components/mirror/ui/ContinueButton.tsx`
- `src/app/components/mirror/ui/SecondaryButton.tsx`
- `src/app/components/mirror/ui/QuestionScreen.tsx`
- `src/app/components/mirror/ui/ValueFingerprintRadar.tsx`
- `src/app/components/mirror/screens/WelcomeScreen.tsx`
- `src/app/components/mirror/screens/BaselineScreen.tsx`
- `src/app/components/mirror/screens/SetIntroScreen.tsx`
- `src/app/components/mirror/screens/QuestionRunner.tsx`
- `src/app/components/mirror/screens/SetCompleteScreen.tsx`
- `src/app/components/mirror/screens/FinalDashboard.tsx`
- `src/app/components/mirror/questions/shared.tsx`
- `src/app/components/mirror/questions/SetAQuestion.tsx`
- `src/app/components/mirror/questions/SetBQuestion.tsx`
- `src/app/components/mirror/questions/SetCQuestion.tsx`
```

The other entries on that bulleted list (`info.tsx`, `package.json`, `wardrobe-mirror.css`, `pnpm-workspace.yaml`, `CLAUDE.md`) stay untouched.

- [ ] **Step 3: Also update the "Entry point and file structure" diagram** earlier in `CLAUDE.md` to reflect the new tree. Replace the existing ASCII block:

```
src/main.tsx
  └── src/app/App.tsx             (thin wrapper)
        └── src/app/components/mirror/MirrorGame.tsx  (ALL logic — ~3,090 lines)
```

with:

```
src/main.tsx
  └── src/app/App.tsx                                       (thin wrapper)
        └── src/app/components/mirror/MirrorGame.tsx       (orchestrator: state + handlers + gameState switch)
              ├── types.ts                                  (shared interfaces and type aliases)
              ├── constants/  (design.ts, garments.ts, archetypes.ts, baselineQuestions.ts, questionSteps.ts)
              ├── lib/        (session.ts, export.ts, supabase.ts, scoring.ts)
              ├── ui/         (SelectionTile, ContinueButton, SecondaryButton, QuestionScreen, ValueFingerprintRadar)
              ├── screens/    (WelcomeScreen, BaselineScreen, SetIntroScreen, QuestionRunner, SetCompleteScreen, FinalDashboard)
              └── questions/  (shared.tsx + SetAQuestion, SetBQuestion, SetCQuestion)
```

- [ ] **Step 4: Update the "Known deferred issues" section** — remove the "Component decomposition" bullet since this refactor closes it.

- [ ] **Step 5: Verify CLAUDE.md still parses correctly** by opening it and confirming no broken Markdown.

---

### Task 26: Final verification

**Files:** none

- [ ] **Step 1: Run `pnpm typecheck`.** Expected: 0 errors.

- [ ] **Step 2: Run `pnpm build`.** Expected: 0 errors, `dist/` regenerates.

- [ ] **Step 3: Final smoke test in `pnpm dev`.**

Walk through every state at least once:
- Welcome screen renders, `Begin` advances to baseline.
- Baseline: all 4 questions render, auto-advance works, back button steps back, first-question back returns to welcome.
- Set A intro renders, "Start" enters questions; every set-A question renders, back/continue/skip behave as before; finishing set A reaches the set-complete screen.
- Set B intro → all 11 questions including optional ones; "skipped" shows correctly for optional text inputs; finishing reaches set-complete.
- Set C intro → all 6 questions; finishing reaches set-complete then the final dashboard.
- Final dashboard: Dashboard tab radar + persona; Insights tab; Share tab (both buttons trigger native share or clipboard); Data tab CSV/JSON downloads + "Try again" if you force-disable network.
- `New Reflection` reloads the page.

Confirm there are **no visible UI differences** from the pre-refactor build. If anything looks different, find the corresponding extraction and reconcile.

- [ ] **Step 4: Line count comparison.**

Run: `wc -l "src/app/components/mirror/MirrorGame.tsx"` and verify it is in the ~200–350 line range (down from ~3,150). If much larger, an extraction was incomplete.

Run: `wc -l "src/app/components/mirror/"**/*`. Confirm no single file is over ~800 lines (FinalDashboard.tsx is the largest expected at ~750).

- [ ] **Step 5: Stop.**

Refactor complete. Report to user:
- New line count of `MirrorGame.tsx`
- Total files created
- Verification: typecheck + build both green
- Smoke test: pass

---

## Self-Review Checklist (for the planner, before handing off)

- ✅ Every section of the original file has a destination task.
- ✅ No placeholders or "implement later" text.
- ✅ Prop names are consistent across tasks (`onBack`, `onAnswer`, `onContinue`, `onStart…`).
- ✅ Verification command (`pnpm typecheck`) appears in every task.
- ✅ Phase checkpoints add `pnpm build` + manual smoke.
- ✅ Final task updates `CLAUDE.md` so file-sync workflow stays accurate.
- ✅ No new dependencies introduced.
- ✅ No behaviour, no styling, no schema, no scoring logic changed.

## Notes for the Codex Executor

- If `pnpm typecheck` fails after a task, **revert the most recent file change** and re-attempt — do not stack unrelated fixes on top of a broken extraction.
- If a closure inside an extracted component references something that wasn't accounted for in the props interface (e.g. a method like `getGarmentLabel` that this plan moved to `constants/garments.ts`), import it directly from its new module rather than threading it through props.
- The "paste verbatim" instructions are deliberate: do not "improve" the JSX, do not consolidate similar branches, do not convert inline styles to Tailwind classes. Visual fidelity must be exact.
- When deciding whether to call `pnpm dev` vs just `pnpm typecheck`: typecheck after every task; smoke-test in dev only at phase checkpoints and after the screens that change visible structure (Welcome, Baseline, FinalDashboard, the Set N questions).

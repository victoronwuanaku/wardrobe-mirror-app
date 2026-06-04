# Scoring Methodology Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ad-hoc additive scoring with a theory-grounded model (Theory of Consumption Values + circular-economy) that computes a normalized behavioural ("reflected") profile and a baseline ("expectation") profile, then assigns one of the existing 6 archetypes by prototype distance — without changing the 4 value keys, the 6 archetype names, the questions, or the DB schema.

**Architecture:** The methodology lives as **data tables** in a new `scoring-config.ts` (matching the spec §4/§5 one-to-one) and **pure functions** in a new `scoring-engine.ts` (normalizer, profile scorers, confidence, prototype distance). The existing `scoring.ts` becomes a thin public API that delegates to the engine while preserving its current exported signatures so the two call sites (`MirrorGame.tsx:305`, `FinalDashboard.tsx:63`) keep working. Phase 1 lands the scoring core (fully unit-tested). Phase 2 updates the display (radar/bars/labels/confidence) to consume the two profiles.

**Tech Stack:** Vite 6 + React 18 + TypeScript 5, pnpm, vitest 4 (already configured — `tests/**/*.test.ts`, node env). Run tests with `pnpm test`, types with `pnpm typecheck`, build with `pnpm build`.

**Source of truth:** `docs/superpowers/specs/2026-06-04-scoring-methodology-redesign-design.md`. The weight/direction tables and prototype coordinates in this plan are copied from that spec; if they ever disagree, the spec wins.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/app/components/mirror/lib/scoring-config.ts` | Methodology-as-data: `Axis`, weight tiers, `ItemSpec`, behavioural + baseline contribution tables, prototype coordinates, band resolvers | **Create** |
| `src/app/components/mirror/lib/scoring-engine.ts` | Pure functions: axis normalizer, profile scorer, reflected/expectation scorers, confidence, prototype-distance archetype assignment | **Create** |
| `src/app/components/mirror/lib/scoring.ts` | Public API: `calculateValuesFromMirrorGame` (→ reflected), `calculatePersona` (→ prototype), new `calculateExpectationProfile` + `calculateConfidence`, unchanged `getMirrorInsights`/`clampValue` | **Modify** |
| `tests/scoring-engine.test.ts` | Unit tests for normalizer, scorers, confidence, prototype distance | **Create** |
| `tests/scoring.test.ts` | Tests for the public API + archetype worked examples + partial-completion | **Create** |
| `src/app/components/mirror/screens/FinalDashboard.tsx` | Phase 2: use expectation profile for baseline bars; signed deltas; Circularity label; pass profiles+confidence to radar | **Modify** |
| `src/app/components/mirror/ui/ValueFingerprintRadar.tsx` | Phase 2: 4 axes + two polygons (expectation dashed, reflected solid) | **Modify** |
| `tests/display-helpers.test.ts` | Phase 2: unit test for the pure signed-delta formatter | **Create** |

**Unchanged (verify, do not edit):** `types.ts` (`ValueMeters` keeps its 4 keys), `lib/schema.ts`, `lib/supabase.ts`, `lib/export.ts`, `constants/*`, the DB. The existing `tests/schema-contract.test.ts` and `tests/smoke.test.ts` must keep passing as a regression gate.

---

# PHASE 1 — Scoring core (test-driven)

## Task 1: Axis types, weight tiers, and the axis normalizer

**Files:**
- Create: `src/app/components/mirror/lib/scoring-config.ts`
- Create: `src/app/components/mirror/lib/scoring-engine.ts`
- Test: `tests/scoring-engine.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/scoring-engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeAxis } from '../src/app/components/mirror/lib/scoring-engine';

describe('normalizeAxis', () => {
  it('returns neutral 50 when there is no evidence (den = 0)', () => {
    expect(normalizeAxis(0, 0)).toBe(50);
  });
  it('returns 100 when all evidence is maximally positive', () => {
    expect(normalizeAxis(2, 2)).toBe(100);
  });
  it('returns 0 when all evidence is maximally negative', () => {
    expect(normalizeAxis(-2, 2)).toBe(0);
  });
  it('maps a half-positive mean to 75', () => {
    expect(normalizeAxis(1, 2)).toBe(75);
  });
  it('rounds to the nearest integer', () => {
    expect(normalizeAxis(-1, 4)).toBe(38); // 50 + 50*(-0.25) = 37.5 -> 38
  });
  it('clamps out-of-range means to [0,100]', () => {
    expect(normalizeAxis(3, 2)).toBe(100);
    expect(normalizeAxis(-3, 2)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `normalizeAxis` is not exported / module not found.

- [ ] **Step 3: Create the config module with axis primitives**

Create `src/app/components/mirror/lib/scoring-config.ts`:

```ts
import type { ValueMeters } from '../types';

// The four value axes are exactly the keys of ValueMeters (storage keys unchanged).
// `inflowOutflow` is the storage key; it represents "Circularity consciousness" in the UI.
export type Axis = keyof ValueMeters; // 'social' | 'emotional' | 'functional' | 'inflowOutflow'

export const ALL_AXES: Axis[] = ['functional', 'social', 'emotional', 'inflowOutflow'];

// Salience tiers (how much an item counts as evidence on an axis).
export const W = { strong: 3, moderate: 2, mild: 1 } as const;

export interface ItemSpec {
  // Salience (weight) per axis this item bears on.
  salience: Partial<Record<Axis, number>>;
  // Axes that are PRIMARY probes: counted in the denominator even when the answer is neutral (s = 0).
  primary: Axis[];
  // Multi-select item: per axis, take the selected option with the max |direction| (sign-aware).
  multi?: boolean;
  // Optional resolver converting a raw answer (e.g. a number) to a lookup key for `directions`.
  bucket?: (raw: string) => string;
  // answer/bucket key -> signed direction per axis, s in [-1, +1].
  directions: Record<string, Partial<Record<Axis, number>>>;
}
```

- [ ] **Step 4: Create the engine module with `normalizeAxis`**

Create `src/app/components/mirror/lib/scoring-engine.ts` (no imports yet — later tasks add imports at the top as the symbols they reference come into existence):

```ts
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Normalize an axis from accumulated signed evidence to a 0-100 score where 50 = neutral.
 * score = 50 + 50 * (num / den); den === 0 means "no evidence" -> 50.
 */
export function normalizeAxis(num: number, den: number): number {
  if (den === 0) return 50;
  return clamp(Math.round(50 + 50 * (num / den)));
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — the 6 `normalizeAxis` assertions pass. (`schema-contract` and `smoke` also still pass.)

- [ ] **Step 6: Commit**

```bash
git add src/app/components/mirror/lib/scoring-config.ts src/app/components/mirror/lib/scoring-engine.ts tests/scoring-engine.test.ts
git commit -m "feat(scoring): add axis primitives and axis normalizer"
```

---

## Task 2: Behavioural contribution tables + band resolvers

**Files:**
- Modify: `src/app/components/mirror/lib/scoring-config.ts`
- Test: `tests/scoring-engine.test.ts`

- [ ] **Step 1: Write the failing test** (append to `tests/scoring-engine.test.ts`)

```ts
import { BEHAVIOUR_SPECS, costBand, yearsBand } from '../src/app/components/mirror/lib/scoring-config';

describe('band resolvers', () => {
  it('buckets cost into the four bands', () => {
    expect(costBand('15')).toBe('0-20');
    expect(costBand('50')).toBe('21-75');
    expect(costBand('120')).toBe('76-150');
    expect(costBand('300')).toBe('151+');
  });
  it('buckets ownership years into the five bands', () => {
    expect(yearsBand('0')).toBe('0-1');
    expect(yearsBand('3')).toBe('2-3');
    expect(yearsBand('5')).toBe('4-6');
    expect(yearsBand('9')).toBe('7-10');
    expect(yearsBand('20')).toBe('11+');
  });
});

describe('behaviour specs shape', () => {
  it('declares a spec for every scorable behavioural field', () => {
    for (const key of [
      'howGot', 'cost', 'wearFrequency', 'mainUse', 'whyBought', 'whyFavorite',
      'howLongHadCategorical', 'howLongHadYears', 'washFrequency', 'repaired',
      'whyNotWear', 'disposalPlan',
    ]) {
      expect(BEHAVIOUR_SPECS[key]).toBeDefined();
    }
  });
  it('keeps every direction within [-1, 1]', () => {
    for (const spec of Object.values(BEHAVIOUR_SPECS)) {
      for (const dirs of Object.values(spec.directions)) {
        for (const v of Object.values(dirs)) {
          expect(v).toBeGreaterThanOrEqual(-1);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `BEHAVIOUR_SPECS`, `costBand`, `yearsBand` not exported.

- [ ] **Step 3: Add band resolvers and behavioural specs** (append to `scoring-config.ts`)

```ts
export function costBand(raw: string): string {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return '21-75'; // neutral band; non-numeric is filtered before scoring
  if (n <= 20) return '0-20';
  if (n <= 75) return '21-75';
  if (n <= 150) return '76-150';
  return '151+';
}

export function yearsBand(raw: string): string {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return '0-1';
  if (n <= 1) return '0-1';
  if (n <= 3) return '2-3';
  if (n <= 6) return '4-6';
  if (n <= 10) return '7-10';
  return '11+';
}

// Behavioural items -> Reflected profile (spec §4.1).
export const BEHAVIOUR_SPECS: Record<string, ItemSpec> = {
  howGot: {
    salience: { inflowOutflow: W.moderate, emotional: W.moderate, functional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'bought-new': { inflowOutflow: -1 },
      'bought-secondhand': { functional: 0.5, inflowOutflow: 1 },
      'gift': { emotional: 1 },
      'borrowed-shared-rented': { inflowOutflow: 1 },
      'made-it': { functional: 0.5, emotional: 0.5, inflowOutflow: 1 },
    },
  },
  cost: {
    salience: { functional: W.moderate, emotional: W.mild, inflowOutflow: W.mild },
    primary: ['functional'],
    bucket: costBand,
    directions: {
      '0-20': { functional: -0.5, inflowOutflow: -0.3 },
      '21-75': {},
      '76-150': { functional: 0.5 },
      '151+': { functional: 1, emotional: 0.5 },
    },
  },
  wearFrequency: {
    salience: { functional: W.moderate, inflowOutflow: W.mild },
    primary: ['functional'],
    directions: {
      'once-a-week': { functional: 1, inflowOutflow: 0.5 },
      'once-a-month': { functional: 0.5, inflowOutflow: 0.3 },
      'once-each-season': {},
      'not-used-last-year': { functional: -1, inflowOutflow: -0.5 },
    },
  },
  mainUse: {
    salience: { functional: W.moderate, social: W.moderate, inflowOutflow: W.mild },
    primary: ['functional', 'social'],
    multi: true,
    directions: {
      'work': { functional: 1 },
      'home': { functional: 1 },
      'sport': { functional: 1 },
      'special-occasions': { social: 1 },
      'leisure': { social: 0.5 },
      'not-in-use': { functional: -1, inflowOutflow: -1 },
      'other': {},
    },
  },
  whyBought: {
    salience: { social: W.moderate, inflowOutflow: W.moderate, functional: W.mild },
    primary: ['social', 'inflowOutflow'],
    directions: {
      'replace-similar': { functional: 1, inflowOutflow: 0.3 },
      'wanted-new': { social: 1, inflowOutflow: -1 },
      'on-sale': { inflowOutflow: -0.6 },
      'other': {},
    },
  },
  whyFavorite: {
    salience: { functional: W.moderate, social: W.moderate, emotional: W.moderate },
    primary: ['functional', 'social', 'emotional'],
    multi: true,
    directions: {
      'comfortable': { functional: 1 },
      'easy-to-style': { functional: 0.3, social: 0.5 },
      'confident': { social: 1 },
      'personal-emotional': { emotional: 1 },
      'other': {},
    },
  },
  howLongHadCategorical: {
    salience: { emotional: W.moderate, inflowOutflow: W.mild },
    primary: ['emotional'],
    directions: {
      'less-1-year': {},
      '1-2-years': { emotional: 0.3 },
      '3-4-years': { emotional: 0.5, inflowOutflow: 0.3 },
      '5-6-years': { emotional: 0.7, inflowOutflow: 0.5 },
      '7-plus-years': { emotional: 1, inflowOutflow: 0.7 },
    },
  },
  howLongHadYears: {
    salience: { emotional: W.moderate, inflowOutflow: W.mild },
    primary: ['emotional'],
    bucket: yearsBand,
    directions: {
      '0-1': {},
      '2-3': { emotional: 0.3 },
      '4-6': { emotional: 0.5, inflowOutflow: 0.3 },
      '7-10': { emotional: 0.7, inflowOutflow: 0.5 },
      '11+': { emotional: 1, inflowOutflow: 0.7 },
    },
  },
  washFrequency: {
    salience: { functional: W.mild, inflowOutflow: W.mild },
    primary: ['functional'],
    directions: {
      'every-time': { functional: 0.5, inflowOutflow: 0.3 },
      'few-times': { functional: 1, inflowOutflow: 0.5 },
      'when-dirty': { functional: 0.5, inflowOutflow: 0.3 },
      'never': {},
    },
  },
  repaired: {
    salience: { inflowOutflow: W.moderate, functional: W.mild, emotional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'yes-myself': { functional: 0.6, emotional: 0.5, inflowOutflow: 1 },
      'yes-professionally': { functional: 0.6, inflowOutflow: 1 },
      'no-but-would': { inflowOutflow: 0.4 },
      'no': {},
    },
  },
  whyNotWear: {
    salience: { functional: W.moderate, social: W.moderate, inflowOutflow: W.mild, emotional: W.mild },
    primary: ['functional', 'social'],
    multi: true,
    directions: {
      'doesnt-fit': { functional: 1 },
      'damaged-worn-out': { functional: 0.5 },
      'out-of-style': { social: 1, inflowOutflow: -0.5 },
      'dont-like-anymore': { social: 1, inflowOutflow: -0.5 },
      'waiting-occasion': { social: 0.3, emotional: 0.5 },
      'forgot': { inflowOutflow: -1 },
      'other': {},
    },
  },
  disposalPlan: {
    salience: { inflowOutflow: W.strong, emotional: W.mild, functional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'repair-repurpose': { functional: 0.5, emotional: 0.5, inflowOutflow: 1 },
      'gift-friends-family': { emotional: 0.5, inflowOutflow: 0.8 },
      'donate-charity': { emotional: 0.3, inflowOutflow: 0.8 },
      'sell-it': { inflowOutflow: 0.7 },
      'textile-bins': { inflowOutflow: 0.5 },
    },
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — band + shape tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/mirror/lib/scoring-config.ts tests/scoring-engine.test.ts
git commit -m "feat(scoring): add behavioural contribution tables and band resolvers"
```

---

## Task 3: Baseline contribution tables + prototype coordinates

**Files:**
- Modify: `src/app/components/mirror/lib/scoring-config.ts`
- Test: `tests/scoring-engine.test.ts`

- [ ] **Step 1: Write the failing test** (append to `tests/scoring-engine.test.ts`)

```ts
import { BASELINE_SPECS, PROTOTYPES, type ArchetypeKey } from '../src/app/components/mirror/lib/scoring-config';

describe('baseline specs + prototypes', () => {
  it('declares a spec for every baseline field', () => {
    for (const key of ['primaryDriver', 'wardrobeSize', 'shoppingFrequency', 'disposalHabit']) {
      expect(BASELINE_SPECS[key]).toBeDefined();
    }
  });
  it('defines all six archetype prototypes with four axes each', () => {
    const keys: ArchetypeKey[] = [
      'functionalMinimalist', 'socialChameleon', 'memoryKeeper',
      'identityCollector', 'consciousCurator', 'balancedAdapter',
    ];
    for (const k of keys) {
      const p = PROTOTYPES[k];
      expect(p).toBeDefined();
      expect(typeof p.functional).toBe('number');
      expect(typeof p.social).toBe('number');
      expect(typeof p.emotional).toBe('number');
      expect(typeof p.inflowOutflow).toBe('number');
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `BASELINE_SPECS`, `PROTOTYPES`, `ArchetypeKey` not exported.

- [ ] **Step 3: Add baseline specs and prototypes** (append to `scoring-config.ts`)

```ts
// Baseline items -> Expectation profile (spec §4.2). primaryDriver is the one ipsative item.
export const BASELINE_SPECS: Record<string, ItemSpec> = {
  primaryDriver: {
    salience: { functional: W.moderate, social: W.moderate, emotional: W.moderate },
    primary: [],
    directions: {
      'function': { functional: 1, social: -0.5, emotional: -0.5 },
      'emotion': { emotional: 1, functional: -0.5, social: -0.5 },
      'social': { social: 1, functional: -0.5, emotional: -0.5 },
    },
  },
  wardrobeSize: {
    salience: { inflowOutflow: W.moderate, functional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'minimal': { functional: 0.5, inflowOutflow: 1 },
      'moderate': {},
      'extensive': { inflowOutflow: -1 },
    },
  },
  shoppingFrequency: {
    salience: { inflowOutflow: W.moderate, functional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'rarely': { functional: 0.3, inflowOutflow: 1 },
      'occasionally': {},
      'frequently': { inflowOutflow: -1 },
    },
  },
  disposalHabit: {
    salience: { inflowOutflow: W.moderate, emotional: W.mild },
    primary: ['inflowOutflow'],
    directions: {
      'rarely': { emotional: 0.5, inflowOutflow: -0.3 },
      'periodically': {},
      'regularly': { inflowOutflow: 0.5 },
    },
  },
};

export type ArchetypeKey =
  | 'functionalMinimalist'
  | 'socialChameleon'
  | 'memoryKeeper'
  | 'identityCollector'
  | 'consciousCurator'
  | 'balancedAdapter';

// Prototype coordinates in [functional, social, emotional, inflowOutflow] space (spec §5).
export const PROTOTYPES: Record<ArchetypeKey, ValueMeters> = {
  functionalMinimalist: { functional: 85, social: 40, emotional: 35, inflowOutflow: 65 },
  socialChameleon:      { functional: 50, social: 85, emotional: 45, inflowOutflow: 30 },
  memoryKeeper:         { functional: 40, social: 40, emotional: 90, inflowOutflow: 55 },
  identityCollector:    { functional: 45, social: 70, emotional: 75, inflowOutflow: 45 },
  consciousCurator:     { functional: 60, social: 45, emotional: 50, inflowOutflow: 90 },
  balancedAdapter:      { functional: 55, social: 55, emotional: 55, inflowOutflow: 55 },
};

// A genuinely flat profile (max - min below this spread) resolves to Balanced Adapter.
export const FLAT_PROFILE_SPREAD = 12;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/mirror/lib/scoring-config.ts tests/scoring-engine.test.ts
git commit -m "feat(scoring): add baseline contribution tables and archetype prototypes"
```

---

## Task 4: The generic profile scorer (`scoreProfile`)

This is the engine that turns a list of `(spec, answer)` pairs into a `ValueMeters` plus the per-axis evidence mass (denominator) used later for confidence.

**Files:**
- Modify: `src/app/components/mirror/lib/scoring-engine.ts`
- Test: `tests/scoring-engine.test.ts`

- [ ] **Step 1: Write the failing test** (append to `tests/scoring-engine.test.ts`)

```ts
import { scoreProfile } from '../src/app/components/mirror/lib/scoring-engine';
// NOTE: BEHAVIOUR_SPECS is already imported at the top of this file (Task 2) — do not re-import it.

describe('scoreProfile', () => {
  it('returns neutral 50 on every axis with no evidence', () => {
    const { values } = scoreProfile([]);
    expect(values).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });

  it('scores a single strong-functional behavioural answer above neutral on functional', () => {
    // wearFrequency once-a-week -> functional +1 (w2, primary), inflowOutflow +0.5 (w1)
    const { values } = scoreProfile([[BEHAVIOUR_SPECS.wearFrequency, 'once-a-week']]);
    // functional: 50 + 50*(2*1 / 2) = 100 ; inflowOutflow: 50 + 50*(1*0.5 / 1) = 75
    expect(values.functional).toBe(100);
    expect(values.inflowOutflow).toBe(75);
    expect(values.social).toBe(50);    // no evidence
    expect(values.emotional).toBe(50); // no evidence
  });

  it('counts a primary-probe neutral answer in the denominator (pulls toward 50)', () => {
    // mainUse ['work'] -> functional primary +1 ; social primary but neutral (0) -> den counts, num 0
    const { values, evidence } = scoreProfile([[BEHAVIOUR_SPECS.mainUse, ['work']]]);
    expect(values.functional).toBe(100); // 50 + 50*(2*1/2)
    expect(values.social).toBe(50);      // primary, neutral -> den=2 num=0 -> 50
    expect(evidence.social).toBe(2);     // social denominator recorded
  });

  it('uses max-magnitude direction per axis for multi-select', () => {
    // mainUse ['work','not-in-use'] -> functional: max(|+1|,|-1|) first wins -> +1
    const { values } = scoreProfile([[BEHAVIOUR_SPECS.mainUse, ['work', 'not-in-use']]]);
    expect(values.functional).toBe(100);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `scoreProfile` not exported.

- [ ] **Step 3: Implement `scoreProfile`**

First add these imports at the **top** of `scoring-engine.ts` (above `normalizeAxis`):

```ts
import type { ValueMeters } from '../types';
import { type ItemSpec, type Axis } from './scoring-config';
```

Then **append** the rest below `normalizeAxis`:

```ts
export interface ScoredProfile {
  values: ValueMeters;
  evidence: Record<Axis, number>; // denominator (evidence mass) per axis
}

type Answer = string | string[];

function directionFor(spec: ItemSpec, axis: Axis, answer: Answer): number {
  if (spec.multi) {
    const selected = Array.isArray(answer) ? answer : [answer];
    let s = 0;
    for (const key of selected) {
      const d = spec.directions[key]?.[axis] ?? 0;
      if (Math.abs(d) > Math.abs(s)) s = d; // max magnitude, first wins on tie
    }
    return s;
  }
  const key = spec.bucket ? spec.bucket(String(answer)) : String(answer);
  return spec.directions[key]?.[axis] ?? 0;
}

/**
 * Accumulate signed evidence across (spec, answer) pairs and normalize each axis.
 * An axis is counted in the denominator when the item is a PRIMARY probe of it,
 * or when the chosen answer has a non-zero direction on it.
 */
export function scoreProfile(items: Array<[ItemSpec, Answer]>): ScoredProfile {
  const num: Record<Axis, number> = { functional: 0, social: 0, emotional: 0, inflowOutflow: 0 };
  const den: Record<Axis, number> = { functional: 0, social: 0, emotional: 0, inflowOutflow: 0 };

  for (const [spec, answer] of items) {
    for (const axis of Object.keys(spec.salience) as Axis[]) {
      const w = spec.salience[axis]!;
      const s = directionFor(spec, axis, answer);
      const isPrimary = spec.primary.includes(axis);
      if (isPrimary || s !== 0) {
        num[axis] += w * s;
        den[axis] += w;
      }
    }
  }

  const values: ValueMeters = {
    functional: normalizeAxis(num.functional, den.functional),
    social: normalizeAxis(num.social, den.social),
    emotional: normalizeAxis(num.emotional, den.emotional),
    inflowOutflow: normalizeAxis(num.inflowOutflow, den.inflowOutflow),
  };
  return { values, evidence: den };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — all `scoreProfile` assertions pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/mirror/lib/scoring-engine.ts tests/scoring-engine.test.ts
git commit -m "feat(scoring): add generic profile scorer with primary-probe denominator rule"
```

---

## Task 5: Reflected + expectation scorers (field routing)

Maps real `SetResponse`/`BaselineResponses` objects to the correct specs, skipping unanswered fields.

**Files:**
- Modify: `src/app/components/mirror/lib/scoring-engine.ts`
- Test: `tests/scoring-engine.test.ts`

- [ ] **Step 1: Write the failing test** (append to `tests/scoring-engine.test.ts`)

```ts
import { scoreReflected, scoreExpectation } from '../src/app/components/mirror/lib/scoring-engine';
import type { SetAResponse, BaselineResponses } from '../src/app/components/mirror/types';

describe('scoreReflected', () => {
  it('scores a clearly functional + circular Set A purchase', () => {
    // Hand computation (spec §4.1), Set A only:
    //   howGot bought-secondhand: C(w2,P,+1) E(w2,s,0 -> excluded) F(w1,s,+0.5)
    //   cost '60' -> 21-75: F(w2,P,0)
    //   wearFrequency once-a-week: F(w2,P,+1) C(w1,s,+0.5)
    //   mainUse ['work']: F(w2,P,+1) S(w2,P,0) C(w1,s,0 -> excluded)
    //   whyBought replace-similar: S(w2,P,0) C(w2,P,+0.3) F(w1,s,+1)
    // F: num 0.5+0+2+2+1 = 5.5 ; den 1+2+2+2+1 = 8 -> 50+50*0.6875 = 84
    // S: num 0 ; den 2+2 = 4 -> 50
    // E: den 0 -> 50
    // C: num 2+0.5+0.6 = 3.1 ; den 2+1+2 = 5 -> 50+50*0.62 = 81
    const a: SetAResponse = {
      setType: 'A', garmentType: 't-shirt', howGot: 'bought-secondhand', cost: '60',
      wearFrequency: 'once-a-week', mainUse: ['work'], whyBought: 'replace-similar',
      timestamp: 't',
    };
    const { values } = scoreReflected([a]);
    expect(values).toEqual({ functional: 84, social: 50, emotional: 50, inflowOutflow: 81 });
  });

  it('returns all-neutral with no behavioural responses', () => {
    expect(scoreReflected([]).values).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });

  it('skips skipped/empty answers', () => {
    const a = {
      setType: 'A', garmentType: 't-shirt', howGot: 'skipped', cost: '',
      wearFrequency: 'skipped', mainUse: [], whyBought: 'skipped', timestamp: 't',
    } as unknown as SetAResponse;
    expect(scoreReflected([a]).values).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });
});

describe('scoreExpectation', () => {
  it('reads a function-driven, minimal, rare-shopper self-image', () => {
    // primaryDriver function: F +1(w2), S -0.5(w2), E -0.5(w2)
    // wardrobeSize minimal: C +1(w2,P), F +0.5(w1)
    // shoppingFrequency rarely: C +1(w2,P), F +0.3(w1)
    // disposalHabit periodically: C 0(w2,P)  [emotional secondary, neutral -> excluded]
    // F: num 2 + 0.5 + 0.3 = 2.8 ; den 2 + 1 + 1 = 4 -> 50+50*0.7 = 85
    // S: num -1 ; den 2 -> 50+50*(-0.5) = 25
    // E: num -1 ; den 2 -> 25
    // C: num 2 + 2 + 0 = 4 ; den 2 + 2 + 2 = 6 -> 50+50*0.6667 = 83
    const b: BaselineResponses = {
      wardrobeSize: 'minimal', shoppingFrequency: 'rarely',
      disposalHabit: 'periodically', primaryDriver: 'function',
    };
    expect(scoreExpectation(b).values).toEqual({ functional: 85, social: 25, emotional: 25, inflowOutflow: 83 });
  });

  it('returns all-neutral when baseline is null', () => {
    expect(scoreExpectation(null).values).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `scoreReflected`, `scoreExpectation` not exported.

- [ ] **Step 3: Implement the scorers**

Add these imports at the **top** of `scoring-engine.ts` (alongside the existing imports):

```ts
import type { SetResponse, BaselineResponses } from '../types';
import { BEHAVIOUR_SPECS, BASELINE_SPECS } from './scoring-config';
```

Then **append** the rest at the bottom of the file:

```ts
// [response field, spec key] per set. Order is irrelevant to the score.
const REFLECTED_FIELDS: Record<'A' | 'B' | 'C', Array<[string, string]>> = {
  A: [['howGot', 'howGot'], ['cost', 'cost'], ['wearFrequency', 'wearFrequency'], ['mainUse', 'mainUse'], ['whyBought', 'whyBought']],
  B: [['whyFavorite', 'whyFavorite'], ['howGot', 'howGot'], ['cost', 'cost'], ['howLongHad', 'howLongHadCategorical'], ['wearFrequency', 'wearFrequency'], ['mainUse', 'mainUse'], ['washFrequency', 'washFrequency'], ['repaired', 'repaired']],
  C: [['howLongHad', 'howLongHadYears'], ['cost', 'cost'], ['howGot', 'howGot'], ['whyNotWear', 'whyNotWear'], ['disposalPlan', 'disposalPlan']],
};

const SKIP_TOKENS = new Set(['', 'skipped', 'other-skipped']);

function isAnswered(value: unknown): value is string | string[] {
  if (value == null) return false;
  if (Array.isArray(value)) return value.filter((v) => !SKIP_TOKENS.has(v)).length > 0;
  if (typeof value === 'string') return !SKIP_TOKENS.has(value);
  return false;
}

export function scoreReflected(responses: SetResponse[]): ScoredProfile {
  const items: Array<[ItemSpec, Answer]> = [];
  for (const response of responses) {
    const fields = REFLECTED_FIELDS[response.setType];
    for (const [field, specKey] of fields) {
      const value = (response as unknown as Record<string, unknown>)[field];
      if (!isAnswered(value)) continue;
      if (specKey === 'cost' && Number.isNaN(parseInt(String(value), 10))) continue;
      items.push([BEHAVIOUR_SPECS[specKey], value]);
    }
  }
  return scoreProfile(items);
}

export function scoreExpectation(baseline: BaselineResponses | null | undefined): ScoredProfile {
  if (!baseline) return scoreProfile([]);
  const items: Array<[ItemSpec, Answer]> = [];
  for (const field of ['primaryDriver', 'wardrobeSize', 'shoppingFrequency', 'disposalHabit']) {
    const value = (baseline as unknown as Record<string, unknown>)[field];
    if (!isAnswered(value)) continue;
    items.push([BASELINE_SPECS[field], value]);
  }
  return scoreProfile(items);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS. (If a worked-example number is off, recheck the arithmetic against the per-item comments — the engine is correct if Task 4 passed; the fixture comments show the expected accumulation.)

- [ ] **Step 5: Commit**

```bash
git add src/app/components/mirror/lib/scoring-engine.ts tests/scoring-engine.test.ts
git commit -m "feat(scoring): add reflected and expectation profile scorers"
```

---

## Task 6: Prototype-distance archetype assignment + confidence

**Files:**
- Modify: `src/app/components/mirror/lib/scoring-engine.ts`
- Test: `tests/scoring-engine.test.ts`

- [ ] **Step 1: Write the failing test** (append to `tests/scoring-engine.test.ts`)

```ts
import { assignArchetype, calculateConfidenceLevel } from '../src/app/components/mirror/lib/scoring-engine';
import { PROTOTYPES } from '../src/app/components/mirror/lib/scoring-config';

describe('assignArchetype', () => {
  it('maps each exact prototype to its own archetype key', () => {
    expect(assignArchetype(PROTOTYPES.functionalMinimalist)).toBe('functionalMinimalist');
    expect(assignArchetype(PROTOTYPES.socialChameleon)).toBe('socialChameleon');
    expect(assignArchetype(PROTOTYPES.memoryKeeper)).toBe('memoryKeeper');
    expect(assignArchetype(PROTOTYPES.identityCollector)).toBe('identityCollector');
    expect(assignArchetype(PROTOTYPES.consciousCurator)).toBe('consciousCurator');
    expect(assignArchetype(PROTOTYPES.balancedAdapter)).toBe('balancedAdapter');
  });

  it('resolves a near-flat profile to balancedAdapter via the dominance gate', () => {
    // spread 8 < 12 -> balanced even though numbers lean functional
    expect(assignArchetype({ functional: 58, social: 52, emotional: 55, inflowOutflow: 50 })).toBe('balancedAdapter');
  });

  it('assigns a clearly functional profile to functionalMinimalist', () => {
    expect(assignArchetype({ functional: 90, social: 40, emotional: 40, inflowOutflow: 55 })).toBe('functionalMinimalist');
  });

  it('assigns a high-circularity profile to consciousCurator (not the old conflation)', () => {
    expect(assignArchetype({ functional: 55, social: 45, emotional: 50, inflowOutflow: 88 })).toBe('consciousCurator');
  });
});

describe('calculateConfidenceLevel', () => {
  it('grades by behavioural sets completed', () => {
    expect(calculateConfidenceLevel(0)).toBe('low');
    expect(calculateConfidenceLevel(1)).toBe('low');
    expect(calculateConfidenceLevel(2)).toBe('medium');
    expect(calculateConfidenceLevel(3)).toBe('high');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `assignArchetype`, `calculateConfidenceLevel` not exported.

- [ ] **Step 3: Implement assignment + confidence**

Add this import at the **top** of `scoring-engine.ts`:

```ts
import { PROTOTYPES, FLAT_PROFILE_SPREAD, type ArchetypeKey } from './scoring-config';
```

Then **append** the rest at the bottom of the file:

```ts
function distance(a: ValueMeters, b: ValueMeters): number {
  return Math.sqrt(
    (a.functional - b.functional) ** 2 +
    (a.social - b.social) ** 2 +
    (a.emotional - b.emotional) ** 2 +
    (a.inflowOutflow - b.inflowOutflow) ** 2,
  );
}

export function assignArchetype(reflected: ValueMeters): ArchetypeKey {
  const vals = [reflected.functional, reflected.social, reflected.emotional, reflected.inflowOutflow];
  if (Math.max(...vals) - Math.min(...vals) < FLAT_PROFILE_SPREAD) return 'balancedAdapter';

  // argmin distance; deterministic table order breaks ties.
  const order: ArchetypeKey[] = [
    'functionalMinimalist', 'socialChameleon', 'memoryKeeper',
    'identityCollector', 'consciousCurator', 'balancedAdapter',
  ];
  let best: ArchetypeKey = 'balancedAdapter';
  let bestD = Infinity;
  for (const key of order) {
    const d = distance(reflected, PROTOTYPES[key]);
    if (d < bestD) { bestD = d; best = key; }
  }
  return best;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export function calculateConfidenceLevel(behaviouralSetsCompleted: number): ConfidenceLevel {
  if (behaviouralSetsCompleted >= 3) return 'high';
  if (behaviouralSetsCompleted === 2) return 'medium';
  return 'low';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/mirror/lib/scoring-engine.ts tests/scoring-engine.test.ts
git commit -m "feat(scoring): add prototype-distance archetype assignment and confidence level"
```

---

## Task 7: Rewire the public `scoring.ts` API

Preserve the exported signatures used by `MirrorGame.tsx` and `FinalDashboard.tsx`; delegate to the engine. `calculateValuesFromMirrorGame` now returns the **reflected** (behaviour-only) profile; `calculatePersona` now uses prototype distance; add `calculateExpectationProfile` and `calculateReflectionConfidence`. Keep `getMirrorInsights` and `clampValue`.

**Files:**
- Modify: `src/app/components/mirror/lib/scoring.ts`
- Test: `tests/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  calculateValuesFromMirrorGame,
  calculatePersona,
  calculateExpectationProfile,
  calculateReflectionConfidence,
} from '../src/app/components/mirror/lib/scoring';
import type { SetResponse, BaselineResponses } from '../src/app/components/mirror/types';

const baseline: BaselineResponses = {
  wardrobeSize: 'minimal', shoppingFrequency: 'rarely',
  disposalHabit: 'periodically', primaryDriver: 'function',
};

const functionalPurchase: SetResponse = {
  setType: 'A', garmentType: 't-shirt', howGot: 'bought-secondhand', cost: '60',
  wearFrequency: 'once-a-week', mainUse: ['work'], whyBought: 'replace-similar', timestamp: 't',
};

describe('calculateValuesFromMirrorGame (reflected, behaviour-only)', () => {
  it('ignores baseline and returns the reflected profile', () => {
    const withBaseline = calculateValuesFromMirrorGame([functionalPurchase], baseline);
    const withoutBaseline = calculateValuesFromMirrorGame([functionalPurchase], null);
    expect(withBaseline).toEqual(withoutBaseline); // baseline no longer leaks into behaviour
    expect(withBaseline.functional).toBeGreaterThan(70);
  });

  it('returns a valid 4-key ValueMeters for an empty run', () => {
    expect(calculateValuesFromMirrorGame([], null)).toEqual({ functional: 50, social: 50, emotional: 50, inflowOutflow: 50 });
  });
});

describe('calculatePersona (prototype distance)', () => {
  it('keeps the six existing names and the "The " prefix', () => {
    const p = calculatePersona({ functional: 90, social: 40, emotional: 40, inflowOutflow: 55 });
    expect(p.name).toBe('The Functional Minimalist');
    expect(p.icon).toBe('⚙️');
  });

  it('assigns Conscious Curator to a high-circularity profile', () => {
    const p = calculatePersona({ functional: 55, social: 45, emotional: 50, inflowOutflow: 88 });
    expect(p.name).toBe('The Conscious Curator');
  });

  it('assigns Balanced Adapter to a flat profile', () => {
    const p = calculatePersona({ functional: 52, social: 50, emotional: 53, inflowOutflow: 49 });
    expect(p.name).toBe('The Balanced Adapter');
  });
});

describe('calculateExpectationProfile', () => {
  it('derives the self-image profile from baseline only', () => {
    const e = calculateExpectationProfile(baseline);
    expect(e.functional).toBeGreaterThan(70);
    expect(e.social).toBeLessThan(50);
  });
});

describe('calculateReflectionConfidence', () => {
  it('is low for one set and high for three', () => {
    expect(calculateReflectionConfidence([functionalPurchase])).toBe('low');
    expect(calculateReflectionConfidence([functionalPurchase, { ...functionalPurchase, setType: 'B' } as SetResponse, { ...functionalPurchase, setType: 'C' } as SetResponse])).toBe('high');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `calculateExpectationProfile` / `calculateReflectionConfidence` not exported and persona names may still come from the old cascade.

- [ ] **Step 3: Rewrite `scoring.ts`** — replace the body of `calculateValuesFromMirrorGame` and `calculatePersona`, add two exports, keep `getMirrorInsights` and `clampValue`.

First add these imports at the **top** of `scoring.ts`, immediately after the existing `import type { … } from '../types';` line:

```ts
import {
  scoreReflected,
  scoreExpectation,
  assignArchetype,
  calculateConfidenceLevel,
  type ConfidenceLevel,
} from './scoring-engine';
import type { ArchetypeKey } from './scoring-config';
```

Then replace the whole region from the `clampValue` declaration through the end of `calculatePersona` (currently `scoring.ts:11-80`) with the following. **Leave `getMirrorInsights` (below line 80) untouched.**

```ts
export const clampValue = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/**
 * Reflected (behaviour-only) value profile. The `baseline` parameter is retained for
 * call-site compatibility but no longer contributes to the behavioural score — baseline
 * is now the separate "expectation" profile (see calculateExpectationProfile).
 */
export function calculateValuesFromMirrorGame(
  responses: SetResponse[],
  _baseline?: BaselineResponses | null,
): ValueMeters {
  return scoreReflected(responses).values;
}

/** Expectation (self-image) profile, computed from baseline answers only. */
export function calculateExpectationProfile(baseline?: BaselineResponses | null): ValueMeters {
  return scoreExpectation(baseline).values;
}

/** Confidence in the reflected profile, graded by behavioural sets completed. */
export function calculateReflectionConfidence(responses: SetResponse[]): ConfidenceLevel {
  return calculateConfidenceLevel(responses.length);
}

const PERSONA_BUILDERS: Record<ArchetypeKey, (v: ValueMeters) => PersonaProfile> = {
  memoryKeeper: () => ({ name: 'The Memory Keeper', icon: '📖', tagline: 'Clothes as an archive of memory', poeticDescription: 'Your wardrobe carries stories. You keep garments because they hold people, phases of life, or moments you are not ready to flatten into simple utility.', insight: 'Meaning is a strength, but it can also make letting go harder than it needs to be.', researchProfile: { acquisitionDriver: 'Personal meaning, gifts, memories, and milestones', retentionPattern: 'Keeps items because they represent emotional chapters', disposalTrigger: 'Usually lets go only when space, condition, or life changes force a decision', flowRate: 'low', primaryValue: 'Emotional value' } }),
  socialChameleon: () => ({ name: 'The Social Chameleon', icon: '🦎', tagline: 'Clothing as social language', poeticDescription: 'You use clothing to adapt, express, and respond to context. Newness, occasions, style shifts, and identity signals matter in your wardrobe decisions.', insight: 'Your wardrobe is responsive and expressive. The key question is whether it reflects your own change, or pressure from outside.', researchProfile: { acquisitionDriver: 'Style, trends, social events, and identity expression', retentionPattern: 'Keeps items while they feel socially or stylistically relevant', disposalTrigger: 'Lets go when items feel outdated, unlike you, or no longer suitable for public use', flowRate: 'high', primaryValue: 'Social value' } }),
  functionalMinimalist: (v) => ({ name: 'The Functional Minimalist', icon: '⚙️', tagline: 'Purpose earns wardrobe space', poeticDescription: 'Your choices are grounded in use. Garments matter when they are comfortable, reliable, repairable, and useful in real life.', insight: 'Your clarity keeps the wardrobe practical. Just remember that usefulness can include pleasure and self-expression too.', researchProfile: { acquisitionDriver: 'Need, replacement, comfort, durability, and practical use', retentionPattern: 'Keeps garments that are worn often or perform a clear role', disposalTrigger: 'Lets go when an item no longer fits, works, or serves daily life', flowRate: v.inflowOutflow > 60 ? 'moderate' : 'low', primaryValue: 'Functional value' } }),
  consciousCurator: () => ({ name: 'The Conscious Curator', icon: '🌱', tagline: 'Aware of the garment lifecycle', poeticDescription: 'You notice movement in and out of the wardrobe. Your answers suggest attention to circulation, repair, resale, donation, or planned letting go.', insight: 'You are aware of clothing as a lifecycle, not just a purchase. The challenge is to make that flow intentional rather than reactive.', researchProfile: { acquisitionDriver: 'Mixture of need, opportunity, and lifecycle awareness', retentionPattern: 'Keeps items while they still have use, value, or a possible second life', disposalTrigger: 'Uses donation, resale, bins, or repurposing when an item no longer belongs', flowRate: 'high', primaryValue: 'Inflow/outflow awareness' } }),
  identityCollector: () => ({ name: 'The Identity Collector', icon: '✨', tagline: 'Wardrobe as autobiography', poeticDescription: 'Your clothing connects memory with identity. Items may represent who you were, who you are, or who you still imagine becoming.', insight: 'Your wardrobe tells a rich story. It may help to ask which chapters still need physical space.', researchProfile: { acquisitionDriver: 'Identity, aspiration, occasions, and emotional resonance', retentionPattern: 'Keeps garments that represent versions of self', disposalTrigger: 'Lets go when identity shifts or the item loses emotional/social relevance', flowRate: 'moderate', primaryValue: 'Identity and emotional-social meaning' } }),
  balancedAdapter: () => ({ name: 'The Balanced Adapter', icon: '⚖️', tagline: 'Flexible, contextual, practical', poeticDescription: 'Your wardrobe decisions are mixed and contextual. You seem to balance use, feeling, appearance, and lifecycle rather than following one dominant rule.', insight: 'Balance is useful because real wardrobes are messy. Your opportunity is to make your implicit rules more visible.', researchProfile: { acquisitionDriver: 'Context, need, preference, and occasion', retentionPattern: 'Keeps items when they remain useful, meaningful, or socially fitting', disposalTrigger: 'Lets go when enough reasons accumulate across fit, taste, use, or condition', flowRate: 'moderate', primaryValue: 'Balanced value mix' } }),
};

export function calculatePersona(values: ValueMeters): PersonaProfile {
  return PERSONA_BUILDERS[assignArchetype(values)](values);
}
```

The replaced region (lines 11–80) already contained the old `clampValue`, `calculateValuesFromMirrorGame`, and `calculatePersona`, so they are fully superseded by the block above. Keep the existing `import type { … } from '../types';` line at the top — its types (`BaselineResponses, PersonaProfile, SetAResponse, SetBResponse, SetCResponse, SetResponse, ValueMeters`) are still used by the new functions and by `getMirrorInsights`, which stays unchanged below.

- [ ] **Step 4: Run tests + typecheck to verify they pass**

Run: `pnpm test`
Expected: PASS — `scoring.test.ts`, `scoring-engine.test.ts`, plus the regression gate `schema-contract.test.ts` and `smoke.test.ts` all green.

Run: `pnpm typecheck`
Expected: no errors (the two call sites in `MirrorGame.tsx` / `FinalDashboard.tsx` still type-check against the unchanged signatures).

- [ ] **Step 5: Commit**

```bash
git add src/app/components/mirror/lib/scoring.ts tests/scoring.test.ts
git commit -m "feat(scoring): rewire public API to reflected/expectation profiles + prototype personas"
```

---

## Task 8: Phase 1 verification gate

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all suites pass (`scoring-engine`, `scoring`, `schema-contract`, `smoke`).

- [ ] **Step 2: Types**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 4: Manual sanity (optional but recommended)**

Run: `pnpm dev`, complete a clearly-functional run (buy second-hand, wear weekly, use for work, repair yourself) and confirm the dashboard shows high Functional/Circularity and a sensible archetype (Functional Minimalist or Conscious Curator). Note: the dashboard still shows the OLD single-profile visuals until Phase 2 — only the numbers/archetype change here.

- [ ] **Step 5: Tag the phase**

```bash
git commit --allow-empty -m "chore: scoring core (phase 1) complete and verified"
```

---

# PHASE 2 — Display follow-up

> Phase 2 makes the dashboard consume **both** profiles (expectation + reflected), so the existing "Initial Self-Assessment vs Reflective Result" radar legend finally becomes truthful, deltas can be negative, the 4th axis is labelled "Circularity", and partial results are flagged. This phase touches React UI; the repo has no component-test harness, so verification is `pnpm typecheck` + `pnpm build` + a manual checklist, with one pure helper unit-tested.

## Task 9: Signed baseline-comparison deltas using the expectation profile

Currently `FinalDashboard.tsx:68-80` re-implements the old additive baseline math and every delta is rendered as a hardcoded green `+`. Replace with the expectation profile and a signed delta.

**Files:**
- Modify: `src/app/components/mirror/screens/FinalDashboard.tsx`
- Create: `src/app/components/mirror/lib/display-helpers.ts`
- Test: `tests/display-helpers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/display-helpers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatDelta } from '../src/app/components/mirror/lib/display-helpers';

describe('formatDelta', () => {
  it('formats a positive shift', () => {
    expect(formatDelta(70, 55)).toEqual({ sign: 'up', label: '+15', magnitude: 15 });
  });
  it('formats a negative shift', () => {
    expect(formatDelta(40, 60)).toEqual({ sign: 'down', label: '-20', magnitude: 20 });
  });
  it('formats no change', () => {
    expect(formatDelta(50, 50)).toEqual({ sign: 'flat', label: '0', magnitude: 0 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `formatDelta` not found.

- [ ] **Step 3: Implement the helper**

Create `src/app/components/mirror/lib/display-helpers.ts`:

```ts
export interface Delta {
  sign: 'up' | 'down' | 'flat';
  label: string;
  magnitude: number;
}

/** Signed delta between a reflected value and an expectation value, for the baseline-comparison row. */
export function formatDelta(reflected: number, expectation: number): Delta {
  const diff = reflected - expectation;
  if (diff > 0) return { sign: 'up', label: `+${diff}`, magnitude: diff };
  if (diff < 0) return { sign: 'down', label: `${diff}`, magnitude: -diff };
  return { sign: 'flat', label: '0', magnitude: 0 };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Replace the baseline math in `FinalDashboard.tsx`**

Add to the imports near `scoring` (around line 22):

```tsx
import { calculateValuesFromMirrorGame, calculatePersona, getMirrorInsights, calculateExpectationProfile, calculateReflectionConfidence } from '../lib/scoring';
import { formatDelta } from '../lib/display-helpers';
```

Replace the whole `baselineValues` block (currently lines 68-80, from `// Baseline values — mirrors...` through the closing `}` before `return (`) with:

```tsx
    // Expectation profile (self-image) from baseline only — the comparison reference.
    const baselineValues = calculateExpectationProfile(baselineResponses);
    const confidence = calculateReflectionConfidence(allResponses);
```

- [ ] **Step 6: Add a reusable `DeltaChip` and use it for all four rows**

First add `TrendingDown` to the lucide-react import block at the top of the file (it currently lists `TrendingUp` around line 16):

```tsx
  TrendingDown,
  TrendingUp,
```

Next, define a small component just above `export function FinalDashboard(props: FinalDashboardProps) {`:

```tsx
function DeltaChip({ reflected, expectation }: { reflected: number; expectation: number }) {
  const d = formatDelta(reflected, expectation);
  const color = d.sign === 'down' ? 'text-amber-400' : d.sign === 'flat' ? 'text-white/50' : 'text-emerald-400';
  return (
    <span className={`flex items-center gap-1 ${color}`}>
      {d.sign === 'down' ? <TrendingDown className="w-3 h-3 flex-shrink-0" /> : <TrendingUp className="w-3 h-3 flex-shrink-0" />}
      <span className="text-xs sm:text-sm">{d.label}</span>
    </span>
  );
}
```

Then, in the Baseline Comparison section, replace each of the four hardcoded delta `<span>` chips. Each currently looks like this (only the axis key differs):

```tsx
<span className="flex items-center gap-1 text-emerald-400" style={{
  filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))'
}}>
  <TrendingUp className="w-3 h-3 flex-shrink-0" />
  <span className="text-xs sm:text-sm">+{values.social - baselineValues.social}</span>
</span>
```

Replace the four of them (Social, Emotional, Functional, and the Flow/Circularity row) respectively with:

```tsx
<DeltaChip reflected={values.social} expectation={baselineValues.social} />
<DeltaChip reflected={values.emotional} expectation={baselineValues.emotional} />
<DeltaChip reflected={values.functional} expectation={baselineValues.functional} />
<DeltaChip reflected={values.inflowOutflow} expectation={baselineValues.inflowOutflow} />
```

- [ ] **Step 7: Verify**

Run: `pnpm typecheck && pnpm build`
Expected: both succeed.

- [ ] **Step 8: Commit**

```bash
git add src/app/components/mirror/screens/FinalDashboard.tsx src/app/components/mirror/lib/display-helpers.ts tests/display-helpers.test.ts
git commit -m "feat(display): signed expectation-vs-reflected deltas on the baseline comparison"
```

---

## Task 10: Relabel the 4th axis "Flow" → "Circularity"

**Files:**
- Modify: `src/app/components/mirror/screens/FinalDashboard.tsx`

- [ ] **Step 1: Update the bar label**

In the Flow row of the Baseline Comparison section, change the label text `Flow` to `Circularity`:

```tsx
<span className="tracking-wider whitespace-nowrap">Circularity</span>
```

(The storage key `inflowOutflow` and DB column `inflow_outflow_value` are unchanged — this is display text only.)

- [ ] **Step 2: Update the "Started as / Reflected as" footer (optional cleanup)**

The footer (around line 340) maps `primaryDriver` to ad-hoc labels (`Guardian`/`Memory Keeper`/`Explorer`). Leave the labels but confirm they still render; no functional change required. If desired for consistency, this can be removed in a later cleanup — not required here.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/mirror/screens/FinalDashboard.tsx
git commit -m "feat(display): relabel 4th value axis to Circularity"
```

---

## Task 11: Radar — 4 axes + two polygons (expectation vs reflected)

The radar currently plots 3 axes and one polygon, while its legend promises an "Initial Self-Assessment" (dashed) vs "Reflective Result" overlay. Make it draw both, across all four axes.

**Files:**
- Modify: `src/app/components/mirror/ui/ValueFingerprintRadar.tsx`
- Modify: `src/app/components/mirror/screens/FinalDashboard.tsx` (pass the expectation profile)

- [ ] **Step 1: Replace the radar component**

Replace the entire body of `src/app/components/mirror/ui/ValueFingerprintRadar.tsx` with a 4-axis, two-polygon version:

```tsx
import React from 'react';
import { COLORS } from '../constants/design';
import type { ValueMeters } from '../types';

const AXES: Array<{ key: keyof ValueMeters; label: string }> = [
  { key: 'social', label: 'Social' },
  { key: 'emotional', label: 'Emotional' },
  { key: 'functional', label: 'Functional' },
  { key: 'inflowOutflow', label: 'Circularity' },
];

export function ValueFingerprintRadar({ values, expectation }: { values: ValueMeters; expectation?: ValueMeters }) {
  const size = 300, center = size / 2, maxRadius = 105;

  const toPoints = (v: ValueMeters) =>
    AXES.map((axis, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
      const radius = (v[axis.key] / 100) * maxRadius;
      return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
    });

  const labelPoints = AXES.map((axis, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
    return {
      ...axis,
      value: values[axis.key],
      lx: center + Math.cos(angle) * (maxRadius + 32),
      ly: center + Math.sin(angle) * (maxRadius + 32),
    };
  });

  const reflectedPoly = toPoints(values).map((p) => `${p.x},${p.y}`).join(' ');
  const expectationPoly = expectation ? toPoints(expectation).map((p) => `${p.x},${p.y}`).join(' ') : null;

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.33, 0.66, 1].map((scale) => (
          <polygon key={scale} points={AXES.map((_, index) => {
            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
            return `${center + Math.cos(angle) * maxRadius * scale},${center + Math.sin(angle) * maxRadius * scale}`;
          }).join(' ')} fill="none" stroke="rgba(245,241,232,0.18)" strokeWidth="1" />
        ))}
        {AXES.map((_, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
          return <line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * maxRadius} y2={center + Math.sin(angle) * maxRadius} stroke="rgba(245,241,232,0.18)" strokeWidth="1" />;
        })}
        {expectationPoly && (
          <polygon points={expectationPoly} fill="none" stroke={COLORS.gold} strokeWidth="2" strokeDasharray="5 4" opacity={0.8} />
        )}
        <polygon points={reflectedPoly} fill="rgba(16,185,129,0.22)" stroke="rgb(16,185,129)" strokeWidth="2" />
        {toPoints(values).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgb(16,185,129)" />)}
        {labelPoints.map((point) => (
          <g key={point.label}>
            <text x={point.lx} y={point.ly - 5} textAnchor="middle" fill={COLORS.light} fontSize="12" fontFamily="Georgia, serif">{point.label}</text>
            <text x={point.lx} y={point.ly + 11} textAnchor="middle" fill={COLORS.gold} fontSize="12" fontFamily="Georgia, serif">{point.value}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Pass the expectation profile from the dashboard**

In `FinalDashboard.tsx`, find the radar usage (around line 448) and pass `expectation`:

```tsx
<ValueFingerprintRadar values={values} expectation={baselineValues} />
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Manual check**

Run `pnpm dev`, finish a run, open the Dashboard tab: the radar should show **four** labelled axes (Social, Emotional, Functional, Circularity), a **dashed gold** polygon (expectation) and a **solid green** polygon (reflected). This matches the existing legend.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/mirror/ui/ValueFingerprintRadar.tsx src/app/components/mirror/screens/FinalDashboard.tsx
git commit -m "feat(display): 4-axis radar with expectation vs reflected polygons"
```

---

## Task 12: Confidence indicator for partial completion

Show a small "based on N of 3 sets" note near the persona when reflection confidence is not high.

**Files:**
- Modify: `src/app/components/mirror/screens/FinalDashboard.tsx`

- [ ] **Step 1: Add the indicator under the persona name**

In the hero section, just after the persona `poeticDescription` paragraph (around line 207-209), add:

```tsx
{confidence !== 'high' && (
  <p className="text-[11px] text-white/50 font-light italic px-4 text-center">
    Provisional result — based on {allResponses.length} of 3 garment sets. Completing more sharpens your profile.
  </p>
)}
```

(`confidence` is already in scope from Task 9 Step 5.)

- [ ] **Step 2: Verify**

Run: `pnpm typecheck && pnpm build`
Expected: both succeed.

- [ ] **Step 3: Manual check**

Run `pnpm dev`, complete only Set A then finish early: the dashboard shows the provisional note; completing all three hides it.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/mirror/screens/FinalDashboard.tsx
git commit -m "feat(display): provisional-confidence note for partial completions"
```

---

## Task 13: Phase 2 verification + methodology note

**Files:**
- Create: `docs/scoring-methodology.md` (participant/researcher-facing summary)

- [ ] **Step 1: Full gate**

Run: `pnpm test && pnpm typecheck && pnpm build`
Expected: all green.

- [ ] **Step 2: Manual end-to-end checklist**

Run `pnpm dev` and confirm:
- Dashboard radar: 4 axes, two polygons (dashed expectation, solid reflected).
- Baseline comparison: deltas can be negative (amber down-arrow) and zero (grey).
- 4th axis labelled "Circularity" everywhere on the dashboard.
- A high-consumption run (buy new, shop frequently, wanted-new, sell/discard) does NOT land on Conscious Curator.
- A repair/donate/second-hand run DOES trend toward Conscious Curator.
- Partial run shows the provisional note.

- [ ] **Step 3: Write the methodology note**

Create `docs/scoring-methodology.md` summarising, for the research team: the four constructs + citations (spec §1), the normalization formula (spec §3), the contribution-table intent (spec §4), the prototype archetypes (spec §5), and the validity disclaimer (spec §1). Link to the full spec at `docs/superpowers/specs/2026-06-04-scoring-methodology-redesign-design.md`.

- [ ] **Step 4: Commit**

```bash
git add docs/scoring-methodology.md
git commit -m "docs: add researcher-facing scoring methodology note"
```

- [ ] **Step 5: Update project docs**

Update `CLAUDE.md`:
- Remove the "Scorer for `washFrequency`, `brand`, `howLongHad`" deferred item (now scored, except `brand` which is legacy/never-written).
- Note that scoring is now the two-profile, normalized, prototype-distance model documented in the spec.

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md to reflect redesigned scoring"
```

---

## Self-review notes (for the implementer)

- **Spec coverage:** §1 constructs → Tasks 2/3 tables; §2 two profiles → Tasks 5/7/9/11; §3 normalization → Tasks 1/4; §4 contribution tables → Tasks 2/3; §5 prototypes → Tasks 3/6; §6 confidence → Tasks 6/7/12; §7 storage (no migration) → unchanged `ValueMeters`, verified by `schema-contract.test.ts`; §9 display → Tasks 9-12.
- **No DB/schema change:** the reflected `ValueMeters` still flows into `MirrorGame.finishGame` submission and the CSV; `schema-contract.test.ts` is the guard.
- **Signatures preserved:** `calculateValuesFromMirrorGame(responses, baseline)` and `calculatePersona(values)` keep their shapes; the `baseline` arg is intentionally ignored (renamed `_baseline`) so both existing call sites keep compiling.
- **Type consistency:** `Axis`, `ItemSpec`, `ArchetypeKey`, `ScoredProfile`, `ConfidenceLevel`, `Delta` are each defined once and imported; persona keys in `PROTOTYPES`, `assignArchetype`'s order array, and `PERSONA_BUILDERS` use the identical six `ArchetypeKey` strings.
- **Calibration caveat:** all weights/prototypes are v1 priors. After implementation, sanity-check against the existing rows and adjust `scoring-config.ts` only (the engine and tests stay stable).

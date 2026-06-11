# Scoring Recalibration — Mapping Revision + Prototype Re-anchor (2026-06-11)

## Why

Re-scoring the full pilot export (284 rows, 108 sessions, `Notes/wardrobe_responses_full_2026-06-11.csv`)
with the engine as deployed proved that three of the six personas — **Functional Minimalist, Memory
Keeper, Conscious Curator — were never assigned** to any clean, fully-completed session, while
Identity Collector + Balanced Adapter absorbed ~81–91%. Two root causes:

1. **Axis inflation.** No behavioural answer could push Social or Emotional below 50 (all S/E
   directions were ≥ 0), and several common answers loaded Social heavily (leisure wear +0.5,
   "don't like it anymore" +1.0). Observed clean-session mean Social was **79** on an effective
   50–100 scale.
2. **Uncalibrated prototypes.** The six prototype coordinates were expert intuition (v1 priors);
   four of them assumed Social/Emotional values below 50 — outside the reachable score space —
   so those personas could never win the nearest-prototype match.

Reference: the stored `persona` column mixes two scoring regimes (40 sessions predate the
2026-06-04 engine redesign); all comparisons below use **uniform re-scoring from raw answers**.

## Stage 1 — Mapping revision (7 changes, `scoring-config.ts`)

| Item / answer | Change | Rationale |
|---|---|---|
| `mainUse: leisure` | S +0.5 → 0 | leisure wear is not group/image signalling (Sheth social value) |
| `mainUse: work/home/sport` | add S −0.3 | purely utilitarian context argues mildly against social motivation (ipsative, like `primaryDriver`) |
| `whyFavorite: comfortable` | add S −0.3 | comfort chosen over the style/confidence options |
| `whyBought: replace-similar` | add S −0.3 | need-driven replacement, not image-driven |
| `whyNotWear: dont-like-anymore` | S +1.0 → +0.5 | taste change ≠ explicit style/image signal (`out-of-style` keeps +1) |
| `disposalPlan: donate-charity` | E +0.3 → 0 | routine charity donation is not attachment evidence |
| `cost: 151+` | E +0.5 → 0 | price is not attachment; removes Emotional noise |

Effect on clean sessions (n=76): Social mean **79 → 71**, minimum **50 → 35** (the floor is
broken; reverse-keyed answers genuinely differentiate). Functional and Circularity are untouched
by construction (no F/C loading changed) — pinned by unit test.

## Stage 2 — Prototype re-anchor + flat-gate adjustment

New coordinates anchored to the observed distribution of the 76 clean sessions **re-scored under
Stage 1** (defining axis ≈ 85th percentile, contrast axes ≈ 25th percentile, otherwise median;
Balanced Adapter = observed centroid):

| Archetype | F | S | E | C | Anchoring |
|---|---|---|---|---|---|
| Functional Minimalist | 78 | 59 | 58 | 46 | F at p85; S, E at p25 |
| Social Chameleon | 68 | 90 | 65 | 39 | S at p85; C low |
| Memory Keeper | 58 | 59 | 81 | 46 | E at p85; S at p25, F low-mid |
| Identity Collector | 58 | 90 | 81 | 46 | S and E at p85 (the combo persona) |
| Conscious Curator | 68 | 59 | 65 | 58 | C at p85; S at p25 |
| Balanced Adapter | 68 | 74 | 65 | 46 | observed centroid |

Observed percentile reference (clean n=76, Stage 1 scoring):
`F p15/50/85 = 54/68/78 · S = 46/74/90 · E = 50/65/81 · C = 34/46/58`

`FLAT_PROFILE_SPREAD` **12 → 8**: with prototypes anchored to the observed distribution, a
distinctive profile can have a small absolute spread (circularity's whole observed range sits
below the other axes), so the old threshold mis-gated the Conscious Curator region to Balanced
Adapter. 8 still routes a no-evidence [50,50,50,50] profile to Balanced Adapter (unit-tested).

## Result — persona distribution, clean full 3-set sessions (n=59)

| Persona | Before (deployed engine) | After Stage 1 only | After Stage 1+2 (final) |
|---|---|---|---|
| Functional Minimalist | **0%** | 3% | **22%** |
| Social Chameleon | 19% | 8% | **12%** |
| Memory Keeper | **0%** | 0% | **8%** |
| Identity Collector | 47% | 44% | **14%** |
| Conscious Curator | **0%** | 0% | **12%** |
| Balanced Adapter | 34% | 44% | **32%** |

All 76 clean sessions (final): FM 21% · SC 18% · MK 12% · IC 12% · CC 11% · BA 26%.

**Acceptance criteria (all met):**
- Every persona assigned to ≥1 clean session ✓ (and each is reachable by a hand-built archetypal
  answer pattern — six unit tests in `tests/scoring-engine.test.ts`).
- No persona exceeds 40% of clean full-completion sessions ✓ (max: BA 32%).
- Face-validity spot-check ✓ — see `pilot-analysis-report.txt` (§ FACE-VALIDITY SAMPLES): FM
  examples are replace-similar / work-wear / fit-driven-disposal patterns; SC are wanted-new /
  special-occasions; MK are gift-acquired with long retention; CC are second-hand / repair /
  conscious-routing.

## Excluded sessions (32 of 108)

Flagged as suspected test runs: explicit test text ("test", "hi", "bored"), the repeated
leading-zero `07` costs, costs > €500, ownership > 30 years, > 60% skipped, or < 45 s per set.
Full list with per-session reasons: `docs/analysis/pilot-analysis-report.txt`
(§ FLAGGED SESSIONS). Exclusion confirmed by the researcher (2026-06-11). The headline
conclusion is insensitive to the 13 speed-only flags — distributions with and without them
differ by ≤ a few points.

## Artifacts

- **Paper dataset:** `docs/analysis/pilot-rescored-sessions.csv` — one row per session,
  uniformly re-scored under the final scheme (values, old/new persona, exclusion flag + reasons).
- **Full analysis report:** `docs/analysis/pilot-analysis-report.txt` (regenerable).
- **Reproduce:** `PILOT_CSV=Notes/wardrobe_responses_full_2026-06-11.csv npx vitest run tests/pilot-analysis.test.ts`

## Comparability note (for the methodology section of the paper)

Sessions submitted before this change were scored and shown personas under the previous scheme.
Stored rows are intentionally untouched; analysis must use the uniformly re-scored dataset above.
Scheme history: v1 additive (until 2026-06-04) → v2 normalized weighted-mean (2026-06-04) →
**v2.1 this recalibration (2026-06-11: 7 mapping revisions, pilot-anchored prototypes, gate 12→8)**.
The weights remain expert-set priors; the prototype coordinates are now **anchored to a pilot
sample (n=76 clean sessions)** — an improvement over intuition, but still pending confirmatory
validation on a larger sample.

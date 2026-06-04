# Scoring Methodology Redesign — Design Spec

- **Date:** 2026-06-04
- **Status:** Draft for review (methodology only — no code or DB changes in this spec)
- **Scope:** The value-scoring and archetype-assignment logic in `src/app/components/mirror/lib/scoring.ts`. Display/UI and database schema changes are noted as downstream consequences but are **out of scope** for this spec.
- **Author:** Claude (with Victor) — to be reviewed and formally signed off by the research team (Hamed) before any empirical claim is made.

## Decisions locked (from brainstorming)

| # | Decision | Choice |
|---|---|---|
| 1 | Theoretical anchor | **Theory of Consumption Values** (Sheth, Newman & Gross, 1991) for functional/social/emotional; clothing-disposal / circular-economy literature for the 4th axis |
| 2 | 4th axis (`inflowOutflow`) | Re-anchor as **Circularity consciousness** — conscious, waste-avoiding behaviour scores high; linear consumption scores low |
| 3 | Deviation budget | **Per-axis normalization** (comparable, completion-invariant) — moderate, approved deviation from additive model |
| 4 | Archetype assignment | **Prototype distance** — order-independent, all 6 archetypes reachable |
| 5 | Baseline answers | **Expectation vs behaviour split** — baseline = expectation profile; Sets A/B/C = reflected profile; archetype from reflected |
| 6 | Unused signals (`howLongHad`, `washFrequency`, `cost`) | **Score all three**, theory-mapped |
| 7 | Partial completion | **Always score, flag confidence** |

## Hard constraints (preserved, per `CLAUDE.md` / `AGENTS.md`)

- **4 value meters**, keeping existing keys/columns: `social`, `emotional`, `functional`, `inflowOutflow` (the 4th is *relabelled* "Circularity" in concept/UI but the storage key and `inflow_outflow_value` column are unchanged — **no DB migration required**).
- **6 archetypes**, same names and same `ARCHETYPE_INFO` descriptive text.
- **Same questions and options** — none added or removed. Only the option→axis *mapping* and the *math* change. (One option-set improvement — a "general waste / bin it" disposal option — is recorded as a *recommendation only*, not part of this spec, because it would add an option.)
- **Exported function signatures** of `scoring.ts` preserved so existing call sites in `FinalDashboard.tsx` keep working.
- 0–100 outputs feeding the existing bars and radar.

---

## 1. Constructs and theoretical grounding

| Meter (storage key) | Construct | Definition | Primary literature |
|---|---|---|---|
| `functional` | **Functional value** | Utility derived from practical/physical performance: comfort, fit, durability, reliability, frequency of use, care/maintenance, repair-for-use, value-for-money | Sheth, Newman & Gross (1991) |
| `social` | **Social value** | Utility derived from association with social groups, image and identity-signalling: trends, occasions, confidence, "being seen", styleability | Sheth, Newman & Gross (1991) |
| `emotional` | **Emotional value** | Utility derived from affective states and attachment: memory, gifts, sentiment, long ownership, aspirational keeping | Sheth, Newman & Gross (1991); Mugge, Schoormans & Schifferstein (2009) on product attachment |
| `inflowOutflow` (UI: **Circularity**) | **Circularity consciousness** | The degree to which a person keeps clothing in active circulation and out of waste: long productive use, maintenance, repair, second-hand acquisition, and routing end-of-life to reuse/resale/recycling rather than disposal or dormant accumulation. Opposite pole = linear throwaway (impulse-newness, sale-impulse, fast discard, "forgot"/unused stock) | Laitala (2014); Joung & Park-Poaps (2013); waste hierarchy (reduce > reuse > repair > recycle > discard) |

**Citations (full):**
- Sheth, J. N., Newman, B. I., & Gross, B. L. (1991). *Why we buy what we buy: A theory of consumption values.* Journal of Business Research, 22(2), 159–170.
- Laitala, K. (2014). *Consumers' clothing disposal behaviour — a synthesis of research results.* International Journal of Consumer Studies, 38(5), 444–457.
- Joung, H.-M., & Park-Poaps, H. (2013). *Factors motivating and influencing clothing disposal behaviours.* International Journal of Consumer Studies, 37(1), 105–111.
- Mugge, R., Schoormans, J. P. L., & Schifferstein, H. N. J. (2009). *Emotional bonding with personalised products.* Journal of Engineering Design, 20(5), 467–476.
- (Corroborating multi-dimensional value structure: Sweeney, J. C., & Soutar, G. N. (2001). *Consumer perceived value: the development of a multiple item scale (PERVAL).* Journal of Retailing, 77(2), 203–220.)

> **Validity disclaimer (must remain in the shipped methodology note):** This design *aligns* the instrument with established theory and removes arbitrary, undocumented weights. The salience weights and prototype coordinates below are **expert-set v1 priors, not empirically validated parameters.** Construct validity requires research-team review and, ideally, a calibration sample. The instrument should be described as "theory-aligned" rather than "validated" until that work is done.

---

## 2. Two-profile model (Expectation vs Reflected)

The app's stated premise is "the gap between expectation and behaviour." The current code sums baseline self-report and behavioural answers into one number, so no gap is ever computed. The redesign produces **two profiles on the same 0–100 scale**:

- **Expectation profile** — computed from the **4 baseline questions only**. Represents the participant's self-image.
- **Reflected profile** — computed from **behavioural Sets A / B / C only**. Represents revealed behaviour.
- **Archetype** is assigned from the **reflected** profile (Decision 5).
- **Gap** (per axis) = `reflected − expectation`. Now genuinely **signed** — it can be negative. This is the quantity the dashboard's "Baseline Comparison" bars and the radar's existing (but currently non-functional) "Initial Self-Assessment vs Reflective Result" legend are meant to show.

Both profiles use the identical normalization (§3) so they are directly comparable. The expectation profile rests on only 4 items, so its confidence is inherently lower than a 3-set reflected profile; this is expected and surfaced via the confidence flag (§6).

---

## 3. Normalization — the core formula

Replaces additive point sums (which made axes non-comparable and confounded with completion depth).

Each scored **item** carries, for each **axis** it bears on:
- a **salience** `w > 0` — how much this item counts as evidence on this axis. Drawn from three transparent tiers: **Strong = 3, Moderate = 2, Mild = 1**.
- a **direction** `s ∈ [−1, +1]` for the *chosen answer* — how strongly that answer pushes positive or negative on the axis (graded items such as cost bands, ownership years, and the disposal waste-hierarchy use fractional `s`).

Each axis is classified per item as a **primary probe** (the item is designed to test this axis) or a **secondary loading** (an option happens to also signal this axis).

**Per profile, per axis `a`:**

```
num = 0 ; den = 0
for each answered item i that maps to axis a:
    w = salience(i, a)
    s = direction(answer_i, a)            // multi-select: per axis take the selected
                                          // option with the max |contribution| (sign-aware)
    include = (i is a PRIMARY probe of a) OR (s != 0)
    if include:
        num += w * s
        den += w
score_a = (den == 0) ? 50 : 50 + 50 * (num / den)
score_a = clamp(round(score_a), 0, 100)
```

**Properties:**
- **50 = neutral** (no net evidence). 100 = all evidence maximally positive; 0 = all maximally negative.
- **Completion-invariant** — it is a weighted *mean*, not a sum, so 1-set and 3-set respondents are on the same scale (fixes A3).
- **Comparable across axes** — every axis is 0–100 with the same neutral point (fixes A1).
- **Signed / reverse-codable** — novelty/consumption answers pull *below* 50 (fixes A2, B2).
- **Bounded by construction** — no runaway pre-clamp totals (fixes A4).
- A primary-probe item with a neutral answer still counts in the denominator (choosing the neutral option is information). A secondary loading only counts when it actually fires.

---

## 4. Contribution tables (complete)

Notation: `F` functional, `S` social, `E` emotional, `C` circularity. Each cell is the signed direction `s` for that answer on that axis. The salience tier `w` for each (item, axis) is given in the item header as **[axis:tier]**; **P** marks a primary probe, **s** a secondary loading.

`garmentType` is **not scored** on any axis in any set (descriptive only) — unchanged from today, and correct.

### 4.1 Behavioural items → Reflected profile

**`howGot`** (Sets A, B, C) — **[C:Moderate **P**] [E:Moderate s] [F:Mild s]**

| Answer | F | S | E | C |
|---|---|---|---|---|
| bought-new | · | · | · | −1.0 |
| bought-secondhand | +0.5 | · | · | +1.0 |
| gift | · | · | +1.0 | 0 |
| borrowed-shared-rented | · | · | · | +1.0 |
| made-it | +0.5 | · | +0.5 | +1.0 |

**`cost`** (numeric €, Sets A, B, C) — **[F:Moderate **P**] [E:Mild s] [C:Mild s]**. Banded; noisy/context-dependent so weights kept modest.

| Band (€) | F | S | E | C |
|---|---|---|---|---|
| 0–20 | −0.5 | · | · | −0.3 |
| 21–75 | 0 | · | · | · |
| 76–150 | +0.5 | · | · | · |
| 151+ | +1.0 | · | +0.5 | · |

> Caveat (documented): cost is currency- and context-sensitive (a cheap gift ≠ cheap fast-fashion). Low salience keeps it a nudge.

**`wearFrequency`** (Sets A, B) — **[F:Moderate **P**] [C:Mild s]**

| Answer | F | S | E | C |
|---|---|---|---|---|
| once-a-week | +1.0 | · | · | +0.5 |
| once-a-month | +0.5 | · | · | +0.3 |
| once-each-season | 0 | · | · | 0 |
| not-used-last-year | −1.0 | · | · | −0.5 |

**`mainUse`** (multi, Sets A, B) — **[F:Moderate **P**] [S:Moderate **P**] [C:Mild s]**. Per axis use the max-magnitude selected option.

| Answer | F | S | E | C |
|---|---|---|---|---|
| work / home / sport | +1.0 | · | · | · |
| special-occasions | · | +1.0 | · | · |
| leisure | · | +0.5 | · | · |
| not-in-use | −1.0 | · | · | −1.0 |
| other | 0 | 0 | · | · |

**`whyBought`** (Set A) — **[S:Moderate **P**] [C:Moderate **P**] [F:Mild s]**

| Answer | F | S | E | C |
|---|---|---|---|---|
| replace-similar | +1.0 | · | · | +0.3 |
| wanted-new (trend/style) | · | +1.0 | · | −1.0 |
| on-sale | · | · | · | −0.6 |
| other | · | 0 | · | 0 |

**`whyFavorite`** (multi, Set B) — **[F:Moderate **P**] [S:Moderate **P**] [E:Moderate **P**]**. *Fixes B3 — content is now read, not collapsed to "answered = emotional".* Per axis use the max-magnitude selected option.

| Answer | F | S | E | C |
|---|---|---|---|---|
| comfortable | +1.0 | · | · | · |
| easy-to-style | +0.3 | +0.5 | · | · |
| confident | · | +1.0 | · | · |
| personal-emotional | · | · | +1.0 | · |
| other | 0 | 0 | 0 | · |

**`howLongHad`** (Set B categorical) — **[E:Moderate **P**] [C:Mild s]**. *NEW (fixes D1).*

| Answer | F | S | E | C |
|---|---|---|---|---|
| less-1-year | · | · | 0 | 0 |
| 1-2-years | · | · | +0.3 | · |
| 3-4-years | · | · | +0.5 | +0.3 |
| 5-6-years | · | · | +0.7 | +0.5 |
| 7-plus-years | · | · | +1.0 | +0.7 |

**`howLongHad`** (Set C, numeric years) — **[E:Moderate **P**] [C:Mild s]**. *NEW.* Mapped from integer years:

| Years | F | S | E | C |
|---|---|---|---|---|
| 0–1 | · | · | 0 | 0 |
| 2–3 | · | · | +0.3 | · |
| 4–6 | · | · | +0.5 | +0.3 |
| 7–10 | · | · | +0.7 | +0.5 |
| 11+ | · | · | +1.0 | +0.7 |

**`washFrequency`** (Set B, optional) — **[F:Mild **P**] [C:Mild s]**. *NEW.* Optional + noisy → low salience.

| Answer | F | S | E | C |
|---|---|---|---|---|
| every-time | +0.5 | · | · | +0.3 |
| few-times | +1.0 | · | · | +0.5 |
| when-dirty | +0.5 | · | · | +0.3 |
| never | 0 | · | 0 | 0 |

**`repaired`** (Set B, optional) — **[C:Moderate **P**] [F:Mild s] [E:Mild s]**

| Answer | F | S | E | C |
|---|---|---|---|---|
| yes-myself | +0.6 | · | +0.5 | +1.0 |
| yes-professionally | +0.6 | · | · | +1.0 |
| no-but-would | · | · | · | +0.4 |
| no | 0 | · | · | 0 |

**`whyNotWear`** (multi, Set C) — **[F:Moderate **P**] [S:Moderate **P**] [C:Mild s] [E:Mild s]**. Per axis use the max-magnitude selected option.

| Answer | F | S | E | C |
|---|---|---|---|---|
| doesnt-fit | +1.0 | · | · | 0 |
| damaged-worn-out | +0.5 | · | · | 0 |
| out-of-style | · | +1.0 | · | −0.5 |
| dont-like-anymore | · | +1.0 | · | −0.5 |
| waiting-occasion | · | +0.3 | +0.5 | · |
| forgot | · | · | · | −1.0 |
| other | 0 | 0 | · | · |

**`disposalPlan`** (Set C) — **[C:Strong **P**] [E:Mild s] [F:Mild s]**. Graded by waste hierarchy. *Fixes B2 — resale is circular-positive, not consumption.*

| Answer | F | S | E | C |
|---|---|---|---|---|
| repair-repurpose | +0.5 | · | +0.5 | +1.0 |
| gift-friends-family | · | · | +0.5 | +0.8 |
| donate-charity | · | · | +0.3 | +0.8 |
| sell-it | · | · | · | +0.7 |
| textile-bins | · | · | · | +0.5 |

> All current disposal options are relatively conscious (there is no "general waste/bin" option), so this item differentiates by *gradient* rather than by sign. **Recommendation (out of scope):** adding a "throw in general waste" option would let the low (linear) end of circularity be measured directly. Not implemented here because it adds an option.

### 4.2 Baseline items → Expectation profile

**`primaryDriver`** — **[F:Moderate **P**] [S:Moderate **P**] [E:Moderate **P**]**. The one **ipsative** (forced-choice relative) item: the chosen value is affirmed, the two unchosen are mildly down-weighted, so "I am functionally driven" reads as high-F / lower-S/E.

| Answer | F | S | E | C |
|---|---|---|---|---|
| function | +1.0 | −0.5 | −0.5 | · |
| emotion | −0.5 | −0.5 | +1.0 | · |
| social | −0.5 | +1.0 | −0.5 | · |

**`wardrobeSize`** — **[C:Moderate **P**] [F:Mild s]**

| Answer | F | S | E | C |
|---|---|---|---|---|
| minimal | +0.5 | · | · | +1.0 |
| moderate | 0 | · | · | 0 |
| extensive | · | · | · | −1.0 |

**`shoppingFrequency`** — **[C:Moderate **P**] [F:Mild s]**

| Answer | F | S | E | C |
|---|---|---|---|---|
| rarely | +0.3 | · | · | +1.0 |
| occasionally | · | · | · | 0 |
| frequently | · | · | · | −1.0 |

**`disposalHabit`** — **[C:Moderate **P**] [E:Mild s]**

| Answer | F | S | E | C |
|---|---|---|---|---|
| rarely | · | · | +0.5 | −0.3 |
| periodically | · | · | · | 0 |
| regularly | · | · | · | +0.5 |

> Nuance (documented): "disposing regularly" is not automatically *conscious* disposal — modest weight, and the behavioural `disposalPlan` determines whether outflow is actually circular. Baseline coverage of S and E rests largely on `primaryDriver`; this thinness is an inherent property of a 4-item baseline and is reflected in lower expectation-profile confidence.

---

## 5. Archetype assignment — prototype distance

Replaces the order-dependent if-else cascade (fixes C1/C2/C3). Each archetype is a **prototype point** in `[F, S, E, C]` space (0–100, 50 = neutral). The reflected profile is assigned to the **nearest** prototype by Euclidean distance.

**v1 prototype coordinates (tunable against face validity + existing rows):**

| Archetype | F | S | E | C | Defining idea (from existing `ARCHETYPE_INFO`) |
|---|---|---|---|---|---|
| Functional Minimalist | 85 | 40 | 35 | 65 | utility-first; repairs; sufficiency |
| Social Chameleon | 50 | 85 | 45 | 30 | trend/occasion; newness → low circularity |
| Memory Keeper | 40 | 40 | 90 | 55 | attachment; long retention; reluctant outflow |
| Identity Collector | 45 | 70 | 75 | 45 | memory + identity/aspiration; accumulates |
| Conscious Curator | 60 | 45 | 50 | 90 | active lifecycle: repair / resale / donate / second-hand |
| Balanced Adapter | 55 | 55 | 55 | 55 | no dominant axis |

**Assignment algorithm:**

```
d_k = euclidean(reflected, prototype_k) for each archetype k
# Dominance gate so a genuinely flat profile resolves to Balanced Adapter
if (max(reflected) − min(reflected)) < 12:
    archetype = "Balanced Adapter"
else:
    archetype = argmin_k d_k        # ties: lower-index in the table above (deterministic)
```

- Every prototype owns a region of the space (Voronoi cell) → no near-unreachable personas (fixes C2).
- No priority ordering between axes (fixes C1).
- Named 2-way combinations are simply prototypes in the space, not special-cased rules (fixes C3).
- The dominance gate prevents a flat ~50 profile from being assigned a weak numerical "winner."

> The coordinates are v1 priors. They should be sanity-checked by hand against the existing ~14 stored rows and adjusted for face validity during implementation/review; the *mechanism* is fixed, the *numbers* are calibration targets.

---

## 6. Confidence flag (Decision 7 — always score, flag confidence)

- **Per-axis confidence** = `den_a / den_max(a)` for the profile, where `den_max(a)` is the denominator if every item that can probe axis `a` were answered. Tiers (illustrative, tunable): `< 0.34` low, `0.34–0.67` medium, `≥ 0.67` high.
- **Overall reflected confidence** derived from behavioural sets completed: 1 set → low, 2 → medium, 3 → high.
- **Overall expectation confidence**: present (baseline done) / absent.
- An archetype is **always** assigned, but a thin (e.g. 1-set or baseline-only) result is shown as **tentative**. The confidence value is computed in the scoring layer and made available to the UI; how it is displayed is a downstream concern (§9).

---

## 7. Storage & backward compatibility (no migration required)

- The **reflected** profile is written to the existing columns `social_value`, `emotional_value`, `functional_value`, `inflow_outflow_value` (these become "behavioural", same columns).
- `persona` = archetype from the reflected profile.
- The **expectation** profile is **recomputable** at analysis time from the already-stored baseline columns (`wardrobe_size`, `shopping_frequency`, `disposal_habit`, `primary_driver`) — so **no new columns are strictly required**.
- **Optional, deferred (needs researcher sign-off, would be a migration):** add `expectation_*_value`, per-axis confidence, and a `scoring_version` column for clean longitudinal analysis. Recorded as a recommendation, not part of this spec.
- **Historical rows:** the existing ~14 rows were scored under the old additive scheme and their stored value numbers are **not comparable** to the new scheme. Because raw answers are stored, old rows *can* be re-scored from raw columns at analysis time if continuity is desired. The methodology note must record the scheme change and date.

---

## 8. Target module shape (for the implementation plan — not implemented here)

Keep the three exported functions used by `FinalDashboard.tsx` so call sites do not break; reimplement internals against the new model:

- `calculateValuesFromMirrorGame(responses, baseline)` → returns the **reflected** `ValueMeters` (behaviour only), preserving the current return type and the four keys.
- `calculatePersona(values)` → prototype-distance assignment over the same 6 names.
- `getMirrorInsights(...)` → unchanged contract; copy may reference the real gap.
- **New internal helpers** (not necessarily exported): a single declarative **contribution table** (data, not branches), a generic **normalizer** implementing §3, a **prototype set** + distance function, an **expectation-profile** calculator from baseline, and a **confidence** calculator.

The intent is that the weights and prototypes live as **data tables** (auditable, matching this spec) rather than as scattered `if` statements, so the methodology doc and the code stay in lock-step.

---

## 9. Downstream consequences (display follow-up — included in implementation, staged second)

These follow from the methodology but are **display / schema** work. Per the implementation-scope decision, they are **included in the implementation plan as a staged second phase** (the scoring core lands and is verified first; this display phase can then be approved or deferred independently):

1. **Radar** (`ValueFingerprintRadar.tsx`): should plot **two polygons** (expectation dashed + reflected solid) and include the **4th axis** — which makes the *already-present* legend truthful (fixes D2). Currently it plots one polygon over three axes.
2. **Baseline-comparison bars** (`FinalDashboard.tsx`): must allow **negative** deltas (the green "+" up-arrow is currently hardcoded).
3. **Circularity relabel**: UI label "Flow/Inflow-Outflow" → "Circularity" (storage key unchanged).
4. **Confidence display**: surface the §6 confidence for tentative (partial) results.
5. **Methodology note**: ship a short participant/researcher-facing "Scoring Methodology & Construct Validity" note containing §1 citations, the §4 tables, the §5 prototypes, and the §1 validity disclaimer.

---

## 10. Findings → fix traceability

| Finding | Fix |
|---|---|
| A1 unequal point budgets / non-comparable axes | §3 normalization (weighted mean, shared 0–100 scale) |
| A2 additive-only / monotonic, no reverse coding | §3 signed directions; §2 real signed gap |
| A3 completion-depth confound | §3 mean (not sum) → completion-invariant; §6 confidence |
| A4 clamp hides ceiling effects | §3 bounded by construction |
| B1 no theoretical grounding / magic numbers | §1 constructs + citations; §4 documented weight tiers |
| B2 4th axis conflates consumption & circularity | §1 re-anchor; §4 novelty loads −C, reuse/resale loads +C |
| B3 `whyFavorite` flattened & miscategorized | §4.1 content-based F/S/E mapping |
| B4 self-report pre-determines result | §2 expectation/behaviour split; archetype from behaviour |
| C1 order-dependent cascade | §5 prototype distance (order-free) |
| C2 uneven archetype reachability | §5 every prototype owns a region |
| C3 arbitrary combination logic | §5 combos are prototypes, not special cases |
| D1 collected-but-unscored signals | §4 `howLongHad`, `washFrequency`, `cost` scored |
| D2 radar contradicts "gap" claim | §2 produces two profiles; §9.1 radar follow-up |

---

## 11. Open items for research-team sign-off

1. Confirm the **theoretical framing** and citations (§1) are acceptable for the academic context.
2. Confirm the **circularity** definition (§1) — especially that **resale/selling counts as circular-positive**, not as consumption.
3. Review/adjust **weight tiers** (§4) and **prototype coordinates** (§5) for face validity; ideally calibrate against a sample.
4. Decide whether to take the **optional schema additions** (§7) for cleaner longitudinal analysis.
5. Decide whether to add the recommended **"general waste/bin" disposal option** (§4.1) in a future question-set revision (adds an option — outside current constraints).

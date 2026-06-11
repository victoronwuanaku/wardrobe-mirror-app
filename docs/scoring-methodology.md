# Wardrobe Mirror — Scoring Methodology

A plain-language summary of how the app turns a participant's answers into a four-axis value
profile and a behavioural archetype. For the full technical specification (complete weight
tables, algorithms, and rationale), see
[`docs/superpowers/specs/2026-06-04-scoring-methodology-redesign-design.md`](superpowers/specs/2026-06-04-scoring-methodology-redesign-design.md).

> **Status — theory-aligned; prototypes pilot-anchored (2026-06-11).** This instrument is
> grounded in established consumer-behaviour theory. The item weights are **expert-set priors,
> not empirically validated parameters** (7 of them revised on 2026-06-11 with documented
> rationale — see §7). The archetype prototype coordinates are now **anchored to the observed
> score distribution of a 76-session pilot sample** rather than intuition — an improvement,
> but still pending confirmatory validation on a larger sample.

## 1. The four value constructs

Three axes are the core dimensions of the **Theory of Consumption Values** (Sheth, Newman &
Gross, 1991); the fourth is grounded in clothing-disposal / circular-economy research.

| Axis (stored key) | Construct | Captures | Source |
|---|---|---|---|
| `functional` | **Functional value** | Comfort, fit, durability, use, care, repair-for-use, value-for-money | Sheth et al. 1991 |
| `social` | **Social value** | Image, identity, trends, occasions, confidence, being seen | Sheth et al. 1991 |
| `emotional` | **Emotional value** | Attachment, memory, gifts, sentiment, long ownership | Sheth et al. 1991; Mugge et al. 2009 |
| `inflowOutflow` (shown as **Circularity**) | **Circularity consciousness** | Keeping clothing in use and out of waste: long use, maintenance, repair, second-hand, reuse/resale/recycling. Opposite pole = linear throwaway (impulse-newness, fast discard, dormant stock) | Laitala 2014; Joung & Park-Poaps 2013 |

**References**
- Sheth, J. N., Newman, B. I., & Gross, B. L. (1991). *Why we buy what we buy: A theory of consumption values.* Journal of Business Research, 22(2), 159–170.
- Laitala, K. (2014). *Consumers' clothing disposal behaviour — a synthesis of research results.* International Journal of Consumer Studies, 38(5), 444–457.
- Joung, H.-M., & Park-Poaps, H. (2013). *Factors motivating and influencing clothing disposal behaviours.* International Journal of Consumer Studies, 37(1), 105–111.
- Mugge, R., Schoormans, J. P. L., & Schifferstein, H. N. J. (2009). *Emotional bonding with personalised products.* Journal of Engineering Design, 20(5), 467–476.
- (Corroborating value structure) Sweeney, J. C., & Soutar, G. N. (2001). *Consumer perceived value: the development of a multiple item scale (PERVAL).* Journal of Retailing, 77(2), 203–220.

## 2. Two profiles: expectation vs behaviour

The app computes **two** profiles on the same 0–100 scale, so it can show the gap between how a
participant *sees* themselves and how their *concrete garment stories* read:

- **Expectation profile** — from the four baseline questions only (the self-image).
- **Reflected profile** — from the behavioural Sets A/B/C only (the revealed behaviour).
- The **archetype** is assigned from the **reflected** profile.
- The dashboard's baseline-comparison bars and the radar's two polygons show `reflected − expectation`
  per axis. This difference is genuinely signed — it can be negative.

## 3. How each axis is scored (normalization)

Every answered item contributes **signed evidence** to the axes it bears on:

- a **salience** weight `w` — how much the item counts on that axis (tiers: strong = 3, moderate = 2, mild = 1);
- a **direction** `s ∈ [−1, +1]` for the chosen answer — positive, neutral, or negative.

Each axis score is a weighted mean rescaled to 0–100:

```
score = 50 + 50 × ( Σ w·s / Σ w )        # 50 = neutral; no evidence → 50
```

Because it is a *mean* (not a running sum), the score is **comparable across axes** and
**independent of how many sets the participant completed**. Evidence can push an axis **below**
50 (e.g. impulse-newness lowers Circularity), which the old additive scheme could never do.

The full item-by-item weight/direction table is in the spec (§4). Two examples of the fixes it
encodes:
- **"Why is it your favourite?"** now reads the *content* of the answer (comfortable → functional;
  confident → social; personal/emotional → emotional) instead of treating any answer as "emotional".
- **Disposal route** is graded by the waste hierarchy (repair > donate/gift > resell > recycle), and
  **reselling counts as circular-positive**, not as consumption — so a heavy consumer is no longer
  mistaken for a "Conscious Curator".

## 4. From scores to archetype (prototype distance)

The six archetypes are unchanged in name and description. Each is defined as a **prototype point**
in the four-axis space; a participant is assigned the **nearest** prototype (Euclidean distance).
A genuinely balanced (flat) profile resolves to **Balanced Adapter**. This replaces the old
order-dependent if/else cascade, so every archetype is reachable and assignment no longer depends
on the order the rules were written.

| Archetype | Functional | Social | Emotional | Circularity |
|---|---|---|---|---|
| Functional Minimalist | 78 | 59 | 58 | 46 |
| Social Chameleon | 68 | 90 | 65 | 39 |
| Memory Keeper | 58 | 59 | 81 | 46 |
| Identity Collector | 58 | 90 | 81 | 46 |
| Conscious Curator | 68 | 59 | 65 | 58 |
| Balanced Adapter | 68 | 74 | 65 | 46 |

(Coordinates recalibrated 2026-06-11 — anchored to the observed pilot distribution; see §7.
The flat-profile gate is `max − min < 8`, lowered from 12 in the same recalibration.)

## 5. Confidence on partial completion

Participants may finish 1, 2, or 3 garment sets. An archetype is always shown, but a result based
on fewer than three sets is flagged as **provisional** on the dashboard, because thinner evidence
means a less certain profile.

## 6. What is stored

The reflected profile is written to the existing `social_value`, `emotional_value`,
`functional_value`, `inflow_outflow_value` columns and `persona` — **no database change was
required**. The expectation profile is recomputable at analysis time from the stored baseline
columns. Note that rows collected before this methodology change were scored under the old
additive scheme and are **not directly comparable** to rows scored afterward.

## 7. Addendum — 2026-06-11 recalibration (scheme v2.1)

A pilot analysis (108 sessions; 76 clean after excluding suspected test runs) showed three
personas were never assigned: no behavioural answer could pull Social/Emotional below 50, and
four prototype coordinates sat outside the reachable score space. Two corrections, both
data-table changes (the engine algorithms are untouched):

1. **Seven mapping revisions** — leisure no longer loads Social; utilitarian answers
   (work/home/sport use, comfort-as-favourite, replacement purchase) now carry mild
   *reverse-keyed* Social loadings (−0.3); "don't like anymore" softened to +0.5; the
   donation→Emotional and premium-price→Emotional loadings removed. Each is justified in
   [`docs/analysis/2026-06-11-prototype-recalibration.md`](analysis/2026-06-11-prototype-recalibration.md).
2. **Prototype re-anchor** — coordinates placed at observed percentiles of the clean pilot
   sample (defining axis ≈ p85, contrast axes ≈ p25, Balanced Adapter = centroid); flat gate
   12 → 8.

Result on clean fully-completed sessions: from FM 0% / MK 0% / CC 0% / IC 47% / BA 34% to
FM 22% / SC 12% / MK 8% / IC 14% / CC 12% / BA 32%. Every persona is also covered by an
archetypal answer-pattern unit test. **Scheme history:** v1 additive (until 2026-06-04) →
v2 normalized weighted-mean (2026-06-04) → v2.1 this recalibration (2026-06-11). Cross-scheme
analysis must use the uniformly re-scored dataset
(`docs/analysis/pilot-rescored-sessions.csv`), not stored values.

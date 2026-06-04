# Wardrobe Mirror — Scoring Methodology

A plain-language summary of how the app turns a participant's answers into a four-axis value
profile and a behavioural archetype. For the full technical specification (complete weight
tables, algorithms, and rationale), see
[`docs/superpowers/specs/2026-06-04-scoring-methodology-redesign-design.md`](superpowers/specs/2026-06-04-scoring-methodology-redesign-design.md).

> **Status — theory-aligned, not yet validated.** This instrument is grounded in established
> consumer-behaviour theory, but the specific item weights and archetype coordinates are
> **expert-set v1 priors, not empirically validated parameters.** Construct validity should be
> confirmed by the research team and, ideally, calibrated against a participant sample before
> any claim of a "validated" instrument is made.

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
| Functional Minimalist | 85 | 40 | 35 | 65 |
| Social Chameleon | 50 | 85 | 45 | 30 |
| Memory Keeper | 40 | 40 | 90 | 55 |
| Identity Collector | 45 | 70 | 75 | 45 |
| Conscious Curator | 60 | 45 | 50 | 90 |
| Balanced Adapter | 55 | 55 | 55 | 55 |

(These coordinates are tunable v1 priors — see the disclaimer above.)

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

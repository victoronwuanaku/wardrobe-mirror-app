# Wardrobe Mirror — Scoring Methodology

A plain-language summary of how the app turns a participant's answers into a four-axis value
profile and a behavioural archetype. The complete weight and direction tables are reproduced in
**Appendix A** at the end of this document. Those tables are the live data in
[`src/app/components/mirror/lib/scoring-config.ts`](../src/app/components/mirror/lib/scoring-config.ts),
which is the single source of truth the scoring engine reads — if you change scoring, change it
there and update this document.

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

The full item-by-item weight/direction table is in **Appendix A**. Two examples of the fixes it
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

---

## Appendix A — Weight and direction tables

These tables reproduce the data in
[`src/app/components/mirror/lib/scoring-config.ts`](../src/app/components/mirror/lib/scoring-config.ts).
That file is authoritative; if the two ever disagree, the code is correct and this appendix is stale.

**Salience tiers** (how strongly an item counts as evidence on an axis): strong = 3, moderate = 2,
mild = 1.

**Direction** `s` is the signed pull a chosen answer exerts on an axis, in the range −1…+1. Axes
listed as *primary probes* count toward an item's denominator even when the chosen answer is neutral
(`s = 0`). Multi-select items: for each axis, the selected option with the largest magnitude wins.
Numeric answers (cost, years owned) are bucketed into bands first.

### Behavioural items → reflected profile

| Item | Salience | Primary | Answer → direction (axis: s) |
|---|---|---|---|
| **howGot** | inflowOutflow 2, emotional 2, functional 1 | inflowOutflow | bought-new → inflowOutflow −1 · bought-secondhand → functional +0.5, inflowOutflow +1 · gift → emotional +1 · borrowed-shared-rented → inflowOutflow +1 · made-it → functional +0.5, emotional +0.5, inflowOutflow +1 |
| **cost** (bands €0–20 / 21–75 / 76–150 / 151+) | functional 2, emotional 1, inflowOutflow 1 | functional | 0–20 → functional −0.5, inflowOutflow −0.3 · 21–75 → neutral · 76–150 → functional +0.5 · 151+ → functional +1, emotional +0.5 |
| **wearFrequency** | functional 2, inflowOutflow 1 | functional | once-a-week → functional +1, inflowOutflow +0.5 · once-a-month → functional +0.5, inflowOutflow +0.3 · once-each-season → neutral · not-used-last-year → functional −1, inflowOutflow −0.5 |
| **mainUse** (multi) | functional 2, social 2, inflowOutflow 1 | functional, social | work / home / sport → functional +1 · special-occasions → social +1 · leisure → social +0.5 · not-in-use → functional −1, inflowOutflow −1 |
| **whyBought** | social 2, inflowOutflow 2, functional 1 | social, inflowOutflow | replace-similar → functional +1, inflowOutflow +0.3 · wanted-new → social +1, inflowOutflow −1 · on-sale → inflowOutflow −0.6 |
| **whyFavorite** (multi) | functional 2, social 2, emotional 2 | functional, social, emotional | comfortable → functional +1 · easy-to-style → functional +0.3, social +0.5 · confident → social +1 · personal-emotional → emotional +1 |
| **howLongHad** (Set B categorical) | emotional 2, inflowOutflow 1 | emotional | <1yr → neutral · 1–2yr → emotional +0.3 · 3–4yr → emotional +0.5, inflowOutflow +0.3 · 5–6yr → emotional +0.7, inflowOutflow +0.5 · 7yr+ → emotional +1, inflowOutflow +0.7 |
| **howLongHadYears** (Set C numeric: 0–1 / 2–3 / 4–6 / 7–10 / 11+) | emotional 2, inflowOutflow 1 | emotional | same gradient as above, by band |
| **washFrequency** | functional 1, inflowOutflow 1 | functional | every-time → functional +0.5, inflowOutflow +0.3 · few-times → functional +1, inflowOutflow +0.5 · when-dirty → functional +0.5, inflowOutflow +0.3 · never → neutral |
| **repaired** | inflowOutflow 2, functional 1, emotional 1 | inflowOutflow | yes-myself → functional +0.6, emotional +0.5, inflowOutflow +1 · yes-professionally → functional +0.6, inflowOutflow +1 · no-but-would → inflowOutflow +0.4 · no → neutral |
| **whyNotWear** (multi) | functional 2, social 2, inflowOutflow 1, emotional 1 | functional, social | doesnt-fit → functional +1 · damaged-worn-out → functional +0.5 · out-of-style / dont-like-anymore → social +1, inflowOutflow −0.5 · waiting-occasion → social +0.3, emotional +0.5 · forgot → inflowOutflow −1 |
| **disposalPlan** | inflowOutflow 3, emotional 1, functional 1 | inflowOutflow | repair-repurpose → functional +0.5, emotional +0.5, inflowOutflow +1 · gift-friends-family → emotional +0.5, inflowOutflow +0.8 · donate-charity → emotional +0.3, inflowOutflow +0.8 · sell-it → inflowOutflow +0.7 · textile-bins → inflowOutflow +0.5 |

### Baseline items → expectation profile

| Item | Salience | Primary | Answer → direction (axis: s) |
|---|---|---|---|
| **primaryDriver** (ipsative) | functional 2, social 2, emotional 2 | — | function → functional +1, social −0.5, emotional −0.5 · emotion → emotional +1, functional −0.5, social −0.5 · social → social +1, functional −0.5, emotional −0.5 |
| **wardrobeSize** | inflowOutflow 2, functional 1 | inflowOutflow | minimal → functional +0.5, inflowOutflow +1 · moderate → neutral · extensive → inflowOutflow −1 |
| **shoppingFrequency** | inflowOutflow 2, functional 1 | inflowOutflow | rarely → functional +0.3, inflowOutflow +1 · occasionally → neutral · frequently → inflowOutflow −1 |
| **disposalHabit** | inflowOutflow 2, emotional 1 | inflowOutflow | rarely → emotional +0.5, inflowOutflow −0.3 · periodically → neutral · regularly → inflowOutflow +0.5 |

### Archetype prototypes

A participant is assigned the nearest prototype by Euclidean distance in
`[functional, social, emotional, inflowOutflow]` space. A genuinely flat profile (max − min below a
spread of **12**, `FLAT_PROFILE_SPREAD`) resolves to Balanced Adapter.

| Archetype | Functional | Social | Emotional | Circularity |
|---|---|---|---|---|
| Functional Minimalist | 85 | 40 | 35 | 65 |
| Social Chameleon | 50 | 85 | 45 | 30 |
| Memory Keeper | 40 | 40 | 90 | 55 |
| Identity Collector | 45 | 70 | 75 | 45 |
| Conscious Curator | 60 | 45 | 50 | 90 |
| Balanced Adapter | 55 | 55 | 55 | 55 |

(These coordinates are tunable v1 priors — see the disclaimer at the top of this document.)

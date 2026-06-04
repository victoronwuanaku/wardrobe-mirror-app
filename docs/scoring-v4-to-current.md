# Wardrobe Mirror — Scoring Logic: What Changed (V4 → Current) and Why

*A reader-friendly overview for collaborators and reviewers. The plain-language summary is first; the deeper sections and the theory→construct mapping follow. Full references are at the end. Companion documents: [`docs/scoring-methodology.md`](scoring-methodology.md) (summary) and [`docs/superpowers/specs/2026-06-04-scoring-methodology-redesign-design.md`](superpowers/specs/2026-06-04-scoring-methodology-redesign-design.md) (full spec with every weight).*

---

## At a glance

The earlier system (**V4**) added a fixed number of points to each value for each answer, starting every value at an arbitrary floor of 35, and then picked a persona with an ordered list of `if` checks. It worked, but the numbers were hand-set with no stated basis, the four values were not on comparable scales, the "Inflow/Outflow" value mixed two opposite behaviours, and the persona that got checked first won.

The **current** system keeps the same four values and the same six personas, but rebuilds *how* they are computed so the result is **interpretable, comparable, and defensible**:

1. Each value is a **normalized score on one shared 0–100 scale** (50 = neutral), not a running sum.
2. Evidence is **signed** — an answer can pull a value *down*, not only up.
3. The participant's **self-image** (from the baseline questions) is separated from their **actual behaviour** (from the garment sets), so the tool can show a genuine gap.
4. Every weight is **mapped to an established consumer-behaviour construct** with a citation, instead of being an undocumented magic number.
5. The persona is chosen by **nearest-prototype matching** (order-independent), so all six personas are reachable.

> **Honest framing (and why it helps the case):** the current logic is **grounded in established theory and fully transparent**, but the specific weight values and persona coordinates are **expert-set starting points, not yet empirically calibrated**. Describing it as *theory-aligned and structured* — rather than *validated* — is the accurate and more credible claim. Calibration against a participant sample is the natural next step.

---

## 1. What changed (V4 → current)

| Aspect | V4 (previous) | Current | Why the change matters |
|---|---|---|---|
| **Score construction** | Add fixed points to each value from a floor of 35; clamp 0–100 | Weighted **mean** of signed evidence, rescaled to 0–100 (50 = neutral) | Sums made the four values **non-comparable** (one axis could collect far more points than another) and **confounded with how many sets were completed**. A normalized mean fixes both — a standard measurement principle. |
| **Direction of evidence** | Points only ever **added** (monotonic) | Evidence is **signed** (−1…+1): some answers *lower* a value | Real instruments use items in both directions; one-directional scoring inflates everything and can't represent "this behaviour argues *against* a value." |
| **Self-image vs behaviour** | Baseline answers and behaviour **blended into one number** | **Two profiles**: *expectation* (baseline) vs *reflected* (behaviour); persona from behaviour | The tool's premise is the *gap between what people say and what they do*. V4 never actually computed a gap; the current model does. |
| **The 4th value** | "Inflow/Outflow" — **high for both** heavy buying *and* conscious recycling | **Circularity consciousness** — consumption/novelty load **negative**, reuse/repair/longevity load **positive** | In V4 a fast-fashion over-consumer and a careful recycler both scored high and could both be labelled "Conscious Curator." The redefinition removes that contradiction. |
| **"Why is it your favourite?"** | Any answer = **+14 emotional** | **Content-aware**: *comfortable* → functional, *confident/easy-to-style* → social, *personal/emotional* → emotional | V4 discarded the most informative question's content and mislabeled it. |
| **Persona assignment** | **Ordered `if` cascade** (Memory Keeper checked first, etc.) | **Nearest-prototype** matching in value-space (+ a "flat profile → Balanced Adapter" rule) | In V4 the *order of the checks* decided ties, and some personas were nearly unreachable. Prototype matching is order-independent and every persona owns a region. |
| **Use of collected data** | `cost` barely used; care/longevity signals collected but unscored (and a stale `useChanged` rule) | Ownership duration, wash/care, and cost are **mapped to constructs** | Data the participant gives is no longer wasted. |
| **Theoretical basis** | Undocumented hand-set numbers | **Every weight maps to a named construct + citation** (see §3) | The headline change: the scoring is now explainable and auditable, not a black box of magic numbers. |
| **Display** | Radar shows Social/Emotional/Functional (Inflow/Outflow internal) | Same 3-axis "value fingerprint" (Circularity internal), now also overlaying *expectation vs reflected*; the separate "Baseline Comparison" table was removed | Simpler participant-facing view; the analytical detail lives in the data, not the screen. |

Everything that participants recognise is preserved: **the four values, the six persona names, and their descriptions are unchanged.** Only the computation underneath them changed.

---

## 2. The current logic, in plain terms

**Four value constructs (the "meters").**
- **Functional** — practical worth: comfort, fit, durability, frequency of use, care, repair-for-use, value for money.
- **Social** — image and identity: trends, occasions, confidence, being seen, style.
- **Emotional** — affect and attachment: memory, gifts, sentiment, long ownership.
- **Circularity** — keeping clothing in use and out of waste: long use, maintenance, repair, second-hand, reuse/resale/recycling vs. linear "buy-new-and-bin." *(Computed and used internally for the persona and stored for analysis; not drawn on the fingerprint.)*

**Two profiles.** The four baseline questions produce an **expectation** profile (how the participant sees themselves); the three garment sets produce a **reflected** profile (what their concrete stories reveal). The **persona is assigned from the reflected (behaviour) profile.**

**How a value is scored.** Each answered question contributes signed evidence to the axes it bears on: a **salience** weight `w` (how much that question counts — strong/moderate/mild) and a **direction** `s` from −1 to +1 (which way, and how strongly, the chosen answer points). Each axis is then:

```
score = 50 + 50 × ( Σ w·s / Σ w )        # 50 = neutral; no evidence → 50
```

Because it is a **weighted mean rather than a sum**, the four values are directly comparable and the score does not inflate just because someone answered more questions.

**How the persona is chosen.** Each of the six personas is defined as a **target point** in the four-value space (a "prototype"). The participant is matched to the **nearest** prototype; a genuinely balanced profile resolves to *Balanced Adapter*. This replaces the order-dependent cascade, so no persona is unreachable and the result doesn't depend on the order the rules were written.

**Confidence.** A result based on fewer than three completed garment sets is flagged as *provisional*, because thinner evidence means a less certain profile.

---

## 3. Why — grounded in the literature

The four values are not arbitrary; they are an operationalisation of well-established constructs.

| Value (in the app) | Grounded in | Source |
|---|---|---|
| **Functional, Social, Emotional** | Three of the five dimensions of the **Theory of Consumption Values**, which explains *why* consumers choose what they choose. Functional value = utility from performance; social value = utility from association with groups/identity; emotional value = utility from feelings aroused. | Sheth, Newman & Gross (1991) |
| **Emotional (attachment/longevity sub-signal)** | **Product-attachment** research: people form emotional bonds to specific possessions, which predicts care and retention. | Mugge, Schoormans & Schifferstein (2009) |
| **Circularity consciousness** | **Clothing-disposal behaviour** and the **circular-economy waste hierarchy** (reduce → reuse → repair → recycle → discard): conscious routes (repair, resale, donation, second-hand) keep garments in use; impulsive newness and fast discard are "linear." | Laitala (2014); Joung & Park-Poaps (2013) |
| **(Corroboration of a multi-dimensional value structure)** | The **PERVAL** scale independently validates functional/emotional/social value as distinct, measurable dimensions of perceived value. | Sweeney & Soutar (2001) |

The **methodological choices** are equally deliberate:

- **Normalization to a common scale (50 = neutral).** Putting heterogeneous indicators on one comparable scale is a basic requirement of sound measurement; without it, comparing "Functional 70" to "Social 70" is meaningless when the two were collected on different point budgets.
- **Signed / reverse-scored evidence.** Mixing positively- and negatively-keyed indicators is standard psychometric practice; a purely additive, one-directional score cannot express disconfirming evidence and tends to inflate.
- **Expectation vs. behaviour split.** The instrument is explicitly about the distance between stated self-image and revealed behaviour — the well-documented gap between attitudes/intentions and action in (sustainable) consumption. Separating the two profiles is what makes that gap measurable.
- **Prototype (nearest-target) persona assignment.** This mirrors the **prototype theory of categorization** — membership judged by similarity to a category's best example (Rosch, 1975) — and is operationally a nearest-centroid classifier: transparent, deterministic, and order-independent.

In short: the *constructs* come from consumption-values theory and circular-economy/clothing-disposal research; the *measurement design* follows standard scaling and categorization principles. The scoring is now something you can point at line-by-line and justify.

---

## 4. Limitations and the honest next step

- The **salience weights and prototype coordinates are expert-set v1 priors.** They are theory-*aligned* but not yet **empirically calibrated**; the tool should be described accordingly.
- Recommended next step: a **face-validity review** by the research team and, ideally, **calibration against a participant sample** (and, where feasible, a check that personas separate as intended).
- A few modelling decisions are deliberate judgement calls worth recording — e.g. **treating resale/selling as circular-positive** (reuse), and that the three optional/at-the-end questions are skippable.
- Some collected fields remain **deliberately unscored or stored-only** pending research-team direction; this is documented rather than hidden.

These caveats are not weaknesses to hide — stating them is exactly what distinguishes a structured, scientifically-framed instrument from a black box.

---

## References

- Joung, H.-M., & Park-Poaps, H. (2013). Factors motivating and influencing clothing disposal behaviours. *International Journal of Consumer Studies, 37*(1), 105–111.
- Laitala, K. (2014). Consumers' clothing disposal behaviour — a synthesis of research results. *International Journal of Consumer Studies, 38*(5), 444–457.
- Mugge, R., Schoormans, J. P. L., & Schifferstein, H. N. J. (2009). Emotional bonding with personalised products. *Journal of Engineering Design, 20*(5), 467–476.
- Rosch, E. (1975). Cognitive representations of semantic categories. *Journal of Experimental Psychology: General, 104*(3), 192–233.
- Sheth, J. N., Newman, B. I., & Gross, B. L. (1991). Why we buy what we buy: A theory of consumption values. *Journal of Business Research, 22*(2), 159–170.
- Sweeney, J. C., & Soutar, G. N. (2001). Consumer perceived value: the development of a multiple item scale (PERVAL). *Journal of Retailing, 77*(2), 203–220.

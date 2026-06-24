# History & Known Issues

A plain-language record of what has been fixed and what is still open. This is context for anyone
picking the project up — the code itself is the source of truth for current behaviour.

## Timeline

- **May 2026** — a round of data-integrity and results-presentation bugs were found and fixed
  (the eight below).
- **June 2026** — the scoring system was redesigned onto a theory-grounded footing (see
  `docs/scoring-methodology.md`). This superseded some of the May scoring patches — for example
  the old "use changed over time" question is no longer scored, and the `use_changed` column is now
  legacy and never written.

## Fixed bugs (May 2026)

Each of these affected the collected data or the results screen, and all are fixed.

| # | What was wrong | Why it mattered |
|---|---|---|
| 1 | Set C's "what do you plan to do with it?" answer (disposal plan) was silently dropped before saving, and one other answer landed in the wrong column. | Disposal intent is the whole point of Set C — it was missing for every participant who completed it. |
| 2 | A Set B question's answer was recorded but contributed **zero** to scoring, because the scorer checked for answer labels the app had stopped using. | Everyone who answered it got a slightly less accurate result; over a full study the distributions would skew. |
| 3 | The results "before" baseline was drawn from only one of the four baseline answers, ignoring the other three. | The shift between "before" and "after" looked larger than it really was, giving participants an inflated sense of change. |
| 4 | The "YOU" badge on the archetype grid never appeared, because the name comparison didn't account for the leading "The ". | Participants couldn't tell at a glance which archetype was theirs. |
| 5 | One archetype ("Balanced Adapter") was missing from the dashboard's description list. | Participants assigned that archetype saw no explanation of what it meant. |
| 6 | The archetype grid was hand-built: it showed one archetype twice and omitted another ("Social Chameleon") entirely. | The gallery was inconsistent and incomplete. Fixed by rendering the grid from the official archetype data instead of a hand-written list. |
| 7 | Multi-select questions could drop a tap when options were tapped in rapid succession (a stale-state race). | Selections participants made might not have been recorded, especially on touch screens. |
| 8 | The Continue button advanced even when a required "Other" text box was left empty. | "Meant to type something but forgot" became indistinguishable from "deliberately skipped" in the data. |

## Known open issues

- **No consent capture.** The `consent_given` / `consent_timestamp` columns exist but are always
  null; there is no in-app consent step yet. This is the main outstanding privacy gap — see the
  "Consent & GDPR" section of `docs/data-and-schema.md`.
- **Scoring is not yet calibrated.** The redesigned scoring is grounded in published
  consumer-behaviour theory, but its specific item weights and archetype coordinates are
  **expert-set starting values, not empirically validated parameters**. The research team should
  review them for face validity and, ideally, calibrate them against a participant sample before
  describing the instrument as "validated". See `docs/scoring-methodology.md`.

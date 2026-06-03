# Bug Report — Wardrobe Mirror

Eight issues were identified and fixed in the data collection, scoring, and results presentation. This document describes each in plain language: what was wrong, why it mattered for the research, and what was corrected.

---

## Bug 1 — Disposal garment answers were not being saved

**What went wrong**

When a participant completed Set C (the garment they are ready to get rid of), their answer to the final question — *"What do you plan to do with it?"* — was silently dropped. It never reached the database, and it never appeared in exported CSV files. The same misalignment also shifted one other answer (Why don't you wear it?) into the wrong column in the spreadsheet, making that data appear under the wrong heading.

**Why it mattered**

Set C exists specifically to capture disposal intent. Losing the disposal plan answer meant the most important data point in that set was missing for every single participant who completed it, with no error or warning shown.

**What was fixed**

A structural mistake in how the data rows were assembled was corrected. All Set C answers now land in their correct columns, and *disposal plan* is properly saved to both the database and the CSV export.

---

## Bug 2 — A question's answers had no effect on the results

**What went wrong**

In Set B (the favourite garment), participants were asked *"Has the way you use this garment changed over time?"* and could answer Yes or No. Their answer was recorded, but the scoring system that shapes the final results (the value meters and persona) was checking for different answer labels that the app had stopped using at some earlier point. Because the labels never matched, this question contributed zero points to anyone's results — as if it had never been answered.

**Why it mattered**

Every participant who answered this question in Set B received a result that was slightly less accurate than it should have been. Over a full study with many participants, the value meter and persona distributions would be systematically skewed.

**What was fixed**

The scoring system was updated to recognise the actual Yes / No answers the app collects. Answering Yes (use has changed) now correctly adds to the Functional score; answering No (use has stayed the same) adds a small amount to the Inflow/Outflow score, as originally intended.

---

## Bug 3 — The "before and after" comparison on the results screen was misleading

**What went wrong**

At the end of the session, participants see a results dashboard showing how their values shifted from their initial self-assessment (the About You questions at the start) compared to after reflecting on specific garments. The starting point shown for each value meter was calculated using only one of the four About You answers (the *primary driver* question). The other three — wardrobe size, shopping frequency, and disposal habit — were ignored when drawing the "before" position, even though they do influence the starting values in the actual calculation.

This made the shift between "before" and "after" appear larger than it really was for most participants. For example, someone who shops frequently would see their Inflow/Outflow value appear to jump by 20 more points than it actually did, because the display was starting from a lower baseline than the calculation used.

**Why it mattered**

Participants were seeing an inflated sense of how much their reflection had shifted their values. This affects the honesty of the feedback the tool gives and could influence how participants interpret and discuss their results in a research context.

**What was fixed**

The "before" baseline shown on screen is now calculated using all four About You answers, in exactly the same way the scoring system calculates it internally. The displayed shift now accurately reflects the real difference between starting position and final result.

---

## Bug 4 — The "YOU" highlight never appeared on the result archetype

**What went wrong**

On the final dashboard, participants see all the available archetypes laid out in a row, with their own archetype highlighted by a small "YOU" badge and a gold border. The badge was never appearing, because the part of the code that decides which card belongs to the participant was checking against a name that didn't quite match the names on the cards (one started with "The " and the other didn't). The check always returned false, so the badge never showed.

**Why it mattered**

Participants couldn't tell which archetype was theirs at a glance. They had to read the full result message above the grid and then mentally find the matching card — friction that diminished the moment of recognition that the dashboard is designed to deliver.

**What was fixed**

The comparison now strips the leading "The " from the persona name before checking, so the badge correctly lights up on the participant's archetype every time.

---

## Bug 5 — One of the result archetypes was invisible

**What went wrong**

The app can assign six archetypes overall. One of them — "Balanced Adapter", given to participants whose answers don't lean strongly in any single direction — was missing from the list of archetype descriptions on the final dashboard. Participants who received this archetype saw it named on their result, but the gallery of archetypes below had no card for it. Clicking around revealed nothing.

**Why it mattered**

A meaningful slice of participants (those with balanced patterns rather than dominant ones) had no description of what their archetype meant. The dashboard quietly told them less than it told other participants.

**What was fixed**

The missing archetype entry was added to the description list, with its proper icon, tagline, and explanation. The gallery now shows all six archetypes.

---

## Bug 6 — The archetype gallery sometimes showed the same archetype twice and hid another entirely

**What went wrong**

The archetype gallery on the final dashboard was built by hand: each of the six possible archetypes was supposed to be its own card, with the participant's own archetype highlighted. The hand-written list had two problems. First, it included a special card labelled "YOU" alongside the participant's archetype, plus a duplicate of that same archetype lower in the list — so the same archetype appeared twice. Second, one of the six archetypes ("Social Chameleon") was missing from the hand-written list entirely, so it could never be explored by anyone.

**Why it mattered**

Participants saw an inconsistent gallery: one archetype shown twice, another never shown at all. Combined with Bug 4 and Bug 5, the final results presentation felt patchy and incomplete.

**What was fixed**

The hand-written list was replaced with a single dynamic loop over the official archetype data. All six archetypes are now shown exactly once, and the "YOU" highlight is applied to whichever one belongs to the participant. The duplicate is gone and Social Chameleon is back.

---

## Bug 7 — Multi-select questions could lose a tap if you clicked quickly

**What went wrong**

On questions where you can select multiple options (like "What do you use it for?"), tapping options in rapid succession could occasionally drop a selection. The code that adds and removes choices was reading the current list of selections from a slightly out-of-date copy when two taps happened back-to-back, so one of them would silently overwrite the other.

**Why it mattered**

Participants might have made selections that weren't actually recorded, especially on touch screens where rapid taps are common. The data captured for these questions could underrepresent what participants actually intended to convey.

**What was fixed**

The code now reads the current list from the freshest possible source each time a tap arrives, so every selection is preserved no matter how quickly users tap.

---

## Bug 8 — Continue button advanced even when required text was empty

**What went wrong**

When participants selected "Other" on a question and were asked to type a specific answer, the Continue button worked even if the text input was empty. This meant participants could choose "Other", not type anything, and still advance — recording the answer as if they had explicitly skipped. The same happened on Set C's "How long have you had it?" question.

**Why it mattered**

The data captured for these questions silently collapsed two distinct intents into one: "I want to say something specific but forgot to type" became indistinguishable from "I want to skip this question". Researchers analysing the data would have no way to tell which.

**What was fixed**

The Continue button is now disabled until text has been typed. Participants who want to skip must explicitly press the Skip button — and the data clearly distinguishes a typed answer from a deliberate skip.

---

*Bugs 1–3 identified and fixed May 2026; Bugs 4–8 identified and fixed May 2026 (subsequent session).*

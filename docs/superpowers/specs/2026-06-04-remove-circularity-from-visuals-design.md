# Remove Circularity from the Value Fingerprint & Baseline Comparison — Design Spec

- **Date:** 2026-06-04
- **Status:** Approved (design); UI-only follow-on to the scoring-methodology redesign.
- **Scope:** Display only. The scoring engine, the six archetypes, the `inflow_outflow_value` storage, and the test suite are **unchanged**.

## Decision

Remove the **Circularity** axis (`inflowOutflow`) from the two participant-facing visuals — the **Value Fingerprint** radar and the **Baseline Comparison** bars — while **keeping circularity in the scoring engine**: it is still computed, still one of the four dimensions feeding prototype-distance archetype assignment (so **Conscious Curator** remains reachable and intact), and still written to `inflow_outflow_value`. It simply stops being drawn as a value meter.

Chosen over full removal because full removal would force redefining the Conscious Curator archetype (it is defined by circularity) and would ripple through the `ValueMeters` type, CSV export, the DB column, the contribution tables, and ~half the tests.

Rationale for it being defensible: the Value Fingerprint now shows exactly the three **Theory of Consumption Values** axes (functional / social / emotional). Circularity is a behavioural / lifecycle dimension, not a Sheth "value", so it legitimately informs the behavioural *archetype* without appearing on the *value* fingerprint.

## Changes

### 1. `src/app/components/mirror/ui/ValueFingerprintRadar.tsx`
- `AXES` reduced to three, in this order: `{ social, 'Social' }`, `{ emotional, 'Emotional' }`, `{ functional, 'Functional' }`. Remove the `inflowOutflow` / 'Circularity' entry → the radar becomes a triangle.
- Keep the two-polygon rendering: dashed-gold **expectation** polygon (when `expectation` is provided) over the solid-green **reflected** polygon, plus vertex dots and per-axis numeric labels.
- Restore `maxRadius` to `105` and both label offsets to `maxRadius + 32`. (The `85` / `+22` values were introduced solely to stop the four-axis *horizontal* labels clipping; a triangle has no horizontal labels, and the original 3-axis radar used `105` / `+32` without clipping.)
- Signature unchanged: `{ values: ValueMeters; expectation?: ValueMeters }`. It reads only the three `AXES` keys; `inflowOutflow` on the passed objects is simply ignored.

### 2. `src/app/components/mirror/screens/FinalDashboard.tsx`
- In the **Baseline Comparison** section, delete the fourth axis row — the **Circularity** block (the one with the `DoorOpen` icon and `values.inflowOutflow` / `baselineValues.inflowOutflow`). Keep the Functional, Social, and Emotional rows with their `DeltaChip`.
- Leave the radar call `<ValueFingerprintRadar values={values} expectation={baselineValues} />` unchanged (the radar now ignores the 4th key).
- **Keep** the `DoorOpen` import — it is still used by the "Letting Go" card in the Behavioural Profile (Insights tab).

### Explicitly unchanged
- `scoring.ts`, `scoring-engine.ts`, `scoring-config.ts` (circularity still computed, still drives the archetype, still stored).
- The archetype grid (Conscious Curator still listed and can be the user's "YOU" archetype), Insights, Behavioural Profile, the provisional-confidence note, the "Started as / Reflected as" footer, the radar legend, and the "gap between expectation and behavior" subtitle.
- The DB schema and CSV export (`inflow_outflow_value` keeps being written).
- All existing tests.

## Verification
- `pnpm test` → still 41 passing (scoring untouched).
- `pnpm typecheck` → clean.
- `pnpm build` → succeeds.
- Visual: the Value Fingerprint is a triangle with two overlaid polygons; the Baseline Comparison shows three rows (Functional/Social/Emotional); Conscious Curator can still be assigned and is explained in the archetype card.

## Files
Two: `ValueFingerprintRadar.tsx`, `FinalDashboard.tsx`. No new tests (pure display change).

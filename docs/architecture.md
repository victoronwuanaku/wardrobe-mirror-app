# Architecture

How the Wardrobe Mirror codebase is organised, and where to make changes.

## Stack

- **Vite 6** + **React 18** + **TypeScript 5**
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **motion** (the `motion/react` library — successor to framer-motion) for animation
- **Lucide React** for icons
- **@supabase/supabase-js** for saving responses
- **pnpm** as the package manager
- **Vitest** for unit tests

## Entry point and file structure

```
src/main.tsx                                          (mounts the React app)
  └── src/app/App.tsx                                 (thin wrapper)
        └── src/app/components/mirror/MirrorGame.tsx  (orchestrator: state + handlers + screen switch)
              ├── types.ts                            (shared TypeScript interfaces)
              ├── constants/   design.ts, garments.ts, archetypes.ts,
              │                baselineQuestions.ts, questionSteps.ts
              ├── lib/         session.ts, export.ts, supabase.ts,
              │                scoring.ts, scoring-engine.ts, scoring-config.ts, schema.ts
              ├── ui/          SelectionTile, ContinueButton, SecondaryButton,
              │                QuestionScreen, ValueFingerprintRadar
              ├── screens/     WelcomeScreen, BaselineScreen, SetIntroScreen,
              │                QuestionRunner, SetCompleteScreen, FinalDashboard
              └── questions/   shared.tsx + SetAQuestion, SetBQuestion, SetCQuestion

src/styles/                  index.css → imports tailwind.css, theme.css, and the app stylesheet
src/app/styles/wardrobe-mirror.css   design tokens, safe-area insets, animations
utils/supabase/info.tsx      Supabase project URL + public key
tests/                       unit tests (scoring + database column contract)
```

`MirrorGame.tsx` owns the application state, the event handlers, the submission trigger, and the
`gameState` switch that decides which screen renders. Everything else (types, constants, scoring,
export/submission helpers, screen components, question renderers) lives in the folders above.

## App flow

1. **Welcome** screen.
2. **Baseline** — 4 questions: wardrobe size, shopping frequency, disposal habit, primary driver.
3. **Set A** — a recent purchase (6 questions).
4. **Set B** — a favourite garment (9 questions; the last 2 — wash frequency and repaired — are optional).
5. **Set C** — a garment ready to dispose of (6 questions).
6. **Final dashboard** — behavioural archetype, value-fingerprint radar, written insights, and a
   data-export tab (CSV / JSON download).

Navigation is driven by per-set definitions in `constants/questionSteps.ts`, where each step has a
`renderIndex`, an `optional` flag, and a `shouldShow()` predicate. The Continue / Back handlers in
`MirrorGame.tsx` move only through the steps that are currently visible.

> Note on Set B: its render indices are 0–6, 8, 9. Index 7 is an intentional gap left over from a
> removed screen — it is not a bug. The "Other reason" follow-up for the favourite question is now
> captured inline within the `whyFavorite` question itself.

## Where changes belong

| You want to change… | Edit… |
|---|---|
| State, cross-screen handlers, the screen switch | `src/app/components/mirror/MirrorGame.tsx` |
| Shared types / response shapes | `src/app/components/mirror/types.ts` |
| Design constants, motion helpers, colour tokens | `src/app/components/mirror/constants/design.ts` |
| Garment option labels, values, and icons | `src/app/components/mirror/constants/garments.ts` |
| Archetype copy shown on the dashboard | `src/app/components/mirror/constants/archetypes.ts` |
| Baseline question wording and options | `src/app/components/mirror/constants/baselineQuestions.ts` |
| Per-set navigation and optional-step visibility | `src/app/components/mirror/constants/questionSteps.ts` |
| CSV / JSON export shape | `src/app/components/mirror/lib/export.ts` |
| Database insert, retry, and payload mapping | `src/app/components/mirror/lib/supabase.ts` |
| Value scoring, persona, and insights | `src/app/components/mirror/lib/scoring.ts` (+ `scoring-engine.ts`, `scoring-config.ts`) |
| Reusable buttons / tiles / radar | `src/app/components/mirror/ui/` |
| A whole screen's layout | `src/app/components/mirror/screens/` |
| Question wording or per-question input behaviour | `src/app/components/mirror/questions/` |

## Design tokens

The brand colours live in the `COLORS` object in `constants/design.ts` and must stay in sync with
`src/app/styles/wardrobe-mirror.css`:

- Gold `#d4af37`
- Light / cream `#f5f1e8`
- Olive `#8a9a5b`
- Dark backgrounds `#1e293b` / `#0f172a` / `#1a3a2e`

## Checking your changes

Run these before considering a change finished:

```bash
pnpm typecheck    # should report zero errors
pnpm test         # unit tests for scoring and the DB column contract
pnpm build        # should produce a clean production build
```

For anything that touches the question flow, navigation, export, or submission, also run
`pnpm dev` and click through the app on both a desktop and a narrow (mobile) viewport to confirm
nothing is clipped, overlapping, or broken.

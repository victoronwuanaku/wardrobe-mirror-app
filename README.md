# Wardrobe Mirror

The Wardrobe Mirror is a mobile-first, browser-based survey tool built for academic research
into clothing and wardrobe behaviour. A participant answers a short baseline questionnaire and
then reflects on three specific garments — a recent purchase, a favourite, and one they are
ready to dispose of. At the end the tool shows them a four-axis "value fingerprint" and a
behavioural archetype. Each completed garment set is saved to a Supabase (PostgreSQL) database
hosted in the EU (Frankfurt) for GDPR compliance.

It is built with Vite, React, and TypeScript.

## Prerequisites

- **Node.js 18 or newer**
- **pnpm 11** — the repo pins `pnpm@11.0.8` via the `packageManager` field in `package.json`.
  The simplest way to get the matching version is Corepack, which ships with Node:

  ```bash
  corepack enable
  ```

  Corepack then reads the pinned version automatically. Alternatively, install pnpm globally:
  `npm install -g pnpm@11.0.8`.

## Running it locally

```bash
pnpm install      # install dependencies (first time only)
pnpm dev          # start the dev server, then open the printed URL (usually http://localhost:5173)
```

The app runs entirely in the browser. Saving responses to the database works out of the box —
the Supabase key in `utils/supabase/info.tsx` is a **public, insert-only key** and is safe to
ship (see [docs/data-and-schema.md](docs/data-and-schema.md)).

## Other commands

```bash
pnpm build        # production build into dist/
pnpm typecheck    # TypeScript type-check (no files emitted)
pnpm test         # run the unit tests once (Vitest)
```

## Where to find things

| Path | What it is |
|---|---|
| `src/` | The application code (React + TypeScript). |
| `docs/architecture.md` | How the code is organised and where to change what. |
| `docs/data-and-schema.md` | The database schema, how responses are saved, privacy/GDPR notes. |
| `docs/scoring-methodology.md` | How answers become value scores and archetypes. |
| `docs/history.md` | Fixed bugs and known open issues. |
| `docs/sample-data/` | An example export of collected responses (column shape reference). |
| `utils/supabase/` | Database connection details and the SQL to recreate the table. |
| `tests/` | Unit tests for scoring and the database column contract. |

## Attributions

Third-party components and assets are credited in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

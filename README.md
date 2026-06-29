# Wardrobe Mirror

A small browser app (Vite + React + TypeScript) — a survey tool that explores how people
relate to their clothing. This guide gets it running on your own machine, step by step.

## 1. Install the tools you need (one time)

**Node.js — version 18 or newer.** The runtime that powers the app.
- Download the **LTS** version from <https://nodejs.org> and run the installer.
- Check it worked: open a terminal and run `node -v`. You should see something like `v20.x.x`.

**pnpm — version 11.** The package manager this project uses (instead of `npm`).
- Easiest way: run `corepack enable` (Corepack ships with Node, so nothing else to download).
- Check it: `pnpm -v` should print `11.x.x`.

## 2. Get the code

If you already have the project folder, open a terminal inside it. Otherwise clone it:

```bash
git clone https://github.com/victoronwuanaku/wardrobe-mirror-app.git
cd wardrobe-mirror-app
```

## 3. Install the project's dependencies (one time)

This downloads the libraries the app needs into a `node_modules/` folder:

```bash
pnpm install
```

## 4. Run the app

```bash
pnpm dev
```

You'll see a line like `Local: http://localhost:5173/`. Open that address in your browser —
the app is now running, and it reloads automatically as you edit the code.

To stop it, press `Ctrl + C` in the terminal.

## Other useful commands

| Command | What it does |
|---|---|
| `pnpm build` | Make an optimized production build (output goes to `dist/`). |
| `pnpm test` | Run the unit tests once. |
| `pnpm typecheck` | Check the TypeScript types without running the app. |

## If something goes wrong

- **`pnpm: command not found`** → run `corepack enable`, then try again (or install it with `npm install -g pnpm`).
- **Port 5173 is already in use** → another copy is running. Stop it with `Ctrl + C`, or let Vite pick the next free port (it prints the new URL).
- **Errors right after `pnpm install`** → delete the folder and reinstall: `rm -rf node_modules && pnpm install`.

## Learn more

The app code lives in `src/`. For how it's organised, the database, and the scoring, see the
`docs/` folder:

- [`docs/architecture.md`](docs/architecture.md) — code structure and where to change what
- [`docs/data-and-schema.md`](docs/data-and-schema.md) — the database and how responses are saved
- [`docs/scoring-methodology.md`](docs/scoring-methodology.md) — how answers become value scores
- [`docs/history.md`](docs/history.md) — fixed bugs and known open issues

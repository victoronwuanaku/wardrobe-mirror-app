# Gemini Handoff — Wardrobe Mirror

## What This App Is

A mobile-first garment research diagnostic tool (Figma Make → Vite + React SPA). Participants answer three question sets about garments (recent purchase, favourite, disposal). At the end, their responses are submitted to the researcher and a persona/value profile is shown.

**Runtime path:**
```
src/main.tsx → src/app/App.tsx → src/app/components/mirror/MirrorGame.tsx
```

All logic lives in `MirrorGame.tsx` (~2100 lines). `App.tsx` is a one-line wrapper.

---

## Current State (Post-Session Changes)

### What Was Fixed This Session

**1. Data submission replaced**
- Old: browser → Supabase Edge Function → Resend email (broken: `btoa()` crash on emoji/non-ASCII, sandbox sender domain, no retry)
- New: browser → Google Apps Script web app → Google Sheet (append row per set response)
- Function renamed: `emailDataToResearcher` → `submitToGoogleSheets`

**2. CSV generation fixed**
- Added `csvQuote()` — RFC 4180 quoting, wraps values containing commas/quotes/newlines
- Added `Gender` and `Age` columns (were collected but missing from CSV)
- Added `Use Change Description` column (was collected in Set B but missing from CSV)
- Headers now 30 columns (was 27)
- Row construction refactored into shared `buildResponseRow()` used by both CSV and Sheets submission

**3. New config file**
- `utils/sheets/config.ts` — holds the Apps Script URL (placeholder until user sets up Apps Script)

---

## File Map

| File | Purpose |
|---|---|
| `src/app/components/mirror/MirrorGame.tsx` | All app logic, types, questions, scoring, UI |
| `src/app/styles/wardrobe-mirror.css` | Design system (glass cards, gold/dark palette) |
| `src/styles/index.css` | Tailwind + theme + wardrobe CSS imports |
| `utils/sheets/config.ts` | Apps Script URL config — **needs real URL** |
| `utils/supabase/info.tsx` | Old Supabase credentials — no longer imported, safe to ignore |
| `supabase/functions/server/index.tsx` | Supabase Edge Function — no longer called, leave as-is |

---

## The One Thing Still Needed: Part 1 Setup

The code is ready but `utils/sheets/config.ts` currently contains a placeholder URL:
```ts
export const appsScriptUrl = 'PASTE_YOUR_APPS_SCRIPT_URL_HERE';
```

The user needs to complete the Google Apps Script setup before the submission path works.

### Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a blank spreadsheet → name it `Wardrobe Mirror Research`
3. Rename tab `Sheet1` → `Responses`
4. Click cell **A1**, paste these headers (tab-separated — they auto-split into columns):

```
Session ID	Timestamp	Wardrobe Size	Shopping Frequency	Disposal Habit	Primary Driver	Gender	Age	Persona	Social Value	Emotional Value	Functional Value	Inflow/Outflow Value	Set Type	Garment Type	How Got	Cost	Wear Frequency	Main Use	Why Bought	Why Bought Other	How Long Had	Use Change Description	Why Favorite	Use Changed	Wash Frequency	Repaired	Brand	Why Not Wear	Disposal Plan
```

### Step 2 — Create the Apps Script

1. In the sheet: **Extensions → Apps Script**
2. Delete the default code, paste exactly:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Responses');
    var payload = JSON.parse(e.postData.contents);

    payload.rows.forEach(function(row) {
      sheet.appendRow(row);
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, rowsAdded: payload.rows.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Save (Cmd+S) → name the project `Wardrobe Mirror Receiver`

### Step 3 — Deploy as Web App

1. Click **Deploy → New deployment**
2. Gear icon → **Web app**
3. Execute as: **Me** / Who has access: **Anyone**
4. Click **Deploy** → authorize → copy the `https://script.google.com/macros/s/.../exec` URL

### Step 4 — Paste URL into Config

Open `utils/sheets/config.ts` and replace the placeholder:
```ts
export const appsScriptUrl = 'https://script.google.com/macros/s/YOUR_ID/exec';
```

> ⚠️ Every time the Apps Script code is edited, a **new deployment** must be created — just saving the script does not update the live URL.

---

## Data Shape Sent to Apps Script

```json
{
  "rows": [
    ["sessionId", "timestamp", "wardrobeSize", ..., "disposalPlan"],
    ["sessionId", "timestamp", "wardrobeSize", ..., "disposalPlan"]
  ]
}
```

Each inner array is one garment set response (30 values matching the 30 sheet headers). A complete run produces up to 3 rows (one per set). Partial completions (user clicks "Finish Now" early) produce fewer rows.

---

## What Has NOT Changed

- All question text, answer values, UI, CSS, animations
- Scoring logic (`calculateValuesFromMirrorGame`)
- Persona logic (`calculatePersona`)
- Local JSON + CSV download buttons in the final Data tab
- Figma Make deployment structure (`vite.config.ts`, `index.html`, `package.json`)
- The Supabase Edge Function (left in place, simply no longer called)

---

## Known Deferred Issues (Not Fixed This Session)

- **Scoring mismatches** — `repaired` answer values (`yes-size-length`, `yes-button`, etc.) do not match what the scoring function checks (`yes-myself`, `yes-professionally`). Scores for repair-related behaviours never increment.
- **`useChanged` scoring** — checks for `yes-more`, `same`, `yes-less` but UI only sets `yes` or `no`.
- These are intentionally out of scope per the original stabilization brief.

---

## Build Verification

When the user has completed the Apps Script setup:

```bash
npx pnpm@10.18.3 run build    # should complete with no errors
npx pnpm@10.18.3 dev          # open http://127.0.0.1:5173/
```

Test checklist:
- Complete all 3 sets → check Google Sheet for 3 new rows
- Type `Nike, Jordan` as brand name → confirm it appears in one cell
- Type an emoji in any free-text field → confirm no crash
- Set `appsScriptUrl` to an invalid URL → confirm CSV + JSON download fallback fires

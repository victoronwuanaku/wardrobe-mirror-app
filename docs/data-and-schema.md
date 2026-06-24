# Data & Schema

How participant responses are stored, what the database looks like, and the privacy
considerations that come with it.

## Where the data lives

- **Provider:** Supabase (managed PostgreSQL).
- **Region:** EU — Frankfurt (`eu-central-1`), chosen for GDPR compliance.
- **Project:** `tahjilropjzzxolhnhnd.supabase.co`.
- **Researcher / owner contact:** hamed.m.nigje@gmail.com.
- The researcher views and exports collected data through the **Supabase dashboard**.

The browser connects with the URL and public key in `utils/supabase/info.ts`:

```ts
export const supabaseUrl = 'https://tahjilropjzzxolhnhnd.supabase.co'
export const publishableKey = 'sb_publishable_...'
```

This key is **intentionally public**. It is an anonymous, insert-only key — Row Level Security
(below) means it can add rows but can never read, change, or delete them. Shipping it in the
browser bundle is safe by design.

## The `wardrobe_responses` table

Each participant session can produce up to **three rows** — one per completed garment set (A, B, C).
All sets share the same wide table; columns that don't apply to a given set are left blank.

```sql
CREATE TABLE wardrobe_responses (
  id bigint generated always as identity primary key,
  session_id text NOT NULL,
  completed_at timestamptz NOT NULL,

  -- baseline (same on every row for a session)
  wardrobe_size text, shopping_frequency text, disposal_habit text, primary_driver text,

  -- computed result (same on every row for a session)
  persona text,
  social_value int2, emotional_value int2, functional_value int2, inflow_outflow_value int2,

  -- which set this row is, and the shared garment fields
  set_type text NOT NULL,
  garment_type text, how_got text, cost text,

  -- Set A / B fields
  wear_frequency text, main_use text, main_use_other text,
  why_bought text, why_bought_other text,
  completion_status text,
  how_long_had text, how_long_had_years text,
  why_favorite text, why_favorite_other text,
  wash_frequency text, repaired text,

  -- Set C fields
  why_not_wear text, why_not_wear_other text, disposal_plan text,

  -- LEGACY: kept for old rows, never written by the current app
  use_changed text, brand text,

  -- consent (reserved — see "Consent & GDPR" below; currently always null)
  consent_given bool, consent_timestamp timestamptz,

  CONSTRAINT valid_set_type CHECK (set_type IN ('A','B','C')),
  CONSTRAINT unique_session_set UNIQUE (session_id, set_type)
);
```

The full SQL to recreate the table is in [`utils/supabase/create_table.sql`](../utils/supabase/create_table.sql),
and a safe, re-runnable migration that adds any missing columns is in
[`utils/supabase/migrations/`](../utils/supabase/migrations/).

### The column list is enforced in code

The exact set of columns the app writes is defined once, as a single source of truth, in
`src/app/components/mirror/lib/schema.ts` (the `DB_COLUMNS` array). The test
`tests/schema-contract.test.ts` asserts that the data the app builds for submission contains
**exactly** those columns — so if a column is added to the table or the code drifts, the test
fails. Keep `schema.ts` and `create_table.sql` in sync.

## Row Level Security (RLS)

RLS is enabled so the public browser key can only ever insert:

```sql
CREATE POLICY "anon_insert_only" ON wardrobe_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_no_select"   ON wardrobe_responses FOR SELECT TO anon USING (false);
CREATE POLICY "anon_no_update"   ON wardrobe_responses FOR UPDATE TO anon USING (false);
CREATE POLICY "anon_no_delete"   ON wardrobe_responses FOR DELETE TO anon USING (false);
```

Supabase's security advisor will flag `anon_insert_only` as "RLS Policy Always True". **This is
expected and safe to ignore** — anonymous participants must be able to insert from the browser,
and the explicit deny policies on SELECT / UPDATE / DELETE enforce read protection.

## How submission works

The submission logic lives in `src/app/components/mirror/lib/supabase.ts`:

- It inserts one row per completed set (up to three).
- On failure it **retries once after 3 seconds**.
- It treats a PostgreSQL duplicate-key error (code `23505`) as **success** — this is what makes the
  `UNIQUE (session_id, set_type)` constraint safe if a submission is attempted twice.
- It returns either `{ ok: true }` or `{ ok: false, error }`, and the final dashboard surfaces the
  result: a "Saving…" banner, an auto-dismissing thank-you on success, or a red error banner with a
  "Try again" button on failure.

## Reading the data: two quirks to know about

When analysing exported CSVs, be aware of two deliberate design decisions (not bugs):

1. **Empty strings, not NULL.** Columns that don't apply to a given set are written as `''` rather
   than `null`. This is cosmetic for CSV but matters in SQL — e.g. a `COUNT()` will include empty
   strings as non-null.
2. **The literal string `'skipped'`.** When a participant explicitly skips an optional free-text
   input (e.g. `why_favorite` in Set B, `how_long_had_years` in Set C), the value stored is the
   word `skipped`. To exclude both blanks and skips from analysis, filter like:
   `WHERE why_favorite NOT IN ('', 'skipped')`.

An example export showing the real column layout is in
[`docs/sample-data/wardrobe_responses_rows.csv`](sample-data/wardrobe_responses_rows.csv).

## Consent & GDPR

> **Status: the consent fields are reserved but not yet used.** `consent_given` and
> `consent_timestamp` exist in the schema but are **always null** — there is no in-app consent
> step yet. Closing this gap is the main outstanding privacy task (see `docs/history.md`).

A short summary of the privacy picture (the study is run from the Netherlands, EU):

- **What is collected:** a random pseudonymous session ID, a completion timestamp, the baseline and
  garment answers, and the four computed value scores + archetype.
- **What is *not* collected:** name, email, address, IP address, device identifiers, or location.
- **Classification:** the data is pseudonymous behavioural data. It is technically personal data
  under GDPR (it relates to a person's behaviour) but sits at the low-sensitivity end and does not
  fall under the special categories of GDPR Article 9.
- **Recommended legal basis:** consent (GDPR Article 6(1)(a)), documented via the briefing
  participants receive before they start. This should be formalised with an in-app consent step.

Open items a future team should resolve before wider data collection:

- Add an **in-app consent screen** and record consent in the `consent_given` / `consent_timestamp`
  columns.
- Provide a short **participant-facing privacy notice**.
- Define a **data retention period** (e.g. delete data N months after the study concludes).
- Put a **Data Processing Agreement (DPA)** in place with the storage provider (Supabase offers a
  GDPR DPA and EU-region hosting).

*Historical note:* an earlier version of this tool submitted responses to a Google Apps Script /
Google Sheets endpoint on a personal Google account. Google's automated abuse detection flagged it
(a public unauthenticated endpoint on a consumer account is a pattern it associates with data
harvesting). That was a Google Terms-of-Service action, not a GDPR finding. The project moved to
Supabase as its stable, GDPR-appropriate replacement.

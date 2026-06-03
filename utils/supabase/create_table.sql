-- ============================================================
-- Wardrobe Mirror — wardrobe_responses table column setup
-- ============================================================
-- Run this in Supabase SQL Editor AFTER saving the table
-- with just the default id and created_at columns.
--
-- created_at = when the DB row was inserted (auto)
-- completed_at = when the participant finished the survey (from app)
-- ============================================================

ALTER TABLE wardrobe_responses
  ADD COLUMN session_id          text,
  ADD COLUMN completed_at        timestamptz,
  ADD COLUMN wardrobe_size       text,
  ADD COLUMN shopping_frequency  text,
  ADD COLUMN disposal_habit      text,
  ADD COLUMN primary_driver      text,
  ADD COLUMN persona             text,
  ADD COLUMN social_value        int2,
  ADD COLUMN emotional_value     int2,
  ADD COLUMN functional_value    int2,
  ADD COLUMN inflow_outflow_value int2,
  ADD COLUMN set_type            text,
  ADD COLUMN garment_type        text,
  ADD COLUMN how_got             text,
  ADD COLUMN cost                text,
  ADD COLUMN wear_frequency      text,
  ADD COLUMN main_use            text,
  ADD COLUMN main_use_other      text,
  ADD COLUMN why_bought          text,
  ADD COLUMN why_bought_other    text,
  ADD COLUMN how_long_had        text,
  ADD COLUMN why_favorite        text,
  ADD COLUMN use_changed         text,
  ADD COLUMN wash_frequency      text,
  ADD COLUMN repaired            text,
  ADD COLUMN brand               text,
  ADD COLUMN why_not_wear        text,
  ADD COLUMN disposal_plan       text,
  ADD COLUMN consent_given       boolean,
  ADD COLUMN consent_timestamp   timestamptz;

-- ============================================================
-- RLS insert-only policy (run this in the same session)
-- Allows the browser (anon key) to INSERT but never read,
-- update, or delete rows.
-- ============================================================

CREATE POLICY "anon_insert_only"
ON wardrobe_responses
FOR INSERT
TO anon
WITH CHECK (true);

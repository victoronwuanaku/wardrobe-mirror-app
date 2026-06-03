-- Brings an already-deployed wardrobe_responses table in line with the app payload.
-- Safe to run multiple times.
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS why_favorite_other text;
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS why_not_wear_other text;
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS completion_status  text;
ALTER TABLE wardrobe_responses ADD COLUMN IF NOT EXISTS how_long_had_years text;

-- Verify the live table has every column the app writes (should return 0 rows):
-- SELECT unnest(ARRAY[
--   'session_id','completed_at','wardrobe_size','shopping_frequency','disposal_habit',
--   'primary_driver','persona','social_value','emotional_value','functional_value',
--   'inflow_outflow_value','set_type','garment_type','consent_given','consent_timestamp',
--   'completion_status','how_got','cost','wear_frequency','main_use','main_use_other',
--   'why_bought','why_bought_other','how_long_had','why_favorite','why_favorite_other',
--   'wash_frequency','repaired','why_not_wear','why_not_wear_other','disposal_plan',
--   'how_long_had_years'
-- ]) AS col
-- EXCEPT
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'wardrobe_responses';

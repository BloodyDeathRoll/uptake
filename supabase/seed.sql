-- Dev seed data: creates a test user profile and sample meals
-- Run after migrations via: supabase db seed

-- Note: auth.users rows must be created via Supabase Auth (not seeded manually)
-- This file seeds profile/goal data for a known test user UUID

-- Replace with your actual test user UUID after signing up
DO $$
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Only seed if the profile doesn't exist (won't break on re-run)
  INSERT INTO profiles (id, height_cm, weight_kg, age, sex, activity_level, dietary_preferences)
  VALUES (test_user_id, 178, 80, 30, 'male', 'moderate', ARRAY['none'])
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO goals (user_id, version, goal_type, calories_target, protein_g, carbs_g, fat_g, fiber_g, water_ml, rationale)
  VALUES (test_user_id, 1, 'muscle_gain', 2800, 176, 350, 90, 35, 3000,
    'Based on your weight and moderate activity, a 300kcal surplus with 2.2g protein per kg supports muscle growth.')
  ON CONFLICT DO NOTHING;
END $$;

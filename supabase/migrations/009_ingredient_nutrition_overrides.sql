-- 009_ingredient_nutrition_overrides.sql
-- Stores user-confirmed nutrition values per ingredient+unit, normalized to per 100 units.
-- Populated from corrected or AI-accepted meal items; checked before calling AI for QTY estimates.

CREATE TABLE ingredient_nutrition_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  ingredient_name text NOT NULL,
  unit text NOT NULL,
  calories_per_100 numeric,
  protein_g_per_100 numeric,
  carbs_g_per_100 numeric,
  fat_g_per_100 numeric,
  fiber_g_per_100 numeric,
  food_group text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ingredient_name, unit)
);

ALTER TABLE ingredient_nutrition_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own nutrition overrides"
  ON ingredient_nutrition_overrides FOR ALL
  USING (auth.uid() = user_id);

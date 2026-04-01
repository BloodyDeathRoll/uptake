-- 004_meal_items.sql
CREATE TABLE meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid REFERENCES meals ON DELETE CASCADE NOT NULL,
  ingredient_name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  saturated_fat_g numeric,
  sodium_mg numeric,
  food_group text CHECK (food_group IN ('protein', 'grain', 'vegetable', 'fruit', 'dairy', 'fat', 'beverage', 'other')),
  confidence text CHECK (confidence IN ('high', 'medium', 'low')),
  source text NOT NULL DEFAULT 'user_manual' CHECK (source IN ('ai_vision', 'ai_text', 'memory', 'user_manual')),
  was_corrected boolean DEFAULT false,
  original_ai_estimate jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX meal_items_meal_id_idx ON meal_items (meal_id);

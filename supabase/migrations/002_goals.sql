-- 002_goals.sql
CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  version integer NOT NULL DEFAULT 1,
  goal_type text NOT NULL CHECK (goal_type IN (
    'muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
    'recomposition', 'endurance', 'heart_healthy', 'longevity',
    'diabetic', 'recovery', 'custom'
  )),
  calories_target integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  saturated_fat_g numeric,
  sodium_mg numeric,
  water_ml numeric,
  protein_per_kg numeric,
  net_carbs_g numeric,
  custom_targets jsonb,
  rationale text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- When inserting a new goal version, deactivate previous
CREATE OR REPLACE FUNCTION deactivate_previous_goals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE goals SET active = false
  WHERE user_id = NEW.user_id AND id != NEW.id AND active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_goal_insert
  AFTER INSERT ON goals
  FOR EACH ROW EXECUTE FUNCTION deactivate_previous_goals();

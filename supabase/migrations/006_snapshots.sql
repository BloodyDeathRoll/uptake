-- 006_snapshots.sql
CREATE TABLE daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_calories numeric DEFAULT 0,
  total_protein_g numeric DEFAULT 0,
  total_carbs_g numeric DEFAULT 0,
  total_fat_g numeric DEFAULT 0,
  total_fiber_g numeric DEFAULT 0,
  total_sugar_g numeric DEFAULT 0,
  total_saturated_fat_g numeric DEFAULT 0,
  total_sodium_mg numeric DEFAULT 0,
  total_water_ml numeric DEFAULT 0,
  meal_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX daily_snapshots_user_id_date_idx ON daily_snapshots (user_id, date DESC);

-- Rate limiter counter table (global per provider, not per user)
CREATE TABLE rate_limit_counters (
  provider text PRIMARY KEY,
  rpm integer NOT NULL DEFAULT 0,
  rpd integer NOT NULL DEFAULT 0,
  last_rpm_reset timestamptz NOT NULL DEFAULT now(),
  last_rpd_reset timestamptz NOT NULL DEFAULT now()
);

-- Seed initial rows for known providers
INSERT INTO rate_limit_counters (provider) VALUES ('groq'), ('gemini')
ON CONFLICT (provider) DO NOTHING;

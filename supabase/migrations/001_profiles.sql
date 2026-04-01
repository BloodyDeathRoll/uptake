-- 001_profiles.sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  height_cm numeric,
  weight_kg numeric,
  age integer,
  sex text CHECK (sex IN ('male', 'female', 'other')),
  activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'athlete')),
  body_fat_pct numeric,
  dietary_preferences text[] DEFAULT '{}',
  allergies text[] DEFAULT '{}',
  meals_per_day integer,
  cooking_frequency text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

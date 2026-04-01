-- 003_meals.sql
CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  revision_of uuid REFERENCES meals(id),
  image_url text,
  human_description text,
  meal_type text NOT NULL DEFAULT 'snack' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX meals_user_id_logged_at_idx ON meals (user_id, logged_at DESC);

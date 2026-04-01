-- 007_rls_policies.sql
-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portion_priors ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/write only their own row
CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- goals: users see only their own
CREATE POLICY "Users see own goals"
  ON goals FOR ALL
  USING (auth.uid() = user_id);

-- meals: users see only their own
CREATE POLICY "Users see own meals"
  ON meals FOR ALL
  USING (auth.uid() = user_id);

-- meal_items: accessible via meal ownership
CREATE POLICY "Users see own meal items"
  ON meal_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_items.meal_id
        AND meals.user_id = auth.uid()
    )
  );

-- meal_embeddings: users see only their own
CREATE POLICY "Users see own embeddings"
  ON meal_embeddings FOR ALL
  USING (auth.uid() = user_id);

-- portion_priors: users see only their own
CREATE POLICY "Users see own portion priors"
  ON portion_priors FOR ALL
  USING (auth.uid() = user_id);

-- daily_snapshots: users see only their own
CREATE POLICY "Users see own snapshots"
  ON daily_snapshots FOR ALL
  USING (auth.uid() = user_id);

-- rate_limit_counters: no user access (admin only via service role)
-- No RLS policy = inaccessible to anon and user roles
ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;

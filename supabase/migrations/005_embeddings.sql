-- 005_embeddings.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE meal_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid REFERENCES meals ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  description_text text NOT NULL,
  embedding vector(768),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX meal_embeddings_embedding_idx
  ON meal_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX meal_embeddings_user_id_idx ON meal_embeddings (user_id);

CREATE TABLE portion_priors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  ingredient_name text NOT NULL,
  avg_quantity numeric NOT NULL,
  avg_unit text NOT NULL,
  sample_count integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ingredient_name)
);

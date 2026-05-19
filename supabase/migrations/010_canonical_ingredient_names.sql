-- 010_canonical_ingredient_names.sql
-- Adds a language-independent canonical_name (lowercase English) so that
-- the same food logged in different languages (e.g. "apple" vs "תפוח")
-- shares a single ingredient_nutrition_overrides row and a single
-- portion_priors row. AI prompts populate canonical_name on parse;
-- existing rows are backfilled from ingredient_name as a best effort.

ALTER TABLE meal_items
  ADD COLUMN canonical_name text;

ALTER TABLE ingredient_nutrition_overrides
  ADD COLUMN canonical_name text;

ALTER TABLE portion_priors
  ADD COLUMN canonical_name text;

-- Backfill: assume existing rows are already in English (the historical default).
UPDATE ingredient_nutrition_overrides
  SET canonical_name = lower(trim(ingredient_name))
  WHERE canonical_name IS NULL;

UPDATE portion_priors
  SET canonical_name = lower(trim(ingredient_name))
  WHERE canonical_name IS NULL;

UPDATE meal_items
  SET canonical_name = lower(trim(ingredient_name))
  WHERE canonical_name IS NULL;

-- Dedup: case-only variants ("Onion" + "onion") collapse onto the same canonical
-- key. Keep the most-recently-updated row per (user_id, canonical_name, unit)
-- and drop the rest, otherwise the new unique constraint can't be added.
DELETE FROM ingredient_nutrition_overrides a
USING ingredient_nutrition_overrides b
WHERE a.id <> b.id
  AND a.user_id = b.user_id
  AND a.canonical_name = b.canonical_name
  AND a.unit = b.unit
  AND (a.updated_at < b.updated_at
       OR (a.updated_at = b.updated_at AND a.id > b.id));

DELETE FROM portion_priors a
USING portion_priors b
WHERE a.id <> b.id
  AND a.user_id = b.user_id
  AND a.canonical_name = b.canonical_name
  AND (a.updated_at < b.updated_at
       OR (a.updated_at = b.updated_at AND a.id > b.id));

ALTER TABLE ingredient_nutrition_overrides
  ALTER COLUMN canonical_name SET NOT NULL;

ALTER TABLE portion_priors
  ALTER COLUMN canonical_name SET NOT NULL;

-- Swap the unique constraint over to the canonical key.
ALTER TABLE ingredient_nutrition_overrides
  DROP CONSTRAINT ingredient_nutrition_overrides_user_id_ingredient_name_unit_key;

ALTER TABLE ingredient_nutrition_overrides
  ADD CONSTRAINT ingredient_nutrition_overrides_user_id_canonical_name_unit_key
  UNIQUE (user_id, canonical_name, unit);

-- portion_priors had its own unique on (user_id, ingredient_name); swap it too.
ALTER TABLE portion_priors
  DROP CONSTRAINT IF EXISTS portion_priors_user_id_ingredient_name_key;

ALTER TABLE portion_priors
  ADD CONSTRAINT portion_priors_user_id_canonical_name_key
  UNIQUE (user_id, canonical_name);

CREATE INDEX IF NOT EXISTS ingredient_nutrition_overrides_canonical_idx
  ON ingredient_nutrition_overrides (user_id, canonical_name);

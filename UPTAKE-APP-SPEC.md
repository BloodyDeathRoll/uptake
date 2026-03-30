# Uptake — Food Consumption Tracking App
## Comprehensive Build Specification for Claude Code

---

## 0. Plan Comparison & Design Rationale

Three independent plans were evaluated. Here's what each got right, where they fell short, and what this spec takes from each.

### ChatGPT Plan — Strengths
- Strong phasing (MVP → Photo → Learning) — realistic scope management
- Immutability principle for meal history — correct data architecture instinct
- Abstracted LLM calls (no hard dependency on one provider) — essential
- Confidence scoring on estimates — important UX trust signal
- Clear separation of "what user ate" vs "what system guessed"

### ChatGPT Plan — Weaknesses
- Vague on vision API choice (no concrete recommendation)
- No specific embedding strategy for the "meal memory" system
- Charts library left unspecified
- No mention of Gemini (the strongest free vision option available)

### Gemini Plan — Strengths
- "Vision-to-JSON" workflow clearly articulated — best pipeline description of the three
- Specific tech picks (Gemini 2.5 Flash for vision, Groq for text) — actionable
- Meal embedding similarity threshold (90%+ match) — concrete design target
- "Verification Card" UX pattern — good interaction design
- Expanded goal types (Heart Healthy, Diabetic Management, etc.)

### Gemini Plan — Weaknesses
- Recommends deprecated model (Gemini 1.5 Flash → deprecated Feb 2026)
- Over-indexes on a single vision provider without fallback
- Database schema is too shallow (missing corrections, revisions, confidence)
- No mention of rate limit management or queuing strategy
- Recharts recommendation is fine but Tremor suggestion is redundant

### This Spec — Synthesis Decisions
| Decision | Source | Rationale |
|---|---|---|
| Groq Llama 4 Scout as primary vision | This spec (updated) | Llama 4 Scout is multimodal; 1,000 RPD vs Gemini's 20 RPD on free tier |
| Gemini 2.5 Flash as vision fallback | Updated Gemini plan | Model ID `gemini-2.5-flash`; 10 RPM / 20 RPD free tier (reduced Dec 2025) |
| Groq (Llama 4 Scout or Llama 3.3 70B) for text | Both plans | Fast inference, generous free tier, 30 RPM / 1K RPD |
| Supabase (Postgres + pgvector + Auth + Storage) | Both plans | All-in-one free tier: 500MB DB, 1GB storage, 50K MAU |
| Next.js App Router | Both plans | Mobile-first SSR, API routes, mature ecosystem |
| Tailwind + shadcn/ui | Both plans | Unanimous — fast, minimal, accessible |
| Recharts for dashboard | Gemini plan | Lightweight, React-native, good mobile rendering |
| Immutable meal history + revision chain | ChatGPT plan | Critical for trust and learning accuracy |
| Multi-provider abstraction layer | ChatGPT plan | Never lock into one LLM |
| 3-phase MVP rollout | ChatGPT plan | Realistic scope control |
| Expanded goal types | Gemini plan | Better product differentiation |
| Global rate limit queue + fallback chain | This spec (new) | Quotas are per API key (global), not per user |
| @ducanh2912/next-pwa for PWA | This spec (new) | Maintained fork of unmaintained next-pwa |
| BYOK (bring your own key) deferred to Phase 4 | This spec (new) | Google OAuth does not share Gemini quota; BYOK adds onboarding friction |

---

## 1. Product Vision

A mobile-first web app that turns messy human inputs (photos, ingredient lists, free text) into structured nutritional data. The app learns from corrections, remembers your kitchen, and tracks progress against personalized health goals.

**Core Principles:**
- No hard-coded nutrition truths — all estimates are editable
- Every correction is persisted and used for learning
- Estimated values are always visually distinguished from confirmed values
- The system gets smarter with use, not just bigger

---

## 2. Onboarding & User Profiling

### Required Inputs
- **Height** (cm or ft/in)
- **Weight** (kg or lbs)
- **Age**
- **Sex** (optional, improves BMR accuracy)
- **Activity Level:** Sedentary | Lightly Active | Moderately Active | Very Active | Competitive Athlete
- **Primary Goal** (select one):

| Goal | Description | Focus Metric |
|---|---|---|
| Muscle Gain / Bulk | Caloric surplus + high protein | Protein/kg, surplus |
| Athlete Cut | Preserve muscle, lose fat | Protein/kg, deficit |
| General Weight Loss | Moderate caloric deficit | Calories, deficit |
| Weight Maintenance | Maintain current weight | Caloric balance |
| Body Recomposition | Lose fat + gain muscle simultaneously | P/C/F ratio + calories |
| Endurance Performance | Fuel for sustained activity | Carbs, hydration |
| Heart Healthy | Lower BP and cholesterol markers | Sodium, saturated fat |
| Longevity / Micronutrient Density | Antioxidants, fiber, stable blood sugar | Fiber, sugar, micronutrients |
| Diabetic Management | Manage glycemic load | Net carbs, sugar |
| Post-Competition Recovery | Anti-inflammatory + protein focus | Protein, omega-3 indicators |
| Custom | User defines own targets | User-specified |

### Optional Inputs
- Dietary preferences (vegetarian, vegan, keto, paleo, Mediterranean, etc.)
- Allergies / exclusions
- Typical meals per day
- Cooking vs restaurant frequency
- Body fat % (improves lean mass calculations)

### Multi-Step Onboarding UX
Step 1: Biometrics (height, weight, age, sex)
Step 2: Activity level (visual slider or card selection)
Step 3: Goal selection (card grid with descriptions)
Step 4: Optional preferences (collapsible, skippable)
Step 5: Review + AI-generated target summary with explanation

---

## 3. Goal Calculation Layer

### Baseline Formulas
- **BMR**: Mifflin-St Jeor equation
  - Male: `10 × weight(kg) + 6.25 × height(cm) - 5 × age - 5`
  - Female: `10 × weight(kg) + 6.25 × height(cm) - 5 × age + 161`
- **TDEE**: `BMR × activity_multiplier`
  - Sedentary: 1.2 | Light: 1.375 | Moderate: 1.55 | Very Active: 1.725 | Athlete: 1.9
- **Caloric Target**: TDEE ± goal-based adjustment

### Tracked Targets

**Primary (always displayed):**
- Calories (kcal)
- Protein (g)
- Carbohydrates (g) — including net carbs for diabetic goals
- Fat (g)

**Secondary (displayed based on goal):**
- Fiber (g) — essential for satiety, gut health
- Sugar (g) — total and added
- Saturated fat (g)
- Sodium (mg)
- Water intake (ml) — adjusted for activity and climate
- Protein per kg bodyweight — key for muscle goals
- Calories per kg bodyweight

**Time Scales:**
- Daily targets (primary view)
- 7-day rolling averages (weekly view)
- 30-day trends (monthly view)

### LLM Role in Goal Setting
The text LLM (Groq) handles:
- Translating biometrics + goal → specific daily targets
- Generating a plain-language rationale ("Here's why we set protein at 2.2g/kg...")
- Adapting targets when the user updates weight or changes goals
- Suggesting goal adjustments based on trend data

**Prompt template stored server-side, not client-side.** User data is injected at call time.

---

## 4. Meal Logging & Interpretation Pipeline

### Input Modalities
Users can log meals via any combination of:
1. **Photo upload** (camera or gallery)
2. **Ingredient list** (structured text input)
3. **Free-text description** ("Had a chicken shawarma with hummus and a side of rice")
4. **Any combination** of the above

### Processing Pipeline

```
┌─────────────────┐
│  User Input      │
│  (photo + text)  │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Memory Check     │  ← Search meal_embeddings for similar past meals
│ (pgvector)       │    If ≥ 85% cosine similarity → propose prior meal
└───────┬─────────┘
        │
        ▼ (no match or user wants fresh parse)
┌─────────────────┐
│ Vision Parse     │  ← Gemini 2.5 Flash: image → food identification
│ (if photo)       │    Returns: items, estimated portions, confidence
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Text Parse       │  ← Groq (Llama): text → structured ingredients
│ (if text)        │    Merges with vision output if both present
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Nutrition Lookup │  ← LLM estimates calories/macros per ingredient
│ + Estimation     │    Uses learned portion priors if available
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Verification     │  ← User sees "Verification Card"
│ Card             │    Can adjust quantities, add/remove items
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Save + Learn     │  ← Store final meal, corrections, and embedding
│                  │    Update portion priors for this user
└─────────────────┘
```

### Verification Card UX
- Each detected ingredient shown as an editable row
- Quantity shown with confidence indicator (high / medium / low)
- "Estimated from history" badge if matched from memory
- One-tap to accept all, or tap individual items to edit
- Add / remove ingredient buttons
- "This is wrong" button → full re-entry mode

### Learning Loop
For every saved meal, store:
- Text embedding of the meal description (for similarity search)
- Image metadata hash (for photo matching)
- Final corrected ingredient list
- Portion sizes as confirmed by user
- Delta between AI estimate and user correction (feeds future accuracy)

When a similar meal appears:
- Retrieve top-3 similar past meals
- Propose the most recent match's ingredients + quantities
- Flag as "estimated from your history"
- User confirms or adjusts

---

## 5. Data Model

### Core Tables

```sql
-- User profile and auth (Supabase Auth handles JWT)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  height_cm numeric,
  weight_kg numeric,
  age integer,
  sex text,                    -- 'male' | 'female' | 'other' | null
  activity_level text,         -- enum
  body_fat_pct numeric,        -- optional
  dietary_preferences text[],  -- array
  allergies text[],
  created_at timestamptz,
  updated_at timestamptz
)

-- Versioned goals (never overwrite — append new version)
goals (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  version integer,
  goal_type text,              -- enum matching goal table above
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
  custom_targets jsonb,        -- for custom goals
  rationale text,              -- LLM-generated explanation
  active boolean DEFAULT true,
  created_at timestamptz
)

-- Body metrics time series (for trend tracking)
body_metrics (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  weight_kg numeric,
  body_fat_pct numeric,
  recorded_at timestamptz
)

-- Meals (immutable — edits create new revision)
meals (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  revision_of uuid REFERENCES meals,  -- null if first version
  image_url text,                      -- Supabase Storage path
  human_description text,              -- free text from user
  meal_type text NOT NULL DEFAULT 'snack',  -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
  logged_at timestamptz,               -- when the meal was eaten
  created_at timestamptz               -- when the log was created
)

-- Individual food items within a meal
meal_items (
  id uuid PRIMARY KEY,
  meal_id uuid REFERENCES meals,
  ingredient_name text,
  quantity numeric,
  unit text,                           -- 'g' | 'ml' | 'oz' | 'cup' | 'piece' | etc.
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  saturated_fat_g numeric,
  sodium_mg numeric,
  food_group text,                     -- 'protein' | 'grain' | 'vegetable' | 'fruit' | 'dairy' | 'fat' | 'other'
  confidence text,                     -- 'high' | 'medium' | 'low'
  source text,                         -- 'ai_vision' | 'ai_text' | 'memory' | 'user_manual'
  was_corrected boolean DEFAULT false,
  original_ai_estimate jsonb,          -- what AI guessed before correction
  created_at timestamptz
)

-- Meal embeddings for similarity search
meal_embeddings (
  id uuid PRIMARY KEY,
  meal_id uuid REFERENCES meals,
  user_id uuid REFERENCES profiles,
  description_text text,               -- normalized description used for embedding
  embedding vector(768),               -- pgvector column; 768 dims = gemini-embedding-001 outputDimensionality
  created_at timestamptz
)
-- Index required for fast similarity search (create in migration 005):
-- CREATE INDEX meal_embeddings_embedding_idx
--   ON meal_embeddings USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);
-- HNSW preferred over IVFFlat for small-to-medium datasets (no training needed, better recall)

-- Learned portion priors per user
portion_priors (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  ingredient_name text,                -- normalized ingredient name
  avg_quantity numeric,
  avg_unit text,
  sample_count integer,                -- how many corrections inform this
  updated_at timestamptz,
  UNIQUE(user_id, ingredient_name)     -- prevent duplicate rows; use ON CONFLICT DO UPDATE to upsert
)

-- Daily nutrition snapshots — manually maintained denormalization (NOT a Postgres materialized view)
-- Rebuilt on every meal save/edit via the /api/snapshots route or a Vercel Cron job at midnight
daily_snapshots (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  date date,
  total_calories numeric,
  total_protein_g numeric,
  total_carbs_g numeric,
  total_fat_g numeric,
  total_fiber_g numeric,
  total_sugar_g numeric,
  total_saturated_fat_g numeric,
  total_sodium_mg numeric,
  total_water_ml numeric,
  meal_count integer,
  updated_at timestamptz,
  UNIQUE(user_id, date)                -- upsert with ON CONFLICT (user_id, date) DO UPDATE
)
```

### Row-Level Security
All tables enforce RLS so users can only access their own data:
```sql
CREATE POLICY "Users see own data" ON meals
  FOR ALL USING (auth.uid() = user_id);
```

### Evaluation Tables

```sql
-- One row per AI request that has shadow runs attached
ai_evaluation_runs (
  id uuid PRIMARY KEY,
  meal_id uuid REFERENCES meals,        -- linked after meal is saved
  user_id uuid REFERENCES profiles,
  input_type text NOT NULL,             -- 'text' | 'image' | 'both'
  input_hash text,                      -- SHA-256 of normalized input (deduplication)
  created_at timestamptz
)

-- One row per provider response within a run
ai_evaluation_responses (
  id uuid PRIMARY KEY,
  run_id uuid REFERENCES ai_evaluation_runs,
  provider text NOT NULL,               -- 'groq' | 'gemini' | 'claude' | 'openai'
  model_id text NOT NULL,               -- exact API model string
  raw_response jsonb,                   -- full provider response (for replay)
  parsed_items jsonb,                   -- extracted items array (normalized)
  latency_ms integer,
  tokens_used integer,
  prompt_tokens integer,
  completion_tokens integer,
  error text,                           -- null if successful
  created_at timestamptz
)

-- Scores computed after user submits Verification Card (ground truth)
ai_evaluation_scores (
  id uuid PRIMARY KEY,
  response_id uuid REFERENCES ai_evaluation_responses,
  -- Item-level accuracy
  items_detected integer,               -- how many items the AI found
  items_correct integer,                -- items that matched user's final list (name similarity ≥ 0.8)
  item_match_rate numeric,              -- items_correct / items_detected
  items_missed integer,                 -- items in user's list that AI missed
  items_hallucinated integer,           -- items AI added that user removed
  -- Macro accuracy (absolute % deviation from user-confirmed value)
  calorie_error_pct numeric,
  protein_error_pct numeric,
  carbs_error_pct numeric,
  fat_error_pct numeric,
  -- Portion accuracy
  avg_portion_error_pct numeric,        -- avg across all matched items
  -- Confidence calibration
  high_confidence_correct_rate numeric, -- when AI said 'high', how often was it right
  created_at timestamptz
)
```

> **RLS on evaluation tables**: `ai_evaluation_runs` and `ai_evaluation_responses` are admin-readable only (no user-facing RLS policy). `ai_evaluation_scores` same. Users never query these tables directly.

### Key Design Principles
- **Immutability**: Meals are never overwritten. Corrections create a new meal with `revision_of` pointing to the original.
- **Audit trail**: `original_ai_estimate` on meal_items preserves what the AI guessed vs what the user confirmed.
- **Separation of concerns**: "what user ate" (meal_items with was_corrected=true) vs "what system guessed" (original_ai_estimate jsonb).

---

## 6. Dashboard & Visualization

### Main Screen (Daily Focus)

**Hero Section — "Today's Rings":**
Three concentric ring/arc charts (à la Apple Watch fitness rings):
- Outer ring: Calories consumed / target
- Middle ring: Protein consumed / target
- Inner ring: Water consumed / target

Below rings: numerical summary — "1,450 / 2,200 kcal • 95 / 160g protein • 1.2 / 2.5L water"

**Deficit / Surplus Indicator:**
- Horizontal bar chart, center-aligned
- Left = deficit (green for weight loss goals, amber for bulk goals)
- Right = surplus (reverse color coding)
- Label: "You're 320 kcal under target today"

**"Remaining Today" Quick Card:**
- "You can still eat: ~750 kcal, ~65g protein, ~45g carbs, ~25g fat"
- Tappable → opens suggestion (future feature)

**Recent Meals Timeline:**
- Scrollable list of today's logged meals
- Each card: thumbnail (if photo), meal name, time, calorie summary
- Tap to view details or edit

### Secondary Views

**Weekly View:**
- 7-day bar chart: actual vs target calories (stacked or grouped)
- Rolling average line overlaid
- Macro split per day (stacked bar: protein/carbs/fat)

**Monthly View:**
- 30-day trend line: calories, with goal line
- Heatmap calendar: days color-coded by adherence (green = on target, red = far off)
- Average macro distribution pie/donut chart

**Food Group Distribution:**
- Horizontal stacked bar or treemap showing % of intake by food group
- Useful for spotting imbalances ("90% of your intake is grains and fats")

### Visual Design Rules
- Color-code surplus/deficit consistently throughout
- Always show confidence level on AI-estimated values (dot or badge)
- One-tap correction flows — no more than 2 taps to fix any value
- Mobile-first: all charts must render well at 375px width
- Dark mode support via CSS variables

---

## 7. AI / LLM Architecture

### Provider Strategy

**Primary Vision + Text: Groq**
- Vision model: `meta-llama/llama-4-scout-17b-16e-instruct` (multimodal: image + text input)
- Text model: `meta-llama/llama-4-scout-17b-16e-instruct` (fast) / `llama-3.3-70b-versatile` (quality fallback)
- Free tier: 30 RPM, 1,000 RPD
- Single API key covers both vision and text — no second provider needed for Phase 1

**Secondary Vision: Gemini 2.5 Flash** (overflow / quality fallback)
- API model ID: `gemini-2.5-flash`
- Free tier: 10 RPM, **20 RPD** (reduced from 250 in December 2025), 250K TPM
- Used when Groq vision is rate-limited, or as a quality cross-check for low-confidence results
- ⚠️ 20 RPD is a hard global cap (per API key, not per user — treat as a shared reserve)

**Fallback Chain:**
```
Vision: Groq Llama 4 Scout → Groq Llama 4 Maverick → Gemini 2.5 Flash → text-only degradation
Text:   Groq Llama 4 Scout → Groq Llama 3.3 70B → Groq Llama 3.1 8B → local formula fallback
```

**Per-User Quota Note:** Google OAuth login does not share Gemini API quota. AI Studio quotas are tied to the app's API key, not individual user accounts. BYOK (users supply their own API key) is deferred to Phase 4.

### Abstraction Layer

All LLM calls go through a unified service:

```typescript
// /lib/ai/provider.ts

interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  tokens_used: number;
}

interface AIProvider {
  name: string;
  parseImage(image: Buffer, text?: string): Promise<LLMResponse>;
  parseText(prompt: string): Promise<LLMResponse>;
  estimateNutrition(ingredients: Ingredient[]): Promise<LLMResponse>;
}

// Provider registry — add new providers without touching call sites
const providers: Record<string, AIProvider> = {
  gemini: new GeminiProvider(),
  groq: new GroqProvider(),
};
```

### Rate Limit Management

Quotas are per API key, not per user. The rate limiter tracks consumption globally across all users.

```typescript
// /lib/ai/rate-limiter.ts
// Global per-provider rate tracking (not per-user)

class RateLimiter {
  private counters: Map<string, { rpm: number; rpd: number; lastReset: Date }>;

  async execute(
    provider: string,
    fn: () => Promise<LLMResponse>,
    fallback?: () => Promise<LLMResponse>
  ): Promise<LLMResponse> {
    // 1. Check RPM and RPD counters for provider
    // 2. If within limits: execute fn(), increment counters
    // 3. If RPM exceeded: wait until next minute window, retry once
    // 4. If RPD exceeded: try fallback provider
    // 5. If all providers exhausted: throw RateLimitExhaustedError
    //    → caller handles degradation (see Error Budget section below)
  }
}
```

Counters are stored in Supabase (a simple `rate_limit_counters` table) so they persist across serverless function cold starts. Redis would be faster but adds a dependency; Supabase is sufficient at free-tier scale.

### Error Budget & Graceful Degradation

Define the app's behavior at each failure tier so developers implement consistent fallbacks, not ad-hoc error screens.

| Failure | Tier | User-Facing Behavior |
|---|---|---|
| Groq vision rate-limited (RPM) | Retry after 60s | Spinner with "Analyzing photo…" — user unaware |
| Groq vision RPD exhausted | Fall to Gemini | Transparent — no user message |
| Gemini RPD exhausted (20/day) | Fall to text-only | Show degradation banner (see error texts) |
| All vision APIs exhausted | Text-only mode | Prompt user to describe meal; photo thumbnail still saved |
| Text parse fails (malformed JSON) | Retry once, then empty card | Open Verification Card with blank rows; user enters manually |
| Nutrition estimation fails | Retry once, then empty card | Same as above |
| Goal calculation LLM fails | Local formula fallback | BMR/TDEE computed locally; no LLM rationale shown |
| Local goal formula fails | Impossible (pure math) | — |
| Embedding generation fails | Silent — meal still saves | Meal saved without embedding; won't appear in similarity matches until re-embedded by cron |
| Image upload fails | Retry with exponential backoff | Error message after 3 failures |
| Supabase write fails | Retry once | Error message with "data preserved" assurance |

### Embedding Strategy
- Model: `gemini-embedding-001` (text-only, production-stable)
- API model ID: `gemini-embedding-001`
- Dimensions: **768** (configured via `outputDimensionality` — model supports 128–3,072 via MRL; 768 balances quality and storage)
- Embedding generated asynchronously on meal save (non-blocking)
- Cosine similarity search with threshold ≥ 0.85 for "meal memory" matches
- Fallback: if embedding fails, meal saves without one; a daily cron re-tries un-embedded meals
- Future: `gemini-embedding-2-preview` (multimodal embeddings for photo+text) when stable

### Multi-Provider Evaluation Framework

The app is designed to benchmark LLMs against each other using real meals as ground truth. There are two complementary mechanisms:

#### 1. Shadow Mode (continuous, real-world data)

When `AI_SHADOW_PROVIDERS` is set, every primary AI request silently fires parallel calls to shadow providers. Shadow calls are **non-blocking** — the user sees the primary provider's response immediately. Shadow results are logged asynchronously.

```typescript
// /lib/ai/shadow-runner.ts

async function runWithShadow(
  input: AIInput,
  primary: AIProvider,
  shadowProviders: AIProvider[]
): Promise<LLMResponse> {
  // 1. Fire primary call — await it (user is waiting)
  const primaryResult = await primary.parseInput(input)

  // 2. Fire shadow calls in background — do NOT await
  const runId = await createEvaluationRun(input)
  Promise.allSettled(
    shadowProviders.map(p =>
      p.parseInput(input)
        .then(r => logEvaluationResponse(runId, p.name, r))
        .catch(e => logEvaluationResponse(runId, p.name, null, e.message))
    )
  )
  // 3. Also log primary result for self-scoring
  logEvaluationResponse(runId, primary.name, primaryResult)

  return primaryResult
}
```

When the user submits the Verification Card, `scoreEvaluationRun(runId, userConfirmedItems)` is called to compute and persist accuracy scores for all responses in that run.

Shadow mode is **opt-in per environment** via env var — disabled in dev by default to avoid unnecessary API calls. Enable selectively for specific users or all users via a feature flag.

#### 2. Golden Dataset Script (controlled, repeatable)

A fixed set of 50 meals with manually verified nutritional facts. Run any time to compare providers on identical inputs.

```
scripts/
  evaluate-providers.ts    # Runs golden dataset through all configured providers
  golden-meals.json        # 50 reference meals with verified ground truth
  evaluation-report.ts     # Aggregates DB scores → markdown/CSV report
```

**Golden dataset structure** (`tests/fixtures/golden-meals.json`):
```json
[
  {
    "id": "golden-001",
    "description": "200g grilled chicken breast, 1 cup cooked brown rice, mixed salad",
    "image_path": "fixtures/images/chicken-rice-salad.jpg",
    "ground_truth": {
      "items": [
        { "name": "grilled chicken breast", "quantity": 200, "unit": "g",
          "calories": 330, "protein_g": 62, "carbs_g": 0, "fat_g": 7.2 },
        { "name": "brown rice cooked", "quantity": 195, "unit": "g",
          "calories": 216, "protein_g": 4.5, "carbs_g": 45, "fat_g": 1.8 },
        { "name": "mixed salad", "quantity": 80, "unit": "g",
          "calories": 20, "protein_g": 1.5, "carbs_g": 3, "fat_g": 0.2 }
      ],
      "total_calories": 566,
      "source": "USDA FoodData Central"
    }
  }
]
```

Dataset should cover: simple single-ingredient meals, complex mixed dishes, restaurant meals, snacks, beverages, culturally diverse foods, ambiguous portions, and dark/low-quality photos.

#### Providers Benchmarked

| Provider | Model ID | Cost tier | Vision |
|---|---|---|---|
| Groq (primary) | `meta-llama/llama-4-scout-17b-16e-instruct` | Free | Yes |
| Groq (quality) | `llama-3.3-70b-versatile` | Free | No — text only |
| Anthropic | `claude-haiku-4-5-20251001` | Paid (cheap) | Yes |
| Anthropic | `claude-sonnet-4-6` | Paid (mid) | Yes |
| OpenAI | `gpt-4o-mini` | Paid (cheap) | Yes |
| OpenAI | `gpt-4o` | Paid (mid) | Yes |
| Google | `gemini-2.5-flash` | Free (20 RPD) | Yes |

Anthropic and OpenAI providers are evaluation-only by default. Promote the winner to primary/fallback chain once the evaluation has enough data (suggest ≥ 200 scored meals before drawing conclusions).

#### Scoring Formulas

```typescript
// /lib/ai/evaluation-scorer.ts

function scoreResponse(
  aiItems: NutritionItem[],
  userItems: NutritionItem[]   // ground truth from Verification Card
): EvaluationScore {

  // Item match: fuzzy name match (normalized, stemmed) with quantity within 50%
  const matched = matchItems(aiItems, userItems)

  return {
    item_match_rate:    matched.correct / Math.max(aiItems.length, userItems.length),
    items_missed:       userItems.length - matched.correct,
    items_hallucinated: aiItems.length - matched.correct,

    // Per-macro: |ai_value - user_value| / user_value × 100
    calorie_error_pct:  absPctError(sum(aiItems, 'calories'),  sum(userItems, 'calories')),
    protein_error_pct:  absPctError(sum(aiItems, 'protein_g'), sum(userItems, 'protein_g')),
    carbs_error_pct:    absPctError(sum(aiItems, 'carbs_g'),   sum(userItems, 'carbs_g')),
    fat_error_pct:      absPctError(sum(aiItems, 'fat_g'),     sum(userItems, 'fat_g')),

    avg_portion_error_pct: mean(matched.pairs.map(
      ([ai, user]) => absPctError(toGrams(ai), toGrams(user))
    )),

    high_confidence_correct_rate: highConfidenceCorrectRate(aiItems, userItems),
  }
}

function absPctError(estimate: number, truth: number): number {
  if (truth === 0) return estimate === 0 ? 0 : 100
  return Math.abs((estimate - truth) / truth) * 100
}
```

#### Admin Evaluation Report

`GET /api/admin/evaluation/report` returns aggregate metrics per provider, filterable by input type and date range:

```json
{
  "generated_at": "2026-03-30T12:00:00Z",
  "sample_size": 312,
  "providers": [
    {
      "provider": "groq",
      "model_id": "meta-llama/llama-4-scout-17b-16e-instruct",
      "sample_count": 312,
      "avg_calorie_error_pct": 14.2,
      "avg_item_match_rate": 0.81,
      "avg_latency_ms": 1240,
      "error_rate": 0.02,
      "p50_latency_ms": 980,
      "p95_latency_ms": 3200
    },
    {
      "provider": "claude",
      "model_id": "claude-haiku-4-5-20251001",
      "sample_count": 312,
      "avg_calorie_error_pct": 11.8,
      "avg_item_match_rate": 0.87,
      "avg_latency_ms": 2100,
      "error_rate": 0.01,
      "p50_latency_ms": 1800,
      "p95_latency_ms": 4500
    }
  ],
  "winner": {
    "accuracy": "claude/claude-haiku-4-5-20251001",
    "speed":    "groq/meta-llama/llama-4-scout-17b-16e-instruct",
    "calorie_error_factor": "claude is 1.20× more accurate on calories than groq"
  }
}
```

The `winner.calorie_error_factor` field gives the scalar comparison you need to make a promotion decision.

### Structured Output Format
All LLM calls that expect structured data use a JSON schema in the system prompt:

```json
{
  "items": [
    {
      "name": "grilled chicken breast",
      "quantity": 200,
      "unit": "g",
      "calories": 330,
      "protein_g": 62,
      "carbs_g": 0,
      "fat_g": 7.2,
      "food_group": "protein",
      "confidence": "high"
    }
  ],
  "total_calories": 330,
  "notes": "Portion estimated from photo — appears to be a standard restaurant serving."
}
```

---

## 8. Tech Stack

### Frontend
| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR, API routes, mobile-first, great DX |
| Styling | **Tailwind CSS** | Utility-first, fast iteration, small bundle |
| Components | **shadcn/ui** | Accessible, customizable, not a dependency |
| Charts | **Recharts** | Lightweight, React-native, good mobile support |
| State | **Zustand** or React Context | Simple, no boilerplate |
| Forms | **React Hook Form + Zod** | Validation, performance, type safety |
| Camera | **Native `<input type="file" accept="image/*" capture>`** | Works on all mobile browsers, no extra deps |
| PWA | **@ducanh2912/next-pwa** | Maintained fork of unmaintained `next-pwa`; drop-in replacement |

### Backend
| Layer | Choice | Reason |
|---|---|---|
| Runtime | **Node.js (via Next.js API routes)** | Unified deploy, no separate backend |
| Auth | **Supabase Auth** | Email/password + OAuth, JWT, free |
| Database | **Supabase PostgreSQL** | Free tier: 500MB, RLS, pgvector |
| Vector Search | **pgvector** (Supabase extension) | No separate vector DB needed |
| File Storage | **Supabase Storage** | Free tier: 1GB, integrated with auth |
| Background Jobs | **Supabase Edge Functions** or **Vercel Cron** | For embedding generation, daily snapshot rollups |
| Deployment | **Vercel** (free tier) | Zero-config Next.js deploy, generous free tier |

### External APIs
| Service | Model ID | Role | Free / Cost |
|---|---|---|---|
| Groq | `meta-llama/llama-4-scout-17b-16e-instruct` | Primary vision + text | Free: 30 RPM, 1K RPD |
| Groq | `llama-3.3-70b-versatile` | Quality text fallback | Free: 30 RPM, 1K RPD |
| Groq | `llama-3.1-8b-instant` | Emergency text fallback | Free: 30 RPM, 1K RPD |
| Google AI Studio | `gemini-2.5-flash` | Vision overflow / fallback | Free: 10 RPM, **20 RPD** |
| Google AI Studio | `gemini-embedding-001` | Meal embeddings (768-dim) | Free: ~10M TPM |
| Anthropic | `claude-haiku-4-5-20251001` | Evaluation shadow (vision) | Paid |
| Anthropic | `claude-sonnet-4-6` | Evaluation shadow (vision, high quality) | Paid |
| OpenAI | `gpt-4o-mini` | Evaluation shadow (vision) | Paid |
| OpenAI | `gpt-4o` | Evaluation shadow (vision, high quality) | Paid |

> **Note on Groq RPD:** The 1K RPD is shared across all models on the same API key. Design the rate limiter to track combined Groq usage, not per-model.

> **Evaluation providers** (Anthropic, OpenAI) are only called in shadow mode — never in the critical path. Gate them behind `AI_SHADOW_PROVIDERS` env var so they're off by default and don't incur cost until intentionally enabled.

---

## 9. Project Structure

```
Uptake/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth group
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── onboarding/
│   │   │       ├── page.tsx          # Multi-step onboarding
│   │   │       └── components/
│   │   ├── (dashboard)/              # Main app group
│   │   │   ├── page.tsx              # Daily dashboard (home)
│   │   │   ├── weekly/page.tsx
│   │   │   ├── monthly/page.tsx
│   │   │   └── components/
│   │   │       ├── CalorieRings.tsx
│   │   │       ├── DeficitBar.tsx
│   │   │       ├── MealTimeline.tsx
│   │   │       └── MacroChart.tsx
│   │   ├── meal/
│   │   │   ├── new/page.tsx          # Meal logging screen
│   │   │   ├── [id]/page.tsx         # Meal detail / edit
│   │   │   └── components/
│   │   │       ├── PhotoCapture.tsx
│   │   │       ├── IngredientEditor.tsx
│   │   │       └── VerificationCard.tsx
│   │   ├── settings/page.tsx         # Profile, goals, data export
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── parse-image/route.ts
│   │   │   │   ├── parse-text/route.ts
│   │   │   │   ├── estimate-nutrition/route.ts
│   │   │   │   ├── calculate-goals/route.ts
│   │   │   │   └── generate-embedding/route.ts
│   │   │   ├── meals/route.ts
│   │   │   ├── goals/route.ts
│   │   │   ├── snapshots/route.ts
│   │   │   └── admin/
│   │   │       └── evaluation/
│   │   │           └── report/route.ts  # Bearer-token protected; returns aggregate scores
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── provider.ts           # Abstract LLM interface + AIProvider type
│   │   │   ├── gemini.ts             # Gemini provider (vision fallback + embeddings)
│   │   │   ├── groq.ts               # Groq provider (primary vision + text)
│   │   │   ├── claude.ts             # Anthropic provider (evaluation shadow)
│   │   │   ├── openai.ts             # OpenAI provider (evaluation shadow)
│   │   │   ├── rate-limiter.ts       # Global per-provider rate limiting
│   │   │   ├── shadow-runner.ts      # Fires shadow calls, logs to evaluation tables
│   │   │   ├── evaluation-scorer.ts  # Scores AI response vs user ground truth
│   │   │   ├── prompts/              # System prompts (version controlled)
│   │   │   │   ├── parse-image.ts
│   │   │   │   ├── parse-text.ts
│   │   │   │   ├── nutrition.ts
│   │   │   │   └── goals.ts
│   │   │   └── schemas.ts            # Zod schemas for LLM output validation
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client (uses service role only for admin routes)
│   │   │   └── types.ts              # Generated DB types
│   │   ├── nutrition/
│   │   │   ├── bmr.ts                # Mifflin-St Jeor
│   │   │   ├── tdee.ts               # TDEE calculation
│   │   │   └── targets.ts            # Goal → target mapping
│   │   └── utils/
│   │       ├── format.ts             # Number/date formatting
│   │       └── constants.ts          # Enums, activity multipliers
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── MobileNav.tsx
│   │   │   └── Header.tsx
│   │   └── shared/
│   │       ├── ConfidenceBadge.tsx
│   │       └── NutrientBar.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMeals.ts
│   │   └── useGoals.ts
│   └── middleware.ts                 # Next.js Auth middleware (must live at src/middleware.ts)
├── tests/
│   ├── unit/
│   │   ├── nutrition/
│   │   │   ├── bmr.test.ts
│   │   │   ├── tdee.test.ts
│   │   │   └── targets.test.ts
│   │   ├── ai/
│   │   │   ├── schemas.test.ts       # Zod validation of LLM output
│   │   │   └── rate-limiter.test.ts
│   │   └── utils/
│   │       └── format.test.ts
│   ├── integration/
│   │   ├── ai/
│   │   │   ├── parse-image.test.ts   # Mocked provider
│   │   │   ├── parse-text.test.ts
│   │   │   ├── estimate-nutrition.test.ts
│   │   │   ├── calculate-goals.test.ts
│   │   │   └── generate-embedding.test.ts
│   │   ├── meals/
│   │   │   ├── meal-save.test.ts     # Immutability, revision chain
│   │   │   ├── meal-snapshot.test.ts # Snapshot aggregation accuracy
│   │   │   └── meal-similarity.test.ts # pgvector similarity search
│   │   ├── goals/
│   │   │   └── goal-versioning.test.ts
│   │   └── rls/
│   │       └── row-level-security.test.ts  # User A cannot read User B's data
│   └── e2e/
│       ├── onboarding.spec.ts        # Full onboarding flow
│       ├── meal-log.spec.ts          # Log a meal end-to-end
│       └── dashboard.spec.ts         # Daily dashboard renders correctly
├── supabase/
│   ├── migrations/                   # SQL migrations
│   │   ├── 001_profiles.sql
│   │   ├── 002_goals.sql
│   │   ├── 003_meals.sql
│   │   ├── 004_meal_items.sql
│   │   ├── 005_embeddings.sql        # includes HNSW index creation
│   │   ├── 006_snapshots.sql
│   │   ├── 007_rls_policies.sql
│   │   └── 008_evaluation.sql        # ai_evaluation_runs/responses/scores (admin-only, no user RLS)
│   └── seed.sql                      # Sample data for dev
├── scripts/
│   ├── evaluate-providers.ts         # Run golden dataset through all providers; writes to DB
│   └── evaluation-report.ts          # Pull DB scores → print markdown/CSV table
├── tests/
│   └── fixtures/
│       ├── golden-meals.json         # 50 reference meals with verified nutritional ground truth
│       └── images/                   # Reference food photos for golden dataset
├── public/
│   ├── icons/                        # PWA icons
│   └── manifest.json                 # PWA manifest
├── .env.local.example                # Required env vars
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 10. Environment Variables

Variables prefixed `NEXT_PUBLIC_` are embedded in the client bundle and visible to users — never put secrets in them. All API keys and the service role key must be unprefixed (server-side only).

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=           # Safe to expose — identifies your project
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Safe to expose — RLS is the security layer
SUPABASE_SERVICE_ROLE_KEY=          # ⚠️ Server-side only. Bypasses RLS entirely.
                                    # Use ONLY in cron jobs and admin-only API routes.
                                    # Never import in client components or public API routes.

# Google AI Studio (Gemini)
GOOGLE_AI_API_KEY=                  # Server-side only

# Groq
GROQ_API_KEY=                       # Server-side only

# Anthropic (evaluation shadow only — leave blank to disable)
ANTHROPIC_API_KEY=                  # Server-side only

# OpenAI (evaluation shadow only — leave blank to disable)
OPENAI_API_KEY=                     # Server-side only

# Evaluation
AI_SHADOW_PROVIDERS=                # Comma-separated: 'claude,openai,gemini' — empty = shadow off
AI_EVALUATION_ADMIN_SECRET=         # Bearer token for /api/admin/evaluation/* routes

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add `.env.local` to `.gitignore`. Commit `.env.local.example` with all keys present but values blank.

---

## 11. MVP Phasing

### Phase 1 — Foundation (Weeks 1-3)
**Goal: Manual meal entry + goal tracking + daily dashboard**

- [ ] Supabase project setup (DB, Auth, Storage)
- [ ] Next.js scaffold with Tailwind + shadcn/ui
- [ ] Auth flows: signup, login, logout
- [ ] Multi-step onboarding (biometrics → activity → goal)
- [ ] Goal calculation via Groq (BMR → TDEE → targets)
- [ ] Manual meal logging (text input, ingredient list)
- [ ] Nutrition estimation via Groq (text → structured JSON)
- [ ] Verification Card for editing AI estimates
- [ ] Daily dashboard: calorie rings, deficit bar, meal timeline
- [ ] Daily snapshot generation (cron or on-save)
- [ ] Mobile-responsive layout
- [ ] PWA manifest + service worker shell

### Phase 2 — Vision + Memory (Weeks 4-6)
**Goal: Photo upload, ingredient extraction, meal similarity**

- [ ] Photo upload flow (camera capture + gallery)
- [ ] Groq Llama 4 Scout multimodal integration (primary vision)
- [ ] Gemini 2.5 Flash as vision fallback (overflow only)
- [ ] Combined photo + text parsing pipeline
- [ ] Embedding generation on meal save (`gemini-embedding-001`, async)
- [ ] pgvector HNSW similarity search for "meal memory"
- [ ] "Estimated from history" badge on Verification Card
- [ ] Correction tracking (original_ai_estimate vs final)
- [ ] Portion prior learning (upsert avg quantities per ingredient per user)
- [ ] Global rate limit management + full fallback chain
- [ ] Settings page: edit profile, update goals, view history
- [ ] Shadow mode infrastructure (`ai_evaluation_runs`, `ai_evaluation_responses` tables + migrations)
- [ ] Evaluation scorer — `scoreEvaluationRun()` triggered on Verification Card submit
- [ ] Claude + OpenAI provider implementations (evaluation-only, gated by `AI_SHADOW_PROVIDERS`)
- [ ] Golden dataset: 50 meals in `tests/fixtures/golden-meals.json` with verified ground truth
- [ ] `scripts/evaluate-providers.ts` — run golden dataset against all configured providers on demand

### Phase 3 — Analytics + Polish (Weeks 7-9)
**Goal: Weekly/monthly views, confidence scoring, data export**

- [ ] Weekly view: 7-day bar charts, rolling averages
- [ ] Monthly view: 30-day trends, heatmap calendar, macro pie
- [ ] Food group distribution visualization
- [ ] Confidence scoring refinement (use correction rate to adjust)
- [ ] Goal adaptation: suggest changes when weight updates or trends diverge
- [ ] Full data export (JSON or CSV)
- [ ] Memory reset option (clear learned priors)
- [ ] Performance optimization (lazy loading, image compression)
- [ ] Accessibility pass (keyboard nav, screen reader, contrast)
- [ ] Error states + empty states + loading skeletons
- [ ] Admin evaluation report endpoint (`GET /api/admin/evaluation/report`)
- [ ] `scripts/evaluation-report.ts` — export aggregate scores as markdown/CSV
- [ ] Provider promotion: update primary/fallback chain based on evaluation data

---

## 12. Privacy & Trust

- **Estimated vs Confirmed**: Always visually distinguished (badge, opacity, icon)
- **Data ownership**: Full JSON/CSV export available
- **Memory reset**: User can clear all learned priors without losing meal history
- **No medical claims**: App explicitly states it provides estimates, not medical advice
- **Free tier data policies**: Note that Gemini free tier data may be used by Google to improve models. For sensitive users, add a toggle to strip PII from prompts.
- **RLS everywhere**: No API endpoint returns another user's data

---

## 13. Claude Code Build Instructions

When handing this to Claude Code, use this prompt structure:

> Build a mobile-first Next.js 15 web app called "Uptake" using the App Router.
>
> **Stack**: Tailwind CSS, shadcn/ui, Recharts, Supabase (Auth + PostgreSQL + pgvector + Storage), @ducanh2912/next-pwa, Groq Llama 4 Scout (primary vision + text), Gemini 2.5 Flash (vision fallback), gemini-embedding-001 (embeddings).
>
> **Start with Phase 1**: Auth, onboarding, manual meal logging with AI nutrition estimation, daily dashboard with calorie rings and deficit tracking.
>
> **Key constraints**:
> - All LLM calls go through an abstraction layer (see `/lib/ai/provider.ts` pattern in the spec)
> - All estimates must be editable by the user
> - Meals are immutable — corrections create revisions
> - Persist the delta between AI estimate and user correction
> - Mobile-first: design for 375px width first
> - Use the database schema from section 5 (including all constraints and index notes)
> - Use the project structure from section 9 (note: middleware at `src/middleware.ts`)
> - Rate limiter tracks quotas globally (per API key), not per user
> - `SUPABASE_SERVICE_ROLE_KEY` used only in cron/admin routes — never in regular API routes
> - Use error texts from section 15 verbatim for all AI failure states
> - All user data and AI calculation code must have corresponding tests (see section 16)
>
> Reference the full spec at `UPTAKE-APP-SPEC.md` for data model, pipeline details, and phasing.

---

## 14. Open Questions / Future Considerations

- **Barcode scanning**: Could add UPC lookup for packaged foods (Phase 4+)
- **Wearable integration**: Apple Health / Google Fit for activity data import
- **Social features**: Meal sharing, accountability partners
- **Meal suggestions**: "You have 500 kcal and 40g protein left — here are some ideas"
- **Restaurant menu integration**: Parse photos of menus for pre-logging
- **Notification system**: "You haven't logged lunch yet" reminders
- **Offline mode**: Queue meals locally when offline, sync on reconnect
- **Multi-language support**: i18n for Hebrew, Arabic, etc.
- **BYOK (Bring Your Own Key)**: Allow power users to supply their own Groq/Gemini API keys for private quota

---

## 15. Error Texts

All user-facing error strings are defined here. Implement these verbatim so UX is consistent regardless of which developer writes the error handler.

### Vision / Photo Errors
```
VISION_RATE_LIMITED=
  "Photo analysis is temporarily at capacity. Describe your meal below and we'll estimate
  the nutrition from your description."

VISION_NO_FOOD_DETECTED=
  "No food was detected in this photo. Is this a meal photo? Try a clearer shot,
  or describe what you ate in the text box below."

VISION_IMAGE_UNREADABLE=
  "We couldn't process this image (it may be too dark or blurry). Try another photo,
  or describe your meal in text."

VISION_ALL_PROVIDERS_EXHAUSTED=
  "Photo analysis is unavailable right now. Your photo has been saved — describe
  your meal below and we'll analyze the photo automatically when capacity is restored."
```

### Text Parse Errors
```
TEXT_PARSE_FAILED=
  "We had trouble understanding that description. Try listing ingredients separately,
  for example: '200g chicken, 1 cup rice, mixed salad'."

NUTRITION_ESTIMATE_FAILED=
  "Nutrition estimation is temporarily unavailable. You can enter values manually
  in the fields below, or tap 'Try again' in a moment."
```

### Goal Calculation Errors
```
GOAL_CALC_LLM_FAILED=
  (Silent — fall back to local BMR/TDEE formula. Do not show this message unless
  local formula also fails, which is impossible for valid inputs.)

GOAL_CALC_INVALID_INPUT=
  "Please check your inputs — we need valid values for height, weight, and age
  to calculate your targets."
```

### Data / Save Errors
```
MEAL_SAVE_FAILED=
  "Couldn't save your meal. Your entries are preserved — tap Save to try again."

IMAGE_UPLOAD_FAILED=
  "Photo upload failed. Check your connection and try again."

PROFILE_UPDATE_FAILED=
  "Profile update failed. Please try again."

SNAPSHOT_STALE=
  (Internal only — never shown to user. Log to console. Cron will rebuild.)
```

### Auth Errors
```
SESSION_EXPIRED=
  "Your session has expired. Sign in again to continue."

UNAUTHORIZED=
  "You don't have permission to view this."
```

### Empty States (not errors — but define here for consistency)
```
EMPTY_TODAY=
  "Nothing logged yet today. Tap + to add your first meal."

EMPTY_WEEK=
  "No meals logged this week yet."

EMPTY_HISTORY=
  "No meal history found. Log your first meal to start building your nutrition picture."
```

---

## 16. Testing Strategy

### Framework Setup
- **Unit + Integration**: Jest + `ts-jest`
- **E2E**: Playwright
- **DB mocking**: `pg-mem` for schema/constraint tests; real Supabase test project for RLS tests
- **AI mocking**: Manual mocks in `tests/__mocks__/` — never call real AI APIs in tests
- **Coverage target**: 100% on nutrition math, ≥ 80% on AI pipeline logic, ≥ 60% overall

### Unit Tests

#### `tests/unit/nutrition/bmr.test.ts`
Pure function — no mocks needed.
```typescript
describe('calculateBMR', () => {
  test('male, standard values', () =>
    expect(calculateBMR({ weight: 80, height: 180, age: 30, sex: 'male' })).toBeCloseTo(1854, 0))

  test('female, standard values', () =>
    expect(calculateBMR({ weight: 65, height: 165, age: 28, sex: 'female' })).toBeCloseTo(1471, 0))

  test('sex=other uses male formula as default', () =>
    expect(calculateBMR({ weight: 70, height: 170, age: 25, sex: 'other' }))
      .toEqual(calculateBMR({ weight: 70, height: 170, age: 25, sex: 'male' })))

  test('throws on negative weight', () =>
    expect(() => calculateBMR({ weight: -5, height: 170, age: 25, sex: 'male' })).toThrow())

  test('throws on age 0', () =>
    expect(() => calculateBMR({ weight: 70, height: 170, age: 0, sex: 'male' })).toThrow())
})
```

#### `tests/unit/nutrition/tdee.test.ts`
```typescript
describe('calculateTDEE', () => {
  const bmr = 1800

  test.each([
    ['sedentary',  1.2,   2160],
    ['light',      1.375, 2475],
    ['moderate',   1.55,  2790],
    ['very_active',1.725, 3105],
    ['athlete',    1.9,   3420],
  ])('%s activity level', (level, _, expected) =>
    expect(calculateTDEE(bmr, level as ActivityLevel)).toBeCloseTo(expected, 0))

  test('throws on unknown activity level', () =>
    expect(() => calculateTDEE(bmr, 'couch_potato' as any)).toThrow())
})
```

#### `tests/unit/nutrition/targets.test.ts`
```typescript
describe('calculateTargets', () => {
  const tdee = 2500
  const weight = 80  // kg

  test('muscle_gain: caloric surplus, protein ≥ 1.8g/kg', () => {
    const t = calculateTargets('muscle_gain', tdee, weight)
    expect(t.calories).toBeGreaterThan(tdee)
    expect(t.protein_g / weight).toBeGreaterThanOrEqual(1.8)
  })

  test('weight_loss: caloric deficit', () => {
    const t = calculateTargets('weight_loss', tdee, weight)
    expect(t.calories).toBeLessThan(tdee)
  })

  test('maintenance: calories within ±50 of TDEE', () => {
    const t = calculateTargets('maintenance', tdee, weight)
    expect(t.calories).toBeCloseTo(tdee, -2)
  })

  test('heart_healthy: sodium_mg target set', () => {
    const t = calculateTargets('heart_healthy', tdee, weight)
    expect(t.sodium_mg).toBeDefined()
    expect(t.sodium_mg).toBeLessThanOrEqual(2300)
  })

  test('diabetic: net_carbs_g set and below threshold', () => {
    const t = calculateTargets('diabetic', tdee, weight)
    expect(t.net_carbs_g).toBeDefined()
  })

  test('custom: returns passed custom_targets unchanged', () => {
    const custom = { calories: 1800, protein_g: 120 }
    const t = calculateTargets('custom', tdee, weight, custom)
    expect(t.calories).toBe(1800)
    expect(t.protein_g).toBe(120)
  })

  test('all goal types produce non-null calories and macros', () => {
    const goalTypes = ['muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
      'recomposition', 'endurance', 'heart_healthy', 'longevity', 'diabetic', 'recovery']
    goalTypes.forEach(g => {
      const t = calculateTargets(g as GoalType, tdee, weight)
      expect(t.calories).toBeGreaterThan(0)
      expect(t.protein_g).toBeGreaterThan(0)
      expect(t.carbs_g).toBeGreaterThanOrEqual(0)
      expect(t.fat_g).toBeGreaterThan(0)
    })
  })
})
```

#### `tests/unit/ai/schemas.test.ts`
Validates that Zod schemas correctly accept valid LLM output and reject malformed output.
```typescript
describe('nutritionResponseSchema', () => {
  test('accepts valid response', () => {
    const valid = {
      items: [{ name: 'chicken', quantity: 200, unit: 'g', calories: 330,
                protein_g: 62, carbs_g: 0, fat_g: 7.2,
                food_group: 'protein', confidence: 'high' }],
      total_calories: 330,
      notes: 'Standard serving'
    }
    expect(() => nutritionResponseSchema.parse(valid)).not.toThrow()
  })

  test('rejects missing required fields', () => {
    expect(() => nutritionResponseSchema.parse({ items: [] })).toThrow()
  })

  test('rejects invalid confidence value', () => {
    const invalid = { items: [{ name: 'x', confidence: 'maybe' }], total_calories: 0 }
    expect(() => nutritionResponseSchema.parse(invalid)).toThrow()
  })

  test('rejects negative calories', () => {
    const invalid = { items: [{ name: 'x', calories: -100, confidence: 'high' }], total_calories: -100 }
    expect(() => nutritionResponseSchema.parse(invalid)).toThrow()
  })
})
```

#### `tests/unit/ai/rate-limiter.test.ts`
```typescript
describe('RateLimiter', () => {
  test('executes fn when under RPM limit', async () => {
    const fn = jest.fn().mockResolvedValue({ content: 'ok' })
    const result = await rateLimiter.execute('groq', fn)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(result.content).toBe('ok')
  })

  test('calls fallback when primary provider RPD is exhausted', async () => {
    simulateRPDExhausted('groq')
    const primary = jest.fn()
    const fallback = jest.fn().mockResolvedValue({ content: 'fallback' })
    const result = await rateLimiter.execute('groq', primary, fallback)
    expect(primary).not.toHaveBeenCalled()
    expect(fallback).toHaveBeenCalledTimes(1)
    expect(result.content).toBe('fallback')
  })

  test('throws RateLimitExhaustedError when all providers exhausted', async () => {
    simulateRPDExhausted('groq')
    simulateRPDExhausted('gemini')
    await expect(rateLimiter.execute('groq', jest.fn(), jest.fn()))
      .rejects.toThrow(RateLimitExhaustedError)
  })

  test('RPM counter resets after 60 seconds', async () => {
    jest.useFakeTimers()
    simulateRPMExhausted('groq')
    jest.advanceTimersByTime(61_000)
    const fn = jest.fn().mockResolvedValue({ content: 'ok' })
    await expect(rateLimiter.execute('groq', fn)).resolves.toBeDefined()
    jest.useRealTimers()
  })
})
```

### Integration Tests

#### `tests/integration/ai/parse-text.test.ts`
All AI providers mocked.
```typescript
describe('POST /api/ai/parse-text', () => {
  beforeEach(() => mockGroqResponse(VALID_NUTRITION_JSON))

  test('returns structured ingredient list for valid description', async () => {
    const res = await POST('/api/ai/parse-text', { text: '200g grilled chicken and rice' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toHaveLength(greaterThan(0))
    expect(body.items[0]).toMatchObject({ name: expect.any(String), calories: expect.any(Number) })
  })

  test('returns 400 for empty text', async () => {
    const res = await POST('/api/ai/parse-text', { text: '' })
    expect(res.status).toBe(400)
  })

  test('returns 401 for unauthenticated request', async () => {
    const res = await POST('/api/ai/parse-text', { text: 'chicken' }, { auth: false })
    expect(res.status).toBe(401)
  })

  test('returns degradation message when all providers exhausted', async () => {
    mockAllProvidersExhausted()
    const res = await POST('/api/ai/parse-text', { text: 'chicken' })
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe(ERROR_TEXTS.NUTRITION_ESTIMATE_FAILED)
  })

  test('validates and rejects malformed LLM output via Zod', async () => {
    mockGroqResponse('{ invalid json }')
    const res = await POST('/api/ai/parse-text', { text: 'chicken' })
    // Should retry once then return empty card, not crash
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toHaveLength(0)
    expect(body.degraded).toBe(true)
  })
})
```

#### `tests/integration/ai/calculate-goals.test.ts`
```typescript
describe('POST /api/ai/calculate-goals', () => {
  test('returns targets for valid profile', async () => {
    mockGroqResponse(VALID_GOALS_JSON)
    const profile = { weight_kg: 80, height_cm: 180, age: 30, sex: 'male',
                      activity_level: 'moderate', goal_type: 'muscle_gain' }
    const res = await POST('/api/ai/calculate-goals', profile)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.calories_target).toBeGreaterThan(0)
    expect(body.protein_g).toBeGreaterThan(0)
    expect(body.rationale).toBeTruthy()
  })

  test('falls back to local formula when LLM fails', async () => {
    mockGroqFailure()
    const profile = { weight_kg: 80, height_cm: 180, age: 30, sex: 'male',
                      activity_level: 'moderate', goal_type: 'maintenance' }
    const res = await POST('/api/ai/calculate-goals', profile)
    expect(res.status).toBe(200)
    const body = await res.json()
    // Local fallback: TDEE for this profile ≈ 2800 kcal
    expect(body.calories_target).toBeGreaterThan(2500)
    expect(body.calories_target).toBeLessThan(3200)
    expect(body.rationale).toBeNull()  // No LLM rationale in fallback mode
  })

  test('returns 400 for missing required fields', async () => {
    const res = await POST('/api/ai/calculate-goals', { weight_kg: 80 })
    expect(res.status).toBe(400)
  })
})
```

#### `tests/integration/meals/meal-save.test.ts`
```typescript
describe('Meal immutability', () => {
  test('editing a meal creates a new revision, not an in-place update', async () => {
    const original = await createMeal(testUserId, { meal_type: 'lunch' })
    const revised = await editMeal(original.id, { meal_type: 'dinner' })

    expect(revised.id).not.toBe(original.id)
    expect(revised.revision_of).toBe(original.id)

    // Original is unchanged in DB
    const fetched = await getMeal(original.id)
    expect(fetched.meal_type).toBe('lunch')
  })

  test('original_ai_estimate preserved on meal_items after user correction', async () => {
    const meal = await createMealWithItems(testUserId, [{
      ingredient_name: 'chicken', calories: 300, original_ai_estimate: { calories: 300 }
    }])
    await correctMealItem(meal.items[0].id, { calories: 350 })

    const item = await getMealItem(meal.items[0].id)
    expect(item.calories).toBe(350)
    expect(item.original_ai_estimate.calories).toBe(300)
    expect(item.was_corrected).toBe(true)
  })

  test('daily snapshot updates when meal is saved', async () => {
    const date = '2026-03-30'
    await createMealWithItems(testUserId, [{ calories: 500, protein_g: 40, carbs_g: 30, fat_g: 10 }], date)
    const snapshot = await getDailySnapshot(testUserId, date)
    expect(snapshot.total_calories).toBe(500)
    expect(snapshot.total_protein_g).toBe(40)
  })

  test('snapshot accumulates across multiple meals in a day', async () => {
    const date = '2026-03-30'
    await createMealWithItems(testUserId, [{ calories: 500 }], date)
    await createMealWithItems(testUserId, [{ calories: 700 }], date)
    const snapshot = await getDailySnapshot(testUserId, date)
    expect(snapshot.total_calories).toBe(1200)
    expect(snapshot.meal_count).toBe(2)
  })
})
```

#### `tests/integration/meals/meal-similarity.test.ts`
```typescript
describe('Meal similarity search', () => {
  test('returns match when cosine similarity ≥ 0.85', async () => {
    await seedEmbedding(testUserId, 'grilled chicken with rice', CHICKEN_RICE_VECTOR)
    const results = await searchSimilarMeals(testUserId, 'chicken and rice grilled', 0.85)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].similarity).toBeGreaterThanOrEqual(0.85)
  })

  test('returns no match when similarity < 0.85', async () => {
    await seedEmbedding(testUserId, 'chocolate cake with cream', CHOCOLATE_CAKE_VECTOR)
    const results = await searchSimilarMeals(testUserId, 'grilled salmon salad', 0.85)
    expect(results.length).toBe(0)
  })

  test('returns top 3 results maximum', async () => {
    await seedFiveSimilarEmbeddings(testUserId)
    const results = await searchSimilarMeals(testUserId, 'chicken rice bowl', 0.85)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  test('does not return other users embeddings', async () => {
    await seedEmbedding(otherUserId, 'grilled chicken', CHICKEN_RICE_VECTOR)
    const results = await searchSimilarMeals(testUserId, 'grilled chicken', 0.85)
    expect(results.length).toBe(0)  // RLS enforced at query level too
  })
})
```

#### `tests/integration/rls/row-level-security.test.ts`
Requires a real Supabase test project (or `pg-mem` with RLS simulation).
```typescript
describe('Row-level security', () => {
  test('user cannot read another user meals', async () => {
    const meal = await createMealAs(userA, { meal_type: 'lunch' })
    const result = await queryAs(userB, 'SELECT * FROM meals WHERE id = $1', [meal.id])
    expect(result.rows).toHaveLength(0)
  })

  test('user cannot read another user goals', async () => {
    const goal = await createGoalAs(userA)
    const result = await queryAs(userB, 'SELECT * FROM goals WHERE id = $1', [goal.id])
    expect(result.rows).toHaveLength(0)
  })

  test('user cannot read another user daily_snapshots', async () => {
    await createSnapshotAs(userA, '2026-03-30')
    const result = await queryAs(userB, "SELECT * FROM daily_snapshots WHERE date = '2026-03-30'")
    expect(result.rows).toHaveLength(0)
  })

  test('user can read their own data', async () => {
    const meal = await createMealAs(userA, { meal_type: 'lunch' })
    const result = await queryAs(userA, 'SELECT * FROM meals WHERE id = $1', [meal.id])
    expect(result.rows).toHaveLength(1)
  })

  test('upsert on portion_priors respects UNIQUE(user_id, ingredient_name)', async () => {
    await upsertPriorAs(userA, 'chicken', { avg_quantity: 200, avg_unit: 'g', sample_count: 1 })
    await upsertPriorAs(userA, 'chicken', { avg_quantity: 220, avg_unit: 'g', sample_count: 2 })
    const rows = await queryAs(userA, "SELECT * FROM portion_priors WHERE ingredient_name = 'chicken'")
    expect(rows.rows).toHaveLength(1)
    expect(rows.rows[0].avg_quantity).toBe(220)
  })
})
```

### E2E Tests (Playwright)

#### `tests/e2e/onboarding.spec.ts`
```typescript
test('completes onboarding and lands on dashboard', async ({ page }) => {
  await page.goto('/signup')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'Test1234!')
  await page.click('button[type=submit]')

  // Step 1: Biometrics
  await page.fill('[name=height_cm]', '180')
  await page.fill('[name=weight_kg]', '80')
  await page.fill('[name=age]', '30')
  await page.click('button:has-text("Next")')

  // Step 2: Activity
  await page.click('[data-activity=moderate]')
  await page.click('button:has-text("Next")')

  // Step 3: Goal
  await page.click('[data-goal=muscle_gain]')
  await page.click('button:has-text("Next")')

  // Step 5: Review
  await expect(page.locator('[data-testid=goal-summary]')).toBeVisible()
  await page.click('button:has-text("Start tracking")')

  await expect(page).toHaveURL('/')
  await expect(page.locator('[data-testid=calorie-rings]')).toBeVisible()
})
```

#### `tests/e2e/meal-log.spec.ts`
```typescript
test('logs a meal via text and sees it on dashboard', async ({ page }) => {
  await loginAs(page, testUser)
  await page.goto('/meal/new')

  await page.fill('[data-testid=meal-description]', '200g grilled chicken, 1 cup brown rice')
  await page.click('button:has-text("Analyze")')

  // Verification Card should appear
  await expect(page.locator('[data-testid=verification-card]')).toBeVisible()
  await expect(page.locator('[data-testid=ingredient-row]')).toHaveCount(greaterThan(0))

  await page.click('button:has-text("Confirm & Save")')

  // Back on dashboard — meal appears in timeline
  await expect(page).toHaveURL('/')
  await expect(page.locator('[data-testid=meal-timeline]')).toContainText('grilled chicken')
})

test('shows correct error text when AI is unavailable', async ({ page }) => {
  await loginAs(page, testUser)
  mockAIUnavailable()
  await page.goto('/meal/new')
  await page.fill('[data-testid=meal-description]', 'chicken')
  await page.click('button:has-text("Analyze")')

  await expect(page.locator('[data-testid=error-banner]'))
    .toContainText('Nutrition estimation is temporarily unavailable')
})
```

### Evaluation Framework Tests

#### `tests/unit/ai/evaluation-scorer.test.ts`
Pure function — no mocks needed.
```typescript
describe('scoreResponse', () => {
  const userItems = [
    { name: 'grilled chicken breast', quantity: 200, unit: 'g',
      calories: 330, protein_g: 62, carbs_g: 0, fat_g: 7.2, confidence: 'high' },
    { name: 'brown rice', quantity: 195, unit: 'g',
      calories: 216, protein_g: 4.5, carbs_g: 45, fat_g: 1.8, confidence: 'high' },
  ]

  test('perfect match scores 100% item match rate and 0% error', () => {
    const score = scoreResponse(userItems, userItems)
    expect(score.item_match_rate).toBe(1)
    expect(score.calorie_error_pct).toBe(0)
    expect(score.protein_error_pct).toBe(0)
    expect(score.items_hallucinated).toBe(0)
    expect(score.items_missed).toBe(0)
  })

  test('calorie error calculated correctly', () => {
    const aiItems = [
      { ...userItems[0], calories: 400 },   // 21% over
      { ...userItems[1], calories: 200 },   // 7.4% under
    ]
    const score = scoreResponse(aiItems, userItems)
    // Total AI: 600, total user: 546 → abs error = 9.9%
    expect(score.calorie_error_pct).toBeCloseTo(9.9, 0)
  })

  test('missed item counted correctly', () => {
    const aiItems = [userItems[0]]  // missing rice
    const score = scoreResponse(aiItems, userItems)
    expect(score.items_missed).toBe(1)
    expect(score.item_match_rate).toBeCloseTo(0.5, 1)
  })

  test('hallucinated item counted correctly', () => {
    const aiItems = [
      ...userItems,
      { name: 'olive oil', quantity: 10, unit: 'g', calories: 88,
        protein_g: 0, carbs_g: 0, fat_g: 10, confidence: 'low' }
    ]
    const score = scoreResponse(aiItems, userItems)
    expect(score.items_hallucinated).toBe(1)
  })

  test('absPctError returns 0 when both values are 0', () => {
    expect(absPctError(0, 0)).toBe(0)
  })

  test('absPctError returns 100 when truth is 0 but estimate is not', () => {
    expect(absPctError(50, 0)).toBe(100)
  })

  test('high confidence correct rate calculated correctly', () => {
    // AI said high confidence on chicken (correct) and hallucinated item (wrong)
    const aiItems = [
      { ...userItems[0], confidence: 'high' },  // correct
      { name: 'mystery sauce', calories: 50, confidence: 'high',  // hallucinated
        protein_g: 1, carbs_g: 5, fat_g: 2 }
    ]
    const score = scoreResponse(aiItems, userItems)
    expect(score.high_confidence_correct_rate).toBeCloseTo(0.5, 1)
  })
})
```

#### `tests/integration/ai/shadow-runner.test.ts`
```typescript
describe('Shadow runner', () => {
  test('returns primary result immediately without waiting for shadows', async () => {
    const primary = mockProvider('groq', { latency: 100 })
    const slow = mockProvider('claude', { latency: 5000 })
    const start = Date.now()
    const result = await runWithShadow(testInput, primary, [slow])
    const elapsed = Date.now() - start
    expect(result.provider).toBe('groq')
    expect(elapsed).toBeLessThan(500)  // did not wait for claude
  })

  test('logs evaluation run and response rows to DB', async () => {
    const primary = mockProvider('groq')
    const shadow = mockProvider('claude')
    await runWithShadow(testInput, primary, [shadow])
    await flushAsyncJobs()

    const runs = await db.query('SELECT * FROM ai_evaluation_runs')
    expect(runs.rows).toHaveLength(1)
    const responses = await db.query('SELECT * FROM ai_evaluation_responses')
    expect(responses.rows).toHaveLength(2)  // groq + claude
    expect(responses.rows.map(r => r.provider)).toContain('claude')
  })

  test('logs error row when shadow provider fails', async () => {
    const primary = mockProvider('groq')
    const failing = mockProviderFailure('openai', 'rate_limited')
    await runWithShadow(testInput, primary, [failing])
    await flushAsyncJobs()

    const responses = await db.query(
      "SELECT * FROM ai_evaluation_responses WHERE provider = 'openai'"
    )
    expect(responses.rows[0].error).toBe('rate_limited')
    expect(responses.rows[0].parsed_items).toBeNull()
  })

  test('does not fire shadows when AI_SHADOW_PROVIDERS is empty', async () => {
    process.env.AI_SHADOW_PROVIDERS = ''
    const primary = mockProvider('groq')
    const shadow = jest.fn()
    await runWithShadow(testInput, primary, [])
    await flushAsyncJobs()
    expect(shadow).not.toHaveBeenCalled()
  })

  test('scores are written after Verification Card submit', async () => {
    const runId = await seedEvaluationRun(testInput)
    await seedEvaluationResponse(runId, 'groq', GROQ_PARSED_ITEMS)
    await seedEvaluationResponse(runId, 'claude', CLAUDE_PARSED_ITEMS)

    await scoreEvaluationRun(runId, USER_CONFIRMED_ITEMS)

    const scores = await db.query(
      'SELECT * FROM ai_evaluation_scores es JOIN ai_evaluation_responses er ON es.response_id = er.id'
    )
    expect(scores.rows).toHaveLength(2)
    expect(scores.rows.every(r => r.calorie_error_pct !== null)).toBe(true)
  })
})
```

#### `tests/integration/ai/golden-dataset.test.ts`
Runs against real providers — excluded from CI, run manually or on schedule.
```typescript
// @group evaluation
// Run with: jest --testPathPattern golden-dataset --testNamePattern "golden"

describe('Golden dataset evaluation', () => {
  const goldenMeals = require('../../fixtures/golden-meals.json')

  test.each(goldenMeals.slice(0, 5))('golden-%s scores within acceptable error', async (meal) => {
    // Runs real API calls — requires provider keys in env
    const providers = getConfiguredShadowProviders()
    for (const provider of providers) {
      const response = await provider.parseInput({
        text: meal.description,
        image: meal.image_path ? loadImage(meal.image_path) : undefined
      })
      const score = scoreResponse(response.items, meal.ground_truth.items)
      // Baseline acceptance threshold — tighten as providers improve
      expect(score.calorie_error_pct).toBeLessThan(30)
      expect(score.item_match_rate).toBeGreaterThan(0.5)
    }
  })
})

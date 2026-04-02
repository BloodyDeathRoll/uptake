export type PriorityNutrient = 'calories' | 'protein' | 'carbs' | 'fat'

export interface PrioritySignal {
  nutrient: PriorityNutrient
  pct: number           // actual % of target (e.g. 40 = 40%)
  direction: 'under' | 'over'
  label: string
}

// How much each macro matters for a given goal (0–1 scale).
// Protein gets 1.0 for any body-composition goal; calories lead for pure weight loss.
const GOAL_WEIGHTS: Record<string, Record<PriorityNutrient, number>> = {
  athlete_cut:   { calories: 0.8, protein: 1.0, carbs: 0.5, fat: 0.4 },
  muscle_gain:   { calories: 0.7, protein: 1.0, carbs: 0.5, fat: 0.4 },
  recomposition: { calories: 0.6, protein: 1.0, carbs: 0.5, fat: 0.4 },
  weight_loss:   { calories: 1.0, protein: 0.8, carbs: 0.6, fat: 0.5 },
  endurance:     { calories: 0.7, protein: 0.5, carbs: 1.0, fat: 0.3 },
  maintenance:   { calories: 0.8, protein: 0.7, carbs: 0.6, fat: 0.6 },
  recovery:      { calories: 0.6, protein: 1.0, carbs: 0.7, fat: 0.4 },
  heart_healthy: { calories: 0.7, protein: 0.6, carbs: 0.5, fat: 0.9 },
  longevity:     { calories: 0.6, protein: 0.7, carbs: 0.5, fat: 0.6 },
  diabetic:      { calories: 0.7, protein: 0.6, carbs: 1.0, fat: 0.5 },
}

const DEFAULT_WEIGHTS: Record<PriorityNutrient, number> = {
  calories: 0.8, protein: 0.7, carbs: 0.6, fat: 0.5,
}

const LABELS: Record<PriorityNutrient, string> = {
  calories: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat',
}

/** Returns all 4 macros sorted by their importance weight for a given goal, highest first. */
export function rankMacrosByGoal(goalType: string): PriorityNutrient[] {
  const weights = GOAL_WEIGHTS[goalType] ?? DEFAULT_WEIGHTS
  return (['calories', 'protein', 'carbs', 'fat'] as PriorityNutrient[])
    .slice()
    .sort((a, b) => weights[b] - weights[a])
}

export function computePriority(
  consumed: { calories: number; protein: number; carbs: number; fat: number },
  targets:  { calories: number; protein: number; carbs: number; fat: number },
  goalType: string,
): PrioritySignal {
  const weights = GOAL_WEIGHTS[goalType] ?? DEFAULT_WEIGHTS
  const nutrients: PriorityNutrient[] = ['calories', 'protein', 'carbs', 'fat']

  let bestScore = -Infinity
  let best: PrioritySignal = {
    nutrient: 'protein', pct: 0, direction: 'under', label: 'Protein',
  }

  for (const n of nutrients) {
    const t = targets[n]
    if (t <= 0) continue

    const pct = consumed[n] / t
    const deviation = Math.abs(1 - pct)
    const direction: 'under' | 'over' = pct < 1 ? 'under' : 'over'

    // Deficits are generally more actionable than surpluses
    // (you can eat more; you can't un-eat)
    const dirMult = direction === 'under' ? 1.2 : 0.8

    const score = deviation * weights[n] * dirMult

    if (score > bestScore) {
      bestScore = score
      best = { nutrient: n, pct: Math.round(pct * 100), direction, label: LABELS[n] }
    }
  }

  return best
}

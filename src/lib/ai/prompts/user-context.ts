// Helpers that build compact context strings from persisted user data.
// All functions are pure (no DB calls) — callers fetch the data, we format it.

export interface PortionPrior {
  ingredient_name: string
  avg_quantity: number
  avg_unit: string
  sample_count: number
}

/** Top portion priors for this user, sorted by frequency. */
export function buildPortionPriorsContext(priors: PortionPrior[]): string {
  if (!priors || priors.length === 0) return ''
  const lines = priors
    .sort((a, b) => b.sample_count - a.sample_count)
    .slice(0, 20)
    .map(p => `  ${p.ingredient_name}: ${Math.round(p.avg_quantity)}${p.avg_unit}`)
  return `\n\nThis user's confirmed typical portions (from past corrections — prefer these over generic defaults):\n${lines.join('\n')}`
}

export interface DailySnapshot {
  total_calories: number | null
  total_protein_g: number | null
  total_carbs_g: number | null
  total_fat_g: number | null
}

/** 7-day macro adherence trend. */
export function buildAdherenceTrend(
  snapshots: DailySnapshot[],
  targets: { calories: number; protein: number; carbs: number; fat: number },
): string {
  if (!snapshots || snapshots.length === 0) return ''

  const pct = (val: number | null, target: number) =>
    target > 0 && val != null ? Math.round((val / target) * 100) : null

  const series = {
    calories: snapshots.map(s => pct(s.total_calories, targets.calories)).filter((v): v is number => v !== null),
    protein:  snapshots.map(s => pct(s.total_protein_g,  targets.protein)).filter((v): v is number => v !== null),
    carbs:    snapshots.map(s => pct(s.total_carbs_g,    targets.carbs)).filter((v): v is number => v !== null),
    fat:      snapshots.map(s => pct(s.total_fat_g,      targets.fat)).filter((v): v is number => v !== null),
  }

  const a = {
    calories: meanInt(series.calories),
    protein:  meanInt(series.protein),
    carbs:    meanInt(series.carbs),
    fat:      meanInt(series.fat),
  }

  if (Object.values(a).every(v => v === null)) return ''

  const n = snapshots.length
  const lines: string[] = [
    `Past ${n}-day average (% of daily target):`,
    `  Calories ${a.calories ?? '?'}%  ·  Protein ${a.protein ?? '?'}%  ·  Carbs ${a.carbs ?? '?'}%  ·  Fat ${a.fat ?? '?'}%`,
  ]

  const under = (['protein', 'calories', 'carbs'] as const).filter(k => (a[k] ?? 100) < 80).map(k => `${k} (${a[k]}%)`)
  const over  = (['calories', 'fat'] as const).filter(k => (a[k] ?? 0) > 115).map(k => `${k} (${a[k]}%)`)
  if (under.length) lines.push(`  Consistently under: ${under.join(', ')}`)
  if (over.length)  lines.push(`  Consistently over: ${over.join(', ')}`)

  return `\n\n${lines.join('\n')}`
}

function meanInt(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

export interface RecentMealForTiming {
  meal_type: string
  logged_at: string
}

/** Average meal time per type, only shown when ≥ 2 data points. */
export function buildMealTimingContext(meals: RecentMealForTiming[]): string {
  if (!meals || meals.length === 0) return ''

  const byType: Record<string, number[]> = {}
  for (const m of meals) {
    const hour = new Date(m.logged_at).getHours()
    if (!byType[m.meal_type]) byType[m.meal_type] = []
    byType[m.meal_type].push(hour)
  }

  const lines = Object.entries(byType)
    .filter(([, hours]) => hours.length >= 2)
    .map(([type, hours]) => {
      const avg = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length)
      return `  ${type}: ~${hourLabel(avg)}`
    })

  if (lines.length === 0) return ''
  return `\n\nThis user's typical meal times:\n${lines.join('\n')}`
}

function hourLabel(h: number): string {
  const period = h >= 12 ? 'pm' : 'am'
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${display}${period}`
}

export interface FoodGroupItem {
  food_group: string | null
}

/** Recent food group distribution (top 5). */
export function buildFoodGroupContext(items: FoodGroupItem[]): string {
  const counts: Record<string, number> = {}
  for (const item of items) {
    if (!item.food_group) continue
    counts[item.food_group] = (counts[item.food_group] ?? 0) + 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return ''

  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([g, n]) => `${g} ${Math.round((n / total) * 100)}%`)
    .join(', ')

  return `\n\nRecent food group mix: ${sorted}`
}

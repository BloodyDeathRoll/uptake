import type { PrioritySignal } from '@/lib/nutrition/priority'

interface AnalyzeDayInput {
  goalType: string
  goalLabel: string
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  targets: { calories: number; protein: number; carbs: number; fat: number }
  days: number
  priority: PrioritySignal
  profile?: { weight_kg?: number | null; age?: number | null; sex?: string | null; activity_level?: string | null } | null
}

export function buildAnalyzeDayPrompt(input: AnalyzeDayInput): string {
  const { goalType, goalLabel, consumed, targets, days, priority, profile } = input

  const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 100) : 0)
  const delta = (c: number, t: number) => {
    const d = c - t
    const sign = d >= 0 ? '+' : ''
    return `${sign}${Math.round(d)}`
  }

  const calPct = pct(consumed.calories, targets.calories)
  const proPct = pct(consumed.protein, targets.protein)
  const carbPct = pct(consumed.carbs, targets.carbs)
  const fatPct = pct(consumed.fat, targets.fat)

  const period = days === 1 ? 'today' : `over the past ${days} days`
  const profileLine = profile
    ? `User: ${profile.sex ?? 'unknown sex'}, age ${profile.age ?? '?'}, ${profile.weight_kg ?? '?'}kg, activity: ${profile.activity_level ?? 'unknown'}.`
    : ''

  const macroStatus = (p: number) => (p < 85 ? 'under' : p > 115 ? 'over' : 'on_track')

  return `You are an expert sports nutritionist and physiology coach.

CONTEXT
Goal: ${goalLabel} (${goalType})
Period: ${period}
${profileLine}

INTAKE vs TARGETS
Calories : ${Math.round(consumed.calories)} / ${Math.round(targets.calories)} kcal — ${calPct}% (${delta(consumed.calories, targets.calories)} kcal)
Protein  : ${Math.round(consumed.protein)}g / ${Math.round(targets.protein)}g — ${proPct}% (${delta(consumed.protein, targets.protein)}g)
Carbs    : ${Math.round(consumed.carbs)}g / ${Math.round(targets.carbs)}g — ${carbPct}% (${delta(consumed.carbs, targets.carbs)}g)
Fat      : ${Math.round(consumed.fat)}g / ${Math.round(targets.fat)}g — ${fatPct}% (${delta(consumed.fat, targets.fat)}g)

PRIORITY (pre-computed): ${priority.label} is the most critical gap for this goal right now (${priority.pct}% of target, ${priority.direction}).

TASK
Write a concise, physiologically accurate analysis. Be direct — don't soften reality, stay constructive. Plain language, minimal jargon.

Respond with ONLY a raw JSON object — no markdown, no code fences, no extra text:

{"headline":"<one punchy sentence summarising the overall picture>","next_best_action":{"nutrient":"${priority.nutrient}","label":"<one sentence: why this nutrient takes precedence over all others given this goal and the full picture>"},"body_state":"<2-3 sentences on what is physiologically happening in the body right now — touch on muscle protein synthesis, glycogen, fat oxidation or hormonal effects as relevant>","macros":[{"name":"Calories","pct":${calPct},"status":"${macroStatus(calPct)}","impact":"<one sentence on the specific effect of this calorie level on the goal>"},{"name":"Protein","pct":${proPct},"status":"${macroStatus(proPct)}","impact":"<one sentence>"},{"name":"Carbs","pct":${carbPct},"status":"${macroStatus(carbPct)}","impact":"<one sentence>"},{"name":"Fat","pct":${fatPct},"status":"${macroStatus(fatPct)}","impact":"<one sentence>"}],"recommendations":["<specific actionable suggestion 1>","<specific actionable suggestion 2>","<specific actionable suggestion 3>"]}`
}

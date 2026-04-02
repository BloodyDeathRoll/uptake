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

  return `You are an expert sports nutritionist and physiology coach. Analyze a user's nutrition data and explain what is happening in their body right now.

Goal: "${goalLabel}" (${goalType})
Period: ${period}
${profileLine}

Intake vs targets:
- Calories: ${consumed.calories} / ${targets.calories} kcal (${calPct}%, ${delta(consumed.calories, targets.calories)} kcal)
- Protein:  ${consumed.protein}g / ${targets.protein}g (${proPct}%, ${delta(consumed.protein, targets.protein)}g)
- Carbs:    ${consumed.carbs}g / ${targets.carbs}g (${carbPct}%, ${delta(consumed.carbs, targets.carbs)}g)
- Fat:      ${consumed.fat}g / ${targets.fat}g (${fatPct}%, ${delta(consumed.fat, targets.fat)}g)

Priority signal (pre-computed): The single most impactful nutritional issue right now for this goal is **${priority.label}** — currently at ${priority.pct}% of target (${priority.direction}). Use this to ground the next_best_action.

Write a concise, honest, physiologically accurate analysis. Be direct and specific — don't soften reality, but stay constructive. Use plain language, avoid jargon where possible.

Return ONLY valid JSON (no markdown, no explanation):
{
  "headline": "One punchy sentence summarizing the overall picture, e.g. 'Serious protein gap is undermining your Athlete Cut'",
  "next_best_action": {
    "nutrient": "${priority.nutrient}",
    "label": "One sentence explaining WHY this nutrient takes precedence over others right now, given the goal and the full picture — e.g. 'Despite being over on carbs, your protein deficit is far more damaging for Athlete Cut — muscle catabolism can't be undone by cutting carbs later.'"
  },
  "body_state": "2–3 sentences describing what is actually happening in the body given this intake pattern and goal. Be specific about muscle protein synthesis, glycogen, fat oxidation, hormonal effects, etc. as relevant.",
  "macros": [
    {
      "name": "Calories",
      "pct": ${calPct},
      "status": "${calPct < 85 ? 'under' : calPct > 115 ? 'over' : 'on_track'}",
      "impact": "One sentence on the specific effect of this deficit/surplus/balance on the goal."
    },
    {
      "name": "Protein",
      "pct": ${proPct},
      "status": "${proPct < 85 ? 'under' : proPct > 115 ? 'over' : 'on_track'}",
      "impact": "One sentence on the specific effect."
    },
    {
      "name": "Carbs",
      "pct": ${carbPct},
      "status": "${carbPct < 85 ? 'under' : carbPct > 115 ? 'over' : 'on_track'}",
      "impact": "One sentence on the specific effect."
    },
    {
      "name": "Fat",
      "pct": ${fatPct},
      "status": "${fatPct < 85 ? 'under' : fatPct > 115 ? 'over' : 'on_track'}",
      "impact": "One sentence on the specific effect."
    }
  ],
  "recommendations": [
    "Specific, actionable suggestion 1",
    "Specific, actionable suggestion 2",
    "Specific, actionable suggestion 3"
  ]
}`
}

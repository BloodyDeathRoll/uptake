import type { PrioritySignal } from '@/lib/nutrition/priority'

interface AnalyzeDayInput {
  goalType: string
  goalLabel: string
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  targets: { calories: number; protein: number; carbs: number; fat: number }
  days: number
  priority: PrioritySignal
  hourOfDay: number
  adherenceTrend?: string
  foodGroupContext?: string
  profile?: { weight_kg?: number | null; age?: number | null; sex?: string | null; activity_level?: string | null } | null
}

export function buildAnalyzeDayPrompt(input: AnalyzeDayInput): string {
  const { goalType, goalLabel, consumed, targets, days, priority, hourOfDay, adherenceTrend, foodGroupContext, profile } = input

  const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 100) : 0)
  const remaining = (c: number, t: number) => Math.max(t - c, 0)

  const calPct  = pct(consumed.calories, targets.calories)
  const proPct  = pct(consumed.protein,  targets.protein)
  const carbPct = pct(consumed.carbs,    targets.carbs)
  const fatPct  = pct(consumed.fat,      targets.fat)

  const macroStatus = (p: number) => (p < 85 ? 'under' : p > 115 ? 'over' : 'on_track')

  const profileLine = profile
    ? `User: ${profile.sex ?? 'unknown sex'}, age ${profile.age ?? '?'}, ${profile.weight_kg ?? '?'}kg, activity: ${profile.activity_level ?? 'unknown'}.`
    : ''

  const WAKE_HOUR  = 6
  const SLEEP_HOUR = 23
  const dayLengthH = SLEEP_HOUR - WAKE_HOUR
  const elapsedH   = Math.max(0, Math.min(hourOfDay - WAKE_HOUR, dayLengthH))
  const dayPct     = Math.round((elapsedH / dayLengthH) * 100)
  const remainingH = Math.max(0, SLEEP_HOUR - hourOfDay)

  const timeLabel =
    hourOfDay < 10 ? 'morning'
    : hourOfDay < 13 ? 'late morning'
    : hourOfDay < 16 ? 'afternoon'
    : hourOfDay < 20 ? 'evening'
    : 'night'

  const calPace = calPct - dayPct
  const paceDesc =
    Math.abs(calPace) < 10 ? 'on pace'
    : calPace > 0 ? `${Math.abs(calPace)}pp ahead of pace`
    : `${Math.abs(calPace)}pp behind pace`

  const isMultiDay = days > 1
  const periodLine = isMultiDay
    ? `Period: past ${days} days (multi-day view — treat totals as the full picture, no time-of-day pacing).`
    : `Time: ${hourOfDay}:00 (${timeLabel}) — ${dayPct}% through the waking day, ~${remainingH}h remaining. Calorie pace: ${paceDesc}.`

  const remainingBlock = isMultiDay ? '' : `
REMAINING BUDGET:
Calories : ~${Math.round(remaining(consumed.calories, targets.calories))} kcal
Protein  : ~${Math.round(remaining(consumed.protein,  targets.protein))}g
Carbs    : ~${Math.round(remaining(consumed.carbs,    targets.carbs))}g
Fat      : ~${Math.round(remaining(consumed.fat,      targets.fat))}g`

  const taskLine = isMultiDay
    ? `Write a concise analysis of this ${days}-day period. Be direct and constructive.`
    : `Act as a forward-looking nutrition coach. The user still has ~${remainingH}h left today — focus on what to do next, not what was already eaten.`

  // Pre-fill the numeric/enum fields so the model only needs to write text
  const macroSchema = [
    { name: 'Calories', pct: calPct,  status: macroStatus(calPct) },
    { name: 'Protein',  pct: proPct,  status: macroStatus(proPct) },
    { name: 'Carbs',    pct: carbPct, status: macroStatus(carbPct) },
    { name: 'Fat',      pct: fatPct,  status: macroStatus(fatPct) },
  ]

  return `You are an expert sports nutritionist and physiology coach. Respond with a single JSON object — no extra text, no markdown.

GOAL: ${goalLabel} (${goalType})
${profileLine}
${periodLine}${adherenceTrend ?? ''}${foodGroupContext ?? ''}

INTAKE vs TARGETS:
Calories : ${Math.round(consumed.calories)} / ${Math.round(targets.calories)} kcal (${calPct}%)
Protein  : ${Math.round(consumed.protein)}g / ${Math.round(targets.protein)}g (${proPct}%)
Carbs    : ${Math.round(consumed.carbs)}g / ${Math.round(targets.carbs)}g (${carbPct}%)
Fat      : ${Math.round(consumed.fat)}g / ${Math.round(targets.fat)}g (${fatPct}%)
${remainingBlock}
PRIORITY: ${priority.label} is the most critical gap right now (${priority.pct}% of target, ${priority.direction}).

${taskLine}

Output a JSON object with exactly these fields. Write only the string values — the numbers and status values are already set:

{
  "headline": <one sentence: current progress + what is still ahead, time-aware, NOT a description of past intake>,
  "next_best_action": {
    "nutrient": "${priority.nutrient}",
    "label": <one sentence: the single highest-leverage action right now and why it matters for this goal>
  },
  "body_state": <2-3 sentences: what is physiologically happening right now — protein synthesis, glycogen, fat oxidation, hormonal state — relevant to the goal>,
  "macros": [
    { "name": "${macroSchema[0].name}", "pct": ${macroSchema[0].pct}, "status": "${macroSchema[0].status}", "impact": <one forward-looking sentence: effect on the goal if the day ends at this level, or what to do> },
    { "name": "${macroSchema[1].name}", "pct": ${macroSchema[1].pct}, "status": "${macroSchema[1].status}", "impact": <one sentence> },
    { "name": "${macroSchema[2].name}", "pct": ${macroSchema[2].pct}, "status": "${macroSchema[2].status}", "impact": <one sentence> },
    { "name": "${macroSchema[3].name}", "pct": ${macroSchema[3].pct}, "status": "${macroSchema[3].status}", "impact": <one sentence> }
  ],
  "recommendations": [
    <specific next step 1: what to eat or do in the next meal, with quantities if relevant>,
    <specific next step 2>,
    <specific next step 3>
  ]
}`
}

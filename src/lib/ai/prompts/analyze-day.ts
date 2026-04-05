import type { PrioritySignal } from '@/lib/nutrition/priority'

interface AnalyzeDayInput {
  goalType: string
  goalLabel: string
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  targets: { calories: number; protein: number; carbs: number; fat: number }
  days: number
  priority: PrioritySignal
  hourOfDay: number
  profile?: { weight_kg?: number | null; age?: number | null; sex?: string | null; activity_level?: string | null } | null
}

export function buildAnalyzeDayPrompt(input: AnalyzeDayInput): string {
  const { goalType, goalLabel, consumed, targets, days, priority, hourOfDay, profile } = input

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

  // Time-of-day framing
  // Assume waking day spans 6am–11pm (17 hours). Cap at that range for pace calc.
  const WAKE_HOUR  = 6
  const SLEEP_HOUR = 23
  const dayLengthH = SLEEP_HOUR - WAKE_HOUR
  const elapsedH   = Math.max(0, Math.min(hourOfDay - WAKE_HOUR, dayLengthH))
  const dayPct     = Math.round((elapsedH / dayLengthH) * 100) // % of waking day elapsed
  const remainingH = Math.max(0, SLEEP_HOUR - hourOfDay)

  const timeLabel =
    hourOfDay < 10 ? 'morning'
    : hourOfDay < 13 ? 'late morning'
    : hourOfDay < 16 ? 'afternoon'
    : hourOfDay < 20 ? 'evening'
    : 'night'

  const expectedCalPct = dayPct // rough pacing: spread evenly through day
  const calPace = calPct - expectedCalPct // positive = ahead, negative = behind

  const paceDesc =
    Math.abs(calPace) < 10 ? 'on pace'
    : calPace > 0 ? `${Math.abs(calPace)} percentage points ahead of pace`
    : `${Math.abs(calPace)} percentage points behind pace`

  const isMultiDay = days > 1
  const periodLine = isMultiDay
    ? `Period: past ${days} days (multi-day view — treat totals as the full picture, no time-of-day pacing).`
    : `Time: ${hourOfDay}:00 (${timeLabel}) — ${dayPct}% through the waking day, ~${remainingH}h remaining. Calorie pace: ${paceDesc}.`

  const remainingBlock = isMultiDay ? '' : `
REMAINING BUDGET (what's still available today):
Calories : ~${Math.round(remaining(consumed.calories, targets.calories))} kcal
Protein  : ~${Math.round(remaining(consumed.protein,  targets.protein))}g
Carbs    : ~${Math.round(remaining(consumed.carbs,    targets.carbs))}g
Fat      : ~${Math.round(remaining(consumed.fat,      targets.fat))}g`

  const taskLine = isMultiDay
    ? `Write a concise analysis of this ${days}-day period. Be direct and constructive.`
    : `You are a forward-looking nutrition coach, NOT a judge at the end of the day. The user still has ~${remainingH} hours left — your job is to identify the single most impactful next step and frame the whole analysis as actionable guidance for the remainder of today. Do not just describe what was eaten. Focus on what to do next.`

  return `You are an expert sports nutritionist and physiology coach.

GOAL: ${goalLabel} (${goalType})
${profileLine}
${periodLine}

INTAKE SO FAR vs DAILY TARGETS:
Calories : ${Math.round(consumed.calories)} / ${Math.round(targets.calories)} kcal — ${calPct}%
Protein  : ${Math.round(consumed.protein)}g / ${Math.round(targets.protein)}g — ${proPct}%
Carbs    : ${Math.round(consumed.carbs)}g / ${Math.round(targets.carbs)}g — ${carbPct}%
Fat      : ${Math.round(consumed.fat)}g / ${Math.round(targets.fat)}g — ${fatPct}%
${remainingBlock}
PRIORITY (pre-computed): ${priority.label} is the most critical gap for this goal right now (${priority.pct}% of target, ${priority.direction}).

${taskLine}

Rules:
- Headline must reflect the current moment ("You're on track heading into the afternoon" not "You consumed X").
- body_state: 2–3 sentences on what is physiologically happening right now — muscle protein synthesis, glycogen, fat oxidation or hormonal state as relevant to the goal.
- recommendations: 3 specific, forward-looking actions for the remainder of the day — e.g. what to eat next, timing, quantities. Not generic advice.
- next_best_action: the single highest-leverage move the user can make right now given their goal, progress, and time of day.

Respond with ONLY a raw JSON object — no markdown, no code fences, no extra text:

{"headline":"<one sentence reflecting current progress and what's still ahead>","next_best_action":{"nutrient":"${priority.nutrient}","label":"<one sentence: the single most impactful thing to do right now and why it matters for this goal>"},"body_state":"<2-3 sentences on current physiological state>","macros":[{"name":"Calories","pct":${calPct},"status":"${macroStatus(calPct)}","impact":"<one forward-looking sentence — effect of this level on the goal if the day ends here, or what to do about it>"},{"name":"Protein","pct":${proPct},"status":"${macroStatus(proPct)}","impact":"<one sentence>"},{"name":"Carbs","pct":${carbPct},"status":"${macroStatus(carbPct)}","impact":"<one sentence>"},{"name":"Fat","pct":${fatPct},"status":"${macroStatus(fatPct)}","impact":"<one sentence>"}],"recommendations":["<specific next step 1 — what to eat or do in the next meal/hours>","<specific next step 2>","<specific next step 3>"]}`
}

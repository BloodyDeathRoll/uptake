import type { PrioritySignal } from '@/lib/nutrition/priority'

interface RecentFood {
  name: string
  cal: number
  pro: number
  carb: number
  fat: number
}

export interface QualityMetrics {
  fiber_g: number
  sugar_g: number
  saturated_fat_g: number
  sodium_mg: number
}

interface AnalyzeDayInput {
  goalType: string
  goalLabel: string
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  targets: { calories: number; protein: number; carbs: number; fat: number }
  days: number
  priority: PrioritySignal
  hourOfDay: number
  isCurrentPeriod: boolean
  quality?: QualityMetrics
  adherenceTrend?: string
  foodGroupContext?: string
  recentFoods?: RecentFood[]
  dietaryBlock?: string
  profile?: { weight_kg?: number | null; age?: number | null; sex?: string | null; activity_level?: string | null } | null
  lang?: string
}

export function buildAnalyzeDayPrompt(input: AnalyzeDayInput): string {
  const { goalType, goalLabel, consumed, targets, days, priority, hourOfDay, isCurrentPeriod, quality, adherenceTrend, foodGroupContext, recentFoods, dietaryBlock, profile, lang } = input

  const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 100) : 0)
  const remaining = (c: number, t: number) => Math.max(t - c, 0)

  const calPct  = pct(consumed.calories, targets.calories)
  const proPct  = pct(consumed.protein,  targets.protein)
  const carbPct = pct(consumed.carbs,    targets.carbs)
  const fatPct  = pct(consumed.fat,      targets.fat)

  const macroStatus = (p: number) => (p < 85 ? 'under' : p > 115 ? 'over' : 'on_track')

  const profileLine = profile
    ? `About you: ${profile.sex ?? 'unknown sex'}, age ${profile.age ?? '?'}, ${profile.weight_kg ?? '?'}kg, activity: ${profile.activity_level ?? 'unknown'}.`
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
  const periodLine = !isCurrentPeriod
    ? `Period: past ${days > 1 ? `${days} days` : 'day'} (historical view — this period has already ended, do NOT make forward-looking recommendations).`
    : isMultiDay
      ? `Period: past ${days} days (multi-day view — treat totals as the full picture, no time-of-day pacing).`
      : `Time: ${hourOfDay}:00 (${timeLabel}) — ${dayPct}% through the waking day, ~${remainingH}h remaining. Calorie pace: ${paceDesc}.`

  const remainingBlock = (!isCurrentPeriod || isMultiDay) ? '' : `
REMAINING BUDGET:
Calories : ~${Math.round(remaining(consumed.calories, targets.calories))} kcal
Protein  : ~${Math.round(remaining(consumed.protein,  targets.protein))}g
Carbs    : ~${Math.round(remaining(consumed.carbs,    targets.carbs))}g
Fat      : ~${Math.round(remaining(consumed.fat,      targets.fat))}g`

  const recentFoodsBlock = recentFoods && recentFoods.length > 0
    ? `\nFOODS YOU'VE EATEN RECENTLY (use these for specific suggestions where relevant):\n${recentFoods.map(f => `- ${f.name} (${f.cal} kcal, ${f.pro}g protein, ${f.carb}g carbs, ${f.fat}g fat)`).join('\n')}`
    : ''

  const qualityBlock = quality
    ? `\nNUTRITION QUALITY (today so far):
Fiber          : ${Math.round(quality.fiber_g)}g (goal ~${25 * days}–${38 * days}g)
Sugar          : ${Math.round(quality.sugar_g)}g (limit ~${50 * days}g)
Saturated fat  : ${Math.round(quality.saturated_fat_g)}g (limit ~${20 * days}g)
Sodium         : ${Math.round(quality.sodium_mg)}mg (limit ~${2300 * days}mg)`
    : ''

  const taskLine = !isCurrentPeriod
    ? `Write a concise retrospective analysis of this completed period. Review what happened, draw conclusions, and identify patterns — but do NOT give any forward-looking recommendations or suggest what to eat next. Always address the person directly as "you".`
    : isMultiDay
      ? `Write a concise analysis of this ${days}-day period. Be direct and constructive. Always address the person directly as "you".`
      : `You are a forward-looking, personal nutrition coach talking directly to this person. They have ~${remainingH}h left today. Focus entirely on what to do next — not what was already eaten. Address them as "you" throughout.`

  // Pre-fill the numeric/enum fields so the model only needs to write text
  const isHe = lang === 'he'
  const macroNames = isHe
    ? ['קלוריות', 'חלבון', 'פחמימות', 'שומן']
    : ['Calories', 'Protein', 'Carbs', 'Fat']
  const macroSchema = [
    { name: macroNames[0], pct: calPct,  status: macroStatus(calPct) },
    { name: macroNames[1], pct: proPct,  status: macroStatus(proPct) },
    { name: macroNames[2], pct: carbPct, status: macroStatus(carbPct) },
    { name: macroNames[3], pct: fatPct,  status: macroStatus(fatPct) },
  ]
  const priorityNutrientLabel = isHe
    ? ({ calories: 'קלוריות', protein: 'חלבון', carbs: 'פחמימות', fat: 'שומן' }[priority.nutrient] ?? priority.label)
    : priority.label

  const langInstruction = isHe
    ? 'CRITICAL INSTRUCTION: You MUST write ALL text fields in Hebrew (עברית). Every sentence, every word in headline, body_state, impact, label, note, recommendations, and next_best_action.label must be in Hebrew. Do not use English in any text field.\n\n'
    : ''

  return `${langInstruction}You are a personal nutrition coach speaking directly to your client. Always use "you/your" — never "the user" or third person. Respond with a single JSON object, no extra text, no markdown.
${dietaryBlock ?? ''}
GOAL: ${goalLabel} (${goalType})
${profileLine}
${periodLine}${adherenceTrend ?? ''}${foodGroupContext ?? ''}${recentFoodsBlock}

YOUR INTAKE vs DAILY TARGETS:
Calories : ${Math.round(consumed.calories)} / ${Math.round(targets.calories)} kcal (${calPct}%)
Protein  : ${Math.round(consumed.protein)}g / ${Math.round(targets.protein)}g (${proPct}%)
Carbs    : ${Math.round(consumed.carbs)}g / ${Math.round(targets.carbs)}g (${carbPct}%)
Fat      : ${Math.round(consumed.fat)}g / ${Math.round(targets.fat)}g (${fatPct}%)
${remainingBlock}${qualityBlock}
PRIORITY: ${priorityNutrientLabel} is the most critical gap right now (${priority.pct}% of target, ${priority.direction}).

${taskLine}

Tone and content rules — follow strictly:
- Always say "you've", "your", "you need" — never "the user", never third person.
- headline: ${isCurrentPeriod ? 'address the current moment directly ("You\'re 45% through your calories with 8 hours left" not a vague summary).' : 'summarise what happened during this period in one direct sentence.'}
- body_state: ${isCurrentPeriod ? 'explain what is happening in their body right now relevant to their goal. Personal and direct.' : 'explain what likely happened in their body during this period based on the data. Retrospective and direct.'}
- macros: one sentence per macro — ${isCurrentPeriod ? 'forward-looking: effect on your goal if the day ends here, or what to do.' : 'retrospective: what the number tells us about the period.'}
- quality_signals: assess only nutrients where data is available (fiber, sugar, saturated_fat, sodium). For each: "good" = within healthy range, "watch" = approaching limit or goal, "concern" = over limit or significantly under goal. "priority" must be one of: "immediate", "important", "good_to_have". Omit if no quality data provided.${isCurrentPeriod ? `
- recommendations: each must name a specific food or meal (ideally from the recent foods list above if suitable), with an approximate quantity. Format like a friend texting advice, not a bullet point template.
- next_best_action: one concrete, specific thing to eat or do right now — name the food.` : `
- recommendations: return an empty array []. Do NOT suggest foods or actions — this is a past period.
- next_best_action: set label to "" (empty string). Do NOT suggest anything forward-looking.`}

Output a JSON object with exactly these fields (numbers and status values are pre-filled — only write the string values):

{
  "headline": <one direct sentence>,
  "next_best_action": {
    "nutrient": "${priorityNutrientLabel}",
    "label": ${isCurrentPeriod ? '<one concrete sentence: exactly what to eat or do right now, naming a specific food if possible>' : '""'}
  },
  "body_state": <2-3 sentences>,
  "macros": [
    { "name": "${macroSchema[0].name}", "pct": ${macroSchema[0].pct}, "status": "${macroSchema[0].status}", "impact": <one sentence> },
    { "name": "${macroSchema[1].name}", "pct": ${macroSchema[1].pct}, "status": "${macroSchema[1].status}", "impact": <one sentence> },
    { "name": "${macroSchema[2].name}", "pct": ${macroSchema[2].pct}, "status": "${macroSchema[2].status}", "impact": <one sentence> },
    { "name": "${macroSchema[3].name}", "pct": ${macroSchema[3].pct}, "status": "${macroSchema[3].status}", "impact": <one sentence> }
  ],
  "recommendations": ${isCurrentPeriod ? `[
    <specific food suggestion with quantity>,
    <specific next step 2>,
    <specific next step 3>
  ]` : '[]'},
  "quality_signals": [
    { "label": <nutrient name>, "status": <"good"|"watch"|"concern">, "note": <one sentence using "you">, "priority": <"immediate"|"important"|"good_to_have"> }
  ]
}`
}

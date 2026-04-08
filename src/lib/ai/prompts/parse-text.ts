export function buildParseTextPrompt(description: string, mealHistory?: string, lang?: string): string {
  const historyBlock = mealHistory ?? ''
  const langLine = lang === 'he' ? 'IMPORTANT: Return all ingredient "name" values in Hebrew (עברית).\n\n' : ''

  return `${langLine}You are a nutrition expert.${historyBlock}

Parse the following meal description into a structured list of ingredients with quantities.

Meal description: "${description}"

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "items": [
    {
      "name": "ingredient name (normalized, lowercase)",
      "quantity": <number>,
      "unit": "g | ml | oz | cup | piece | tbsp | tsp | slice | serving",
      "calories": <number>,
      "protein_g": <number>,
      "carbs_g": <number>,
      "fat_g": <number>,
      "fiber_g": <number>,
      "sugar_g": <number>,
      "food_group": "protein | grain | vegetable | fruit | dairy | fat | beverage | other",
      "confidence": "high | medium | low"
    }
  ],
  "total_calories": <number>,
  "notes": "optional notes about estimates or assumptions"
}

Rules:
- ALWAYS return a best-effort estimate — never return empty items for a recognizable food description
- If quantities are not specified, use typical serving sizes (e.g. "acai bowl" → 300g bowl with 50g granola and 100g mixed fruit)
- If the description is vague or general (e.g. "acai bowl with granola"), fill in typical ingredients and quantities and set confidence "low"
- If meal history is provided, use it to calibrate typical sizes for this user
- Use standard nutritional data for all macros
- Set confidence "low" for items where portion is ambiguous or inferred
- Set confidence "high" only when quantity is explicitly stated
- Normalize ingredient names (e.g., "chicken breast" not "Chicken Breast")
- Only return {"items": [], "total_calories": 0} if the input contains no food whatsoever (e.g. purely non-food text)`
}

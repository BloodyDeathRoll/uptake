export function buildParseTextPrompt(description: string, mealHistory?: string): string {
  const historyBlock = mealHistory ?? ''

  return `You are a nutrition expert.${historyBlock}

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
- Estimate realistic portion sizes if not specified; if meal history is provided, use it to calibrate typical sizes for this user
- Use standard nutritional data for all macros
- Set confidence "low" for items where portion is ambiguous
- Set confidence "high" only when quantity is explicitly stated
- Normalize ingredient names (e.g., "chicken breast" not "Chicken Breast")
- If no food is detected, return {"items": [], "total_calories": 0}`
}

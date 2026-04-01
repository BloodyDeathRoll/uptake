export function buildParseImagePrompt(additionalText?: string, mealHistory?: string): string {
  const historyBlock = mealHistory ?? ''
  const textContext = additionalText
    ? `\n\nUser's description of this meal: "${additionalText}"`
    : ''

  return `You are a nutrition expert analyzing a food photo.${historyBlock}

Identify all food items visible in the image, estimate portions using visual cues (plate size, typical serving sizes), and return structured nutritional data.${textContext}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "suggested_description": "A concise natural-language label for this meal, e.g. 'Grilled chicken with brown rice and mixed salad'",
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
  "notes": "describe what you see and any assumptions about portions"
}

Rules:
- Set confidence "low" for items that are partially visible or ambiguous
- Set confidence "high" only when item and portion are clearly identifiable
- If meal history is provided, use it to calibrate typical portion sizes for this user
- If no food is visible, return {"suggested_description": "", "items": [], "total_calories": 0, "notes": "No food detected"}`
}

export function buildParseImagePrompt(additionalText?: string, mealHistory?: string, lang?: string): string {
  const historyBlock = mealHistory ?? ''
  const textContext = additionalText
    ? `\n\nUser's description: "${additionalText}"`
    : ''
  const langLine = lang === 'he' ? 'IMPORTANT: Return all ingredient "name" values in Hebrew (עברית).\n\n' : ''

  return `${langLine}You are a nutrition expert. Analyze the provided image — it may be either a photo of a prepared meal OR an ingredient list (such as a nutrition label, package ingredients panel, grocery list, handwritten ingredients list, or recipe ingredient list).

First, determine which type of image this is:
- "meal": a photo of prepared or plated food
- "ingredient_list": a nutrition label, ingredients panel, grocery list, handwritten list, or any enumeration of ingredients without a plated meal${historyBlock}${textContext}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "image_type": "meal | ingredient_list",
  "suggested_description": "A concise natural-language label, e.g. 'Grilled chicken with brown rice and mixed salad'",
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
  "notes": "describe what you see and any assumptions"
}

Rules for "meal" images:
- Identify all visible food items
- Estimate portions using visual cues (plate size, typical serving sizes)
- Set confidence "high" only when item and portion are clearly identifiable
- Set confidence "low" for items that are partially visible or ambiguous
- If meal history is provided, use it to calibrate typical portion sizes for this user

Rules for "ingredient_list" images:
- Extract every ingredient listed in the image
- Set quantity to 100 and unit to "g" for every item (the user will adjust to actual amounts eaten)
- Provide nutritional values per 100g — read from the label if shown, otherwise use standard nutritional data
- Set confidence based on how legibly each ingredient can be read
- Do NOT guess how much of each ingredient the user intends to consume

If no food is detected, return {"image_type": "meal", "suggested_description": "", "items": [], "total_calories": 0, "notes": "No food detected"}`
}

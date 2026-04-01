import type { Ingredient } from '../provider'

export function buildNutritionEstimationPrompt(ingredients: Ingredient[]): string {
  const ingredientList = ingredients
    .map(i => `- ${i.quantity} ${i.unit} of ${i.name}`)
    .join('\n')

  return `You are a nutrition expert. Estimate the nutritional content for each ingredient listed below using standard nutritional databases (USDA, etc.).

Ingredients:
${ingredientList}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "items": [
    {
      "name": "ingredient name (same as input, normalized)",
      "quantity": <number matching input>,
      "unit": "<unit matching input>",
      "calories": <number>,
      "protein_g": <number>,
      "carbs_g": <number>,
      "fat_g": <number>,
      "fiber_g": <number>,
      "sugar_g": <number>,
      "saturated_fat_g": <number>,
      "sodium_mg": <number>,
      "food_group": "protein | grain | vegetable | fruit | dairy | fat | beverage | other",
      "confidence": "high | medium | low"
    }
  ],
  "total_calories": <sum of all item calories>
}

Rules:
- Match the input ingredient names and quantities exactly
- Use standard serving size data for nutritional estimates
- confidence "high" = well-known item with clear quantity
- confidence "medium" = reasonable estimate
- confidence "low" = ambiguous item or unusual preparation`
}

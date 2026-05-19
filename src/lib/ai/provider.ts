export interface NutritionItem {
  name: string
  canonical_name?: string
  quantity: number
  unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number
  sugar_g?: number
  saturated_fat_g?: number
  sodium_mg?: number
  food_group?: string
  confidence: 'high' | 'medium' | 'low'
}

export interface NutritionResponse {
  items: NutritionItem[]
  total_calories: number
  notes?: string
  suggested_description?: string
}

export interface LLMResponse {
  content: string
  model: string
  provider: string
  tokens_used: number
  prompt_tokens?: number
  completion_tokens?: number
  latency_ms?: number
}

export interface Ingredient {
  name: string
  quantity: number
  unit: string
}

export interface AIInput {
  type: 'text' | 'image' | 'both'
  text?: string
  imageBase64?: string
  imageMimeType?: string
  ingredients?: Ingredient[]
}

export interface AIProvider {
  name: string
  parseText(description: string, mealHistory?: string): Promise<LLMResponse>
  parseImage(imageBase64: string, mimeType: string, text?: string, mealHistory?: string): Promise<LLMResponse>
  estimateNutrition(ingredients: Ingredient[]): Promise<LLMResponse>
  generateEmbedding?(text: string): Promise<number[]>
}

export class RateLimitExhaustedError extends Error {
  constructor(provider: string) {
    super(`Rate limit exhausted for provider: ${provider}`)
    this.name = 'RateLimitExhaustedError'
  }
}

export class AIParseError extends Error {
  constructor(message: string, public readonly raw?: string) {
    super(message)
    this.name = 'AIParseError'
  }
}

export function parseNutritionResponse(content: string): NutritionResponse {
  // Strip markdown code fences if present
  const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new AIParseError('Failed to parse LLM response as JSON', content)
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).items)
  ) {
    throw new AIParseError('LLM response missing required "items" array', content)
  }

  return parsed as NutritionResponse
}

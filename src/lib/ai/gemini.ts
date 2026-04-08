import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider, Ingredient, LLMResponse } from './provider'
import { buildParseTextPrompt } from './prompts/parse-text'
import { buildParseImagePrompt } from './prompts/parse-image'
import { buildNutritionEstimationPrompt } from './prompts/nutrition'

const VISION_MODEL = 'gemini-2.5-flash'
const EMBEDDING_MODEL = 'gemini-embedding-001'

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini'
  private client: GoogleGenerativeAI

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
  }

  async parseText(description: string, mealHistory?: string, lang?: string): Promise<LLMResponse> {
    const prompt = buildParseTextPrompt(description, mealHistory, lang)
    const model = this.client.getGenerativeModel({ model: VISION_MODEL })
    const start = Date.now()

    const result = await model.generateContent(prompt)
    const content = result.response.text()

    return {
      content,
      model: VISION_MODEL,
      provider: 'gemini',
      tokens_used: result.response.usageMetadata?.totalTokenCount ?? 0,
      prompt_tokens: result.response.usageMetadata?.promptTokenCount,
      completion_tokens: result.response.usageMetadata?.candidatesTokenCount,
      latency_ms: Date.now() - start,
    }
  }

  async parseImage(imageBase64: string, mimeType: string, additionalText?: string, mealHistory?: string, lang?: string): Promise<LLMResponse> {
    const prompt = buildParseImagePrompt(additionalText, mealHistory, lang)
    const model = this.client.getGenerativeModel({ model: VISION_MODEL })
    const start = Date.now()

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType } },
    ])

    const content = result.response.text()
    return {
      content,
      model: VISION_MODEL,
      provider: 'gemini',
      tokens_used: result.response.usageMetadata?.totalTokenCount ?? 0,
      prompt_tokens: result.response.usageMetadata?.promptTokenCount,
      completion_tokens: result.response.usageMetadata?.candidatesTokenCount,
      latency_ms: Date.now() - start,
    }
  }

  async estimateNutrition(ingredients: Ingredient[]): Promise<LLMResponse> {
    const prompt = buildNutritionEstimationPrompt(ingredients)
    const model = this.client.getGenerativeModel({ model: VISION_MODEL })
    const start = Date.now()

    const result = await model.generateContent(prompt)
    const content = result.response.text()

    return {
      content,
      model: VISION_MODEL,
      provider: 'gemini',
      tokens_used: result.response.usageMetadata?.totalTokenCount ?? 0,
      prompt_tokens: result.response.usageMetadata?.promptTokenCount,
      completion_tokens: result.response.usageMetadata?.candidatesTokenCount,
      latency_ms: Date.now() - start,
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({ model: EMBEDDING_MODEL })
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      taskType: 'RETRIEVAL_DOCUMENT' as never,
      outputDimensionality: 768,
    } as never)
    return result.embedding.values
  }
}

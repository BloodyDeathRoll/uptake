import Groq from 'groq-sdk'
import type { AIProvider, Ingredient, LLMResponse } from './provider'
import { buildParseTextPrompt } from './prompts/parse-text'
import { buildParseImagePrompt } from './prompts/parse-image'
import { buildNutritionEstimationPrompt } from './prompts/nutrition'

const PRIMARY_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const QUALITY_MODEL = 'llama-3.3-70b-versatile'

export class GroqProvider implements AIProvider {
  readonly name = 'groq'
  private client: Groq

  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }

  async parseText(description: string, mealHistory?: string, lang?: string): Promise<LLMResponse> {
    const prompt = buildParseTextPrompt(description, mealHistory, lang)
    const start = Date.now()

    const completion = await this.client.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    })

    const content = completion.choices[0]?.message?.content ?? ''
    return {
      content,
      model: PRIMARY_MODEL,
      provider: 'groq',
      tokens_used: completion.usage?.total_tokens ?? 0,
      prompt_tokens: completion.usage?.prompt_tokens,
      completion_tokens: completion.usage?.completion_tokens,
      latency_ms: Date.now() - start,
    }
  }

  async parseImage(imageBase64: string, mimeType: string, additionalText?: string, mealHistory?: string, lang?: string): Promise<LLMResponse> {
    const prompt = buildParseImagePrompt(additionalText, mealHistory, lang)
    const start = Date.now()

    const completion = await this.client.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    })

    const content = completion.choices[0]?.message?.content ?? ''
    return {
      content,
      model: PRIMARY_MODEL,
      provider: 'groq',
      tokens_used: completion.usage?.total_tokens ?? 0,
      prompt_tokens: completion.usage?.prompt_tokens,
      completion_tokens: completion.usage?.completion_tokens,
      latency_ms: Date.now() - start,
    }
  }

  async estimateNutrition(ingredients: Ingredient[]): Promise<LLMResponse> {
    const prompt = buildNutritionEstimationPrompt(ingredients)
    const start = Date.now()

    const completion = await this.client.chat.completions.create({
      model: QUALITY_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    })

    const content = completion.choices[0]?.message?.content ?? ''
    return {
      content,
      model: QUALITY_MODEL,
      provider: 'groq',
      tokens_used: completion.usage?.total_tokens ?? 0,
      prompt_tokens: completion.usage?.prompt_tokens,
      completion_tokens: completion.usage?.completion_tokens,
      latency_ms: Date.now() - start,
    }
  }
}

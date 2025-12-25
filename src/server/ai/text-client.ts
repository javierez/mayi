/**
 * Unified Text Generation Client
 *
 * Supports both OpenAI and Gemini models for text generation.
 * Model selection via AI_DESCRIPTION_MODEL environment variable.
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

// Supported models
export type AIModel = "gpt-5-mini" | "gemini-3-pro-preview";

// Default model from environment or fallback to Gemini
const DEFAULT_MODEL: AIModel =
  (process.env.AI_DESCRIPTION_MODEL as AIModel) ?? "gemini-3-pro-preview";

export interface TextGenerationOptions {
  temperature?: number;
  maxTokens?: number;
}

// Lazy-initialized clients
let openaiClient: OpenAI | null = null;
let geminiClient: GoogleGenAI | null = null;

function getOpenAI(): OpenAI {
  openaiClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}

function getGemini(): GoogleGenAI {
  geminiClient ??= new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  });
  return geminiClient;
}

function isGeminiModel(model: AIModel): boolean {
  return model.startsWith("gemini");
}

/**
 * Generate text using the configured AI model
 *
 * @param systemPrompt - System instructions for the model
 * @param userPrompt - User message/prompt
 * @param options - Optional configuration (temperature, maxTokens)
 * @returns Generated text response
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: TextGenerationOptions = {},
): Promise<string> {
  const model = DEFAULT_MODEL;

  console.log(`🤖 AI Text Generation - Using model: ${model}`);

  if (isGeminiModel(model)) {
    return generateWithGemini(systemPrompt, userPrompt, model, options);
  } else {
    return generateWithOpenAI(systemPrompt, userPrompt, model, options);
  }
}

async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  model: AIModel,
  options: TextGenerationOptions,
): Promise<string> {
  const ai = getGemini();

  // Gemini 3 uses temperature 1.0 by default (recommended)
  const temperature = options.temperature ?? 1.0;
  const maxOutputTokens = options.maxTokens ?? 2000;

  const response = await ai.models.generateContent({
    model,
    contents: `${systemPrompt}\n\n${userPrompt}`,
    config: {
      temperature,
      maxOutputTokens,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("No text response from Gemini API");
  }

  return text;
}

async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model: AIModel,
  options: TextGenerationOptions,
): Promise<string> {
  const openai = getOpenAI();

  // Map model name to OpenAI model ID
  const openaiModel =
    model === "gpt-5-mini" ? "gpt-5-mini-2025-08-07" : "gpt-4o";

  const completion = await openai.chat.completions.create({
    model: openaiModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  return content;
}

/**
 * Get the currently configured model
 */
export function getCurrentModel(): AIModel {
  return DEFAULT_MODEL;
}

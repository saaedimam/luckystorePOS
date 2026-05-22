/**
 * Gemini Provider
 * Compliant with MASTER_RULES v2026.05.22-v1
 *
 * Handles communication with Google Gemini API.
 * Escalation provider for 10% of tasks (PAID tier).
 *
 * API Endpoint: https://generativelanguage.googleapis.com/v1beta/
 * Requires: GEMINI_API_KEY
 */

import type {
  AITask,
  GeminiModel,
  AllowedModel,
} from "../types";
import { ConfigurationError } from "../types";

/**
 * Gemini API response types
 */
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiStreamChunk {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason?: string;
    index: number;
  }>;
}

/**
 * Gemini Provider Configuration
 */
interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

/**
 * Gemini Provider
 * Used for complex tasks only (10% of tasks per MASTER_RULES)
 */
export class GeminiProvider {
  private config: GeminiConfig;

  constructor(config?: Partial<GeminiConfig>) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey && !config?.apiKey) {
      throw new ConfigurationError(
        "Gemini API key not configured. Set VITE_GEMINI_API_KEY environment variable."
      );
    }

    this.config = {
      apiKey: config?.apiKey || apiKey || "",
      baseUrl:
        config?.baseUrl ||
        "https://generativelanguage.googleapis.com/v1beta/",
      timeout: config?.timeout || 60000,
    };
  }

  /**
   * Map our model names to Gemini model names
   */
  private mapModel(model: AllowedModel): string {
    const modelMap: Record<GeminiModel, string> = {
      "gemini-2.5-flash": "gemini-2.5-flash",
      "gemini-2.5-pro": "gemini-2.5-pro",
    };

    const geminiModel = modelMap[model as GeminiModel];
    if (!geminiModel) {
      throw new ConfigurationError(
        `Model ${model} is not a Gemini model. Check routing configuration.`
      );
    }

    return geminiModel;
  }

  /**
   * Execute content generation
   */
  public async generate(
    model: GeminiModel,
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<{ text: string; tokensUsed: number }> {
    const url = `${this.config.baseUrl}models/${this.mapModel(model)}:generateContent?key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 8192,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || "";
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    return { text, tokensUsed };
  }

  /**
   * Execute chat completion
   */
  public async chat(
    model: GeminiModel,
    messages: Array<{ role: string; content: string }>,
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<{ text: string; tokensUsed: number }> {
    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const url = `${this.config.baseUrl}models/${this.mapModel(
      model
    )}:generateContent?key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 8192,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || "";
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    return { text, tokensUsed };
  }

  /**
   * Handle streaming response
   */
  public async chatStream(
    model: GeminiModel,
    messages: Array<{ role: string; content: string }>,
    options: {
      temperature?: number;
      maxTokens?: number;
      onChunk: (text: string) => void;
    }
  ): Promise<{ text: string; tokensUsed: number }> {
    const geminiMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const url = `${this.config.baseUrl}models/${this.mapModel(
      model
    )}:streamGenerateContent?key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 8192,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body available for streaming");
    }

    const decoder = new TextDecoder();
    let fullContent = "";
    let totalTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          // Handle streaming format
          if (line.startsWith("data: ")) {
            try {
              const data: GeminiStreamChunk = JSON.parse(line.slice(6));
              if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const text = data.candidates[0].content.parts[0].text;
                fullContent += text;
                options.onChunk(text);
              }
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Estimate tokens if not provided
    totalTokens = Math.ceil(fullContent.length / 4);

    return { text: fullContent, tokensUsed: totalTokens };
  }

  /**
   * Check if model is available
   */
  public async checkModel(model: GeminiModel): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}models?key=${this.config.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const models = data.models || [];
      const mappedModel = this.mapModel(model);

      return models.some((m: { name: string }) => m.name.includes(mappedModel));
    } catch {
      return false;
    }
  }

  /**
   * Count tokens for a prompt
   */
  public async countTokens(
    model: GeminiModel,
    text: string
  ): Promise<number> {
    const url = `${this.config.baseUrl}models/${this.mapModel(
      model
    )}:countTokens?key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text }],
          },
        ],
      }),
    });

    if (!response.ok) {
      // Fallback: estimate based on text length
      return Math.ceil(text.length / 4);
    }

    const data = await response.json();
    return data.totalTokens || Math.ceil(text.length / 4);
  }
}

/**
 * Create task prompt for Gemini (enhanced for complex tasks)
 */
export function createGeminiPrompt(task: AITask): string {
  return `You are processing a complex task for Lucky Store POS.

Task ID: ${task.id}
Category: ${task.category}
Description: ${task.description}
Complexity Level: ${task.complexity}

This task has been escalated to Gemini due to:
- ${task.contextSwitches ? `${task.contextSwitches} context switches required` : "Complex reasoning required"}
- ${task.filesAffected ? `${task.filesAffected} files may be affected` : "Multiple system interactions"}

Please provide a thorough analysis and clear recommendations.`;
}

/**
 * Default system prompt for Gemini tasks
 */
export const GEMINI_SYSTEM_PROMPT = `You are an advanced AI assistant for Lucky Store POS, operating at the escalation tier.
You handle complex tasks requiring deep reasoning, security analysis, or architectural decisions.
Provide comprehensive analysis and actionable recommendations.
Always consider data integrity, security, and scalability in your responses.`;

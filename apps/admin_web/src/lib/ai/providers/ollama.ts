/**
 * Ollama Cloud Provider
 * Compliant with MASTER_RULES v2026.05.22-v1
 *
 * Handles communication with Ollama Cloud API.
 * Default provider for 90% of tasks (FREE tier).
 *
 * API Endpoint: https://api.ollama.ai/v1/
 * Requires: OLLAMA_PRO_API_KEY
 */

import type {
  AITask,
  OllamaModel,
  AllowedModel,
} from "../types";
import { ConfigurationError } from "../types";

/**
 * Ollama Cloud API response types
 */
interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * Ollama Cloud Provider Configuration
 */
interface OllamaConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

/**
 * Ollama Cloud Provider
 */
export class OllamaProvider {
  private config: OllamaConfig;

  constructor(config?: Partial<OllamaConfig>) {
    const apiKey = import.meta.env.VITE_OLLAMA_PRO_API_KEY;
    if (!apiKey && !config?.apiKey) {
      throw new ConfigurationError(
        "Ollama Cloud API key not configured. Set VITE_OLLAMA_PRO_API_KEY environment variable."
      );
    }

    this.config = {
      apiKey: config?.apiKey || apiKey || "",
      baseUrl: config?.baseUrl || "https://api.ollama.ai/v1/",
      timeout: config?.timeout || 60000,
    };
  }

  /**
   * Validate that we're using Ollama Cloud, not local Ollama
   * STRICT ENFORCEMENT per MASTER_RULES
   */
  private validateEndpoint(): void {
    const localPatterns = [
      /localhost:11434/,
      /127\.0\.0\.1:11434/,
      /0\.0\.0\.0:11434/,
      /:\/\/ollama\.local/,
    ];

    if (localPatterns.some((pattern) => pattern.test(this.config.baseUrl))) {
      throw new ConfigurationError(
        "FORBIDDEN: Local Ollama endpoint detected. MASTER_RULES strictly prohibits local Ollama. " +
          "Use Ollama Cloud (https://api.ollama.ai/v1/) only."
      );
    }
  }

  /**
   * Map our model names to Ollama Cloud model names
   */
  private mapModel(model: AllowedModel): string {
    const modelMap: Record<OllamaModel, string> = {
      "gemma3:4b": "gemma3:4b",
      "qwen3-coder:480b": "qwen3-coder:480b",
      "kimi-k2.5": "kimi-k2.5",
      "kimi-k2-thinking": "kimi-k2-thinking",
    };

    const ollamaModel = modelMap[model as OllamaModel];
    if (!ollamaModel) {
      throw new ConfigurationError(
        `Model ${model} is not an Ollama Cloud model. Check routing configuration.`
      );
    }

    return ollamaModel;
  }

  /**
   * Execute chat completion
   */
  public async chat(
    model: OllamaModel,
    messages: Array<{ role: string; content: string }>,
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<string> {
    this.validateEndpoint();

    const url = `${this.config.baseUrl}chat`;
    const mappedModel = this.mapModel(model);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: mappedModel,
        messages,
        stream: options.stream ?? false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 2000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama Cloud API error: ${response.status} - ${error}`);
    }

    // Handle streaming response
    if (options.stream) {
      return this.handleStream(response);
    }

    // Handle non-streaming response
    const data: OllamaChatResponse = await response.json();
    return data.message.content;
  }

  /**
   * Handle streaming response
   */
  private async handleStream(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body available for streaming");
    }

    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data: OllamaStreamChunk = JSON.parse(line);
            if (data.message?.content) {
              fullContent += data.message.content;
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  /**
   * Generate completion (for simple tasks)
   */
  public async generate(
    model: OllamaModel,
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    this.validateEndpoint();

    const url = `${this.config.baseUrl}generate`;
    const mappedModel = this.mapModel(model);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: mappedModel,
        prompt,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 2000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama Cloud API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Check if model is available
   */
  public async checkModel(model: OllamaModel): Promise<boolean> {
    try {
      this.validateEndpoint();

      const url = `${this.config.baseUrl}tags`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const models = data.models || [];
      const mappedModel = this.mapModel(model);

      return models.some((m: { name: string }) => m.name === mappedModel);
    } catch {
      return false;
    }
  }
}

/**
 * Create task prompt for Ollama
 */
export function createOllamaPrompt(task: AITask): string {
  return `Task: ${task.description}
Category: ${task.category}
Complexity: ${task.complexity}

Please process this task according to the Lucky Store POS requirements.`;
}

/**
 * Convert task to chat messages format
 */
export function taskToMessages(
  task: AITask,
  systemPrompt?: string
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({
    role: "user",
    content: createOllamaPrompt(task),
  });

  return messages;
}

/**
 * Default system prompt for Lucky Store POS
 */
export const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for Lucky Store POS, a retail management system.
You help with tasks like inventory management, catalog updates, analytics, and customer support.
Respond concisely and accurately in English or Bangla as appropriate.
Always validate data integrity and report any issues you detect.`;

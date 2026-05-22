/**
 * AI Orchestration Types
 * Compliant with MASTER_RULES v2026.05.22-v1
 *
 * Defines types for the model router, cost tracking, and task evaluation.
 * STRICT ENFORCEMENT: No Claude API, No local Ollama, Ollama Cloud default.
 */

/**
 * Allowed Ollama Cloud models per MASTER_RULES
 * Default for 90% of tasks
 */
export type OllamaModel =
  | "gemma3:4b" // General tasks, quick answers
  | "qwen3-coder:480b" // Code generation, refactoring
  | "kimi-k2.5" // Complex reasoning, architecture
  | "kimi-k2-thinking"; // Deep analysis, debugging

/**
 * Allowed Gemini models per MASTER_RULES
 * Used for 10% of tasks only - complex scenarios
 */
export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-pro";

/**
 * All allowed models - union for type safety
 */
export type AllowedModel = OllamaModel | GeminiModel;

/**
 * Forbidden models - explicitly defined to prevent accidental use
 */
export type ForbiddenModel =
  | "claude-opus-4-7"
  | "claude-opus-4-6"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5"
  | "gpt-4"
  | "gpt-4o"
  | "gpt-3.5-turbo"
  | string; // Catch-all for any other unauthorized model

/**
 * Provider types
 */
export type Provider = "ollama-cloud" | "gemini" | "forbidden";

/**
 * Task complexity level determines routing
 */
export type TaskComplexity = "simple" | "moderate" | "complex" | "critical";

/**
 * Task categories for the POS system
 */
export type TaskCategory =
  | "whatsapp-invoicing" // WhatsApp order processing
  | "catalog-update" // Product catalog updates
  | "inventory-sync" // Inventory synchronization
  | "analytics-query" // Analytics and reporting
  | "customer-support" // Automated customer responses
  | "data-processing" // Generic data processing
  | "code-generation" // Code generation tasks
  | "security-review" // Security analysis (always escalated)
  | "architecture-review"; // Architecture decisions (always escalated)

/**
 * Task definition for routing
 */
export interface AITask {
  id: string;
  category: TaskCategory;
  complexity: TaskComplexity;
  description: string;
  inputTokens: number; // Estimated input tokens
  expectedOutputTokens: number; // Estimated output tokens
  contextSwitches?: number; // Number of context switches required
  filesAffected?: number; // Number of files affected
  requiresReasoning?: boolean; // Does it require deep reasoning?
  userRequestedAnalysis?: boolean; // Did user explicitly request complex analysis?
}

/**
 * Routing decision result
 */
export interface RoutingDecision {
  provider: Provider;
  model: AllowedModel;
  complexity: TaskComplexity;
  estimatedCost: number; // In USD
  reason: string;
  taskId: string;
}

/**
 * Cost tracking entry
 */
export interface CostEntry {
  id: string;
  taskId: string;
  timestamp: string;
  provider: Provider;
  model: AllowedModel;
  inputTokens: number;
  outputTokens: number;
  cost: number; // In USD
  taskCategory: TaskCategory;
}

/**
 * Monthly budget status
 */
export interface BudgetStatus {
  month: string; // YYYY-MM
  totalSpent: number;
  totalBudget: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  warningThreshold: number; // 80%
  criticalThreshold: number; // 95%
}

/**
 * Model capabilities and pricing
 */
export interface ModelConfig {
  model: AllowedModel;
  provider: Provider;
  inputPricePerMillion: number; // USD per 1M tokens
  outputPricePerMillion: number; // USD per 1M tokens
  maxTokens: number;
  supportsReasoning: boolean;
  supportsCode: boolean;
  supportsVision: boolean;
}

/**
 * Escalation threshold configuration
 */
export interface EscalationThresholds {
  // Escalate to Gemini if context switches exceed this
  contextSwitches: number;
  // Escalate if files affected exceed this
  filesAffected: number;
  // Escalate if task complexity is 'complex' or 'critical'
  minComplexityForEscalation: TaskComplexity;
  // Categories that always escalate
  alwaysEscalateCategories: TaskCategory[];
}

/**
 * Router configuration
 */
export interface RouterConfig {
  defaultOllamaModel: OllamaModel;
  fallbackOllamaModel: OllamaModel;
  geminiFlashModel: GeminiModel;
  geminiProModel: GeminiModel;
  monthlyBudget: number; // Default: 10.0 (USD)
  escalationThresholds: EscalationThresholds;
  ollamaApiEndpoint: string;
  geminiApiEndpoint: string;
}

/**
 * Error types for routing
 */
export class ModelRouterError extends Error {
  code: string;
  taskId?: string;

  constructor(message: string, code: string, taskId?: string) {
    super(message);
    this.code = code;
    this.taskId = taskId;
    this.name = "ModelRouterError";
  }
}

/**
 * Forbidden model error - thrown when Claude API or other forbidden models are requested
 */
export class ForbiddenModelError extends ModelRouterError {
  constructor(model: ForbiddenModel, taskId?: string) {
    super(
      `FORBIDDEN MODEL REQUESTED: "${model}". This project strictly prohibits Claude API, ` +
        `local Ollama, OpenAI GPT-4, and any unauthorized models per MASTER_RULES v2026.05.22-v1. ` +
        `Allowed models: Ollama Cloud (gemma3:4b, qwen3-coder:480b, kimi-k2.5, kimi-k2-thinking) ` +
        `and Gemini (gemini-2.5-flash, gemini-2.5-pro).`,
      "FORBIDDEN_MODEL",
      taskId
    );
    this.name = "ForbiddenModelError";
  }
}

/**
 * Budget exceeded error
 */
export class BudgetExceededError extends ModelRouterError {
  currentSpend: number;
  budget: number;

  constructor(currentSpend: number, budget: number, taskId?: string) {
    super(
      `Budget exceeded: $${currentSpend.toFixed(2)} / $${budget.toFixed(2)}. ` +
        `Task cannot be processed without budget increase or manual override.`,
      "BUDGET_EXCEEDED",
      taskId
    );
    this.name = "BudgetExceededError";
    this.currentSpend = currentSpend;
    this.budget = budget;
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends ModelRouterError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}

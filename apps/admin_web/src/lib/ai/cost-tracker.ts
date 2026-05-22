/**
 * Cost Tracking Utility
 * Compliant with MASTER_RULES v2026.05.22-v1
 *
 * Tracks AI spending to ensure we stay within the $0-$10 monthly budget.
 * Provides real-time budget monitoring and alerts.
 */

import type {
  AllowedModel,
  CostEntry,
  BudgetStatus,
  ModelConfig,
  Provider,
  TaskCategory,
} from "./types";
import { BudgetExceededError } from "./types";

/**
 * Pricing configuration per MASTER_RULES
 * Prices in USD per 1 million tokens
 *
 * Note: These are estimated prices. Update with actual Ollama Cloud
 * and Gemini pricing as available.
 */
const MODEL_PRICING: Record<AllowedModel, ModelConfig> = {
  // Ollama Cloud models - FREE tier (estimated minimal costs for tracking)
  "gemma3:4b": {
    model: "gemma3:4b",
    provider: "ollama-cloud",
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    maxTokens: 8192,
    supportsReasoning: false,
    supportsCode: true,
    supportsVision: false,
  },
  "qwen3-coder:480b": {
    model: "qwen3-coder:480b",
    provider: "ollama-cloud",
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    maxTokens: 32768,
    supportsReasoning: true,
    supportsCode: true,
    supportsVision: false,
  },
  "kimi-k2.5": {
    model: "kimi-k2.5",
    provider: "ollama-cloud",
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    maxTokens: 128000,
    supportsReasoning: true,
    supportsCode: true,
    supportsVision: true,
  },
  "kimi-k2-thinking": {
    model: "kimi-k2-thinking",
    provider: "ollama-cloud",
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    maxTokens: 128000,
    supportsReasoning: true,
    supportsCode: true,
    supportsVision: true,
  },
  // Gemini models - PAID (actual pricing)
  "gemini-2.5-flash": {
    model: "gemini-2.5-flash",
    provider: "gemini",
    inputPricePerMillion: 0.15, // $0.15 per 1M input tokens
    outputPricePerMillion: 0.6, // $0.60 per 1M output tokens
    maxTokens: 65536,
    supportsReasoning: true,
    supportsCode: true,
    supportsVision: true,
  },
  "gemini-2.5-pro": {
    model: "gemini-2.5-pro",
    provider: "gemini",
    inputPricePerMillion: 1.25, // $1.25 per 1M input tokens
    outputPricePerMillion: 5.0, // $5.00 per 1M output tokens
    maxTokens: 65536,
    supportsReasoning: true,
    supportsCode: true,
    supportsVision: true,
  },
};

/**
 * Cost Tracker Class
 * Singleton pattern for global cost tracking
 */
export class CostTracker {
  private static instance: CostTracker | null = null;
  private entries: CostEntry[] = [];
  private monthlyBudget: number;
  private warningThreshold: number;
  private criticalThreshold: number;

  /**
   * Private constructor - use getInstance()
   */
  private constructor(budget: number = 10.0) {
    this.monthlyBudget = budget;
    this.warningThreshold = 0.8; // 80%
    this.criticalThreshold = 0.95; // 95%
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(budget?: number): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker(budget);
    }
    return CostTracker.instance;
  }

  /**
   * Reset instance (for testing)
   */
  public static resetInstance(): void {
    CostTracker.instance = null;
  }

  /**
   * Calculate cost for a given model and token usage
   */
  public calculateCost(
    model: AllowedModel,
    inputTokens: number,
    outputTokens: number
  ): number {
    const config = MODEL_PRICING[model];
    if (!config) {
      throw new Error(`Unknown model: ${model}`);
    }

    const inputCost = (inputTokens / 1000000) * config.inputPricePerMillion;
    const outputCost = (outputTokens / 1000000) * config.outputPricePerMillion;

    return inputCost + outputCost;
  }

  /**
   * Record a cost entry
   */
  public recordCost(entry: Omit<CostEntry, "id" | "timestamp">): CostEntry {
    const fullEntry: CostEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    this.entries.push(fullEntry);
    return fullEntry;
  }

  /**
   * Get current month's budget status
   */
  public getBudgetStatus(): BudgetStatus {
    const currentMonth = this.getCurrentMonth();
    const monthlySpend = this.getMonthlySpend(currentMonth);
    const percentageUsed = monthlySpend / this.monthlyBudget;

    return {
      month: currentMonth,
      totalSpent: monthlySpend,
      totalBudget: this.monthlyBudget,
      remaining: Math.max(0, this.monthlyBudget - monthlySpend),
      percentageUsed,
      isOverBudget: monthlySpend > this.monthlyBudget,
      warningThreshold: this.warningThreshold,
      criticalThreshold: this.criticalThreshold,
    };
  }

  /**
   * Check if a task can be processed within budget
   * Throws BudgetExceededError if over budget
   */
  public checkBudget(
    estimatedCost: number,
    taskId?: string
  ): { allowed: boolean; status: BudgetStatus } {
    const status = this.getBudgetStatus();

    if (status.totalSpent + estimatedCost > this.monthlyBudget) {
      throw new BudgetExceededError(
        status.totalSpent + estimatedCost,
        this.monthlyBudget,
        taskId
      );
    }

    return { allowed: true, status };
  }

  /**
   * Check if budget warning should be shown
   */
  public shouldShowWarning(): boolean {
    const status = this.getBudgetStatus();
    return (
      status.percentageUsed >= status.warningThreshold &&
      status.percentageUsed < status.criticalThreshold
    );
  }

  /**
   * Check if budget is in critical state
   */
  public isBudgetCritical(): boolean {
    const status = this.getBudgetStatus();
    return status.percentageUsed >= status.criticalThreshold;
  }

  /**
   * Get spending by category
   */
  public getSpendingByCategory(): Record<TaskCategory, number> {
    const currentMonth = this.getCurrentMonth();
    const spending: Partial<Record<TaskCategory, number>> = {};

    for (const entry of this.entries) {
      if (entry.timestamp.startsWith(currentMonth)) {
        spending[entry.taskCategory] =
          (spending[entry.taskCategory] || 0) + entry.cost;
      }
    }

    return spending as Record<TaskCategory, number>;
  }

  /**
   * Get spending by provider
   */
  public getSpendingByProvider(): Record<Provider, number> {
    const currentMonth = this.getCurrentMonth();
    const spending: Record<Provider, number> = {
      "ollama-cloud": 0,
      gemini: 0,
      forbidden: 0,
    };

    for (const entry of this.entries) {
      if (entry.timestamp.startsWith(currentMonth)) {
        spending[entry.provider] += entry.cost;
      }
    }

    return spending;
  }

  /**
   * Get model configuration
   */
  public getModelConfig(model: AllowedModel): ModelConfig {
    const config = MODEL_PRICING[model];
    if (!config) {
      throw new Error(`Model configuration not found: ${model}`);
    }
    return config;
  }

  /**
   * Get all entries for current month
   */
  public getCurrentMonthEntries(): CostEntry[] {
    const currentMonth = this.getCurrentMonth();
    return this.entries.filter((entry) => entry.timestamp.startsWith(currentMonth));
  }

  /**
   * Export cost report
   */
  public exportReport(): string {
    const status = this.getBudgetStatus();
    const byCategory = this.getSpendingByCategory();
    const byProvider = this.getSpendingByProvider();

    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        budgetStatus: status,
        spendingByCategory: byCategory,
        spendingByProvider: byProvider,
        entries: this.getCurrentMonthEntries(),
      },
      null,
      2
    );
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  /**
   * Get total spend for a specific month
   */
  private getMonthlySpend(month: string): number {
    return this.entries
      .filter((entry) => entry.timestamp.startsWith(month))
      .reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Convenience function to get cost tracker instance
 */
export function getCostTracker(): CostTracker {
  // Get budget from environment or default to $10
  const budget = parseFloat(import.meta.env.VITE_AI_MONTHLY_BUDGET || "10");
  return CostTracker.getInstance(budget);
}

/**
 * Estimate tokens from text (rough approximation)
 * 1 token ≈ 4 characters for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get recommended model based on task characteristics
 */
export function getRecommendedOllamaModel(
  requiresCode: boolean,
  requiresReasoning: boolean
): AllowedModel {
  if (requiresCode) {
    return "qwen3-coder:480b";
  }
  if (requiresReasoning) {
    return "kimi-k2.5";
  }
  return "gemma3:4b";
}

/**
 * Export pricing info for reference
 */
export function getPricingInfo(): Record<string, ModelConfig> {
  return { ...MODEL_PRICING };
}

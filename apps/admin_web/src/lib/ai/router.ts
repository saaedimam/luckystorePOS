/**
 * AI Model Router
 * Compliant with MASTER_RULES v2026.05.22-v1
 *
 * Core routing logic for AI tasks with strict enforcement of:
 * - Ollama Cloud as default (90% of tasks)
 * - Gemini escalation only for complex tasks (10% of tasks)
 * - ZERO fallback to Claude API or other forbidden models
 * - Budget constraint: $0-$10/month
 */

import type {
  AITask,
  RoutingDecision,
  RouterConfig,
  TaskComplexity,
  TaskCategory,
  AllowedModel,
  OllamaModel,
  GeminiModel,
} from "./types";
import { ForbiddenModelError, ConfigurationError } from "./types";
import { getCostTracker, estimateTokens, CostTracker } from "./cost-tracker";

/**
 * Default router configuration per MASTER_RULES
 */
const DEFAULT_CONFIG: RouterConfig = {
  // Ollama Cloud models (default - FREE tier)
  defaultOllamaModel: "gemma3:4b",
  fallbackOllamaModel: "qwen3-coder:480b",

  // Gemini models (paid - 10% of tasks only)
  geminiFlashModel: "gemini-2.5-flash",
  geminiProModel: "gemini-2.5-pro",

  // Budget: $10/month maximum per MASTER_RULES
  monthlyBudget: 10.0,

  // Escalation thresholds
  escalationThresholds: {
    contextSwitches: 5, // Escalate if >5 context switches
    filesAffected: 10, // Escalate if >10 files affected
    minComplexityForEscalation: "complex", // Escalate for complex/critical
    alwaysEscalateCategories: [
      "security-review",
      "architecture-review",
    ],
  },

  // API endpoints
  ollamaApiEndpoint:
    import.meta.env.VITE_OLLAMA_CLOUD_API_URL || "https://api.ollama.ai/v1/",
  geminiApiEndpoint:
    import.meta.env.VITE_GEMINI_API_URL ||
    "https://generativelanguage.googleapis.com/v1beta/",
};

/**
 * Model Router Class
 * Singleton pattern for centralized routing
 */
export class ModelRouter {
  private static instance: ModelRouter | null = null;
  private config: RouterConfig;
  private costTracker = getCostTracker();

  /**
   * Private constructor - use getInstance()
   */
  private constructor(config: Partial<RouterConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      escalationThresholds: {
        ...DEFAULT_CONFIG.escalationThresholds,
        ...config.escalationThresholds,
      },
    };

    this.validateConfiguration();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(config?: Partial<RouterConfig>): ModelRouter {
    if (!ModelRouter.instance) {
      ModelRouter.instance = new ModelRouter(config);
    }
    return ModelRouter.instance;
  }

  /**
   * Reset instance (for testing)
   */
  public static resetInstance(): void {
    ModelRouter.instance = null;
  }

  /**
   * Validate router configuration
   * Ensures no forbidden models are configured
   */
  private validateConfiguration(): void {
    // Check that no Claude models are configured
    const forbiddenModels = [
      "claude-opus-4-7",
      "claude-opus-4-6",
      "claude-sonnet-4-6",
      "claude-haiku-4-5",
      "gpt-4",
      "gpt-4o",
    ];

    const allConfiguredModels = [
      this.config.defaultOllamaModel,
      this.config.fallbackOllamaModel,
      this.config.geminiFlashModel,
      this.config.geminiProModel,
    ];

    for (const model of allConfiguredModels) {
      if (forbiddenModels.some((forbidden) => model.includes(forbidden))) {
        throw new ConfigurationError(
          `Router configured with forbidden model: ${model}. ` +
            `MASTER_RULES strictly prohibits Claude API and OpenAI models.`
        );
      }
    }
  }

  /**
   * Evaluate task complexity based on MASTER_RULES criteria
   */
  private evaluateComplexity(task: AITask): TaskComplexity {
    const thresholds = this.config.escalationThresholds;

    // Critical complexity indicators
    if (
      task.category === "security-review" ||
      task.category === "architecture-review" ||
      task.complexity === "critical"
    ) {
      return "critical";
    }

    // Complex complexity indicators per MASTER_RULES
    if (
      (task.contextSwitches ?? 0) > thresholds.contextSwitches ||
      (task.filesAffected ?? 0) > thresholds.filesAffected ||
      task.complexity === "complex" ||
      task.requiresReasoning === true ||
      task.userRequestedAnalysis === true
    ) {
      return "complex";
    }

    // Moderate complexity
    if (
      (task.contextSwitches ?? 0) >= 3 ||
      (task.filesAffected ?? 0) >= 5 ||
      task.complexity === "moderate"
    ) {
      return "moderate";
    }

    return "simple";
  }

  /**
   * Determine if task should escalate to Gemini
   * Per MASTER_RULES: Only 10% of tasks should escalate
   */
  private shouldEscalateToGemini(
    task: AITask,
    evaluatedComplexity: TaskComplexity
  ): { escalate: boolean; reason: string; geminiModel: GeminiModel } {
    const thresholds = this.config.escalationThresholds;

    // ALWAYS escalate security and architecture reviews
    if (thresholds.alwaysEscalateCategories.includes(task.category)) {
      return {
        escalate: true,
        reason: `Task category "${task.category}" requires Gemini per MASTER_RULES escalation rules`,
        geminiModel: this.config.geminiProModel,
      };
    }

    // Escalate if user explicitly requested complex analysis
    if (task.userRequestedAnalysis) {
      return {
        escalate: true,
        reason: "User explicitly requested complex analysis",
        geminiModel: this.config.geminiFlashModel,
      };
    }

    // Escalate if critical complexity
    if (evaluatedComplexity === "critical") {
      return {
        escalate: true,
        reason: "Critical complexity task - requires Gemini Pro",
        geminiModel: this.config.geminiProModel,
      };
    }

    // Escalate if complex complexity
    if (evaluatedComplexity === "complex") {
      return {
        escalate: true,
        reason: `Complex task: ${task.contextSwitches ?? 0} context switches, ${task.filesAffected ?? 0} files affected`,
        geminiModel: this.config.geminiFlashModel,
      };
    }

    // Default: Do not escalate
    return {
      escalate: false,
      reason: `Task within Ollama Cloud capabilities (${evaluatedComplexity} complexity)`,
      geminiModel: this.config.geminiFlashModel,
    };
  }

  /**
   * Select Ollama Cloud model based on task requirements
   */
  private selectOllamaModel(
    task: AITask,
    complexity: TaskComplexity
  ): OllamaModel {
    // For code generation tasks
    if (task.category === "code-generation") {
      return "qwen3-coder:480b";
    }

    // For complex reasoning tasks
    if (
      complexity === "complex" ||
      task.requiresReasoning === true ||
      task.category === "analytics-query"
    ) {
      // Note: Even for complex tasks that don't escalate to Gemini,
      // we use the best Ollama model available
      return "kimi-k2.5";
    }

    // For debugging/analysis within Ollama
    if (task.category === "data-processing" && complexity === "moderate") {
      return "kimi-k2-thinking";
    }

    // Default: gemma3:4b for simple tasks
    return this.config.defaultOllamaModel;
  }

  /**
   * Route a task to the appropriate model
   * MAIN ROUTING FUNCTION
   */
  public route(task: AITask): RoutingDecision {
    // Step 1: Evaluate complexity
    const evaluatedComplexity = this.evaluateComplexity(task);

    // Step 2: Check if we should escalate to Gemini
    const escalation = this.shouldEscalateToGemini(task, evaluatedComplexity);

    let selectedModel: AllowedModel;
    let provider: "ollama-cloud" | "gemini";
    let reason: string;

    if (escalation.escalate) {
      // ESCALATE to Gemini (paid - 10% of tasks)
      selectedModel = escalation.geminiModel;
      provider = "gemini";
      reason = escalation.reason;
    } else {
      // DEFAULT to Ollama Cloud (free - 90% of tasks)
      selectedModel = this.selectOllamaModel(task, evaluatedComplexity);
      provider = "ollama-cloud";
      reason = escalation.reason;
    }

    // Step 3: Calculate estimated cost
    const estimatedCost = this.costTracker.calculateCost(
      selectedModel,
      task.inputTokens,
      task.expectedOutputTokens
    );

    // Step 4: Check budget before returning decision
    this.costTracker.checkBudget(estimatedCost, task.id);

    // Step 5: Return routing decision
    return {
      provider,
      model: selectedModel,
      complexity: evaluatedComplexity,
      estimatedCost,
      reason,
      taskId: task.id,
    };
  }

  /**
   * Execute a task with the routed model
   * This is a stub - actual implementation would call the APIs
   */
  public async executeTask<T = unknown>(
    task: AITask,
    payload: Record<string, unknown>
  ): Promise<{
    result: T;
    decision: RoutingDecision;
    actualCost: number;
  }> {
    // Step 1: Route the task
    const decision = this.route(task);

    // Step 2: Check if Claude API was somehow requested (DEFENSE IN DEPTH)
    if (payload.model && this.isForbiddenModel(String(payload.model))) {
      throw new ForbiddenModelError(String(payload.model), task.id);
    }

    // Step 3: Execute with appropriate provider
    let result: T;
    let actualTokensUsed = {
      input: task.inputTokens,
      output: task.expectedOutputTokens,
    };

    switch (decision.provider) {
      case "ollama-cloud":
        result = await this.executeWithOllama<T>(task, decision.model as OllamaModel, payload);
        break;
      case "gemini":
        result = await this.executeWithGemini<T>(task, decision.model as GeminiModel, payload);
        break;
      default:
        throw new ConfigurationError(`Unknown provider: ${decision.provider}`);
    }

    // Step 4: Record actual cost
    const actualCost = this.costTracker.recordCost({
      taskId: task.id,
      provider: decision.provider,
      model: decision.model,
      inputTokens: actualTokensUsed.input,
      outputTokens: actualTokensUsed.output,
      cost: this.costTracker.calculateCost(
        decision.model,
        actualTokensUsed.input,
        actualTokensUsed.output
      ),
      taskCategory: task.category,
    }).cost;

    return {
      result,
      decision,
      actualCost,
    };
  }

  /**
   * Check if a model is forbidden
   * STRICT ENFORCEMENT - per MASTER_RULES
   */
  public isForbiddenModel(model: string): boolean {
    const forbiddenPatterns = [
      /claude/i, // Any Claude model
      /gpt-4/i, // GPT-4 models
      /gpt-3\.5/i, // GPT-3.5 models
      /localhost:11434/, // Local Ollama
      /127\.0\.0\.1:11434/, // Local Ollama
    ];

    return forbiddenPatterns.some((pattern) => pattern.test(model));
  }

  /**
   * Validate that a model is explicitly allowed
   * Throws ForbiddenModelError if not allowed
   */
  public validateAllowedModel(model: string): AllowedModel {
    const allowedModels: string[] = [
      "gemma3:4b",
      "qwen3-coder:480b",
      "kimi-k2.5",
      "kimi-k2-thinking",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ];

    if (!allowedModels.includes(model)) {
      throw new ForbiddenModelError(model);
    }

    return model as AllowedModel;
  }

  /**
   * Get current budget status
   */
  public getBudgetStatus() {
    return this.costTracker.getBudgetStatus();
  }

  /**
   * Get router statistics
   */
  public getStats(): {
    totalTasks: number;
    ollamaTasks: number;
    geminiTasks: number;
    escalationRate: number;
    budgetStatus: ReturnType<CostTracker["getBudgetStatus"]>;
  } {
    const entries = this.costTracker.getCurrentMonthEntries();
    const ollamaTasks = entries.filter((e) => e.provider === "ollama-cloud").length;
    const geminiTasks = entries.filter((e) => e.provider === "gemini").length;
    const totalTasks = entries.length;

    return {
      totalTasks,
      ollamaTasks,
      geminiTasks,
      escalationRate: totalTasks > 0 ? geminiTasks / totalTasks : 0,
      budgetStatus: this.costTracker.getBudgetStatus(),
    };
  }

  /**
   * Execute with Ollama Cloud (stub)
   */
  private async executeWithOllama<T>(
    task: AITask,
    model: OllamaModel,
    _payload: Record<string, unknown>
  ): Promise<T> {
    // TODO: Implement actual Ollama Cloud API call
    // This would use the Ollama Cloud API endpoint
    console.log(`[Ollama Cloud] Executing task ${task.id} with model ${model}`);

    // Placeholder - actual implementation would call Ollama Cloud API
    return Promise.resolve({ success: true, model, taskId: task.id } as T);
  }

  /**
   * Execute with Gemini (stub)
   */
  private async executeWithGemini<T>(
    task: AITask,
    model: GeminiModel,
    _payload: Record<string, unknown>
  ): Promise<T> {
    // TODO: Implement actual Gemini API call
    // This would use the Gemini API endpoint
    console.log(`[Gemini] Executing task ${task.id} with model ${model}`);

    // Placeholder - actual implementation would call Gemini API
    return Promise.resolve({ success: true, model, taskId: task.id } as T);
  }
}

/**
 * Convenience function to get router instance
 */
export function getModelRouter(config?: Partial<RouterConfig>): ModelRouter {
  return ModelRouter.getInstance(config);
}

/**
 * Create a task definition helper
 */
export function createTask(
  id: string,
  category: TaskCategory,
  description: string,
  options: Partial<Omit<AITask, "id" | "category" | "description">> = {}
): AITask {
  return {
    id,
    category,
    description,
    complexity: options.complexity ?? "simple",
    inputTokens: options.inputTokens ?? estimateTokens(description),
    expectedOutputTokens: options.expectedOutputTokens ?? 1000,
    contextSwitches: options.contextSwitches ?? 0,
    filesAffected: options.filesAffected ?? 0,
    requiresReasoning: options.requiresReasoning ?? false,
    userRequestedAnalysis: options.userRequestedAnalysis ?? false,
    ...options,
  };
}

/**
 * Task category helpers for common Lucky Store POS tasks
 */
export const TaskCategories = {
  WHATSAPP_INVOICING: "whatsapp-invoicing" as TaskCategory,
  CATALOG_UPDATE: "catalog-update" as TaskCategory,
  INVENTORY_SYNC: "inventory-sync" as TaskCategory,
  ANALYTICS_QUERY: "analytics-query" as TaskCategory,
  CUSTOMER_SUPPORT: "customer-support" as TaskCategory,
  DATA_PROCESSING: "data-processing" as TaskCategory,
  CODE_GENERATION: "code-generation" as TaskCategory,
  SECURITY_REVIEW: "security-review" as TaskCategory,
  ARCHITECTURE_REVIEW: "architecture-review" as TaskCategory,
} as const;

/**
 * Complexity levels
 */
export const ComplexityLevels = {
  SIMPLE: "simple" as TaskComplexity,
  MODERATE: "moderate" as TaskComplexity,
  COMPLEX: "complex" as TaskComplexity,
  CRITICAL: "critical" as TaskComplexity,
} as const;

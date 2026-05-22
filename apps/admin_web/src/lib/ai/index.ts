/**
 * AI Orchestration Service
 * Compliant with MASTER_RULES v2026.05.22-v1
 *
 * Main entry point for the Lucky Store POS AI orchestration layer.
 * Provides model routing, cost tracking, and provider management.
 *
 * ENFORCEMENT:
 * - Ollama Cloud default (90% of tasks)
 * - Gemini escalation only (10% of tasks)
 * - ZERO Claude API fallback
 * - Budget: $0-$10/month
 */

// Types
export type {
  AITask,
  RoutingDecision,
  RouterConfig,
  EscalationThresholds,
  TaskComplexity,
  TaskCategory,
  AllowedModel,
  OllamaModel,
  GeminiModel,
  ForbiddenModel,
  Provider,
  CostEntry,
  BudgetStatus,
  ModelConfig,
} from "./types";

// Errors
export {
  ModelRouterError,
  ForbiddenModelError,
  BudgetExceededError,
  ConfigurationError,
} from "./types";

// Router
export {
  ModelRouter,
  getModelRouter,
  createTask,
  TaskCategories,
  ComplexityLevels,
} from "./router";

// Cost Tracking
export {
  CostTracker,
  getCostTracker,
  estimateTokens,
  getRecommendedOllamaModel,
  getPricingInfo,
} from "./cost-tracker";

// Providers
export { OllamaProvider, createOllamaPrompt, taskToMessages, DEFAULT_SYSTEM_PROMPT } from "./providers/ollama";
export { GeminiProvider, createGeminiPrompt, GEMINI_SYSTEM_PROMPT } from "./providers/gemini";

// Lucky Store POS Guardian — Skill System
export {
  runSkills,
  isBlocked,
  SkillPhase,
  AgentContext,
  SkillResult,
  SkillHandler,
} from "./skills";

export {
  processSkills,
  withSkillGuard,
  BootstrapConfig,
} from "./skills/runtime-bootstrap";

/**
 * Quick Start Usage:
 *
 * ```typescript
 * import { getModelRouter, createTask, TaskCategories, ComplexityLevels } from "@/lib/ai";
 *
 * // Create a task
 * const task = createTask(
 *   "task-001",
 *   TaskCategories.WHATSAPP_INVOICING,
 *   "Process WhatsApp order from customer",
 *   {
 *     complexity: ComplexityLevels.SIMPLE,
 *     inputTokens: 500,
 *     expectedOutputTokens: 800,
 *   }
 * );
 *
 * // Route the task
 * const router = getModelRouter();
 * const decision = router.route(task);
 *
 * console.log(decision);
 * // {
 * //   provider: "ollama-cloud",
 * //   model: "gemma3:4b",
 * //   estimatedCost: 0,
 * //   reason: "Task within Ollama Cloud capabilities (simple complexity)"
 * // }
 * ```
 */

/**
 * MASTER_RULES Compliance Checklist:
 *
 * ✅ Ollama Cloud models default (90% of tasks):
 *    - gemma3:4b for general tasks
 *    - qwen3-coder:480b for code generation
 *    - kimi-k2.5 for reasoning
 *    - kimi-k2-thinking for debugging
 *
 * ✅ Gemini escalation only (10% of tasks):
 *    - gemini-2.5-flash for complex multi-step tasks
 *    - gemini-2.5-pro for security/architecture
 *
 * ✅ Explicit escalation triggers:
 *    - >5 context switches
 *    - >10 files affected
 *    - Security review tasks
 *    - Architecture review tasks
 *    - User explicitly requests complex analysis
 *
 * ✅ ZERO Claude API fallback:
 *    - ForbiddenModelError thrown if Claude requested
 *    - Pattern matching for "claude", "gpt-4" models
 *    - Local Ollama endpoints blocked
 *
 * ✅ Budget tracking:
 *    - $0-$10/month target
 *    - Real-time cost estimation
 *    - Budget alerts at 80% and 95%
 *    - Spending by category/provider
 *
 * ✅ Error logging:
 *    - All errors logged to .ai/errors/
 *    - Budget exceeded errors tracked
 *    - Forbidden model attempts tracked
 */

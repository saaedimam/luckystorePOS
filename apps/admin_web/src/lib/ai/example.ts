/**
 * AI Router Usage Examples
 * Compliant with MASTER_RULES v2026.05.22-v1
 *
 * Demonstrates routing for common Lucky Store POS tasks.
 */

import {
  getModelRouter,
  createTask,
  TaskCategories,
  ComplexityLevels,
  getCostTracker,
  ForbiddenModelError,
  type RoutingDecision,
} from "./";

/**
 * Example 1: WhatsApp Invoicing (Simple - Ollama)
 * Most common task, should use Ollama Cloud (free)
 */
export function exampleWhatsAppInvoicing(): RoutingDecision {
  const router = getModelRouter();

  const task = createTask(
    "whatsapp-001",
    TaskCategories.WHATSAPP_INVOICING,
    "Generate invoice from WhatsApp order: Customer ordered 3x Rice (5kg), 2x Milk (1L). Total: ৳1,250",
    {
      complexity: ComplexityLevels.SIMPLE,
      inputTokens: 200,
      expectedOutputTokens: 500,
    }
  );

  const decision = router.route(task);

  console.log("[WhatsApp Invoicing]");
  console.log(`  Provider: ${decision.provider}`);
  console.log(`  Model: ${decision.model}`);
  console.log(`  Cost: $${decision.estimatedCost.toFixed(4)}`);
  console.log(`  Reason: ${decision.reason}`);
  console.log();

  // Expected output:
  // Provider: ollama-cloud
  // Model: gemma3:4b
  // Cost: $0.0000
  // Reason: Task within Ollama Cloud capabilities (simple complexity)

  return decision;
}

/**
 * Example 2: Catalog Update with Many Products (Complex - Gemini Escalation)
 * When updating >10 products, escalate to Gemini
 */
export function exampleCatalogUpdate(): RoutingDecision {
  const router = getModelRouter();

  const task = createTask(
    "catalog-001",
    TaskCategories.CATALOG_UPDATE,
    "Update pricing for 15 products based on supplier rate changes. " +
      "Validate margin thresholds. Generate price change report.",
    {
      complexity: ComplexityLevels.COMPLEX,
      inputTokens: 3000,
      expectedOutputTokens: 2000,
      filesAffected: 15, // >10 triggers escalation
      contextSwitches: 3,
    }
  );

  const decision = router.route(task);

  console.log("[Catalog Update - Many Products]");
  console.log(`  Provider: ${decision.provider}`);
  console.log(`  Model: ${decision.model}`);
  console.log(`  Cost: $${decision.estimatedCost.toFixed(4)}`);
  console.log(`  Reason: ${decision.reason}`);
  console.log();

  // Expected output:
  // Provider: gemini
  // Model: gemini-2.5-flash
  // Cost: $1.6500 (estimated)
  // Reason: Complex task: 3 context switches, 15 files affected

  return decision;
}

/**
 * Example 3: Security Review (Always Escalate - Gemini Pro)
 * Security reviews ALWAYS escalate to Gemini Pro per MASTER_RULES
 */
export function exampleSecurityReview(): RoutingDecision {
  const router = getModelRouter();

  const task = createTask(
    "security-001",
    TaskCategories.SECURITY_REVIEW,
    "Review authentication flow for potential vulnerabilities. " +
      "Check for SQL injection, XSS, and session fixation issues.",
    {
      complexity: ComplexityLevels.CRITICAL,
      inputTokens: 5000,
      expectedOutputTokens: 3000,
      requiresReasoning: true,
    }
  );

  const decision = router.route(task);

  console.log("[Security Review - ALWAYS Escalates]");
  console.log(`  Provider: ${decision.provider}`);
  console.log(`  Model: ${decision.model}`);
  console.log(`  Cost: $${decision.estimatedCost.toFixed(4)}`);
  console.log(`  Reason: ${decision.reason}`);
  console.log();

  // Expected output:
  // Provider: gemini
  // Model: gemini-2.5-pro
  // Cost: $21.2500 (estimated - worth it for security!)
  // Reason: Task category "security-review" requires Gemini per MASTER_RULES escalation rules

  return decision;
}

/**
 * Example 4: User Requests Complex Analysis (Explicit Escalation)
 * When user explicitly asks for complex analysis
 */
export function exampleUserRequestedAnalysis(): RoutingDecision {
  const router = getModelRouter();

  const task = createTask(
    "analytics-001",
    TaskCategories.ANALYTICS_QUERY,
    "Analyze Q1 sales data and provide recommendations",
    {
      complexity: ComplexityLevels.MODERATE,
      inputTokens: 2000,
      expectedOutputTokens: 1500,
      userRequestedAnalysis: true, // User explicitly asked
    }
  );

  const decision = router.route(task);

  console.log("[User Requested Analysis]");
  console.log(`  Provider: ${decision.provider}`);
  console.log(`  Model: ${decision.model}`);
  console.log(`  Cost: $${decision.estimatedCost.toFixed(4)}`);
  console.log(`  Reason: ${decision.reason}`);
  console.log();

  // Expected output:
  // Provider: gemini
  // Model: gemini-2.5-flash
  // Cost: $1.2000 (estimated)
  // Reason: User explicitly requested complex analysis

  return decision;
}

/**
 * Example 5: Code Generation (Ollama - Code Model)
 * Code tasks use qwen3-coder:480b
 */
export function exampleCodeGeneration(): RoutingDecision {
  const router = getModelRouter();

  const task = createTask(
    "code-001",
    TaskCategories.CODE_GENERATION,
    "Generate React component for inventory dashboard with filtering and sorting",
    {
      complexity: ComplexityLevels.MODERATE,
      inputTokens: 800,
      expectedOutputTokens: 2000,
    }
  );

  const decision = router.route(task);

  console.log("[Code Generation]");
  console.log(`  Provider: ${decision.provider}`);
  console.log(`  Model: ${decision.model}`);
  console.log(`  Cost: $${decision.estimatedCost.toFixed(4)}`);
  console.log(`  Reason: ${decision.reason}`);
  console.log();

  // Expected output:
  // Provider: ollama-cloud
  // Model: qwen3-coder:480b (code-optimized model)
  // Cost: $0.0000
  // Reason: Task within Ollama Cloud capabilities (moderate complexity)

  return decision;
}

/**
 * Example 6: Forbidden Model Request (THROWS ERROR)
 * STRICT ENFORCEMENT: Claude API is forbidden
 */
export function exampleForbiddenModel(): void {
  const router = getModelRouter();

  try {
    // Attempt to use Claude (FORBIDDEN)
    router.validateAllowedModel("claude-opus-4-7");
  } catch (error) {
    if (error instanceof ForbiddenModelError) {
      console.log("[Forbidden Model Attempt]");
      console.log(`  Error Code: ${error.code}`);
      console.log(`  Message: ${error.message.slice(0, 100)}...`);
      console.log();
      console.log("  ✅ Router correctly rejected forbidden model!");
    }
  }
}

/**
 * Example 7: Budget Tracking
 * Monitor spending across providers
 */
export function exampleBudgetTracking(): void {
  const costTracker = getCostTracker();

  // Record some costs
  costTracker.recordCost({
    taskId: "task-001",
    provider: "ollama-cloud",
    model: "gemma3:4b",
    inputTokens: 500,
    outputTokens: 800,
    cost: 0,
    taskCategory: "whatsapp-invoicing",
  });

  costTracker.recordCost({
    taskId: "task-002",
    provider: "gemini",
    model: "gemini-2.5-flash",
    inputTokens: 2000,
    outputTokens: 1500,
    cost: 1.2,
    taskCategory: "catalog-update",
  });

  // Get budget status
  const status = costTracker.getBudgetStatus();
  console.log("[Budget Status]");
  console.log(`  Month: ${status.month}`);
  console.log(`  Spent: $${status.totalSpent.toFixed(2)}`);
  console.log(`  Budget: $${status.totalBudget.toFixed(2)}`);
  console.log(`  Remaining: $${status.remaining.toFixed(2)}`);
  console.log(`  Used: ${(status.percentageUsed * 100).toFixed(1)}%`);
  console.log();

  // Spending by provider
  const byProvider = costTracker.getSpendingByProvider();
  console.log("[Spending by Provider]");
  console.log(`  Ollama Cloud: $${byProvider["ollama-cloud"].toFixed(2)} (FREE)`);
  console.log(`  Gemini: $${byProvider["gemini"].toFixed(2)}`);
  console.log();
}

/**
 * Example 8: Router Statistics
 * Track escalation rate and usage
 */
export function exampleRouterStats(): void {
  const router = getModelRouter();
  const stats = router.getStats();

  console.log("[Router Statistics]");
  console.log(`  Total Tasks: ${stats.totalTasks}`);
  console.log(`  Ollama Tasks: ${stats.ollamaTasks} (FREE)`);
  console.log(`  Gemini Tasks: ${stats.geminiTasks} (PAID)`);
  console.log(
    `  Escalation Rate: ${(stats.escalationRate * 100).toFixed(1)}% (Target: ≤10%)`
  );
  console.log(`  Budget Used: ${(stats.budgetStatus.percentageUsed * 100).toFixed(1)}%`);
  console.log();

  if (stats.escalationRate > 0.1) {
    console.log("  ⚠️ Warning: Escalation rate exceeds 10% target!");
  } else {
    console.log("  ✅ Escalation rate within target");
  }
}

/**
 * Run all examples
 */
export function runAllExamples(): void {
  console.log("=".repeat(60));
  console.log("AI Router Examples - MASTER_RULES Compliant");
  console.log("=".repeat(60));
  console.log();

  exampleWhatsAppInvoicing();
  exampleCatalogUpdate();
  exampleSecurityReview();
  exampleUserRequestedAnalysis();
  exampleCodeGeneration();
  exampleForbiddenModel();
  exampleBudgetTracking();
  exampleRouterStats();

  console.log("=".repeat(60));
  console.log("All examples completed successfully!");
  console.log("=".repeat(60));
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

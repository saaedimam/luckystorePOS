// Lucky Store POS Guardian — Agent Bootstrap Integration
// Wire this into your agent runtime to enable skill-based guardrails
// Compliant with MASTER_RULES v2026.05.22-v1

import { runSkills, isBlocked, SkillPhase, AgentContext } from './index';

export interface BootstrapConfig {
  enableLogging?: boolean;
  throwOnBlock?: boolean;
}

/**
 * Process skills for a given phase and context.
 * Returns the modified context with any injected skill context.
 * Throws if any skill blocks the operation (when throwOnBlock is true).
 */
export async function processSkills(
  phase: SkillPhase,
  ctx: AgentContext,
  config: BootstrapConfig = { enableLogging: true, throwOnBlock: true }
): Promise<AgentContext> {
  const results = await runSkills(phase, ctx);
  const block = isBlocked(results);

  if (block && config.throwOnBlock) {
    throw new Error(`[SKILL BLOCKED] ${block.reason}`);
  }

  const warnings = results.filter(r => r.warning).map(r => r.warning);
  if (warnings.length && config.enableLogging) {
    console.warn('[SKILL WARNING]', warnings.join('; '));
  }

  const injections = results.filter(r => r.injectedContext).map(r => r.injectedContext);
  if (injections.length) {
    const injectedPrompt = injections.join('\n\n') + '\n\n' + ctx.prompt;
    return { ...ctx, prompt: injectedPrompt };
  }

  return ctx;
}

/**
 * Higher-order function to wrap tool calls with skill validation.
 */
export function withSkillGuard<T extends (...args: unknown[]) => unknown>(
  toolName: string,
  fn: T,
  config?: BootstrapConfig
): T {
  return (async (...args: unknown[]) => {
    // Build context from arguments
    const ctx: AgentContext = {
      prompt: args[0]?.toString() || '',
      toolName,
      toolInput: args[0] as Record<string, unknown>,
      sessionTokens: 0, // Would be calculated from actual token count
    };

    // PRE_TOOL validation
    await processSkills('PRE_TOOL', ctx, config);

    try {
      const result = await fn(...args);

      // POST_TOOL validation (if needed)
      await processSkills('POST_TOOL', ctx, config);

      return result;
    } catch (error) {
      // ON_ERROR handling
      await processSkills('ON_ERROR', ctx, config);
      throw error;
    }
  }) as T;
}

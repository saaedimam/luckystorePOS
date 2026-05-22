// Layer 0 — Runtime Contract
// Core types for the Lucky Store POS Guardian skill system
// Compliant with MASTER_RULES v2026.05.22-v1

export type SkillPhase = 'PRE_PROMPT' | 'PRE_TOOL' | 'POST_TOOL' | 'ON_ERROR';

export interface AgentContext {
  activeFile?: string;
  prompt: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  tenantId?: string;
  sessionTokens: number;
}

export interface SkillResult {
  blocked: boolean;
  reason?: string;
  warning?: string;
  injectedContext?: string;  // prepended to prompt
}

export type SkillHandler = (
  phase: SkillPhase,
  ctx: AgentContext
) => SkillResult | Promise<SkillResult>;

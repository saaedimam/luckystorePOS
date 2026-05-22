// Layer 0 — Runtime Contract
// Skill registry and execution runner
// Compliant with MASTER_RULES v2026.05.22-v1

import { SkillHandler, SkillPhase, AgentContext, SkillResult } from './types';

const registry = new Map<string, SkillHandler>();

export function registerSkill(name: string, handler: SkillHandler) {
  registry.set(name, handler);
}

export async function runSkills(
  phase: SkillPhase,
  ctx: AgentContext
): Promise<SkillResult[]> {
  const results: SkillResult[] = [];
  for (const [, handler] of registry) {
    results.push(await handler(phase, ctx));
  }
  return results;
}

export function isBlocked(results: SkillResult[]): SkillResult | null {
  return results.find(r => r.blocked) ?? null;
}

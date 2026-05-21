# REPO_AUDIT.md

## Security Findings
| Severity | Finding | Location | Impact | Mitigation |
|----------|---------|----------|--------|------------|
| 🔴 Critical | SUPABASE_SERVICE_ROLE_KEY exposed | `.hermes/memory-hub/forensics/continuity-audit.md` | Service role key in git history | Rotate key + git-filter-repo |
| 🔴 Critical | STAGING_DATABASE_URL exposed | Same file | Plaintext password | Rotate + purge history |
| 🟠 High | No secret scanning | CI workflows | Future leak risk | Add detect-secrets |
| 🟡 Medium | No pre-commit hooks | `.git/hooks/` | Quality drift | Husky + lint-staged |
| 🟢 Low | Console statements | 30 in `apps/admin_web/src/` | Production noise | Remove in build |

## Tech Debt Registry
| Issue | Evidence | Impact | Priority |
|-------|----------|--------|----------|
| 0.5% test coverage | 1 test / 191 files | Regression risk | P0 |
| No Prettier | No `.prettierrc` | Format inconsistency | P1 |
| No E2E tests | No Playwright/Cypress | Integration gaps | P1 |
| Flutter tests non-blocking | `|| true` in CI | False positives | P1 |

## Coverage Gaps
| Layer | Coverage | Missing |
|-------|----------|---------|
| admin_web | 0.5% | 190/191 files untested |
| customer_storefront | 0% | No tests found |
| mobile_app | Partial | Flutter tests pass silently |
| Edge Functions | 0% | No integration tests |
| DB/RPC | 0% | No migration tests |

## Compliance Notes
| Requirement | Status | Gap |
|-------------|--------|-----|
| PII detection | ❌ Missing | No automated scrubbing |
| Encryption at rest | ❌ Missing | Checkpoints unencrypted |
| Retention policy | ⚠️ Partial | 7-day checkpoints, learnings never deleted |
| Audit logging | ✅ Partial | JSONL session logs only |

## Undocumented Systems

| System | Location | Risk | Priority |
|--------|----------|------|----------|
| AI Infrastructure | `.ai/`, `.vibe/`, `.antigravity/`, `.agents/`, `.gemini/`, `.hermes/` | ✅ Documented in CLAUDE.md, ARCHITECTURE.md | ✅ **P1 - DONE** |
| Store App | `apps/store/` | Missing from README | P2 |
| Customer Storefront | `apps/customer_storefront/` | Missing from README | P2 |
| 9 Edge Functions | `supabase/functions/` | Not listed in docs | P1 |
| Governance Pipeline | `scripts/replay-certification/` | No runbook | P1 |
| Safety Guardrails | `scripts/safety/` | No operational docs | P2 |

## Governance Gaps

| Gap | Evidence | Impact |
|-----|----------|--------|
| No migration runbook | `docs/runbooks/` empty | Onboarding risk |
| No design system docs | `docs/design-system/` unlinked | UI inconsistency |
| No audit trail | `docs/audits/` not referenced | Compliance gap |
| Artifact quarantine unused | `artifacts/quarantine/` empty | Safety net missing |

## Setup Complete Log

| Date | System | Status | Notes |
|------|--------|--------|-------|
| 2026-05-22 | AI Infrastructure | ✅ Complete | Ollama Cloud + Gemini configured, Antigravity IDE integrated |
| 2026-05-22 | Vibe Coding | ✅ Complete | `.vibe/` structure, session management |
| 2026-05-22 | Model Routing | ✅ Complete | `llm_config.json` with routing rules |
| 2026-05-22 | AI Tasks | ✅ Complete | `.ai/AI_TASKS.md` with task queue |

---
*Audit Date: 2026-05-22*
*Auditor: Claude Code Analysis*

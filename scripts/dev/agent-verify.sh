#!/bin/bash

# Agent Compliance Verification Script
# Usage: ./scripts/dev/agent-verify.sh
# Exit code: 0 = compliant, >0 = violations

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Ensure we're running from project root
cd "$PROJECT_ROOT" || { echo "❌ Failed to cd to project root"; exit 1; }

if [ ! -f "ARCHITECTURE.md" ]; then
  echo "❌ Not in project root (ARCHITECTURE.md not found)"
  exit 1
fi

ERRORS=0
WARNINGS=0

echo "🔍 Checking agent compliance with MASTER_RULES..."
echo ""

# Load env if exists
if [ -f .env.local ]; then
  set -a
  # shellcheck source=/dev/null
  . .env.local
  set +a
fi

# Check required files exist
echo "📄 Checking required files..."
for file in ARCHITECTURE.md .ai/MASTER_RULES.md .ai/AGENT_ONBOARDING.md .ai/AI_TASKS.md .ai/llm_config.json; do
  if [ ! -f "$file" ]; then
    echo "  ❌ MISSING: $file"
    ((ERRORS++))
  else
    echo "  ✅ Found: $file"
  fi
done
echo ""

# Check API keys
echo "🔑 Checking API keys..."
[ -z "${OLLAMA_PRO_API_KEY:-}" ] && { echo "  ❌ OLLAMA_PRO_API_KEY missing"; ((ERRORS++)); } || echo "  ✅ OLLAMA_PRO_API_KEY set"
[ -z "${GEMINI_API_KEY:-}" ] && { echo "  ❌ GEMINI_API_KEY missing"; ((ERRORS++)); } || echo "  ✅ GEMINI_API_KEY set"
echo ""

# Check for forbidden references
echo "🚫 Checking for forbidden references..."
if [ -f .ai/llm_config.json ]; then
  if grep -q "claude" .ai/llm_config.json 2>/dev/null; then
    echo "  ⚠️  WARNING: 'claude' found in .ai/llm_config.json"
    ((WARNINGS++))
  else
    echo "  ✅ No forbidden 'claude' references in llm_config.json"
  fi
else
  echo "  ⚠️  WARNING: .ai/llm_config.json not found"
  ((WARNINGS++))
fi
echo ""

# Check .contextignore has required includes
echo "📝 Checking .contextignore..."
if [ -f .contextignore ]; then
  REQUIRED_PATTERNS=(
    "ARCHITECTURE.md"
    ".ai/MASTER_RULES.md"
    ".ai/AGENT_ONBOARDING.md"
    ".ai/AI_TASKS.md"
    ".ai/llm_config.json"
  )

  for pattern in "${REQUIRED_PATTERNS[@]}"; do
    # Check for either anchored (!/pattern) or unanchored (!pattern)
    if grep -q "^!/$pattern" .contextignore 2>/dev/null || \
       grep -q "^!$pattern" .contextignore 2>/dev/null; then
      echo "  ✅ Found: !$pattern"
    else
      echo "  ❌ MISSING: !$pattern"
      ((ERRORS++))
    fi
  done
else
  echo "  ⚠️  WARNING: .contextignore not found"
  ((WARNINGS++))
fi
echo ""

# Summary
echo "──────────────────────────────────────"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ COMPLIANT"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  COMPLIANT WITH WARNINGS ($WARNINGS warning(s))"
  exit 0
else
  echo "❌ NON-COMPLIANT ($ERRORS error(s), $WARNINGS warning(s))"
  exit $ERRORS
fi

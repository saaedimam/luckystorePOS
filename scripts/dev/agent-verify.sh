#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

# Verify agent compliance with MASTER_RULES

ERRORS=0

if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi


for file in ARCHITECTURE.md .ai/MASTER_RULES.md .ai/AI_TASKS.md; do
  [ ! -f "$file" ] && echo "❌ MISSING: $file" && ((ERRORS++))
done

[ -z "$OLLAMA_PRO_API_KEY" ] && echo "❌ OLLAMA_PRO_API_KEY missing" && ((ERRORS++))
[ -z "$GEMINI_API_KEY" ] && echo "❌ GEMINI_API_KEY missing" && ((ERRORS++))

grep -q "claude" .ai/llm_config.json 2>/dev/null && echo "⚠️  Claude found in llm_config.json"

[ $ERRORS -eq 0 ] && echo "✅ Compliant" || echo "❌ $ERRORS violations"
exit $ERRORS

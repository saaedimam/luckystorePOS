#!/bin/bash
# AI Context Sync — Lucky Store POS

echo "🧠 Syncing AI context..."

# 1. Compress old memory
if [ -d .hermes/memory-hub/forensics/ ]; then
  find .hermes/memory-hub/forensics/ -name "*.log" -mtime +7 -exec gzip {} \; 2>/dev/null || true
fi

# 2. Update AI_TASKS.md with git status
echo "" >> .ai/AI_TASKS.md
echo "---" >> .ai/AI_TASKS.md
echo "## Git Status ($(date +%Y-%m-%d))" >> .ai/AI_TASKS.md
git status --short >> .ai/AI_TASKS.md

# 3. Check token usage (if logs exist)
if [ -d .hermes/memory-hub/forensics/ ]; then
  echo "📊 Token usage yesterday:"
  grep -h "tokens:" .hermes/memory-hub/forensics/\$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d yesterday +%Y-%m-%d).log 2>/dev/null | tail -5 || echo "No token logs found"
fi

# 4. Pull latest from Supabase (if npx exists)
if command -v npx &> /dev/null; then
  echo "🔄 Syncing Supabase schema..."
  npx supabase db pull --schema public 2>/dev/null || echo "Skipping Supabase sync"
fi

echo "✅ Context ready"

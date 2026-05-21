#!/bin/bash
# AI Checkpoint — Lucky Store POS

echo "💾 Creating AI checkpoint..."

# 1. Save current AI_TASKS.md
cp .ai/AI_TASKS.md .ai/memory/checkpoints/\$(date +%Y%m%d-%H%M).md

# 2. Commit AI metadata
git add .ai/ .hermes/ 2>/dev/null || true
git commit -m "checkpoint: AI session \$(date +%Y%m%d)" --no-verify 2>/dev/null || echo "Nothing to commit"

# 3. Rotate logs
find .ai/outputs/ -mtime +14 -delete 2>/dev/null || true

echo "✅ Checkpoint saved at .ai/memory/checkpoints/\$(date +%Y%m%d-%H%M).md"

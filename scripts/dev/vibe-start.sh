#!/bin/bash
# scripts/dev/vibe-start.sh — Start a vibe coding session
# Usage: ./scripts/dev/vibe-start.sh [session-name]

set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

SESSION_NAME="${1:-$(date +%Y%m%d-%H%M)}"
SESSION_DIR=".vibe/current"

echo "🎵 Starting Vibe Session: $SESSION_NAME"

# 1. Archive previous session
if [ -d "$SESSION_DIR" ]; then
  PREV_NAME=$(basename "$SESSION_DIR")
  ARCHIVE_DIR=".vibe/history/$(date +%Y%m%d-%H%M)"
  mkdir -p "$ARCHIVE_DIR"
  mv "$SESSION_DIR"/* "$ARCHIVE_DIR/" 2>/dev/null || true
  rmdir "$SESSION_DIR" 2>/dev/null || true
  echo "📦 Archived previous session to $ARCHIVE_DIR"
fi

# 2. Create new session
mkdir -p "$SESSION_DIR"

# 3. Generate context
cat > "$SESSION_DIR/context.md" << EOF
# Vibe Session: $SESSION_NAME

**Started:** $(date '+%Y-%m-%d %H:%M:%S')
**Branch:** $(git branch --show-current 2>/dev/null || echo 'unknown')
**Last commit:** $(git log -1 --pretty=format:"%h %s" 2>/dev/null || echo 'none')

## Active Tasks
$(grep "^| T" .ai/AI_TASKS.md 2>/dev/null | head -3 || echo "No active tasks")

## Uncommitted Changes
$(git status --short 2>/dev/null | wc -l | xargs echo) files modified

## Model Routing
| Task | Model | Cost |
|------|-------|------|
| Quick questions | Ollama Pro llama3.1:8b | Free |
| Code generation | Ollama Pro codellama:70b | Free |
| Code review | Ollama Pro gemma2:27b | Free |
| Architecture review | Gemini Flash | \$0.075/1K |
| Deep research | Gemini Pro | \$0.15/1K |
| Polish/Synth | Gemini Flash | \$0.075/1K |

## Quick Commands
\`\`\`bash
# Questions
ask "how do I use Zustand with persistence?"

# Code generation
gen "create a React form component with validation"

# Research
research "best practices for offline-first sync"

# Polish code
polish "refactor this to use composition over inheritance"

# Smart router
ai code "generate a POS checkout screen"
\`\`\`
EOF

# 4. Create plan.md template
cat > "$SESSION_DIR/plan.md" << 'EOF'
# Session Plan

## Goal
<!-- What are we building/fixing today? -->

## Steps
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Models to Use
- [ ] Ollama Pro (code/review)
- [ ] Gemini Flash/Pro (architecture/research)

## Notes
<!-- Scratchpad -->
EOF

# 5. Create scratchpad.md
cat > "$SESSION_DIR/scratchpad.md" << 'EOF'
# Scratchpad

## Ideas

## Blockers

## Decisions

## Code Snippets
EOF

echo ""
echo "✅ Vibe session ready at $SESSION_DIR/"
echo ""
echo "📁 Session files:"
echo "   context.md    → Session overview"
echo "   plan.md       → Your task plan"
echo "   scratchpad.md → Notes & ideas"
echo ""
echo "🚀 Quick start:"
echo "   source scripts/dev/ai-helper.sh"
echo "   cat $SESSION_DIR/context.md"
echo ""

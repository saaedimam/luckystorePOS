#!/usr/bin/env bash
# strict-mode-init.sh
# Initializes ATOM Strict Mode state on top of base token-saver.
# Usage: bash token-saver-strict/strict-mode-init.sh [--limit 1000] [--per-turn 100]
# Defaults: 1000 token session, 100 tokens/turn (70 input / 30 output)
set -euo pipefail

STATE=".agent-state"
SESSION_LIMIT="${2:-1000}"
PER_TURN="${4:-100}"
INPUT_CEIL=70
OUTPUT_CEIL=30

# Parse optional flags
while [[ $# -gt 0 ]]; do
  case $1 in
    --limit)    SESSION_LIMIT="$2"; shift 2 ;;
    --per-turn) PER_TURN="$2"; INPUT_CEIL=$(( PER_TURN * 70 / 100 )); OUTPUT_CEIL=$(( PER_TURN * 30 / 100 )); shift 2 ;;
    *) shift ;;
  esac
done

# Guard: base token-saver must be initialized first
if [ ! -f "$STATE/runtime.json" ]; then
  echo "[ERROR] Base token-saver not initialized."
  echo "        Run: bash token-saver/references/runtime-detection.sh"
  exit 1
fi

# Write budget config
cat > "$STATE/budget.json" <<EOF
{
  "session_token_limit": ${SESSION_LIMIT},
  "per_turn_limit": ${PER_TURN},
  "input_ceiling": ${INPUT_CEIL},
  "output_ceiling": ${OUTPUT_CEIL},
  "tokens_used": 0,
  "turns_taken": 0,
  "compression_events": 0,
  "mode": "strict",
  "session_start": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Initialize empty turn ledger
echo "[]" > "$STATE/turn_ledger.json"

# Overwrite snapshot with strict format template
cat > "$STATE/context_snapshot.md" <<EOF
## STRICT SNAPSHOT — T0
task: (none)
files: (none)
risk: (none)
EOF

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        ATOM STRICT MODE ACTIVATED            ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Session budget : ${SESSION_LIMIT} tokens                  ║"
echo "║  Per-turn limit : ${PER_TURN} tokens (${INPUT_CEIL} in / ${OUTPUT_CEIL} out)     ║"
echo "║  Compression    : silent, automatic          ║"
echo "║  Session halt   : NEVER                      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "State written to $STATE/budget.json"
echo "Turn ledger at   $STATE/turn_ledger.json"
echo ""
echo "To deactivate: set \"mode\": \"standard\" in $STATE/budget.json"

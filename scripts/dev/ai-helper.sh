#!/bin/bash
# AI Helper — Ollama Cloud + Gemini

OLLAMA_API_KEY="${OLLAMA_API_KEY:-${OLLAMA_PRO_API_KEY}}"

# ─── Ollama Cloud API (using /api/generate) ──────────────────────────────────
ask() {
  if [ -z "$OLLAMA_API_KEY" ]; then
    echo "❌ OLLAMA_API_KEY not set"
    return 1
  fi
  echo "💬 Ollama Cloud (gemma3:4b)..."
  curl -s https://ollama.com/api/generate \
    -H "Authorization: Bearer $OLLAMA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"gemma3:4b\",
      \"prompt\": \"$1\",
      \"stream\": false
    }" | jq -r '.response' 2>/dev/null || echo "❌ API error"
}

gen() {
  if [ -z "$OLLAMA_API_KEY" ]; then
    echo "❌ OLLAMA_API_KEY not set"
    return 1
  fi
  echo "🔨 Ollama Cloud (qwen3-coder:480b)..."
  curl -s https://ollama.com/api/generate \
    -H "Authorization: Bearer $OLLAMA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"qwen3-coder:480b\",
      \"prompt\": \"$1\",
      \"stream\": false
    }" | jq -r '.response' 2>/dev/null || echo "❌ API error"
}

review() {
  if [ -z "$OLLAMA_API_KEY" ]; then
    echo "❌ OLLAMA_API_KEY not set"
    return 1
  fi
  echo "🔍 Ollama Cloud (kimi-k2.5)..."
  curl -s https://ollama.com/api/generate \
    -H "Authorization: Bearer $OLLAMA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"kimi-k2.5\",
      \"prompt\": \"$1\",
      \"stream\": false
    }" | jq -r '.response' 2>/dev/null || echo "❌ API error"
}

think() {
  if [ -z "$OLLAMA_API_KEY" ]; then
    echo "❌ OLLAMA_API_KEY not set"
    return 1
  fi
  echo "🧠 Ollama Cloud (kimi-k2-thinking)..."
  curl -s https://ollama.com/api/generate \
    -H "Authorization: Bearer $OLLAMA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"kimi-k2-thinking\",
      \"prompt\": \"$1\",
      \"stream\": false
    }" | jq -r '.response' 2>/dev/null || echo "❌ API error"
}

# ─── Gemini ─────────────────────────────────────────────────────────────────
gemini() {
  if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY not set"
    return 1
  fi
  echo "⚡ Gemini 2.5 Flash..."
  curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "{
      \"contents\": [{\"parts\":[{\"text\":\"$1\"}]}],
      \"generationConfig\": {\"maxOutputTokens\":8192}
    }" | jq -r '.candidates[0].content.parts[0].text'
}

gemini_pro() {
  if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY not set"
    return 1
  fi
  echo "🧠 Gemini 2.5 Pro..."
  curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=$GEMINI_API_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "{
      \"contents\": [{\"parts\":[{\"text\":\"$1\"}]}],
      \"generationConfig\": {\"maxOutputTokens\":8192}
    }" | jq -r '.candidates[0].content.parts[0].text'
}

# ─── Smart Router ───────────────────────────────────────────────────────────
ai() {
  local task="$1"
  local prompt="$2"

  case "$task" in
    quick|ask|hello|what|how|explain)
      ask "$prompt" ;;
    code|gen|write|fix|refactor|component|function)
      gen "$prompt" ;;
    review|check|lint|audit|scan)
      review "$prompt" ;;
    deep|complex|analyze|thinking|reason)
      think "$prompt" ;;
    research|compare|synthesize|polish|refine)
      gemini_pro "$prompt" ;;
    *)
      gemini "$prompt" ;;  # Default to Gemini Flash
  esac
}

export -f ask gen review think gemini gemini_pro ai

echo ""
echo "🤖 AI Helper — Ollama Cloud + Gemini"
echo "======================================"
echo "  ask 'question'        → Ollama gemma3:4b           💰 Free"
echo "  gen 'code'            → Ollama qwen3-coder:480b  💰 Free"
echo "  review 'code'         → Ollama kimi-k2.5         💰 Free"
echo "  think 'complex'       → Ollama kimi-k2-thinking  💰 Free"
echo "  gemini 'prompt'       → Gemini 2.5 Flash         💵 ~$0.01"
echo "  gemini_pro 'prompt'   → Gemini 2.5 Pro             💵 ~$0.05"
echo "  ai <task> 'prompt'    → Smart router"
echo ""

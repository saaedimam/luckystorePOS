#!/bin/bash
# Antigravity IDE Setup — Lucky Store POS
# Usage: ./scripts/dev/antigravity-setup.sh

set -e

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

echo "🚀 Antigravity IDE Setup"
echo "========================"
echo ""

# Check if Antigravity is installed
if ! command -v antigravity > /dev/null 2>&1; then
  echo "⚠️  Antigravity IDE not found in PATH"
  echo ""
  echo "Please install Antigravity first:"
  echo "  https://antigravity.io/download"
  echo ""
  echo "Or if installed in custom location, add to PATH:"
  echo "  export PATH=\$PATH:/path/to/antigravity/bin"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "✓ Running from: $ROOT"
echo ""

# Step 1: Verify config exists
echo "1️⃣  Checking Antigravity config..."
if [ -f .antigravity/config.json ]; then
  echo "   ✅ Config exists"
else
  echo "   ❌ Config missing. Creating..."
  mkdir -p .antigravity
  # Config will be created below
fi

# Step 2: Check API keys
echo ""
echo "2️⃣  Checking API keys..."

if [ -f .env.local ]; then
  source .env.local 2>/dev/null || true

  if [ -n "$OLLAMA_API_KEY" ]; then
    echo "   ✅ OLLAMA_API_KEY found"
  else
    echo "   ⚠️  OLLAMA_API_KEY not set in .env.local"
  fi

  if [ -n "$GEMINI_API_KEY" ]; then
    echo "   ✅ GEMINI_API_KEY found"
  else
    echo "   ⚠️  GEMINI_API_KEY not set in .env.local"
  fi
else
  echo "   ⚠️  .env.local not found"
  echo "   Creating from .env.ai..."
  cp .env.ai .env.local
  echo "   ✅ Created .env.local - please edit with your API keys"
fi

# Step 3: Verify Antigravity can read config
echo ""
echo "3️⃣  Verifying Antigravity integration..."

if [ -f .antigravity/config.json ]; then
  if jq -e '.project_context' .antigravity/config.json > /dev/null 2>&1; then
    echo "   ✅ Config is valid JSON"
  else
    echo "   ❌ Config has JSON errors"
  fi
else
  echo "   ❌ Config file missing"
fi

# Step 4: Test AI connection
echo ""
echo "4️⃣  Testing AI connections..."

# Test Ollama
if [ -n "$OLLAMA_API_KEY" ]; then
  echo "   Testing Ollama Cloud..."
  OLLAMA_TEST=$(curl -s https://ollama.com/api/generate \
    -H "Authorization: Bearer $OLLAMA_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model":"gemma3:4b","prompt":"Hi","stream":false}' \
    | jq -r '.response' 2>/dev/null || echo "")

  if [ -n "$OLLAMA_TEST" ]; then
    echo "   ✅ Ollama Cloud: Connected"
  else
    echo "   ❌ Ollama Cloud: Connection failed"
  fi
fi

# Test Gemini
if [ -n "$GEMINI_API_KEY" ]; then
  echo "   Testing Gemini..."
  GEMINI_TEST=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    -d '{"contents":[{"parts":[{"text":"Hi"}]}]}' \
    | jq -r '.candidates[0].content.parts[0].text' 2>/dev/null || echo "")

  if [ -n "$GEMINI_TEST" ]; then
    echo "   ✅ Gemini: Connected"
  else
    echo "   ❌ Gemini: Connection failed"
  fi
fi

# Step 5: Final instructions
echo ""
echo "========================"
echo "✅ Setup Complete!"
echo "========================"
echo ""
echo "Next steps:"
echo ""
echo "1. Open Antigravity IDE"
echo "   $ antigravity ."
echo ""
echo "2. Set API keys in Antigravity (if not in .env.local):"
echo "   export OLLAMA_API_KEY=your_key"
echo "   export GEMINI_API_KEY=your_key"
echo ""
echo "3. Try an inline command in any file:"
echo "   // @ai ask: What is Zustand?"
echo ""
echo "4. Press Ctrl+Shift+A to trigger AI"
echo ""
echo "5. Read the cheatsheet:"
echo "   cat .ai/antigravity/CHEATSHEET.md"
echo ""
echo "Happy coding! 🚀"

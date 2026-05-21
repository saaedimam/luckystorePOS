#!/bin/bash
# Gemini API Authentication Setup — Lucky Store POS
# Usage: ./scripts/dev/auth-gemini.sh

set -e

cd "$(dirname "$0")/../.."

echo "🔐 Gemini API Authentication Setup"
echo "==================================="
echo ""

# Check if already configured
if [ -f .env.local ] && grep -q "GEMINI_API_KEY" .env.local; then
  echo "✅ GEMINI_API_KEY found in .env.local"
  echo ""
  echo "Testing connection..."

  GEMINI_KEY=$(grep "GEMINI_API_KEY" .env.local | cut -d '=' -f2)

  # Test API call
  RESPONSE=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=$GEMINI_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    -d '{
      "contents": [{"parts":[{"text":"Hello, Gemini!"}]}],
      "generationConfig": {"maxOutputTokens":100}
    }' 2>/dev/null)

  if echo "$RESPONSE" | jq -e '.candidates[0].content.parts[0].text' > /dev/null 2>&1; then
    echo "✅ Gemini API connection successful!"
    echo ""
    echo "Response: $(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text')"
  else
    echo "❌ Gemini API connection failed"
    echo "Error: $(echo "$RESPONSE" | jq -r '.error.message' 2>/dev/null || echo "$RESPONSE")"
    exit 1
  fi

  exit 0
fi

echo "📝 Setup Instructions:"
echo ""
echo "1. Get your API key from Google AI Studio:"
echo "   https://aistudio.google.com/app/apikey"
echo ""
echo "2. Create a new API key (or use existing)"
echo ""
echo "3. Copy it and run:"
echo "   echo 'GEMINI_API_KEY=your_actual_key_here' >> .env.local"
echo ""
echo "4. Test with: ./scripts/dev/auth-gemini.sh"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "🆕 Creating .env.local from template..."
  cp .env.ai .env.local
  echo "✅ Created .env.local — edit it with your API keys"
else
  echo "⚠️  .env.local exists but GEMINI_API_KEY not set"
  echo "   Add this line to .env.local:"
  echo "   GEMINI_API_KEY=your_actual_key_here"
fi

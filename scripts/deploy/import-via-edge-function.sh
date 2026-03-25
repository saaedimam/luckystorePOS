#!/bin/bash
# Import Shwapno products using the edge function
# This imports products, then we'll add competitor prices separately

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNja3NjaGlleHp2eXN2ZHJhY3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDA3NjMsImV4cCI6MjA3ODk3Njc2M30.1htIKuXVNs9mtRSktS2cBk2QvAriXpYgipIYuVuI3T8"
FUNCTION_URL="https://cckschiexzvysvdracvc.supabase.co/functions/v1/import-inventory"
CSV_DIR="Docs/Competitors Price"

echo "🚀 Importing Shwapno Products via Edge Function"
echo ""

# Get all CSV files
files=(
  "shwapno-bakingneeds.csv"
  "shwapno-beverage.csv"
  "shwapno-breakfast.csv"
  "shwapno-candy&chocolate.csv"
  "shwapno-dairy.csv"
  "shwapno-eggs.csv"
  "shwapno-icecream.csv"
  "shwapno-products (1).csv"
  "shwapno-snacks.csv"
)

total_imported=0
total_errors=0

for file in "${files[@]}"; do
  filepath="$CSV_DIR/$file"
  
  if [ ! -f "$filepath" ]; then
    echo "⚠️  File not found: $filepath"
    continue
  fi
  
  echo "📄 Importing: $file"
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "apikey: $ANON_KEY" \
    -F "file=@$filepath")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -eq 200 ]; then
    items=$(echo "$body" | grep -o '"items_inserted":[0-9]*' | grep -o '[0-9]*')
    updated=$(echo "$body" | grep -o '"items_updated":[0-9]*' | grep -o '[0-9]*')
    echo "   ✅ Items inserted: ${items:-0}"
    echo "   ✅ Items updated: ${updated:-0}"
    total_imported=$((total_imported + ${items:-0} + ${updated:-0}))
  else
    echo "   ❌ Error (HTTP $http_code)"
    echo "$body" | head -3
    total_errors=$((total_errors + 1))
  fi
  
  echo ""
  sleep 1  # Rate limiting
done

echo "📊 Summary:"
echo "   ✅ Total items processed: $total_imported"
echo "   ⚠️  Errors: $total_errors"
echo ""
echo "💡 Next step: Run the competitor prices script to add Shwapno prices"
echo "   node scripts/add-competitor-prices.js"


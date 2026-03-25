#!/bin/bash
# Simple curl test for import-inventory function

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEFAULT_CSV="$REPO_ROOT/data/samples/test-sample.csv"

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNja3NjaGlleHp2eXN2ZHJhY3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDA3NjMsImV4cCI6MjA3ODk3Njc2M30.1htIKuXVNs9mtRSktS2cBk2QvAriXpYgipIYuVuI3T8"
FUNCTION_URL="https://cckschiexzvysvdracvc.supabase.co/functions/v1/import-inventory"
CSV_FILE="${1:-$DEFAULT_CSV}"

echo "Testing import-inventory function..."
echo "File: $CSV_FILE"
echo ""

curl -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -F "file=@$CSV_FILE" \
  -w "\n\nHTTP Status: %{http_code}\n"


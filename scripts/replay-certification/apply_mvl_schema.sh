#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: ./apply_mvl_schema.sh [YOUR_DB_PASSWORD]"
  exit 1
fi

export SUPABASE_DB_PASSWORD="$1"
echo "Applying MVL schema to Staging..."

npx supabase db query -f supabase/migrations/20260521000003_safe_online_orders.sql --linked

echo "Schema successfully applied to Staging!"

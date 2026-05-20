#!/bin/bash
# Wrapper to avoid ENAMETOOLONG in Gemini CLI permission parser

# Replace [YOUR_DB_PASSWORD] with your actual staging database password
export SUPABASE_DB_PASSWORD="[YOUR_DB_PASSWORD]"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bXl4eWNjZm5rcmJ4cWJobG5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM3MTAyMywiZXhwIjoyMDg5OTQ3MDIzfQ.6upBdBJ2FZdh4pve6Q9cBdnVaT7Uigh_G_BfZkOZ96I"

npm run replay:certify

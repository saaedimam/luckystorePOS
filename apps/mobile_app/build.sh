#!/bin/bash
echo "SUPABASE_URL=$SUPABASE_URL" > .env
echo "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> .env
echo "MANAGER_EMAIL=$MANAGER_EMAIL" >> .env
echo "MANAGER_PASSWORD=$MANAGER_PASSWORD" >> .env
echo "ADMIN_EMAIL=$ADMIN_EMAIL" >> .env
echo "ADMIN_PASSWORD=$ADMIN_PASSWORD" >> .env
echo "DEFAULT_STORE_ID=4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd" >> .env
./flutter/bin/flutter gen-l10n
./flutter/bin/flutter build web --release


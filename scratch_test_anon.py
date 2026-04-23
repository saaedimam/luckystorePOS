import requests
import json

supabase_url = "https://hvmyxyccfnkrbxqbhlnm.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bXl4eWNjZm5rcmJ4cWJobG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzEwMjMsImV4cCI6MjA4OTk0NzAyM30.8_H6GaToDmslFcjitqaPyJd_N-bUaIPUC2tnC1_pwfI"

headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}",
    "Content-Type": "application/json",
}

def call_rpc(rpc_name, params):
    url = f"{supabase_url}/rest/v1/rpc/{rpc_name}"
    response = requests.post(url, headers=headers, json=params)
    print(f"\n--- RPC {rpc_name} (ANON) ---")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}...")

call_rpc("search_items_pos", {
    "p_store_id": "4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd",
    "p_query": "",
    "p_limit": 5
})

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = (import.meta as unknown as { env: { VITE_SUPABASE_URL: string } }).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as unknown as { env: { VITE_SUPABASE_ANON_KEY: string } }).env.VITE_SUPABASE_ANON_KEY;

let _client: ReturnType<typeof createClient<Database>> | null = null;

function getClient() {
  if (!_client) {
    _client = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

// Export a proxy so we can use `supabase.from` without initializing immediately
export const supabase = new Proxy({} as unknown as ReturnType<typeof createClient<Database>>, {
  get: (target, prop) => {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  }
});

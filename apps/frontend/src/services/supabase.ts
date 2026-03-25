import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Log environment variable status (only in dev)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config:', {
    url: supabaseUrl ? '✅ Present' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Present' : '❌ Missing',
    urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'N/A'
  })
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  })
  console.error('💡 Make sure you have a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Create Supabase client with auth persistence
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-client-info': 'lucky-pos@1.0.0'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// Log connection status
if (import.meta.env.DEV) {
  console.log('✅ Supabase client initialized')
}



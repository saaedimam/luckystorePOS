import { createBrowserClient } from '@supabase/ssr'

function getPublishableKey(): string {
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  if (!key) {
    throw new Error(
      'Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
    )
  }
  return key
}

export function createClient() {
  return createBrowserClient(import.meta.env.VITE_SUPABASE_URL!, getPublishableKey())
}

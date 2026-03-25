import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'

function getPublishableKey(): string {
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  if (!key) {
    throw new Error(
      'Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
    )
  }
  return key
}

export function createClient(request: Request) {
  const headers = new Headers()

  const supabase = createServerClient(
    process.env.VITE_SUPABASE_URL!,
    getPublishableKey(),
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '') as {
            name: string
            value: string
          }[]
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
          )
        },
      },
    }
  )

  return { supabase, headers }
}

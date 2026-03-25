/** Shims for Supabase Edge (Deno) when TypeScript analyzes this folder without the Deno LSP. */
declare module 'jsr:@supabase/functions-js/edge-runtime.d.ts' {}

declare const Deno: {
  env: { get(key: string): string | undefined }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void
}

declare module 'https://esm.sh/xlsx@0.18.5' {
  export const SSF: any
  export function read(...args: any[]): any
  export const utils: any
}

declare module 'https://esm.sh/@supabase/supabase-js@2.38.4' {
  /** Loose return: full typings come from Deno / deploy; this is for the TS language service only. */
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): any
}

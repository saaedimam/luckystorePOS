// ============================================================================
// To generate the true types, run the following command on your local machine
// (where Docker is accessible) inside the project root:
//
// supabase gen types typescript --local > apps/admin_web/src/types/database.ts
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: unknown
    }
    Views: {
      [key: string]: unknown
    }
    Functions: {
      [key: string]: unknown
    }
    Enums: {
      [key: string]: unknown
    }
    CompositeTypes: {
      [key: string]: unknown
    }
  }
}

/**
 * Manually defined Supabase types for LuckyStorePOS.
 * This acts as a fallback when 'supabase gen types' is unavailable.
 */

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
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone_whatsapp: string | null
          credit_limit: number
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone_whatsapp?: string | null
          credit_limit?: number
          balance?: number
        }
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          category_id: string | null
          name_en: string
          name_bn: string | null
          sku: string | null
          price: number
          cost: number
          stock_qty: number
          reorder_point: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          category_id?: string | null
          name_en: string
          name_bn?: string | null
          sku?: string | null
          price: number
          cost?: number
          stock_qty?: number
          reorder_point?: number
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      sales: {
        Row: {
          id: string
          store_id: string
          cashier_id: string
          customer_id: string | null
          status: string
          total: number
          discount: number
          payment_method: string | null
          invoice_sent_via: string | null
          invoice_sent_at: string | null
          offline_created_at: string | null
          synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          cashier_id: string
          customer_id?: string | null
          status?: string
          total?: number
          discount?: number
          payment_method?: string | null
          invoice_sent_via?: string | null
          invoice_sent_at?: string | null
          offline_created_at?: string | null
          synced_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['sales']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

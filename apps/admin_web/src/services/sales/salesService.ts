import { supabase } from '../../lib/supabase';
import { SalesHistoryRow, SaleDetailsResponse } from '../../types/rpc';

export const salesService = {
  async getHistory(storeId: string, searchQuery?: string, startDate?: string, endDate?: string, limit = 50, offset = 0) {
    if (!storeId) throw new Error("Store ID is required");
    
    const { data, error } = await supabase.rpc('get_sales_history', {
      p_store_id: storeId,
      p_search_query: searchQuery || '',
      p_start_date: startDate || new Date(0).toISOString(),
      p_end_date: endDate || new Date().toISOString(),
      p_limit: limit,
      p_offset: offset
    });

    if (error) throw error;
    return data as SalesHistoryRow[];
  },

  async getDetails(saleId: string) {
    if (!saleId) throw new Error("Sale ID is required");
    
    const { data, error } = await supabase.rpc('get_sale_details', {
      p_sale_id: saleId
    });

    if (error) throw error;
    const responseData = data as unknown as SaleDetailsResponse;
    if (!responseData || !responseData.sale) throw new Error('Sale not found');
    return responseData;
  },

  async voidSale(saleId: string, reason: string, idempotencyKey: string) {
    if (!saleId) throw new Error("Sale ID is required");
    
    const { data, error } = await supabase.rpc('void_sale', {
      p_sale_id: saleId,
      p_reason: reason,
      p_idempotency_key: idempotencyKey
    });

    if (error) throw error;
    return data;
  },

  async updateWhatsAppInfo(saleId: string, whatsapp: string, pdfUrl: string) {
    const { error } = await supabase
      .from('sales')
      .update({
        customer_whatsapp: whatsapp,
        invoice_pdf_url: pdfUrl,
        invoice_sent_via: 'whatsapp',
        invoice_sent_at: new Date().toISOString(),
        // @ts-expect-error - These columns exist in the DB but the generated types are out of sync
      })
      .eq('id', saleId);

    if (error) throw error;
  }
};

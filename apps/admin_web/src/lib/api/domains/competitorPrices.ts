import { supabase } from '../../supabase';
import type {
  CompetitorPrice,
  PriceAlert,
  CompetitorPriceFormData,
  CompetitorPriceFilters,
} from '../types';

export async function fetchCompetitorPrices(
  storeId: string,
  filters?: CompetitorPriceFilters
): Promise<CompetitorPrice[]> {
  let query = supabase
    .from('competitor_prices')
    .select(`
      id,
      store_id,
      product_id,
      product_name,
      product_sku,
      competitor_name,
      competitor_product_id,
      competitor_product_url,
      competitor_price,
      competitor_original_price,
      currency,
      our_price,
      price_gap_percent,
      scraped_at,
      scrape_batch_id,
      scrape_status,
      error_message,
      raw_data,
      created_at,
      updated_at
    `)
    .eq('store_id', storeId)
    .order('scraped_at', { ascending: false });

  if (filters?.itemId) {
    query = query.eq('product_id', filters.itemId);
  }
  if (filters?.competitorName) {
    query = query.ilike('competitor_name', `%${filters.competitorName}%`);
  }
  if (filters?.dateFrom) {
    query = query.gte('scraped_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('scraped_at', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as CompetitorPrice[];
}

export async function fetchPriceAlerts(
  storeId: string,
  threshold: number = 0.15
): Promise<PriceAlert[]> {
  const { data, error } = await supabase.rpc('check_price_alerts', {
    p_store_id: storeId,
    p_threshold: threshold,
  });

  if (error) throw error;
  return data || [];
}

export async function addCompetitorPrice(
  storeId: string,
  data: CompetitorPriceFormData
): Promise<void> {
  const { error } = await supabase.from('competitor_prices').insert({
    store_id: storeId,
    product_id: data.product_id,
    product_name: data.product_name,
    competitor_name: data.competitor_name,
    competitor_price: data.competitor_price,
    competitor_product_url: data.competitor_product_url || null,
    scraped_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function updateCompetitorPrice(
  id: string,
  data: Partial<CompetitorPriceFormData>
): Promise<void> {
  const { error } = await supabase
    .from('competitor_prices')
    .update({
      ...data,
      competitor_product_url: data.competitor_product_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCompetitorPrice(id: string): Promise<void> {
  const { error } = await supabase
    .from('competitor_prices')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchCompetitorNames(storeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('competitor_prices')
    .select('competitor_name')
    .eq('store_id', storeId)
    .order('competitor_name');

  if (error) throw error;

  const names = [...new Set((data || []).map((d: any) => d.competitor_name))] as string[];
  return names;
}
/* DEPLOY TRIGGER 1780164778 */

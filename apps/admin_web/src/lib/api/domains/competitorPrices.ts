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
      *,
      items:product_id (name, sku)
    `)
    .eq('store_id', storeId)
    .order('scraped_at', { ascending: false });

  if (filters?.itemId) {
    query = query.eq('item_id', filters.itemId);
  }
  if (filters?.competitorName) {
    query = query.ilike('competitor_name', `%${filters.competitorName}%`);
  }
  if (filters?.dateFrom) {
    query = query.gte('last_updated', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('last_updated', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    item_id: row.product_id,
    item_name: row.product_name || row.items?.name,
    sku: row.product_sku || row.items?.sku,
    competitor_name: row.competitor_name,
    competitor_price: row.competitor_price,
    competitor_url: row.competitor_product_url,
    scraped_at: row.scraped_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
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
    product_id: data.item_id,
    competitor_name: data.competitor_name,
    competitor_price: data.competitor_price,
    competitor_product_url: data.competitor_url || null,
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
      competitor_product_url: data.competitor_url || null,
      scraped_at: new Date().toISOString(),
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

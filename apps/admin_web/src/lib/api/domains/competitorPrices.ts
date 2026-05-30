import { supabase } from '../../supabase';
import type {
  CompetitorPrice,
  PriceAlert,
  CompetitorPriceFormData,
  CompetitorPriceFilters,
} from '../types';

export async function fetchCompetitorPrices(
  filters?: CompetitorPriceFilters
): Promise<CompetitorPrice[]> {
  let query = supabase
    .from('competitor_prices')
    .select(`
      id,
      item_id,
      items!inner(name, sku),
      competitor_name,
      competitor_price,
      competitor_url,
      last_updated,
      created_at
    `)
    .order('last_updated', { ascending: false });

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
    item_id: row.item_id,
    item_name: row.items?.name || 'Unknown',
    sku: row.items?.sku,
    competitor_name: row.competitor_name,
    competitor_price: row.competitor_price,
    competitor_url: row.competitor_url,
    scraped_at: row.last_updated,
    created_at: row.created_at,
    updated_at: row.last_updated,
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
  data: CompetitorPriceFormData
): Promise<void> {
  const { error } = await supabase.from('competitor_prices').insert({
    item_id: data.item_id,
    competitor_name: data.competitor_name,
    competitor_price: data.competitor_price,
    competitor_url: data.competitor_url || null,
    last_updated: new Date().toISOString(),
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
      competitor_name: data.competitor_name,
      competitor_price: data.competitor_price,
      competitor_url: data.competitor_url || null,
      last_updated: new Date().toISOString(),
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

export async function fetchCompetitorNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from('competitor_prices')
    .select('competitor_name')
    .order('competitor_name');

  if (error) throw error;

  const names = [...new Set((data || []).map((d: any) => d.competitor_name))] as string[];
  return names;
}
/* DEPLOY TRIGGER 1780164778 */

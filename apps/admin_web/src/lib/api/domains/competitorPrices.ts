import { supabase } from '../../supabase';
import type {
  CompetitorPrice,
  PriceAlert,
  CompetitorPriceFormData,
  CompetitorPriceFilters,
} from '../types';
import type { Database } from '../../database.types';

type CompetitorPriceRow = Database['public']['Tables']['competitor_prices']['Row'] & {
  items?: { name: string; sku: string } | null;
};

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

  return ((data as CompetitorPriceRow[]) || []).map((row) => ({
    id: row.id,
    product_id: row.product_id || '',
    item_name: row.items?.name,
    sku: row.items?.sku,
    competitor_name: row.competitor_name,
    competitor_price: row.competitor_price,
    competitor_url: row.competitor_product_url,
    scraped_at: row.scraped_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}
interface PriceAlertRow {
  product_id: string;
  product_name: string;
  our_price: number;
  market_avg_price: number;
  price_gap_percent: number;
  competitors: string[];
}

export async function fetchPriceAlerts(
  storeId: string,
  threshold: number = 0.15
): Promise<PriceAlert[]> {
  const { data, error } = await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)('get_price_alerts', {
    p_store_id: storeId,
    p_threshold: threshold,
  });

  if (error) throw error;

  return ((data as PriceAlertRow[]) || []).map((row) => ({
    product_id: row.product_id,
    product_name: row.product_name,
    our_price: Number(row.our_price),
    market_avg_price: Number(row.market_avg_price),
    price_gap_percent: Number(row.price_gap_percent),
    competitors: row.competitors || [],
  }));
}

export async function addCompetitorPrice(
  storeId: string,
  data: CompetitorPriceFormData
): Promise<void> {
  const { error } = await supabase.from('competitor_prices').insert({
    store_id: storeId,
    product_id: data.product_id,
    competitor_name: data.competitor_name,
    competitor_price: data.competitor_price,
    competitor_product_url: data.competitor_url || null,
    scraped_at: new Date().toISOString(),
  } as unknown as Database['public']['Tables']['competitor_prices']['Insert']);

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
      updated_at: new Date().toISOString(),
    } as unknown as Database['public']['Tables']['competitor_prices']['Update'])
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

  const names = [...new Set((data || []).map((d) => d.competitor_name))] as string[];
  return names;
}

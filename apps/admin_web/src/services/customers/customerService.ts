import { supabase } from '../../lib/supabase';

export const customerService = {
  async getCustomers(tenantId: string, searchQuery?: string) {
    if (!tenantId) throw new Error("Tenant ID is required");

    let query = supabase.from('customers').select('*').eq('tenant_id', tenantId).order('name', { ascending: true });

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};

import { supabase } from '../../supabase';
import type { ProductCreateInput, ProductUpdateInput } from '../types';
import type { Database } from '../../database.types';

export const products = {
  list: async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*, categories(name)')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    return data;
  },
  get: async (id: string) => {
    const { data, error } = await supabase.from('items').select('*, categories(*)').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  create: async (product: ProductCreateInput) => {
    const { data, error } = await supabase.from('items').insert(product as unknown as Database['public']['Tables']['items']['Insert']).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: ProductUpdateInput) => {
    const { data, error } = await supabase.from('items').update(updates as unknown as Database['public']['Tables']['items']['Update']).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  remove: async (id: string) => {
    const { data, error } = await supabase.from('items').update({ active: false }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

export const categories = {
  list: async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data;
  },
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { ExpenseData } from '../../schemas/expense.schema';
import {  useAuth  } from '../../hooks/useAuth';

export function useCreateExpense() {
  const { storeId, tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ExpenseData) => {
      if (!storeId || !tenantId) throw new Error('Missing authentication context');

      const { data: result, error } = await supabase
        .from('expenses')
        .insert({
          tenant_id: tenantId,
          store_id: storeId,
          category: data.categoryId, // Map categoryId to category string
          amount: data.amount,
          description: data.description,
          expense_date: data.date,
          payment_type: data.paymentMethod,
          vendor_name: 'General', // Default vendor name if not in schema
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    }
  });
}

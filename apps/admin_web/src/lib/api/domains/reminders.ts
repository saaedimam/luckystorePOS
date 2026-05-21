import { supabase } from '../../supabase';
import { mapReminder, mapReminders } from '../mappers';

export const reminders = {
  list: async (storeId: string, includeCompleted = false) => {
    const { data, error } = await supabase.rpc('get_upcoming_reminders', {
      p_store_id: storeId,
      p_include_completed: includeCompleted,
    });
    if (error) throw error;
    return mapReminders(data);
  },
  create: async (params: {
    tenantId: string;
    storeId: string;
    title: string;
    description?: string | null;
    reminderDate: string;
    reminderType: string;
    createdBy?: string | null;
  }) => {
    const { data, error } = await supabase.rpc('create_reminder', {
      p_tenant_id: params.tenantId,
      p_store_id: params.storeId,
      p_title: params.title,
      p_description: params.description || '',
      p_reminder_date: params.reminderDate,
      p_reminder_type: params.reminderType,
      p_created_by: params.createdBy ?? undefined,
    });
    if (error) throw error;
    return mapReminder(data);
  },
  update: async (params: {
    reminderId: string;
    title?: string;
    description?: string | null;
    reminderDate?: string;
    reminderType?: string;
    isCompleted?: boolean;
  }) => {
    const { data, error } = await supabase.rpc('update_reminder', {
      p_reminder_id: params.reminderId,
      p_title: params.title ?? undefined,
      p_description: params.description ?? undefined,
      p_reminder_date: params.reminderDate ?? undefined,
      p_reminder_type: params.reminderType ?? undefined,
      p_is_completed: params.isCompleted ?? undefined,
    });
    if (error) throw error;
    return mapReminder(data);
  },
  delete: async (reminderId: string) => {
    const { data, error } = await supabase.rpc('delete_reminder', {
      p_reminder_id: reminderId,
    });
    if (error) throw error;
    return data;
  },
};
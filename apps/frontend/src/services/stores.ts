import { supabase } from './supabase'

export type Store = {
  id: string
  code: string
  name: string
  address: string | null
  timezone: string
  created_at: string
}

export type StoreFormData = {
  code: string
  name: string
  address?: string
  timezone?: string
}

// Stores CRUD
export async function getStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('code', { ascending: true })

  if (error) throw error
  return data as Store[]
}

export async function getStore(id: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Store
}

export async function createStore(store: StoreFormData) {
  const { data, error } = await supabase
    .from('stores')
    .insert({
      code: store.code,
      name: store.name,
      address: store.address || null,
      timezone: store.timezone || 'Asia/Dhaka',
    })
    .select()
    .single()

  if (error) throw error
  return data as Store
}

export async function updateStore(id: string, store: Partial<StoreFormData>) {
  const { data, error } = await supabase
    .from('stores')
    .update({
      code: store.code,
      name: store.name,
      address: store.address,
      timezone: store.timezone,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Store
}

export async function deleteStore(id: string) {
  const { error } = await supabase.from('stores').delete().eq('id', id)
  if (error) throw error
}

export async function checkStoreCodeUnique(code: string, excludeId?: string) {
  let query = supabase.from('stores').select('id').eq('code', code)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error
  return data.length === 0
}


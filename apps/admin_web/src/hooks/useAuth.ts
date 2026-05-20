import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  authId: string;
  tenantId: string;
  storeId: string;
  role: string;
  name: string | null;
}

export interface AuthContextValue {
  session: Session | null;
  user: AdminUser | null;
  tenantId: string;
  storeId: string;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

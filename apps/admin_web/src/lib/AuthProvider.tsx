import { AuthContext, type AdminUser, type AuthContextValue } from '../hooks/useAuth';
import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';



// ── Context ────────────────────────────────────────────────────────────────────



// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Resolve the admin user profile whenever the auth session changes.
    const resolveUser = async (s: Session | null) => {
      if (!s) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data: userRow, error } = await supabase
          .from('users')
          .select('id, auth_id, tenant_id, store_id, role, full_name, name')
          .eq('auth_id', s.user.id)
          .maybeSingle();

        if (error || !userRow) {
          console.error('[AuthContext] Could not load user profile:', error?.message);
          setUser(null);
          setLoading(false);
          return;
        }

        setUser({
          id: userRow.id as string,
          authId: userRow.auth_id as string,
          tenantId: userRow.tenant_id as string,
          storeId: userRow.store_id as string,
          role: (userRow.role as string) ?? 'viewer',
          name: (userRow.full_name ?? userRow.name) as string | null,
        });
      } catch (e) {
        console.error('[AuthContext] Unexpected error resolving user:', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Load initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      resolveUser(s);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(true);
      resolveUser(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    session,
    user,
    tenantId: user?.tenantId ?? '',
    storeId: user?.storeId ?? '',
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { LoginPage } from './LoginPage';

export function AuthGuard({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Checking session...</div>;
  if (!session) return <LoginPage />;

  return <>{children}</>;
}

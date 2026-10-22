import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  role: 'admin' | 'editor' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthState>(null as unknown as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AuthState['role']>(null);
  const [loading, setLoading] = useState(true);

  async function loadRole(s: Session | null) {
    if (!s) { setRole(null); return; }
    // El rol se consulta en la base de datos; las reglas RLS impiden falsificarlo desde el navegador.
    const { data } = await supabase.from('editors').select('role').eq('user_id', s.user.id).maybeSingle();
    setRole((data?.role as AuthState['role']) ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadRole(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => loadRole(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (/invalid login/i.test(error.message)) return 'Correo o contraseña incorrectos.';
      if (/rate|too many/i.test(error.message)) return 'Demasiados intentos. Esperá unos minutos y volvé a probar.';
      return 'No se pudo iniciar sesión: ' + error.message;
    }
    const { data: ed } = await supabase.from('editors').select('role').eq('user_id', data.user.id).maybeSingle();
    if (!ed) {
      await supabase.auth.signOut();
      return 'Esta cuenta no tiene permisos de edición.';
    }
    setRole(ed.role as AuthState['role']);
    return null;
  };

  const signOut = async () => { await supabase.auth.signOut(); setRole(null); };

  return <Ctx.Provider value={{ session, role, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

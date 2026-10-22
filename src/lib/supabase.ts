import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

// Si faltan las variables, se crea un cliente apuntando a una URL inválida:
// la interfaz mostrará un aviso claro en lugar de romperse.
export const supabase = createClient(url || 'https://configurar.invalid', key || 'sin-clave', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  global: { fetch: (...args: Parameters<typeof fetch>) => fetch(...args) },
});

export const functionsUrl = `${url ?? ''}/functions/v1`;

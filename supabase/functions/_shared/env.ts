// Utilidades compartidas por las Edge Functions de BIOQUNS (Deno).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
}

/** Clave secreta del proyecto (nuevo formato sb_secret_… o clave service_role heredada). */
function secretKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keys) {
    try { const k = JSON.parse(keys); return k.default ?? Object.values(k)[0]; } catch { /* sigue */ }
  }
  throw new Error('Falta la clave secreta de Supabase en el entorno de la función.');
}

/** Cliente con privilegios de servidor (salta RLS). Nunca se expone al navegador. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getSettings(db: SupabaseClient) {
  const { data } = await db.from('settings').select('key,value').in('key', ['general', 'newsletter', 'footer']);
  const m: Record<string, any> = {};
  for (const r of data ?? []) m[r.key] = r.value;
  return m as { general?: any; newsletter?: any; footer?: any };
}

export function siteUrl(settings: { general?: any }) {
  return (Deno.env.get('SITE_URL') || settings.general?.site_url || '').replace(/\/$/, '');
}

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

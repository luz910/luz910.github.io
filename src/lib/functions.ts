import { functionsUrl, supabase, supabaseConfigured } from './supabase';

/** Llama a una Edge Function de Supabase y devuelve un error legible si algo falla. */
export async function callFunction<T = unknown>(name: string, body: unknown, auth = false): Promise<T> {
  if (!supabaseConfigured) throw new Error('El sitio todavía no está conectado a la base de datos.');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
  if (auth) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Tu sesión expiró. Volvé a iniciar sesión.');
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${functionsUrl}/${name}`, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new Error('No hay conexión con el servidor. Probá de nuevo en unos minutos.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) throw new Error('El servicio todavía no está desplegado en el servidor (Edge Function "' + name + '").');
    throw new Error(json.error || 'Ocurrió un error inesperado. Probá de nuevo.');
  }
  return json as T;
}

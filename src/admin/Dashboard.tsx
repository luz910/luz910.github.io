import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { callFunction } from '../lib/functions';
import { useAuth } from '../lib/auth';
import { fmtShort } from '../lib/format';
import { RESOURCES } from './resources';
import { StatusBadge } from './StatusBadge';

export default function Dashboard() {
  const { session } = useAuth();
  const counts = useQuery({
    queryKey: ['dash-counts'],
    queryFn: async () => {
      const out: Record<string, { total: number; drafts: number }> = {};
      await Promise.all(RESOURCES.map(async (r) => {
        const [t, d] = await Promise.all([
          supabase.from(r.table).select('id', { count: 'exact', head: true }),
          supabase.from(r.table).select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        ]);
        out[r.key] = { total: t.count ?? 0, drafts: d.count ?? 0 };
      }));
      const s = await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active');
      out.subs = { total: s.count ?? 0, drafts: 0 };
      return out;
    },
  });
  const recent = useQuery({
    queryKey: ['dash-recent'],
    queryFn: async () => {
      const all = await Promise.all(RESOURCES.slice(0, 3).map(async (r) => {
        const { data } = await supabase.from(r.table).select('*').order('updated_at', { ascending: false }).limit(5);
        return (data ?? []).map((x: any) => ({ ...x, _r: r }));
      }));
      return all.flat().sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 8);
    },
  });
  const mail = useQuery({ queryKey: ['mail-status'], queryFn: () => callFunction<{ configured: boolean; problems: string[] }>('admin', { action: 'status' }, true), retry: 0 });
  const mailProblem = mail.error || (mail.data && (!mail.data.configured || mail.data.problems.length));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Hola 👋</h1>
      <p className="text-sm text-mute">Sesión iniciada como {session?.user.email}</p>
      {mailProblem && (
        <Link to="/admin/newsletter" className="mt-5 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" /><span className="flex-1"><strong>El envío de correos todavía no está activo.</strong> Las suscripciones se registran, pero no se envían confirmaciones ni avisos hasta configurar el servicio.</span><ArrowRight className="h-4 w-4" />
        </Link>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RESOURCES.map((r) => (
          <Link key={r.key} to={`/admin/${r.key}`} className="rounded-xl border border-line bg-white p-4 transition hover:border-orange/50">
            <p className="text-3xl font-extrabold text-ink">{counts.data?.[r.key]?.total ?? '–'}</p>
            <p className="text-sm font-semibold text-ink-soft">{r.label}</p>
            {!!counts.data?.[r.key]?.drafts && <p className="mt-1 text-xs text-amber-700">{counts.data[r.key].drafts} en borrador</p>}
          </Link>
        ))}
        <Link to="/admin/newsletter" className="rounded-xl border border-orange/40 bg-orange-soft p-4">
          <p className="text-3xl font-extrabold text-orange-deep">{counts.data?.subs?.total ?? '–'}</p>
          <p className="text-sm font-semibold text-ink-soft">Suscriptores activos</p>
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 rounded-xl border border-line bg-white">
          <h2 className="border-b border-line p-4 text-xs font-bold uppercase tracking-[0.14em] text-petrol">Últimos cambios</h2>
          <ul className="divide-y divide-line">
            {recent.data?.map((x: any) => (
              <li key={x.id}><Link to={`/admin/${x._r.key}/${x.id}`} className="flex items-center gap-3 p-3 text-sm hover:bg-mist">
                <span className="chip">{x._r.singular}</span><span className="flex-1 truncate font-semibold">{x[x._r.titleField]}</span>
                <StatusBadge status={x.status} publishedAt={x.published_at} /><span className="text-xs text-mute">{fmtShort(x.updated_at)}</span>
              </Link></li>
            ))}
            {recent.data?.length === 0 && <li className="p-6 text-center text-sm text-mute">Todavía no hay contenidos. ¡Empezá creando un curso o un artículo!</li>}
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-petrol">Accesos rápidos</h2>
          {[['cursos', 'Nuevo curso'], ['articulos', 'Nuevo artículo'], ['publicaciones', 'Nueva publicación'], ['posteres', 'Nuevo póster']].map(([k, l]) => (
            <Link key={k} to={`/admin/${k}/nuevo`} className="flex items-center gap-2 rounded-lg border border-line bg-white p-3 text-sm font-semibold hover:border-orange/50"><Plus className="h-4 w-4 text-orange" />{l}</Link>
          ))}
          <Link to="/admin/galeria" className="flex items-center gap-2 rounded-lg border border-line bg-white p-3 text-sm font-semibold hover:border-orange/50"><Plus className="h-4 w-4 text-orange" />Subir fotos a la galería</Link>
        </section>
      </div>
    </div>
  );
}

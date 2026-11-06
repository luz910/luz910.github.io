import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArrowDown, ArrowUp, Copy, Eye, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fmtShort } from '../lib/format';
import { useDebounced } from '../lib/useDebounced';
import { resourceByKey, type Resource } from './resources';
import { ConfirmDialog, useToast } from './toast';
import { StatusBadge } from './StatusBadge';
import NotFoundAdmin from './NotFoundAdmin';
import { appHref, newTab } from '../lib/paths';

const PER_PAGE = 25;

export default function ResourceList() {
  const { key } = useParams();
  const r = resourceByKey(key!);
  if (!r) return <NotFoundAdmin />;
  return <ListInner r={r} key={r.key} />;
}

function ListInner({ r }: { r: Resource }) {
  const thumbField = r.fields.find((f) => f.type === 'image' && ['cover_url', 'thumbnail_url', 'photo_url'].includes(f.name))?.name;
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [confirm, setConfirm] = useState<any>(null);
  const search = useDebounced(q, 300);
  const queryKey = ['admin', r.table, search, status, page];

  const list = useQuery({
    queryKey,
    queryFn: async () => {
      let qb = supabase.from(r.table).select('*', { count: 'exact' });
      if (status) qb = qb.eq('status', status);
      const s = search.replace(/[%,()*\\:."']/g, ' ').trim();
      if (s) qb = qb.or(r.searchCols.map((c) => `${c}.ilike.%${s}%`).join(','));
      for (const o of r.order) qb = qb.order(o.col, { ascending: !!o.asc, nullsFirst: false });
      qb = qb.order('created_at', { ascending: false });
      const { data, error, count } = await qb.range(page * PER_PAGE, page * PER_PAGE + PER_PAGE - 1);
      if (error) throw error;
      return { rows: (data ?? []) as any[], count: count ?? 0 };
    },
  });
  const rows = list.data?.rows ?? [];
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin', r.table] }); qc.invalidateQueries({ queryKey: ['public'] }); qc.invalidateQueries({ queryKey: ['public-list'] }); };

  async function update(id: string, patch: object, msg: string) {
    const { error } = await supabase.from(r.table).update(patch).eq('id', id);
    if (error) return toast.error('No se pudo guardar: ' + error.message);
    toast.ok(msg); refresh();
  }
  async function remove(row: any) {
    const { error } = await supabase.from(r.table).delete().eq('id', row.id);
    setConfirm(null);
    if (error) return toast.error('No se pudo eliminar: ' + error.message);
    toast.ok(`Se eliminó "${row[r.titleField]}".`); refresh();
  }
  async function duplicate(row: any) {
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
    const copy = { ...rest, [r.titleField]: `${row[r.titleField]} (copia)`, slug: `${row.slug}-copia-${Date.now().toString(36).slice(-4)}`, status: 'draft', published_at: null, featured: false };
    const { error } = await supabase.from(r.table).insert(copy);
    if (error) return toast.error('No se pudo duplicar: ' + error.message);
    toast.ok('Copia creada como borrador.'); refresh();
  }
  async function reorder(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const ordered = [...rows];
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const base = page * PER_PAGE;
    const results = await Promise.all(ordered.map((row, k) => (row.sort_order === (base + k) * 10 ? null : supabase.from(r.table).update({ sort_order: (base + k) * 10 }).eq('id', row.id))));
    if (results.some((x) => x?.error)) toast.error('No se pudo cambiar el orden.');
    refresh();
  }
  const canReorder = r.order[0]?.col === 'sort_order' && !search && !status;
  const pages = Math.ceil((list.data?.count ?? 0) / PER_PAGE);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{r.label}</h1>
          <p className="text-sm text-mute">{list.data?.count ?? 0} en total</p>
        </div>
        <Link to={`/admin/${r.key}/nuevo`} className="btn-primary"><Plus className="h-4 w-4" />{r.female ? 'Nueva' : 'Nuevo'} {r.singular}</Link>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
          <input className="input pl-9" placeholder="Buscar…" aria-label="Buscar" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        <select className="input sm:w-48" aria-label="Filtrar por estado" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">Todos los estados</option>
          <option value="published">Publicados / programados</option>
          <option value="draft">Borradores</option>
          <option value="archived">Archivados</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
        {list.isLoading ? <p className="p-6 text-sm text-mute">Cargando…</p> : list.error ? <p className="p-6 text-sm text-red-700">Error: {(list.error as Error).message}</p> : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-ink">{q || status ? 'Sin resultados' : `Todavía no hay ${r.label.toLowerCase()}`}</p>
            {!q && !status && <Link to={`/admin/${r.key}/nuevo`} className="btn-primary mt-4"><Plus className="h-4 w-4" />Crear el primero</Link>}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row, i) => (
              <li key={row.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
                {canReorder && (
                  <div className="hidden flex-col sm:flex">
                    <button className="rounded p-0.5 text-mute hover:bg-mist disabled:opacity-20" disabled={i === 0 && page === 0} onClick={() => reorder(i, -1)} aria-label="Subir en el orden"><ArrowUp className="h-4 w-4" /></button>
                    <button className="rounded p-0.5 text-mute hover:bg-mist disabled:opacity-20" disabled={i === rows.length - 1} onClick={() => reorder(i, 1)} aria-label="Bajar en el orden"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                )}
                {thumbField && row[thumbField] && <img src={row[thumbField]} alt="" className="hidden h-12 w-16 shrink-0 rounded-md object-cover sm:block" />}
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/${r.key}/${row.id}`} className="font-semibold text-ink hover:text-orange-deep">{row[r.titleField]}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mute">
                    <StatusBadge status={row.status} publishedAt={row.published_at} />
                    {r.subtitle?.(row) && <span>{r.subtitle(row)}</span>}
                    {r.dateField && row[r.dateField] && <span>· {r.dateField === 'year' ? row.year : fmtShort(row[r.dateField])}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {r.featured && (
                    <button className={`rounded-lg p-2 ${row.featured ? 'text-orange' : 'text-mute hover:bg-mist'}`} title={row.featured ? 'Quitar de destacados' : 'Destacar en la portada'} aria-label={row.featured ? 'Quitar de destacados' : 'Destacar en la portada'} aria-pressed={row.featured}
                      onClick={() => update(row.id, { featured: !row.featured }, row.featured ? 'Quitado de destacados.' : 'Ahora aparece como destacado en la portada.')}>
                      <Star className="h-4 w-4" fill={row.featured ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  {r.publicPath && <a href={appHref(r.publicPath(row) + '?preview=1')} {...newTab} className="rounded-lg p-2 text-mute hover:bg-mist" title="Vista previa" aria-label="Vista previa"><Eye className="h-4 w-4" /></a>}
                  <Link to={`/admin/${r.key}/${row.id}`} className="rounded-lg p-2 text-mute hover:bg-mist" title="Editar" aria-label="Editar"><Pencil className="h-4 w-4" /></Link>
                  {r.duplicate && <button className="rounded-lg p-2 text-mute hover:bg-mist" title="Duplicar" aria-label="Duplicar" onClick={() => duplicate(row)}><Copy className="h-4 w-4" /></button>}
                  {row.status !== 'archived' && <button className="rounded-lg p-2 text-mute hover:bg-mist" title="Archivar (ocultar del sitio)" aria-label="Archivar" onClick={() => update(row.id, { status: 'archived' }, 'Archivado: ya no se muestra en el sitio.')}><Archive className="h-4 w-4" /></button>}
                  <button className="rounded-lg p-2 text-red-700 hover:bg-red-50" title="Eliminar" aria-label="Eliminar" onClick={() => setConfirm(row)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button className="btn-outline !py-1.5" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
          <span>Página {page + 1} de {pages}</span>
          <button className="btn-outline !py-1.5" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Siguiente</button>
        </div>
      )}
      <ConfirmDialog open={!!confirm} title={`¿Eliminar "${confirm?.[r.titleField]}"?`} text="Esta acción no se puede deshacer. Si solo querés ocultarlo, usá Archivar." onCancel={() => setConfirm(null)} onConfirm={() => remove(confirm)} />
    </div>
  );
}

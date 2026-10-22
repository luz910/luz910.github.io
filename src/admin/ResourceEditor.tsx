import { useEffect, useMemo, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, Mail, Save, Send, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { slugify } from '../lib/format';
import { callFunction } from '../lib/functions';
import { FieldInput, validate, type RelationOptions } from './fields';
import { resourceByKey, type Resource } from './resources';
import { ConfirmDialog, useToast } from './toast';
import { StatusBadge } from './StatusBadge';
import NotFoundAdmin from './NotFoundAdmin';
import { appHref, newTab } from '../lib/paths';

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const DEFAULTS: Record<string, any> = {
  tags: [], logos: ['uns', 'bioquns', 'dirEaD'], teachers: [], files: [], links: [], topics: [], specialties: [],
  enrollment_status: 'soon', cta_type: 'external', is_leader: true,
};

export default function ResourceEditor() {
  const { key, id } = useParams();
  const r = resourceByKey(key!);
  if (!r) return <NotFoundAdmin />;
  return <EditorInner r={r} id={id === 'nuevo' ? undefined : id} key={`${key}-${id}`} />;
}

function EditorInner({ r, id }: { r: Resource; id?: string }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [data, setData] = useState<Record<string, any> | null>(id ? null : Object.fromEntries(r.fields.filter((f) => f.name in DEFAULTS).map((f) => [f.name, DEFAULTS[f.name]])));
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDel, setConfirmDel] = useState(false);

  const existing = useQuery({
    queryKey: ['admin-item', r.table, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from(r.table).select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as Record<string, any> | null;
    },
  });
  useEffect(() => { if (existing.data && !data) setData(existing.data); }, [existing.data, data]);

  // Opciones para campos que se vinculan con congresos
  const relFields = r.fields.filter((f) => f.type === 'relation');
  const relations = useQuery({
    queryKey: ['admin-relations', r.table],
    enabled: relFields.length > 0,
    queryFn: async () => {
      const out: RelationOptions = {};
      for (const f of relFields) {
        const { data } = await supabase.from(f.relation!.table).select(`id, ${f.relation!.labelCol}`).order(f.relation!.labelCol);
        out[f.name] = (data ?? []).map((x: any) => ({ value: x.id, label: x[f.relation!.labelCol] }));
      }
      return out;
    },
  });

  // Aviso si se intenta salir con cambios sin guardar
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);

  const set = (patch: Record<string, any>) => {
    setDirty(true);
    setData((d) => {
      const next = { ...d, ...patch };
      if (r.slugFrom && r.slugFrom in patch && !slugTouched) next.slug = slugify(String(patch[r.slugFrom] ?? ''));
      return next;
    });
  };

  const sections = useMemo(() => {
    const m = new Map<string, typeof r.fields>();
    for (const f of r.fields) { const s = f.section ?? 'Datos'; if (!m.has(s)) m.set(s, []); m.get(s)!.push(f); }
    return [...m.entries()];
  }, [r]);

  if (id && existing.isLoading) return <p className="text-sm text-mute">Cargando…</p>;
  if (id && !existing.isLoading && !existing.data) return <NotFoundAdmin />;
  if (!data) return null;

  const scheduledFuture = data.published_at && new Date(data.published_at) > new Date();

  async function save(mode: 'draft' | 'publish' | 'keep' | 'archive') {
    const payload: Record<string, any> = { ...data };
    if (mode === 'draft') payload.status = 'draft';
    if (mode === 'archive') payload.status = 'archived';
    if (mode === 'publish') { payload.status = 'published'; if (!payload.published_at) payload.published_at = new Date().toISOString(); }
    if ('slug' in payload || r.slugFrom) payload.slug = slugify(payload.slug || String(payload[r.slugFrom!] ?? ''));
    const errs = validate(r.fields, payload);
    if (r.slugFrom && !payload.slug) errs.slug = 'La dirección no puede quedar vacía.';
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error('Revisá los campos marcados: ' + Object.values(errs)[0]); return; }
    for (const k of ['id', 'created_at', 'updated_at']) delete payload[k];
    setSaving(true);
    const q = id ? supabase.from(r.table).update(payload).eq('id', id).select().single() : supabase.from(r.table).insert(payload).select().single();
    const { data: saved, error } = await q;
    setSaving(false);
    if (error) {
      if (error.code === '23505') { setErrors({ slug: 'Ya existe otro contenido con esta dirección.' }); return toast.error('Ya existe otro contenido con esta dirección (URL). Cambiala en el panel lateral.'); }
      if (error.code === '42501') return toast.error('No tenés permiso para guardar. Volvé a iniciar sesión.');
      return toast.error('No se pudo guardar: ' + error.message);
    }
    setDirty(false);
    setData(saved);
    qc.invalidateQueries({ queryKey: ['admin', r.table] });
    qc.invalidateQueries({ queryKey: ['public'] }); qc.invalidateQueries({ queryKey: ['public-list'] }); qc.invalidateQueries({ queryKey: ['item'] });
    const live = saved.status === 'published' && new Date(saved.published_at) <= new Date();
    toast.ok(saved.status === 'draft' ? 'Borrador guardado. No es visible en el sitio.' : saved.status === 'archived' ? 'Archivado.' : live ? 'Publicado: ya está visible en el sitio.' : 'Guardado y programado para la fecha indicada.');
    if (r.notifies && live && mode === 'publish') {
      // Pide el envío inmediato de novedades (si está activado). El servidor evita duplicados.
      callFunction('admin', { action: 'dispatch' }, true).catch(() => {});
    }
    if (!id) nav(`/admin/${r.key}/${saved.id}`, { replace: true });
  }

  async function remove() {
    const { error } = await supabase.from(r.table).delete().eq('id', id!);
    if (error) return toast.error('No se pudo eliminar: ' + error.message);
    setDirty(false);
    toast.ok('Eliminado.');
    qc.invalidateQueries({ queryKey: ['admin', r.table] });
    setTimeout(() => nav(`/admin/${r.key}`), 0);
  }

  const err = (n: string) => errors[n] && <p className="mt-1 text-xs font-semibold text-red-700">{errors[n]}</p>;

  return (
    <div>
      <Link to={`/admin/${r.key}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink"><ArrowLeft className="h-4 w-4" />{r.label}</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{id ? `Editar ${r.singular}` : `${r.female ? 'Nueva' : 'Nuevo'} ${r.singular}`}</h1>
        {id && <StatusBadge status={data.status} publishedAt={data.published_at} />}
        {dirty && <span className="text-xs font-semibold text-amber-700">Cambios sin guardar</span>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {sections.map(([title, fields]) => (
            <section key={title} className="rounded-xl border border-line bg-white p-5">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-petrol">{title}</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.name} className={f.wide || ['markdown', 'image', 'pdf', 'files', 'links', 'teachers', 'logos', 'tags', 'checkbox'].includes(f.type) ? 'md:col-span-2' : ''}>
                    <FieldInput f={f} data={data} set={set} relations={relations.data} />
                    {err(f.name)}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-petrol">Publicación</h2>
            <label className="label" htmlFor="pubdate">Fecha de publicación</label>
            <input id="pubdate" type="datetime-local" className="input" value={toLocalInput(data.published_at)} onChange={(e) => set({ published_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            <p className="help">Vacío = ahora. Con una fecha futura, se publica automáticamente ese día.</p>
            {scheduledFuture && <p className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-800">Se mostrará en el sitio a partir de esa fecha.</p>}
            <div className="mt-4 grid gap-2">
              {data.status === 'published' ? (
                <>
                  <button className="btn-primary" disabled={saving} onClick={() => save('keep')}><Save className="h-4 w-4" />{saving ? 'Guardando…' : 'Guardar cambios'}</button>
                  <button className="btn-outline" disabled={saving} onClick={() => save('draft')}>Pasar a borrador (ocultar)</button>
                </>
              ) : (
                <>
                  <button className="btn-primary" disabled={saving} onClick={() => save('publish')}><Send className="h-4 w-4" />{saving ? 'Guardando…' : scheduledFuture ? 'Programar publicación' : 'Publicar'}</button>
                  <button className="btn-outline" disabled={saving} onClick={() => save('draft')}><Save className="h-4 w-4" />Guardar borrador</button>
                </>
              )}
              {id && r.publicPath && (
                <a className="btn-ghost" href={appHref(r.publicPath(data) + '?preview=1')} {...newTab} onClick={(e) => { if (dirty) { e.preventDefault(); toast.error('Guardá los cambios (por ejemplo como borrador) antes de ver la vista previa.'); } }}>
                  <Eye className="h-4 w-4" />Vista previa
                </a>
              )}
            </div>
            {r.notifies && (
              <p className="mt-4 flex gap-2 rounded-lg bg-mist p-2.5 text-xs text-ink-soft"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />Al publicarse, se avisará a los suscriptores si el envío automático está activado en Newsletter. Los borradores nunca generan correos.</p>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-line bg-white p-5">
            {r.slugFrom && (
              <div>
                <label className="label" htmlFor="slug">Dirección (URL)</label>
                <input id="slug" className="input font-mono text-xs" value={data.slug ?? ''} onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }} onBlur={() => set({ slug: slugify(data.slug ?? '') })} />
                <p className="help break-all">{r.publicPath ? window.location.origin + r.publicPath({ ...data, slug: data.slug || '…' }) : ''}</p>
                {err('slug')}
              </div>
            )}
            {r.featured && (
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-orange" checked={!!data.featured} onChange={(e) => set({ featured: e.target.checked })} />Destacar en la portada
              </label>
            )}
            <div>
              <label className="label" htmlFor="order">Orden de presentación</label>
              <input id="order" type="number" className="input" value={data.sort_order ?? 0} onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })} />
              <p className="help">Número menor = aparece antes.</p>
            </div>
          </div>

          {id && (
            <div className="rounded-xl border border-red-200 bg-white p-5">
              {data.status !== 'archived' && <button className="btn-ghost w-full" onClick={() => save('archive')}>Archivar (ocultar sin borrar)</button>}
              <button className="btn-ghost mt-1 w-full text-red-700 hover:bg-red-50" onClick={() => setConfirmDel(true)}><Trash2 className="h-4 w-4" />Eliminar definitivamente</button>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog open={confirmDel} title={`¿Eliminar este ${r.singular}?`} text="Esta acción no se puede deshacer." onCancel={() => setConfirmDel(false)} onConfirm={() => { setConfirmDel(false); remove(); }} />
      <ConfirmDialog open={blocker.state === 'blocked'} title="Hay cambios sin guardar" text="Si salís ahora, se perderán." confirmLabel="Salir sin guardar" onCancel={() => blocker.reset?.()} onConfirm={() => blocker.proceed?.()} />
    </div>
  );
}

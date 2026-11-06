// Dentro del formulario de una actividad: conferencias, pósteres y fotos vinculados a ella.
// Todo se guarda en sus propias tablas (talks, posters, gallery_photos) con congress_id = esta actividad.
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mic, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile, removeStoredFile } from '../lib/storage';
import { slugify } from '../lib/format';
import type { Photo, Poster, Talk } from '../lib/types';
import { FieldInput } from './fields';
import { ConfirmDialog, useToast } from './toast';

const uniqueSlug = (t: string) => `${slugify(t) || 'item'}-${Math.random().toString(36).slice(2, 6)}`;

function Box({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-petrol">{title}</h2>
      {help && <p className="help mb-4 mt-1">{help}</p>}
      {children}
    </section>
  );
}

export function CongressChildren({ congressId, year }: { congressId?: string; year?: number | null }) {
  if (!congressId) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white p-5 text-sm text-ink-soft">
        <strong className="text-ink">Pósteres y fotografías:</strong> guardá primero la actividad (como borrador o publicándola) y después vas a poder agregarlos acá mismo.
      </div>
    );
  }
  return (
    <>
      <Posters congressId={congressId} year={year} />
      <Photos congressId={congressId} year={year} />
    </>
  );
}

function useChildren<T>(table: string, congressId: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['admin-children', table, congressId],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select('*').eq('congress_id', congressId).order('created_at', { ascending: true });
      if (error) throw error; return (data ?? []) as T[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-children', table, congressId] }); qc.invalidateQueries({ queryKey: ['admin', table] }); qc.invalidateQueries({ queryKey: ['public-list'] }); };
  return { ...q, refresh };
}

// @ts-ignore — sección de conferencias oculta a pedido
function Talks({ congressId }: { congressId: string }) {
  const toast = useToast();
  const list = useChildren<Talk>('talks', congressId);
  const [d, setD] = useState({ title: '', speaker: '', date: '', summary: '' });
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Talk | null>(null);
  async function add() {
    if (!d.title.trim()) return toast.error('Escribí el título de la conferencia.');
    setBusy(true);
    const { error } = await supabase.from('talks').insert({
      title: d.title.trim(), speaker: d.speaker.trim() || null, date: d.date || null, summary: d.summary.trim() || null,
      congress_id: congressId, slug: uniqueSlug(d.title), status: 'published', published_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) return toast.error('No se pudo agregar: ' + error.message);
    setD({ title: '', speaker: '', date: '', summary: '' }); toast.ok('Conferencia agregada.'); list.refresh();
  }
  async function remove(t: Talk) {
    setDel(null);
    const { error } = await supabase.from('talks').delete().eq('id', t.id);
    if (error) return toast.error(error.message);
    toast.ok('Conferencia eliminada.'); list.refresh();
  }
  return (
    <Box title="Conferencias y disertaciones" help="Agregá las conferencias o disertaciones que se dieron en esta actividad.">
      <ul className="mb-4 space-y-2">
        {(list.data ?? []).map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
            <Mic className="h-4 w-4 shrink-0 text-orange" aria-hidden />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{t.title}</p>{t.speaker && <p className="text-xs text-mute">{t.speaker}</p>}</div>
            <Link to={`/admin/disertaciones/${t.id}`} className="rounded p-1.5 text-mute hover:bg-mist" title="Editar todos los datos" aria-label="Editar"><Pencil className="h-4 w-4" /></Link>
            <button type="button" className="rounded p-1.5 text-red-700 hover:bg-red-50" onClick={() => setDel(t)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {list.data?.length === 0 && <li className="text-sm text-mute">Todavía no hay conferencias en esta actividad.</li>}
      </ul>
      <div className="grid gap-3 rounded-lg bg-mist p-3 md:grid-cols-2">
        <input className="input md:col-span-2" placeholder="Título de la conferencia" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        <input className="input" placeholder="Disertante" value={d.speaker} onChange={(e) => setD({ ...d, speaker: e.target.value })} />
        <input className="input" type="date" aria-label="Fecha" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
        <textarea className="input md:col-span-2" rows={2} placeholder="Resumen (opcional)" value={d.summary} onChange={(e) => setD({ ...d, summary: e.target.value })} />
        <div className="md:col-span-2"><button type="button" className="btn-outline" onClick={add} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Agregar conferencia</button></div>
      </div>
      <ConfirmDialog open={!!del} title="¿Eliminar esta conferencia?" text="Se borra del sitio." onCancel={() => setDel(null)} onConfirm={() => remove(del!)} />
    </Box>
  );
}

function Posters({ congressId, year }: { congressId: string; year?: number | null }) {
  const toast = useToast();
  const list = useChildren<Poster>('posters', congressId);
  const [d, setD] = useState<Record<string, any>>({ title: '', authors: '', pdf_url: '', thumbnail_url: '' });
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Poster | null>(null);
  async function add() {
    if (!d.title.trim()) return toast.error('Escribí el título del póster.');
    setBusy(true);
    const { error } = await supabase.from('posters').insert({
      title: d.title.trim(), authors: d.authors.trim() || null, pdf_url: d.pdf_url || null, thumbnail_url: d.thumbnail_url || null,
      year: year ?? null, congress_id: congressId, slug: uniqueSlug(d.title), status: 'published', published_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) return toast.error('No se pudo agregar: ' + error.message);
    setD({ title: '', authors: '', pdf_url: '', thumbnail_url: '' }); toast.ok('Póster agregado.'); list.refresh();
  }
  async function remove(p: Poster) {
    setDel(null);
    const { error } = await supabase.from('posters').delete().eq('id', p.id);
    if (error) return toast.error(error.message);
    await removeStoredFile(p.pdf_url); await removeStoredFile(p.thumbnail_url);
    toast.ok('Póster eliminado.'); list.refresh();
  }
  return (
    <Box title="Pósteres presentados" help="Subí el archivo (PDF o imagen) de cada póster presentado en esta actividad. También van a aparecer en Nuestros pósteres.">
      <ul className="mb-4 space-y-2">
        {(list.data ?? []).map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
            {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="h-12 w-9 shrink-0 rounded object-cover ring-1 ring-line" /> : <span className="h-12 w-9 shrink-0 rounded bg-mist" />}
            <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{p.title}</p>{p.authors && <p className="text-xs text-mute">{p.authors}</p>}</div>
            <Link to={`/admin/posteres/${p.id}`} className="rounded p-1.5 text-mute hover:bg-mist" title="Editar todos los datos" aria-label="Editar"><Pencil className="h-4 w-4" /></Link>
            <button type="button" className="rounded p-1.5 text-red-700 hover:bg-red-50" onClick={() => setDel(p)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {list.data?.length === 0 && <li className="text-sm text-mute">Todavía no hay pósteres en esta actividad.</li>}
      </ul>
      <div className="grid gap-3 rounded-lg bg-mist p-3 md:grid-cols-2">
        <input className="input" placeholder="Título del póster" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        <input className="input" placeholder="Autores" value={d.authors} onChange={(e) => setD({ ...d, authors: e.target.value })} />
        <div className="md:col-span-2">
          <FieldInput f={{ name: 'pdf_url', label: 'Archivo del póster (PDF o imagen)', type: 'pdf', thumbField: 'thumbnail_url', folder: 'posteres' }} data={d} set={(p) => setD((x) => ({ ...x, ...p }))} />
        </div>
        <div className="md:col-span-2"><button type="button" className="btn-outline" onClick={add} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Agregar póster</button></div>
      </div>
      <ConfirmDialog open={!!del} title="¿Eliminar este póster?" text="Se borra del sitio y se eliminan sus archivos." onCancel={() => setDel(null)} onConfirm={() => remove(del!)} />
    </Box>
  );
}

function Photos({ congressId, year }: { congressId: string; year?: number | null }) {
  const toast = useToast();
  const list = useChildren<Photo>('gallery_photos', congressId);
  const ref = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [del, setDel] = useState<Photo | null>(null);
  async function uploadMany(files: FileList) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    let ok = 0;
    for (const [i, f] of arr.entries()) {
      setProgress(`Subiendo ${i + 1} de ${arr.length}…`);
      try {
        const url = await uploadFile(f, 'galeria');
        const { error } = await supabase.from('gallery_photos').insert({ image_url: url, title: null, alt: '', status: 'published', year: year ?? null, congress_id: congressId, sort_order: ((list.data?.length ?? 0) + i) * 10 });
        if (error) throw error;
        ok++;
      } catch (e) { toast.error(`${f.name}: ${(e as Error).message}`); }
    }
    setProgress(null);
    if (ok) toast.ok(`${ok} foto(s) agregadas.`);
    list.refresh();
  }
  async function remove(p: Photo) {
    setDel(null);
    const { error } = await supabase.from('gallery_photos').delete().eq('id', p.id);
    if (error) return toast.error(error.message);
    await removeStoredFile(p.image_url);
    toast.ok('Foto eliminada.'); list.refresh();
  }
  return (
    <Box title="Fotografías" help="Subí las fotos de esta actividad. También van a aparecer en la Galería, agrupadas bajo el nombre de la actividad.">
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {(list.data ?? []).map((p) => (
          <div key={p.id} className="group relative overflow-hidden rounded-lg ring-1 ring-line">
            <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
            <button type="button" className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-700 opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100" onClick={() => setDel(p)} aria-label="Eliminar foto"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      {list.data?.length === 0 && <p className="mb-4 text-sm text-mute">Todavía no hay fotos en esta actividad.</p>}
      <button type="button" className="btn-outline" onClick={() => ref.current?.click()} disabled={!!progress}>{progress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{progress ?? 'Subir fotos'}</button>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) uploadMany(e.target.files); e.target.value = ''; }} />
      <ConfirmDialog open={!!del} title="¿Eliminar esta foto?" text="Se borra del sitio y del almacenamiento." onCancel={() => setDel(null)} onConfirm={() => remove(del!)} />
    </Box>
  );
}

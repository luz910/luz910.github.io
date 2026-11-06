import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Save, Trash2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile, removeStoredFile } from '../lib/storage';
import type { Photo } from '../lib/types';
import { ConfirmDialog, useToast } from './toast';

export default function GalleryAdmin() {
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [batch, setBatch] = useState({ year: new Date().getFullYear(), congress_id: '' });
  const [progress, setProgress] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [del, setDel] = useState<Photo | null>(null);

  const congresses = useQuery({ queryKey: ['admin-congress-options'], queryFn: async () => (await supabase.from('congresses').select('id,name').order('start_date', { ascending: false })).data ?? [] });
  const photos = useQuery({
    queryKey: ['admin', 'gallery_photos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gallery_photos').select('*').order('year', { ascending: false, nullsFirst: false }).order('sort_order').order('created_at');
      if (error) throw error; return data as Photo[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin', 'gallery_photos'] }); qc.invalidateQueries({ queryKey: ['public-list'] }); };

  async function uploadMany(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    let ok = 0;
    const startOrder = (photos.data?.length ?? 0) * 10;
    for (const [i, f] of list.entries()) {
      setProgress(`Subiendo ${i + 1} de ${list.length}…`);
      try {
        const url = await uploadFile(f, 'galeria');
        const { error } = await supabase.from('gallery_photos').insert({
          image_url: url, title: null, alt: '', status: 'published',
          event_label: null, year: batch.year || null, congress_id: batch.congress_id || null, sort_order: startOrder + i * 10,
        });
        if (error) throw error;
        ok++;
      } catch (e) { toast.error(`${f.name}: ${(e as Error).message}`); }
    }
    setProgress(null);
    if (ok) toast.ok(`${ok} foto(s) publicadas. Completá el texto alternativo de cada una para accesibilidad.`);
    refresh();
  }

  async function patch(id: string, p: Partial<Photo>, quiet = false) {
    const { error } = await supabase.from('gallery_photos').update(p).eq('id', id);
    if (error) return toast.error('No se pudo guardar: ' + error.message);
    if (!quiet) toast.ok('Foto actualizada.');
    refresh();
  }
  async function replace(p: Photo, f: File) {
    try { const url = await uploadFile(f, 'galeria'); await patch(p.id, { image_url: url }); await removeStoredFile(p.image_url); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function remove(p: Photo) {
    setDel(null);
    const { error } = await supabase.from('gallery_photos').delete().eq('id', p.id);
    if (error) return toast.error('No se pudo eliminar: ' + error.message);
    await removeStoredFile(p.image_url);
    toast.ok('Foto eliminada.'); refresh();
  }
  async function move(list: Photo[], i: number, d: number) {
    const j = i + d; if (j < 0 || j >= list.length) return;
    const a = [...list]; [a[i], a[j]] = [a[j], a[i]];
    await Promise.all(a.map((p, k) => supabase.from('gallery_photos').update({ sort_order: k * 10 }).eq('id', p.id)));
    refresh();
  }

  const all = photos.data ?? [];
  const groups = new Map<string, Photo[]>();
  for (const p of all) {
    const key = `${p.year ?? 'Sin año'}`;
    if (filter && !key.toLowerCase().includes(filter.toLowerCase())) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Galería de fotografías</h1>
      <p className="mt-1 text-sm text-mute">Subí varias fotos a la vez. En el sitio se organizan por año.</p>

      <section className="mt-6 rounded-xl border border-line bg-white p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-petrol">Subir fotografías</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[8rem_minmax(0,1fr)_auto] md:items-end">
          <div><label className="label" htmlFor="g-y">Año</label><input id="g-y" type="number" className="input" value={batch.year} onChange={(e) => setBatch({ ...batch, year: Number(e.target.value) })} /></div>
          <div><label className="label" htmlFor="g-c">Vincular a una actividad científica o académica (opcional)</label>
            <select id="g-c" className="input" value={batch.congress_id} onChange={(e) => setBatch({ ...batch, congress_id: e.target.value })}>
              <option value="">— Ninguno —</option>{congresses.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={!!progress}>{progress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{progress ?? 'Elegir fotos'}</button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) uploadMany(e.target.files); e.target.value = ''; }} />
        </div>
      </section>

      <input className="input mt-6 max-w-sm" placeholder="Filtrar por año…" aria-label="Filtrar galería" value={filter} onChange={(e) => setFilter(e.target.value)} />

      {photos.isLoading ? <p className="mt-6 text-sm text-mute">Cargando…</p> : groups.size === 0 ? <p className="mt-6 rounded-xl border border-dashed border-line bg-white p-10 text-center text-sm text-mute">Todavía no hay fotos.</p> : (
        [...groups.entries()].map(([g, list]) => (
          <section key={g} className="mt-8">
            <h2 className="mb-3 font-bold text-ink">{g} <span className="text-sm font-normal text-mute">({list.length})</span></h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p, i) => <PhotoCard key={p.id} p={p} first={i === 0} last={i === list.length - 1} onMove={(d) => move(list, i, d)} onSave={(x) => patch(p.id, x)} onReplace={(f) => replace(p, f)} onDelete={() => setDel(p)} congresses={congresses.data ?? []} />)}
            </div>
          </section>
        ))
      )}
      <ConfirmDialog open={!!del} title="¿Eliminar esta foto?" text="Se borra del sitio y del almacenamiento." onCancel={() => setDel(null)} onConfirm={() => remove(del!)} />
    </div>
  );
}

function PhotoCard({ p, first, last, onMove, onSave, onReplace, onDelete, congresses }: { p: Photo; first: boolean; last: boolean; onMove: (d: number) => void; onSave: (x: Partial<Photo>) => void; onReplace: (f: File) => void; onDelete: () => void; congresses: any[] }) {
  const [d, setD] = useState({ title: p.title ?? '', description: p.description ?? '', alt: p.alt ?? '', event_label: p.event_label ?? '', year: p.year ?? '', congress_id: p.congress_id ?? '' });
  const changed = JSON.stringify(d) !== JSON.stringify({ title: p.title ?? '', description: p.description ?? '', alt: p.alt ?? '', event_label: p.event_label ?? '', year: p.year ?? '', congress_id: p.congress_id ?? '' });
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative">
        <img src={p.image_url} alt={p.alt ?? ''} className="h-44 w-full object-cover" loading="lazy" />
        {!p.alt && <span className="absolute left-2 top-2 rounded bg-amber-100 px-2 py-0.5 text-[0.7rem] font-bold text-amber-900">Falta texto alternativo</span>}
      </div>
      <div className="space-y-2 p-3 text-sm">
        <div className="grid grid-cols-[5rem] gap-2">
          <input className="input !py-1.5" type="number" placeholder="Año" aria-label="Año" value={d.year} onChange={(e) => setD({ ...d, year: e.target.value as any })} />
        </div>
        <select className="input !py-1.5" aria-label="Congreso" value={d.congress_id} onChange={(e) => setD({ ...d, congress_id: e.target.value })}>
          <option value="">— Sin actividad vinculada —</option>{congresses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-1 pt-1">
          <button className="rounded p-1.5 text-mute hover:bg-mist disabled:opacity-30" disabled={first} onClick={() => onMove(-1)} aria-label="Mover antes"><ArrowLeft className="h-4 w-4" /></button>
          <button className="rounded p-1.5 text-mute hover:bg-mist disabled:opacity-30" disabled={last} onClick={() => onMove(1)} aria-label="Mover después"><ArrowRight className="h-4 w-4" /></button>
          <button className="rounded p-1.5 text-mute hover:bg-mist" onClick={() => ref.current?.click()} aria-label="Reemplazar imagen" title="Reemplazar imagen"><RefreshCw className="h-4 w-4" /></button>
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplace(f); e.target.value = ''; }} />
          <button className="rounded p-1.5 text-red-700 hover:bg-red-50" onClick={onDelete} aria-label="Eliminar foto"><Trash2 className="h-4 w-4" /></button>
          <button className="btn-primary ml-auto !px-3 !py-1.5 text-xs" disabled={!changed} onClick={() => onSave({ ...d, year: d.year === '' ? null : Number(d.year), congress_id: d.congress_id || null, event_label: d.event_label || null } as any)}><Save className="h-3.5 w-3.5" />Guardar</button>
        </div>
      </div>
    </div>
  );
}

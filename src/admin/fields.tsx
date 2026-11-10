import { useRef, useState, type ReactNode } from 'react';
import { Bold, Eye, FileText, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Pencil, Plus, Quote, Trash2, Upload, X, ArrowUp, ArrowDown } from 'lucide-react';
import { uploadFile } from '../lib/storage';
import { pdfFirstPageThumb } from '../lib/pdfThumb';
import { Markdown } from '../components/Markdown';
import { useSettings } from '../lib/settings';
import { useToast } from './toast';

export type FieldType =
  | 'text' | 'textarea' | 'markdown' | 'number' | 'date' | 'month' | 'datetime' | 'url' | 'email'
  | 'select' | 'checkbox' | 'tags' | 'image' | 'pdf' | 'files' | 'links' | 'teachers' | 'logos' | 'relation';

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Para imágenes: campo donde guardar el texto alternativo */
  altField?: string;
  /** Para PDF: campo donde guardar la miniatura generada automáticamente */
  thumbField?: string;
  /** Solo acepta PDF (no imágenes) */
  pdfOnly?: boolean;
  folder?: string;
  /** Para "relation": tabla y columna que se muestra */
  relation?: { table: string; labelCol: string };
  /** Sugerencias para autocompletar (por ejemplo, categorías ya usadas) */
  suggestions?: string[];
  wide?: boolean;
  section?: string;
  rows?: number;
  /** Para "teachers": muestra solo el docente coordinador o el resto del plantel (todo se guarda en la columna teachers) */
  teacherRole?: 'coordinator' | 'staff';
  /** Para "select" no obligatorio: texto de la opción vacía */
  emptyLabel?: string;
}

export function FieldShell({ f, id, children }: { f: Pick<Field, 'label' | 'required' | 'help'>; id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{f.label}{f.required && <span className="text-orange-deep"> *</span>}</label>
      {children}
      {f.help && <p className="help">{f.help}</p>}
    </div>
  );
}

/* ---------- Editor de texto con formato (Markdown) ---------- */
function MarkdownInput({ id, value, onChange, rows = 10, placeholder }: { id: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const wrap = (before: string, after = before, ph = 'texto') => {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = value.slice(s, e) || ph;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
  };
  const linePrefix = (prefix: string) => {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    requestAnimationFrame(() => el.focus());
  };
  const link = () => {
    const url = prompt('Dirección del enlace (https://…)');
    if (url) wrap('[', `](${url})`, 'texto del enlace');
  };
  const insertImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, 'contenido');
      const alt = prompt('Describí brevemente la imagen (texto alternativo para accesibilidad):') || '';
      wrap(`\n![${alt}](${url})\n`, '', '');
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };
  const tools = [
    { icon: Heading2, label: 'Subtítulo', run: () => linePrefix('## ') },
    { icon: Bold, label: 'Negrita', run: () => wrap('**') },
    { icon: Italic, label: 'Cursiva', run: () => wrap('_') },
    { icon: List, label: 'Lista', run: () => linePrefix('- ') },
    { icon: ListOrdered, label: 'Lista numerada', run: () => linePrefix('1. ') },
    { icon: Quote, label: 'Cita', run: () => linePrefix('> ') },
    { icon: Link2, label: 'Enlace', run: link },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/20">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-mist/60 px-1.5 py-1">
        {tab === 'edit' && tools.map((t) => (
          <button key={t.label} type="button" title={t.label} aria-label={t.label} onClick={t.run} className="rounded p-1.5 text-ink-soft hover:bg-white hover:text-ink"><t.icon className="h-4 w-4" /></button>
        ))}
        {tab === 'edit' && (
          <>
            <button type="button" title="Insertar imagen" aria-label="Insertar imagen" onClick={() => fileRef.current?.click()} className="rounded p-1.5 text-ink-soft hover:bg-white hover:text-ink" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImage(f); e.target.value = ''; }} />
          </>
        )}
        <div className="ml-auto flex rounded-md bg-white p-0.5 text-xs font-semibold">
          <button type="button" onClick={() => setTab('edit')} className={`flex items-center gap-1 rounded px-2 py-1 ${tab === 'edit' ? 'bg-ink text-white' : 'text-ink-soft'}`}><Pencil className="h-3 w-3" />Escribir</button>
          <button type="button" onClick={() => setTab('preview')} className={`flex items-center gap-1 rounded px-2 py-1 ${tab === 'preview' ? 'bg-ink text-white' : 'text-ink-soft'}`}><Eye className="h-3 w-3" />Vista previa</button>
        </div>
      </div>
      {tab === 'edit'
        ? <textarea id={id} ref={ref} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="block w-full resize-y border-0 px-3 py-2 font-mono text-[0.85rem] leading-relaxed text-ink focus:outline-none" />
        : <div className="min-h-[8rem] px-4 py-3">{value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-mute">Nada para mostrar todavía.</p>}</div>}
    </div>
  );
}

/* ---------- Subida de imagen ---------- */
export function ImageInput({ id, value, onChange, folder = 'imagenes' }: { id: string; value: string; onChange: (v: string) => void; alt?: string; onAlt?: (v: string) => void; folder?: string }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  async function pick(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('El archivo debe ser una imagen (JPG, PNG, WEBP).');
    setBusy(true);
    try { onChange(await uploadFile(file, folder)); toast.ok('Imagen subida. Recordá guardar los cambios.'); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div
        className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-line bg-mist sm:w-48"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin text-mute" /> : value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <span className="px-2 text-center text-xs text-mute">Arrastrá una imagen o usá el botón</span>}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline !py-1.5 text-xs" onClick={() => ref.current?.click()} disabled={busy}><Upload className="h-3.5 w-3.5" />{value ? 'Reemplazar imagen' : 'Subir imagen'}</button>
          {value && <button type="button" className="btn-ghost !py-1.5 text-xs text-red-700" onClick={() => onChange('')}><X className="h-3.5 w-3.5" />Quitar</button>}
        </div>
        <input ref={ref} id={id} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}

/* ---------- Subida de PDF o imagen (con miniatura automática si es PDF) ---------- */
function PdfInput({ id, value, onChange, onThumb, folder = 'pdf', pdfOnly = false }: { id: string; value: string; onChange: (v: string) => void; onThumb?: (v: string) => void; folder?: string; pdfOnly?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  async function pick(file: File) {
    const isPdf = file.type === 'application/pdf';
    const isImg = file.type.startsWith('image/');
    if (pdfOnly && !isPdf) return toast.error('El archivo tiene que ser un PDF.');
    if (!isPdf && !isImg) return toast.error('El archivo tiene que ser un PDF o una imagen (JPG, PNG, WEBP).');
    try {
      setBusy('Subiendo archivo…');
      const url = await uploadFile(file, folder);
      onChange(url);
      setName(file.name);
      if (onThumb) {
        if (isImg) onThumb(url);
        else {
          setBusy('Preparando vista previa…');
          // Si no se puede generar la miniatura no pasa nada: el póster se publica igual.
          try { onThumb(await uploadFile(await pdfFirstPageThumb(file), 'miniaturas', file.name.replace(/\.pdf$/i, '') + '-miniatura.webp')); }
          catch (e) { console.warn('miniatura', e); }
        }
      }
      toast.ok('Archivo subido');
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }
  const shown = name ?? (value ? decodeURIComponent(value.split('/').pop() ?? '').replace(/^[a-z0-9]+-[a-f0-9]{8}-/, '') : '');
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white p-3">
      <FileText className="h-8 w-8 shrink-0 text-orange" />
      <div className="min-w-0 flex-1 text-sm">
        {busy ? <span className="flex items-center gap-2 text-mute"><Loader2 className="h-4 w-4 animate-spin" />{busy}</span>
          : value ? <a href={value} target="_blank" rel="noopener noreferrer" className="link block truncate">{shown || 'Ver archivo'}</a>
            : <span className="text-mute">Ningún archivo cargado</span>}
      </div>
      <button type="button" className="btn-outline !py-1.5 text-xs" onClick={() => ref.current?.click()} disabled={!!busy}><Upload className="h-3.5 w-3.5" />{value ? 'Reemplazar' : 'Subir archivo'}</button>
      {value && !busy && <button type="button" className="btn-ghost !py-1.5 text-xs text-red-700" onClick={() => { onChange(''); setName(null); }}><X className="h-3.5 w-3.5" />Quitar</button>}
      <input ref={ref} id={id} type="file" accept={pdfOnly ? 'application/pdf' : 'application/pdf,image/*'} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
    </div>
  );
}

/* ---------- Listas: archivos, enlaces, docentes ---------- */
function move<T>(arr: T[], i: number, d: number) { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; }
const RowTools = ({ i, n, onMove, onDel }: { i: number; n: number; onMove: (d: number) => void; onDel: () => void }) => (
  <div className="flex shrink-0 gap-0.5">
    <button type="button" className="rounded p-1 text-mute hover:bg-mist disabled:opacity-30" disabled={i === 0} onClick={() => onMove(-1)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
    <button type="button" className="rounded p-1 text-mute hover:bg-mist disabled:opacity-30" disabled={i === n - 1} onClick={() => onMove(1)} aria-label="Bajar"><ArrowDown className="h-4 w-4" /></button>
    <button type="button" className="rounded p-1 text-red-700 hover:bg-red-50" onClick={onDel} aria-label="Quitar"><Trash2 className="h-4 w-4" /></button>
  </div>
);

function FilesInput({ value, onChange, folder = 'archivos' }: { value: { name: string; url: string }[]; onChange: (v: { name: string; url: string }[]) => void; folder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function add(files: FileList) {
    setBusy(true);
    const out = [...value];
    for (const f of Array.from(files)) {
      try { out.push({ name: f.name.replace(/\.[^.]+$/, ''), url: await uploadFile(f, folder) }); }
      catch (e) { toast.error(`${f.name}: ${(e as Error).message}`); }
    }
    onChange(out); setBusy(false);
  }
  return (
    <div className="space-y-2">
      {value.map((f, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-line bg-white p-2">
          <FileText className="h-4 w-4 shrink-0 text-orange" />
          <input className="input !py-1" aria-label="Nombre visible del archivo" value={f.name} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-mute underline">ver</a>
          <RowTools i={i} n={value.length} onMove={(d) => onChange(move(value, i, d))} onDel={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <button type="button" className="btn-outline !py-1.5 text-xs" onClick={() => ref.current?.click()} disabled={busy}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Agregar archivos</button>
      <input ref={ref} type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) add(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

function LinksInput({ value, onChange }: { value: { label: string; url: string }[]; onChange: (v: { label: string; url: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((l, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-line bg-white p-2 sm:flex-row sm:items-center">
          <input className="input !py-1 sm:w-48" placeholder="Texto" aria-label="Texto del enlace" value={l.label} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          <input className="input !py-1" placeholder="https://…" aria-label="Dirección del enlace" value={l.url} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
          <RowTools i={i} n={value.length} onMove={(d) => onChange(move(value, i, d))} onDel={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <button type="button" className="btn-outline !py-1.5 text-xs" onClick={() => onChange([...value, { label: '', url: '' }])}><Plus className="h-3.5 w-3.5" />Agregar enlace</button>
    </div>
  );
}

function TeachersInput({ value, onChange, addLabel = 'Agregar docente', idPrefix = 'teacher' }: { value: { name: string; bio?: string; photo_url?: string }[]; onChange: (v: { name: string; bio?: string; photo_url?: string }[]) => void; addLabel?: string; idPrefix?: string }) {
  const set = (i: number, patch: object) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-3">
      {value.map((t, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-line bg-white p-3">
          <div className="flex items-center gap-2">
            <input className="input" placeholder="Nombre y apellido" aria-label="Nombre del docente" value={t.name} onChange={(e) => set(i, { name: e.target.value })} />
            <RowTools i={i} n={value.length} onMove={(d) => onChange(move(value, i, d))} onDel={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
          <textarea className="input" rows={3} placeholder="Antecedentes (título, cargo, experiencia)…" aria-label="Antecedentes del docente" value={t.bio ?? ''} onChange={(e) => set(i, { bio: e.target.value })} />
          <ImageInput id={`${idPrefix}-${i}`} value={t.photo_url ?? ''} onChange={(v) => set(i, { photo_url: v })} folder="docentes" />
        </div>
      ))}
      <button type="button" className="btn-outline !py-1.5 text-xs" onClick={() => onChange([...value, { name: '' }])}><Plus className="h-3.5 w-3.5" />{addLabel}</button>
    </div>
  );
}

function TagsInput({ id, value, onChange, suggestions }: { id: string; value: string[]; onChange: (v: string[]) => void; suggestions?: string[] }) {
  const [draft, setDraft] = useState('');
  const add = (t: string) => { const v = t.trim(); if (v && !value.includes(v)) onChange([...value, v]); setDraft(''); };
  return (
    <div className="rounded-lg border border-line bg-white p-2 focus-within:border-orange">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => <span key={t} className="chip gap-1">{t}<button type="button" aria-label={`Quitar ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}><X className="h-3 w-3" /></button></span>)}
        <input id={id} list={id + '-list'} className="min-w-[10rem] flex-1 border-0 p-1 text-sm focus:outline-none" placeholder="Escribí y presioná Enter" value={draft}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft); } }} onBlur={() => draft && add(draft)} />
        {suggestions && <datalist id={id + '-list'}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
      </div>
    </div>
  );
}

function LogosInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { settings } = useSettings();
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(settings.logos).map(([k, l]) => (
        <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 pr-3 ${value.includes(k) ? 'border-orange bg-orange-soft' : 'border-line bg-white'}`}>
          <input type="checkbox" className="accent-orange" checked={value.includes(k)} onChange={(e) => onChange(e.target.checked ? [...value, k] : value.filter((x) => x !== k))} />
          {l.url && <img src={l.url} alt="" className="h-7 w-auto max-w-16 object-contain" />}
          <span className="text-sm">{l.label}</span>
        </label>
      ))}
    </div>
  );
}

export type RelationOptions = Record<string, { value: string; label: string }[]>;

/** Dibuja el control adecuado según el tipo de campo. */
export function FieldInput({ f, data, set, relations }: { f: Field; data: Record<string, any>; set: (patch: Record<string, any>) => void; relations?: RelationOptions }) {
  const id = `f-${f.name}`;
  const v = data[f.name];
  const str = v ?? '';
  switch (f.type) {
    case 'checkbox':
      return (
        <label className="flex items-start gap-3 rounded-lg border border-line bg-white p-3">
          <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 accent-orange" checked={!!v} onChange={(e) => set({ [f.name]: e.target.checked })} />
          <span><span className="block text-sm font-semibold text-ink">{f.label}</span>{f.help && <span className="help block">{f.help}</span>}</span>
        </label>
      );
    case 'markdown':
      return <FieldShell f={f} id={id}><MarkdownInput id={id} value={str} rows={f.rows} placeholder={f.placeholder} onChange={(x) => set({ [f.name]: x })} /></FieldShell>;
    case 'textarea':
      return <FieldShell f={f} id={id}><textarea id={id} className="input" rows={f.rows ?? 3} value={str} placeholder={f.placeholder} onChange={(e) => set({ [f.name]: e.target.value })} /></FieldShell>;
    case 'select':
      return (
        <FieldShell f={f} id={id}>
          <select id={id} className="input" value={str} onChange={(e) => set({ [f.name]: e.target.value })}>
            {!f.required && <option value="">{f.emptyLabel ?? '—'}</option>}
            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FieldShell>
      );
    case 'relation':
      return (
        <FieldShell f={f} id={id}>
          <select id={id} className="input" value={str} onChange={(e) => set({ [f.name]: e.target.value || null })}>
            <option value="">— Ninguno —</option>
            {(relations?.[f.name] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FieldShell>
      );
    case 'number':
      return <FieldShell f={f} id={id}><input id={id} type="number" className="input" value={str} placeholder={f.placeholder} onChange={(e) => set({ [f.name]: e.target.value === '' ? null : Number(e.target.value) })} /></FieldShell>;
    case 'date':
      return <FieldShell f={f} id={id}><input id={id} type="date" className="input" value={str ? String(str).slice(0, 10) : ''} onChange={(e) => set({ [f.name]: e.target.value || null })} /></FieldShell>;
    case 'month':
      return <FieldShell f={f} id={id}><input id={id} type="month" className="input" value={str ? String(str).slice(0, 7) : ''} onChange={(e) => set({ [f.name]: e.target.value ? e.target.value + '-01' : null })} /></FieldShell>;
    case 'tags':
      return <FieldShell f={f} id={id}><TagsInput id={id} value={v ?? []} suggestions={f.suggestions} onChange={(x) => set({ [f.name]: x })} /></FieldShell>;
    case 'image':
      return <FieldShell f={f} id={id}><ImageInput id={id} value={str} folder={f.folder} onChange={(x) => set({ [f.name]: x })} alt={f.altField ? data[f.altField] : undefined} onAlt={f.altField ? (x) => set({ [f.altField!]: x }) : undefined} /></FieldShell>;
    case 'pdf':
      return <FieldShell f={f} id={id}><PdfInput id={id} value={str} folder={f.folder} pdfOnly={f.pdfOnly} onChange={(x) => set({ [f.name]: x })} onThumb={f.thumbField ? (x) => set({ [f.thumbField!]: x }) : undefined} /></FieldShell>;
    case 'files':
      return <FieldShell f={f} id={id}><FilesInput value={v ?? []} folder={f.folder} onChange={(x) => set({ [f.name]: x })} /></FieldShell>;
    case 'links':
      return <FieldShell f={f} id={id}><LinksInput value={v ?? []} onChange={(x) => set({ [f.name]: x })} /></FieldShell>;
    case 'teachers': {
      if (f.teacherRole) {
        // Texto libre: se guarda dentro de la columna teachers como un elemento de tipo texto
        const all: any[] = data.teachers ?? [];
        const isCoord = f.teacherRole === 'coordinator';
        const mine = all.find((t) => t.text && !!t.coordinator === isCoord);
        const others = all.filter((t) => !(t.text && !!t.coordinator === isCoord));
        const save = (x: string) => set({ teachers: x.trim() ? [...others, { name: '', bio: x, coordinator: isCoord, text: true }] : others });
        return <FieldShell f={f} id={id}><MarkdownInput id={id} value={mine?.bio ?? ''} rows={f.rows ?? 3} onChange={save} /></FieldShell>;
      }
      return <FieldShell f={f} id={id}><TeachersInput value={v ?? []} onChange={(x) => set({ [f.name]: x })} /></FieldShell>;
    }
    case 'logos':
      return <FieldShell f={f} id={id}><LogosInput value={v ?? []} onChange={(x) => set({ [f.name]: x })} /></FieldShell>;
    default:
      return (
        <FieldShell f={f} id={id}>
          <input id={id} type={f.type === 'url' ? 'url' : f.type === 'email' ? 'email' : 'text'} list={f.suggestions ? id + '-list' : undefined} className="input" value={str} placeholder={f.placeholder} onChange={(e) => set({ [f.name]: e.target.value })} />
          {f.suggestions && <datalist id={id + '-list'}>{f.suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
        </FieldShell>
      );
  }
}

/** Validación básica antes de guardar. Devuelve un mensaje por campo con error. */
export function validate(fields: Field[], data: Record<string, any>) {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    const v = data[f.name];
    if (f.required && (v === undefined || v === null || String(v).trim() === '')) errs[f.name] = `Completá "${f.label}".`;
    if ((f.type === 'url' || f.type === 'image' || f.type === 'pdf') && v && !/^(https?:\/\/|\/|blob:|data:)/.test(String(v))) errs[f.name] = `"${f.label}" debe empezar con https:// o con /`;
    if (f.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v))) errs[f.name] = `"${f.label}" no parece un correo válido.`;
    if (f.type === 'links' && Array.isArray(v) && v.some((l: any) => l.url && !/^https?:\/\//.test(l.url))) errs[f.name] = 'Los enlaces deben empezar con https://';
  }
  return errs;
}

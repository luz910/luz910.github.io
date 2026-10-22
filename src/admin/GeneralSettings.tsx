import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2, UserPlus } from 'lucide-react';
import { saveSetting, useSettings } from '../lib/settings';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { callFunction } from '../lib/functions';
import { slugify } from '../lib/format';
import { ImageInput } from './fields';
import { SettingsForm } from './SettingsEditors';
import { ConfirmDialog, useToast } from './toast';

function LogosManager() {
  const { settings, loading } = useSettings();
  const qc = useQueryClient();
  const toast = useToast();
  const [logos, setLogos] = useState<Record<string, { label: string; url: string }> | null>(null);
  const [newName, setNewName] = useState('');
  useEffect(() => { if (!loading && !logos) setLogos(structuredClone(settings.logos)); }, [loading, settings.logos, logos]);
  if (!logos) return null;
  async function save() {
    try { await saveSetting('logos', logos!); await qc.invalidateQueries({ queryKey: ['settings'] }); toast.ok('Logos guardados. Ya se ven en las tarjetas de cursos.'); }
    catch (e) { toast.error((e as Error).message); }
  }
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-petrol">Logos institucionales de las tarjetas de cursos</h2>
      <p className="mb-4 mt-1 text-xs text-mute">Reemplazá cada logo de forma individual. Se muestran respetando sus proporciones. En cada curso elegís cuáles aparecen.</p>
      <div className="space-y-4">
        {Object.entries(logos).map(([k, l]) => (
          <div key={k} className="rounded-lg border border-line p-4">
            <div className="mb-3 flex items-center gap-2">
              <input className="input max-w-xs" aria-label="Nombre del logo" value={l.label} onChange={(e) => setLogos({ ...logos, [k]: { ...l, label: e.target.value } })} />
              <code className="text-xs text-mute">{k}</code>
              {!['uns', 'bioquns', 'dirEaD'].includes(k) && <button className="ml-auto rounded p-2 text-red-700 hover:bg-red-50" aria-label="Quitar logo" onClick={() => { const n = { ...logos }; delete n[k]; setLogos(n); }}><Trash2 className="h-4 w-4" /></button>}
            </div>
            <ImageInput id={`logo-${k}`} value={l.url} folder="logos" onChange={(url) => setLogos({ ...logos, [k]: { ...l, url } })} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Nombre de un logo nuevo" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="btn-outline" onClick={() => { const k = slugify(newName); if (!k) return; setLogos({ ...logos, [k]: { label: newName, url: '' } }); setNewName(''); }}><Plus className="h-4 w-4" />Agregar logo</button>
        <button className="btn-primary ml-auto" onClick={save}><Save className="h-4 w-4" />Guardar logos</button>
      </div>
    </section>
  );
}

function EditorsManager() {
  const { role, session } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'admin'>('editor');
  const [busy, setBusy] = useState(false);
  const [revoke, setRevoke] = useState<any>(null);
  const editors = useQuery({
    queryKey: ['editors'],
    queryFn: async () => { const { data, error } = await supabase.from('editors').select('*').order('created_at'); if (error) throw error; return data; },
  });
  async function add(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error('La contraseña inicial debe tener al menos 8 caracteres.');
    setBusy(true);
    try { await callFunction('admin', { action: 'create-editor', email, password, role: newRole }, true); toast.ok(`Se creó el acceso para ${email}. Comunicale la contraseña por un medio seguro.`); setEmail(''); setPassword(''); qc.invalidateQueries({ queryKey: ['editors'] }); }
    catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }
  async function doRevoke(row: any) {
    setRevoke(null);
    try { await callFunction('admin', { action: 'revoke-editor', user_id: row.user_id }, true); toast.ok(`Se revocó el acceso de ${row.email}.`); qc.invalidateQueries({ queryKey: ['editors'] }); }
    catch (err) { toast.error((err as Error).message); }
  }
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-petrol">Editores con acceso al panel</h2>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
        {editors.data?.map((ed: any) => (
          <li key={ed.user_id} className="flex items-center gap-3 p-3 text-sm">
            <span className="flex-1 truncate">{ed.email}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ed.role === 'admin' ? 'bg-orange-soft text-orange-deep' : 'bg-mist text-ink-soft'}`}>{ed.role === 'admin' ? 'Administrador' : 'Editor'}</span>
            {role === 'admin' && ed.user_id !== session?.user.id && <button className="rounded p-1.5 text-red-700 hover:bg-red-50" onClick={() => setRevoke(ed)} aria-label={`Revocar acceso de ${ed.email}`}><Trash2 className="h-4 w-4" /></button>}
          </li>
        ))}
      </ul>
      {role === 'admin' ? (
        <form onSubmit={add} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_9rem_auto]">
          <input className="input" type="email" required placeholder="correo@ejemplo.com" aria-label="Correo del nuevo editor" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="text" required placeholder="Contraseña inicial" aria-label="Contraseña inicial" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <select className="input" aria-label="Rol" value={newRole} onChange={(e) => setNewRole(e.target.value as any)}><option value="editor">Editor</option><option value="admin">Administrador</option></select>
          <button className="btn-dark" disabled={busy}><UserPlus className="h-4 w-4" />Crear</button>
        </form>
      ) : <p className="mt-3 text-xs text-mute">Solo un administrador puede crear o revocar accesos.</p>}
      <ConfirmDialog open={!!revoke} title={`¿Revocar el acceso de ${revoke?.email}?`} text="Esa persona ya no podrá entrar al panel ni modificar contenidos." confirmLabel="Revocar acceso" onCancel={() => setRevoke(null)} onConfirm={() => doRevoke(revoke)} />
    </section>
  );
}

export default function GeneralSettings() {
  return (
    <SettingsForm
      k="general" title="Configuración general"
      groups={[{ title: 'Sitio y buscadores', fields: [
        { name: 'site_name', label: 'Nombre del sitio', type: 'text', required: true },
        { name: 'site_url', label: 'Dirección pública del sitio', type: 'url', placeholder: 'https://www.bioquns.com.ar', help: 'Se usa en los correos, el sitemap y los enlaces canónicos. Completala cuando tengas el dominio.' },
        { name: 'tagline', label: 'Lema (aparece en el título de la pestaña)', type: 'text', wide: true },
        { name: 'default_seo_description', label: 'Descripción general para buscadores', type: 'textarea', rows: 2, wide: true },
      ] }]}
      extra={() => <><LogosManager /><EditorsManager /></>}
    />
  );
}

export function Account() {
  const { session } = useAuth();
  const toast = useToast();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (p1.length < 8) return toast.error('Usá al menos 8 caracteres.');
    if (p1 !== p2) return toast.error('Las contraseñas no coinciden.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (error) return toast.error('No se pudo cambiar: ' + error.message);
    setP1(''); setP2(''); toast.ok('Contraseña actualizada.');
  }
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-extrabold text-ink">Mi cuenta</h1>
      <p className="mt-1 text-sm text-mute">{session?.user.email}</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-line bg-white p-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-petrol">Cambiar contraseña</h2>
        <div><label className="label" htmlFor="p1">Nueva contraseña</label><input id="p1" type="password" className="input" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} /></div>
        <div><label className="label" htmlFor="p2">Repetir contraseña</label><input id="p2" type="password" className="input" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} /></div>
        <p className="help">Recomendación: una frase larga, distinta de la contraseña inicial.</p>
        <button className="btn-primary" disabled={busy}><Save className="h-4 w-4" />Guardar contraseña</button>
      </form>
    </div>
  );
}

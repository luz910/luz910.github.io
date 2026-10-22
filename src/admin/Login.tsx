import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { DnaLoader, DnaSymbol } from '../components/DnaSymbol';
import { Seo } from '../components/Seo';
import { IS_DEMO } from '../lib/paths';

const FIXED_EMAIL = (import.meta.env.VITE_EDITOR_EMAIL as string | undefined)?.trim() || '';

export default function Login() {
  const { session, role, loading, signIn } = useAuth();
  const nav = useNavigate();
  const [useOther, setUseOther] = useState(!FIXED_EMAIL);
  const [email, setEmail] = useState(FIXED_EMAIL);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (loading) return <DnaLoader />;
  if (session && role) return <Navigate to="/admin" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const err = await signIn(useOther ? email : FIXED_EMAIL, password);
    setBusy(false);
    if (err) setMsg({ ok: false, text: err }); else nav('/admin', { replace: true });
  }
  async function reset() {
    const target = useOther ? email : FIXED_EMAIL;
    if (!target) return setMsg({ ok: false, text: 'Escribí tu correo para recibir el enlace.' });
    const { error } = await supabase.auth.resetPasswordForEmail(target, { redirectTo: `${window.location.origin}/admin/cuenta` });
    setMsg(error ? { ok: false, text: 'No se pudo enviar: ' + error.message } : { ok: true, text: 'Si el correo corresponde a un editor, vas a recibir un enlace para crear una nueva contraseña.' });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4">
      <Seo title="Acceso editores" noindex />
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink"><ArrowLeft className="h-4 w-4" />Volver al sitio</Link>
        <div className="card p-8">
          <div className="flex flex-col items-center text-center">
            <DnaSymbol className="h-16 w-auto" />
            <h1 className="mt-4 text-xl font-extrabold text-ink">Acceso editores</h1>
            <p className="mt-1 text-sm text-mute">Panel de administración de BIOQUNS</p>
          </div>
          {IS_DEMO && <p className="mt-6 rounded-lg bg-petrol-soft p-3 text-center text-sm text-petrol-deep">Demostración: la contraseña es <strong>25/10/01</strong>. Los cambios no se guardan al recargar.</p>}
          {!supabaseConfigured && <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Falta conectar Supabase (ver README).</p>}
          <form className="mt-6 space-y-4" onSubmit={submit}>
            {useOther && (
              <div>
                <label className="label" htmlFor="email">Correo electrónico</label>
                <input id="email" type="email" className="input" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            )}
            {!useOther && <input type="email" className="hidden" autoComplete="username" value={FIXED_EMAIL} readOnly />}
            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <input id="password" type="password" className="input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            </div>
            {msg && <p role="alert" className={`rounded-lg p-3 text-sm ${msg.ok ? 'bg-petrol-soft text-petrol-deep' : 'bg-red-50 text-red-800'}`}>{msg.text}</p>}
            <button className="btn-dark w-full" disabled={busy}><Lock className="h-4 w-4" />{busy ? 'Ingresando…' : 'Ingresar'}</button>
          </form>
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs">
            <button className="text-mute hover:text-ink" onClick={reset}>Olvidé mi contraseña</button>
            {FIXED_EMAIL && <button className="text-mute hover:text-ink" onClick={() => { setUseOther(!useOther); setEmail(useOther ? FIXED_EMAIL : ''); }}>{useOther ? 'Usar cuenta principal' : 'Ingresar con otra cuenta'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

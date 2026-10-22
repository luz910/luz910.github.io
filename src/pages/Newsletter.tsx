import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { callFunction } from '../lib/functions';
import { useSettings } from '../lib/settings';
import { DnaLoader, DnaSymbol } from '../components/DnaSymbol';
import { Seo } from '../components/Seo';
import { Markdown } from '../components/Markdown';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x flex justify-center py-20">
      <Seo title="Newsletter" noindex />
      <div className="card w-full max-w-lg p-8 text-center sm:p-10"><DnaSymbol className="mx-auto h-16 w-auto" />{children}</div>
    </div>
  );
}
const Msg = ({ ok, text }: { ok: boolean; text: string }) => (
  <div className={`mt-6 flex items-start gap-3 rounded-xl p-4 text-left text-sm ${ok ? 'bg-petrol-soft text-petrol-deep' : 'bg-red-50 text-red-800'}`} role={ok ? 'status' : 'alert'}>
    {ok ? <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden /> : <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />}<p>{text}</p>
  </div>
);

export function Confirm() {
  const [p] = useSearchParams();
  const token = p.get('token');
  const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!token) { setRes({ ok: false, text: 'El enlace de confirmación está incompleto.' }); return; }
    callFunction<{ message: string }>('newsletter', { action: 'confirm', token })
      .then((r) => setRes({ ok: true, text: r.message }))
      .catch((e) => setRes({ ok: false, text: e.message }));
  }, [token]);
  return (
    <Shell>
      <h1 className="h-display mt-4 text-3xl">Confirmación de suscripción</h1>
      {!res ? <DnaLoader label="Confirmando…" /> : <Msg {...res} />}
      <Link to="/cursos" className="btn-primary mt-8">Ver cursos</Link>
    </Shell>
  );
}

export function Unsubscribe() {
  const [p] = useSearchParams();
  const token = p.get('token');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null);
  async function run(body: object) {
    setBusy(true);
    try { const r = await callFunction<{ message: string }>('newsletter', body); setRes({ ok: true, text: r.message }); }
    catch (e) { setRes({ ok: false, text: (e as Error).message }); }
    finally { setBusy(false); }
  }
  return (
    <Shell>
      <h1 className="h-display mt-4 text-3xl">Cancelar suscripción</h1>
      {res ? <Msg {...res} /> : token ? (
        <>
          <p className="mt-3 text-ink-soft">Vas a dejar de recibir las novedades de BIOQUNS por correo.</p>
          <button className="btn-dark mt-6" disabled={busy} onClick={() => run({ action: 'unsubscribe', token })}>{busy ? 'Procesando…' : 'Confirmar baja'}</button>
        </>
      ) : (
        <form className="mt-6 space-y-3 text-left" onSubmit={(e: FormEvent) => { e.preventDefault(); run({ action: 'request-unsubscribe', email }); }}>
          <p className="text-sm text-ink-soft">Ingresá tu correo y te enviaremos un enlace para confirmar la baja. También podés usar el enlace que aparece al pie de cada correo.</p>
          <label className="label" htmlFor="baja-email">Correo electrónico</label>
          <input id="baja-email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-dark w-full" disabled={busy}>{busy ? 'Enviando…' : 'Enviarme el enlace de baja'}</button>
        </form>
      )}
    </Shell>
  );
}

export function Privacy() {
  const { settings } = useSettings();
  return (
    <div className="container-x max-w-3xl py-16">
      <Seo title="Aviso de privacidad" />
      <h1 className="h-display text-4xl">Aviso de privacidad</h1>
      <Markdown className="mt-6">{settings.footer.privacy_text}</Markdown>
      {settings.footer.email && <p className="mt-6 text-ink-soft">Para consultas sobre tus datos escribinos a <a className="link" href={`mailto:${settings.footer.email}`}>{settings.footer.email}</a>.</p>}
    </div>
  );
}

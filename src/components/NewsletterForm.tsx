import { useState, type FormEvent } from 'react';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { callFunction } from '../lib/functions';
import { Link } from 'react-router-dom';

const INTERESTS = ['Cursos', 'Artículos', 'Publicaciones'];

export function NewsletterForm({ variant = 'band', showInterests = false }: { variant?: 'band' | 'compact' | 'card'; showInterests?: boolean }) {
  const { settings } = useSettings();
  const n = settings.newsletter;
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState(''); // campo trampa anti-spam (invisible para personas)
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'ok' | 'error'; msg?: string }>({ kind: 'idle' });
  const id = variant + Math.random().toString(36).slice(2, 6);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setState({ kind: 'error', msg: 'Revisá el correo: parece incompleto.' });
    if (!consent) return setState({ kind: 'error', msg: 'Necesitamos tu consentimiento para enviarte correos.' });
    setState({ kind: 'sending' });
    try {
      const r = await callFunction<{ message: string }>('newsletter', {
        action: 'subscribe', email: email.trim(), name: name.trim(), interests, consent: n.consent, website: hp,
      });
      setState({ kind: 'ok', msg: r.message });
    } catch (err) {
      setState({ kind: 'error', msg: (err as Error).message });
    }
  }

  const dark = variant === 'band';
  if (state.kind === 'ok') {
    return (
      <div role="status" className={`flex items-start gap-3 rounded-xl p-4 ${dark ? 'bg-white/10 text-white' : 'bg-petrol-soft text-petrol-deep'}`}>
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p className="text-sm">{state.msg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div className={`flex flex-col gap-2 ${variant === 'compact' ? '' : 'sm:flex-row'}`}>
        {showInterests && (
          <div className="sm:w-44">
            <label htmlFor={id + 'n'} className="sr-only">Nombre (opcional)</label>
            <input id={id + 'n'} className="input" placeholder="Nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
          </div>
        )}
        <div className="relative flex-1">
          <label htmlFor={id + 'e'} className="sr-only">Correo electrónico</label>
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
          <input id={id + 'e'} type="email" required className="input pl-9" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <input tabIndex={-1} aria-hidden className="hidden" value={hp} onChange={(e) => setHp(e.target.value)} name="website" autoComplete="off" />
        <button className={dark ? 'btn-primary' : 'btn-dark'} disabled={state.kind === 'sending'}>
          {state.kind === 'sending' ? 'Enviando…' : n.button}
        </button>
      </div>
      {showInterests && (
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <legend className={`mr-2 inline font-semibold ${dark ? 'text-white/80' : 'text-ink-soft'}`}>Me interesan:</legend>
          {INTERESTS.map((i) => (
            <label key={i} className={`inline-flex items-center gap-1.5 ${dark ? 'text-white/85' : 'text-ink-soft'}`}>
              <input type="checkbox" className="accent-orange" checked={interests.includes(i)} onChange={(e) => setInterests(e.target.checked ? [...interests, i] : interests.filter((x) => x !== i))} />
              {i}
            </label>
          ))}
        </fieldset>
      )}
      <label className={`flex items-start gap-2 text-xs leading-snug ${dark ? 'text-white/75' : 'text-mute'}`}>
        <input type="checkbox" className="mt-0.5 accent-orange" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{n.consent} <Link to="/privacidad" className={dark ? 'underline' : 'link'}>Aviso de privacidad</Link>.</span>
      </label>
      {state.kind === 'error' && (
        <p role="alert" className={`flex items-center gap-2 text-sm ${dark ? 'text-orange-soft' : 'text-red-700'}`}>
          <AlertCircle className="h-4 w-4" aria-hidden /> {state.msg}
        </p>
      )}
    </form>
  );
}

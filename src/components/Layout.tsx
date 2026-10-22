import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Mail, Phone, MapPin, Lock } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { supabaseConfigured } from '../lib/supabase';
import { NewsletterForm } from './NewsletterForm';
import { SocialIcon, type SocialName } from './SocialIcons';
import { DnaSymbol } from './DnaSymbol';
import { IS_DEMO } from '../lib/paths';

export const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/articulos', label: 'Artículos de interés' },
  { to: '/cursos', label: 'Nuestros cursos' },
  { to: '/publicaciones', label: 'Nuestras publicaciones' },
  { to: '/congresos', label: 'Congresos' },
  { to: '/quienes-somos', label: 'Quiénes somos' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  const item = ({ isActive }: { isActive: boolean }) =>
    `relative px-1 py-2 text-[0.84rem] font-semibold transition-colors ${isActive ? 'text-ink after:absolute after:inset-x-1 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-orange' : 'text-ink-soft hover:text-ink'}`;
  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${scrolled ? 'border-line bg-white/90 backdrop-blur-md' : 'border-transparent bg-paper/80 backdrop-blur-sm'}`}>
      <a href="#contenido" onClick={(e) => { e.preventDefault(); const m = document.getElementById('contenido'); m?.setAttribute('tabindex', '-1'); m?.focus(); }} className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Saltar al contenido</a>
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex shrink-0 items-center" aria-label="BIOQUNS — Inicio">
          <img src="/brand/wordmark.png" alt="BIOQUNS" className="h-8 w-auto sm:h-9" width={361} height={95} />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-5 lg:flex">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={item}>{n.label}</NavLink>)}
        </nav>
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-mist lg:hidden" aria-expanded={open} aria-controls="menu-movil" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav id="menu-movil" aria-label="Principal" className="border-t border-line bg-white lg:hidden">
          <ul className="container-x py-2">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={({ isActive }) => `flex items-center justify-between rounded-lg px-3 py-3 text-base font-semibold ${isActive ? 'bg-orange-soft text-orange-deep' : 'text-ink hover:bg-mist'}`}>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { settings } = useSettings();
  const f = settings.footer;
  const socials = (['instagram', 'linkedin', 'facebook', 'youtube'] as SocialName[]).filter((s) => (f as any)[s]);
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-3">
            <DnaSymbol className="h-12 w-auto" />
            <img src="/brand/wordmark.png" alt="BIOQUNS" className="h-8 w-auto" />
          </div>
          {f.description && <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">{f.description}</p>}
          {socials.length > 0 && (
            <ul className="mt-5 flex gap-2">
              {socials.map((s) => (
                <li key={s}>
                  <a href={(f as any)[s]} target="_blank" rel="noopener noreferrer" aria-label={s} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-mist text-ink-soft hover:bg-orange hover:text-white">
                    <SocialIcon name={s} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="md:col-span-2">
          <h2 className="eyebrow">Secciones</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV.map((n) => <li key={n.to}><Link to={n.to} className="text-ink-soft hover:text-orange-deep">{n.label}</Link></li>)}
          </ul>
        </div>
        <div className="md:col-span-2">
          <h2 className="eyebrow">Contacto</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {f.email && <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><a className="break-all hover:text-orange-deep" href={`mailto:${f.email}`}>{f.email}</a></li>}
            {f.phone && <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{f.phone}</li>}
            {f.address && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{f.address}</li>}
            {!f.email && !f.phone && !f.address && <li className="text-mute">Datos de contacto a completar desde el panel.</li>}
            {f.website_links?.map((l) => <li key={l.url}><a className="hover:text-orange-deep" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a></li>)}
          </ul>
        </div>
        <div className="md:col-span-4">
          <h2 className="eyebrow">Newsletter</h2>
          <p className="mt-3 mb-3 text-sm text-ink-soft">{settings.newsletter.text}</p>
          <NewsletterForm variant="compact" />
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-5 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>© {new Date().getFullYear()} BIOQUNS. Todos los derechos reservados.</span>
            <Link to="/privacidad" className="hover:text-ink">Aviso de privacidad</Link>
            <Link to="/newsletter/baja" className="hover:text-ink">Cancelar suscripción</Link>
          </div>
          <Link to="/editores" className="inline-flex items-center gap-1.5 self-end text-mute hover:text-ink sm:self-auto">
            <Lock className="h-3 w-3" aria-hidden /> Acceso editores
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      {IS_DEMO && (
        <div className="bg-petrol-deep px-4 py-2 text-center text-xs font-semibold text-white">
          Vista de demostración con contenido de ejemplo · Para entrar al panel: «Acceso editores» al pie, contraseña 25/10/01
        </div>
      )}
      {!IS_DEMO && !supabaseConfigured && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          El sitio aún no está conectado a Supabase. Configurá <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (ver README).
        </div>
      )}
      <Navbar />
      <main id="contenido" className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}

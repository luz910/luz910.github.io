import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Mail, Lock, ChevronDown } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { supabaseConfigured } from '../lib/supabase';
import { NewsletterForm } from './NewsletterForm';
import { SocialIcon } from './SocialIcons';
import { IS_DEMO } from '../lib/paths';

type NavLinkItem = { to: string; label: string; end?: boolean };
type NavGroup = { label: string; children: NavLinkItem[] };
type NavItem = NavLinkItem | NavGroup;
const isGroup = (n: NavItem): n is NavGroup => 'children' in n;

export const NAV: NavItem[] = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/articulos', label: 'Artículos de interés' },
  { to: '/cursos', label: 'Nuestros cursos' },
  {
    label: 'Nuestro trabajo',
    children: [
      { to: '/publicaciones', label: 'Nuestras publicaciones' },
      { to: '/congresos', label: 'Actividades científicas y académicas', end: true },
      { to: '/congresos/posteres', label: 'Nuestros pósteres' },
      { to: '/congresos/galeria', label: 'Galería' },
    ],
  },
  { to: '/quienes-somos', label: 'Quiénes somos' },
];
/** Lista plana de enlaces (para el pie de página). */
export const NAV_FLAT: NavLinkItem[] = NAV.flatMap((n) => (isGroup(n) ? n.children : [n]));

/** Botón "Nuestro trabajo" que despliega sus secciones hacia abajo. */
function NavDropdown({ group, itemClass }: { group: NavGroup; itemClass: (a: { isActive: boolean }) => string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const active = group.children.some((c) => pathname === c.to || pathname.startsWith(c.to + '/'));
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', click); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)} className={`${itemClass({ isActive: active })} inline-flex items-center gap-1.5`}>
        {group.label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-white py-1.5 shadow-[0_16px_36px_-16px_rgba(20,30,40,0.35)]">
          {group.children.map((c) => (
            <NavLink key={c.to} to={c.to} end={c.end} className={({ isActive }) => `block px-4 py-2.5 text-[0.95rem] font-semibold transition-colors ${isActive ? 'bg-orange-soft text-orange-deep' : 'text-ink hover:bg-orange-soft hover:text-orange-deep'}`}>
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

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
    `whitespace-nowrap rounded-md px-3.5 py-2 text-[0.98rem] font-semibold transition-all duration-200 ${isActive ? 'bg-orange text-white shadow-sm' : 'text-ink hover:bg-orange-soft hover:text-orange-deep'}`;
  return (
    <header className={`sticky top-0 z-40 bg-bar transition-shadow ${scrolled ? 'shadow-[0_6px_18px_-12px_rgba(20,30,40,0.35)]' : ''}`}>
      <a href="#contenido" onClick={(e) => { e.preventDefault(); const m = document.getElementById('contenido'); m?.setAttribute('tabindex', '-1'); m?.focus(); }} className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Saltar al contenido</a>
      <div className="flex h-20 w-full items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center" aria-label="BIOQUNS — Inicio">
          <img src="/brand/wordmark.png" alt="BIOQUNS" className="h-8 w-auto sm:h-9" width={361} height={86} />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 xl:flex">
          {NAV.map((n) => isGroup(n)
            ? <NavDropdown key={n.label} group={n} itemClass={item} />
            : <NavLink key={n.to} to={n.to} end={n.end} className={item}>{n.label}</NavLink>)}
        </nav>
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-orange-soft xl:hidden" aria-expanded={open} aria-controls="menu-movil" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav id="menu-movil" aria-label="Principal" className="border-t border-line bg-white xl:hidden">
          <ul className="container-x py-2">
            {NAV.map((n) => isGroup(n) ? (
              <li key={n.label} className="mt-1 border-t border-line pt-2">
                <p className="px-3 pb-1 text-xs font-bold uppercase tracking-[0.14em] text-mute">{n.label}</p>
                <ul>
                  {n.children.map((c) => (
                    <li key={c.to}>
                      <NavLink to={c.to} end={c.end} className={({ isActive }) => `flex items-center rounded-md py-2.5 pl-6 pr-3 text-base font-semibold ${isActive ? 'bg-orange text-white' : 'text-ink hover:bg-orange-soft hover:text-orange-deep'}`}>
                        {c.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={({ isActive }) => `flex items-center justify-between rounded-md px-3 py-3 text-base font-semibold ${isActive ? 'bg-orange text-white' : 'text-ink hover:bg-orange-soft hover:text-orange-deep'}`}>
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

/** Datos fijos del pie de página (no se editan desde el panel). */
export const CONTACT = { email: 'bioquns@gmail.com', instagram: 'https://www.instagram.com/bioquns', instagramHandle: '@bioquns' };

function Footer() {
  const { settings } = useSettings();
  const head = 'text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white';
  const link = 'text-white/80 transition-colors hover:text-white hover:underline underline-offset-4';
  return (
    <footer className="mt-24 bg-petrol-deep font-corp text-white">
      <div className="mx-auto w-full max-w-[1500px] px-6 sm:px-10 lg:px-16 grid gap-10 py-14 sm:grid-cols-2 lg:flex lg:justify-between lg:gap-12">
        <div className="lg:w-[17rem] lg:shrink-0">
          <p className="font-display text-[2.1rem] font-extrabold leading-none tracking-[-0.01em] text-white">BIOQUNS</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">Educación a distancia y actualización profesional continua.</p>
          <ul className="mt-5 flex gap-2">
            <li>
              <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${CONTACT.instagramHandle}`} title={CONTACT.instagramHandle} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-orange">
                <SocialIcon name="instagram" />
              </a>
            </li>
          </ul>
        </div>
        <div className="lg:shrink-0">
          <h2 className={head}>Navegación</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV_FLAT.map((n) => <li key={n.to}><Link to={n.to} className={`whitespace-nowrap ${link}`}>{n.label}</Link></li>)}
          </ul>
        </div>
        <div className="lg:mr-20 lg:shrink-0">
          <h2 className={head}>Contacto</h2>
          <ul className="mt-3 space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0" aria-hidden /><a className={`[overflow-wrap:anywhere] ${link}`} href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
          </ul>
        </div>
        <div className="lg:w-[28rem] lg:shrink">
          <h2 className={head}>Newsletter</h2>
          <p className="mb-3 mt-3 text-sm text-white/80">{settings.newsletter.text}</p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto w-full max-w-[1500px] px-6 sm:px-10 lg:px-16 flex flex-col gap-3 py-5 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>© {new Date().getFullYear()} BIOQUNS. Todos los derechos reservados.</span>
            <Link to="/privacidad" className={link}>Aviso de privacidad</Link>
            <Link to="/newsletter/baja" className={link}>Cancelar suscripción</Link>
          </div>
          <Link to="/editores" className={`inline-flex items-center gap-1.5 self-end sm:self-auto ${link}`}>
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

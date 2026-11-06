import { useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { BookOpenText, UserCog, ExternalLink, FileText, GraduationCap, Images, LayoutDashboard, LogOut, Mail, Menu, Microscope, Presentation, UserRound, Users, X, Info } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { DnaLoader } from '../components/DnaSymbol';
import { Seo } from '../components/Seo';
import { ToastProvider } from './toast';
import ResourceList from './ResourceList';
import ResourceEditor from './ResourceEditor';
import Dashboard from './Dashboard';
import { AboutEditor } from './SettingsEditors';
import GeneralSettings, { Account } from './GeneralSettings';
import GalleryAdmin from './GalleryAdmin';
import NewsletterAdmin from './NewsletterAdmin';
import { appHref, newTab } from '../lib/paths';

const MENU = [
  { to: '/admin', label: 'Resumen general', icon: LayoutDashboard, end: true },
  { to: '/admin/articulos', label: 'Artículos', icon: BookOpenText },
  { to: '/admin/cursos', label: 'Cursos', icon: GraduationCap },
  { to: '/admin/publicaciones', label: 'Publicaciones', icon: Microscope },
  { to: '/admin/congresos', label: 'Actividades científicas', icon: Presentation },
  { to: '/admin/posteres', label: 'Pósteres', icon: FileText },
  { to: '/admin/galeria', label: 'Galería', icon: Images },
  { to: '/admin/quienes-somos', label: 'Quiénes somos', icon: Info },
  { to: '/admin/integrantes', label: 'Integrantes', icon: Users },
  { to: '/admin/newsletter', label: 'Newsletter y suscriptores', icon: Mail },
  { to: '/admin/editores', label: 'Editores', icon: UserCog },
];

export default function AdminApp() {
  const { session, role, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  if (loading) return <DnaLoader label="Verificando acceso…" />;
  if (!session || !role) return <Navigate to="/editores" replace state={{ from: loc.pathname }} />;

  const nav = (
    <nav aria-label="Panel" className="space-y-0.5">
      {MENU.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'}`}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden />{label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <ToastProvider>
      <Seo title="Panel de editores" noindex />
      <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink p-4 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-6 flex items-center justify-between px-2">
            <Link to="/admin" className="flex items-center gap-2"><img src="/brand/simbolo-adn.png" alt="" className="h-8 w-auto" /><span className="font-extrabold tracking-wide text-white">BIOQUNS</span></Link>
            <button className="text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">{nav}</div>
          <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
            <a href={appHref('/')} {...newTab} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/65 hover:text-white"><ExternalLink className="h-4 w-4" />Ver sitio</a>
            <NavLink to="/admin/cuenta" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/65 hover:text-white"><UserRound className="h-4 w-4" /><span className="truncate">{session.user.email}</span></NavLink>
            <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/65 hover:text-white"><LogOut className="h-4 w-4" />Cerrar sesión</button>
          </div>
        </aside>
        {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
            <button onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu className="h-5 w-5" /></button>
            <span className="font-bold">Panel BIOQUNS</span>
          </header>
          <main className="mx-auto max-w-6xl p-4 sm:p-8">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="quienes-somos" element={<AboutEditor />} />
              <Route path="galeria" element={<GalleryAdmin />} />
              <Route path="newsletter" element={<NewsletterAdmin />} />
              <Route path="editores" element={<GeneralSettings />} />
              <Route path="cuenta" element={<Account />} />
              <Route path=":key" element={<ResourceList />} />
              <Route path=":key/:id" element={<ResourceEditor />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

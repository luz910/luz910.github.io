import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock3, MonitorPlay, BookOpen, BookOpenText } from 'lucide-react';
import type { Article, Course, Publication, EnrollmentStatus } from '../lib/types';
import { ENROLLMENT_LABEL, fmtShort, plainText } from '../lib/format';
import { useSettings } from '../lib/settings';
import { Img } from './Img';

export function EnrollmentBadge({ s, className = '' }: { s: EnrollmentStatus; className?: string }) {
  const tone = s === 'open' ? 'bg-orange text-white' : s === 'soon' ? 'bg-petrol text-white' : 'bg-ink/10 text-ink-soft';
  return (
    <span className={`badge-center inline-flex items-center gap-1.5 rounded-full px-2.5 py-[0.4rem] text-[0.7rem] font-bold uppercase tracking-wide ${tone} ${className}`}>
      {s === 'open' && <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />}
      {ENROLLMENT_LABEL[s]}
    </span>
  );
}

export function LogoStrip({ keys, size = 'sm' }: { keys: string[]; size?: 'sm' | 'md' }) {
  const { settings } = useSettings();
  const logos = keys.map((k) => settings.logos[k]).filter((l) => l?.url);
  if (!logos.length) return null;
  const h = size === 'sm' ? 'h-8' : 'h-11';
  return (
    <div className="inline-flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
      {logos.map((l, i) => (
        <img key={i} src={l.url} alt={l.label} title={l.label} className={`${h} w-auto max-w-[5.5rem] object-contain`} loading="lazy" />
      ))}
    </div>
  );
}

/** Tarjeta de curso — estructura inspirada en la referencia, con estética BIOQUNS. */
export function CourseCard({ c }: { c: Course }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-card-line bg-card transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-18px_rgba(120,80,30,0.35)]">
      <div className="flex items-center justify-between gap-2 border-b border-card-line/80 bg-card-head px-5 py-2.5">
        <span className="text-sm font-bold text-ink">Curso</span>
        <EnrollmentBadge s={c.enrollment_status} />
      </div>
      <div className="relative h-36 overflow-hidden">
        <Img src={c.cover_url} alt={c.cover_alt || c.title} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-4 top-4"><LogoStrip keys={c.logos} /></div>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="line-clamp-2 font-display text-xl font-bold leading-snug text-ink">
          <Link to={`/cursos/${c.slug}`} className="after:absolute after:inset-0 focus:outline-none">{c.title}</Link>
        </h3>
        {c.institution && <p className="mt-1 text-[0.95rem] text-ink-soft">{c.institution}</p>}
        <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
          {c.duration && <li className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-petrol" aria-hidden />{c.duration}</li>}
          {c.modality && <li className="flex items-center gap-2"><MonitorPlay className="h-4 w-4 text-petrol" aria-hidden />{c.modality}</li>}
        </ul>
        <div className="mt-auto pt-5">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-deep transition-all group-hover:gap-2.5">
            Ver programa <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}

/** Ilustración fija para las tarjetas de artículos: un librito sobre fondo suave. */
/** Colores por categoría de artículo: degradé de la tarjeta, librito y etiqueta. */
type Tone = { from: string; to: string; icon: string; chipBg: string; chipText: string };
const TONES: Record<string, Tone> = {
  petrol: { from: '#eef4f6', to: '#d6e7ec', icon: '#1f4b5a', chipBg: '#e4eef1', chipText: '#163844' },
  orange: { from: '#fdf4ee', to: '#fbdcc8', icon: '#e86a2a', chipBg: '#fdeee5', chipText: '#b9501a' },
  violet: { from: '#f5f2fa', to: '#e2d9f1', icon: '#7b5ea7', chipBg: '#eee8f6', chipText: '#5b3f87' },
  green:  { from: '#f1f7f2', to: '#d8eadb', icon: '#3f8a55', chipBg: '#e5f1e7', chipText: '#2d6a40' },
  rose:   { from: '#fcf2f3', to: '#f4d6da', icon: '#c2414f', chipBg: '#fae6e8', chipText: '#9c2f3b' },
  amber:  { from: '#fdf8ec', to: '#f6e6b8', icon: '#b7860b', chipBg: '#fbf1d6', chipText: '#86620a' },
  blue:   { from: '#f0f5fb', to: '#d5e3f4', icon: '#3567a8', chipBg: '#e4edf8', chipText: '#264d80' },
  teal:   { from: '#eff8f7', to: '#cfeae6', icon: '#0f857c', chipBg: '#e0f2f0', chipText: '#0b6159' },
  slate:  { from: '#f3f4f6', to: '#dde1e7', icon: '#4b5565', chipBg: '#e8ebef', chipText: '#363d49' },
};
const KNOWN: Record<string, keyof typeof TONES> = {
  'química clínica': 'petrol', 'hematología y hemostasia': 'orange', 'inmunología y serología': 'blue',
  'microbiología clínica': 'rose', 'biología molecular y genética': 'violet', 'endocrinología': 'teal',
  'toxicología': 'green', 'ética y legislación': 'slate', 'gestión de calidad': 'amber',
};
const ORDER = Object.keys(TONES) as (keyof typeof TONES)[];
export function categoryTone(cat?: string | null): Tone {
  const k = (cat ?? '').trim().toLowerCase();
  if (!k) return TONES.petrol;
  if (KNOWN[k]) return TONES[KNOWN[k]];
  let h = 0; for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) >>> 0; // misma categoría = mismo color siempre
  return TONES[ORDER[h % ORDER.length]];
}

/** Ilustración fija para las tarjetas de artículos: un librito sobre fondo suave. */
export function ArticleArt({ className = 'h-32', category, left = false }: { className?: string; category?: string | null; left?: boolean }) {
  const t = category !== undefined ? categoryTone(category) : null;
  const bg = t ? `linear-gradient(135deg, ${t.from} 0%, ${t.from} 30%, ${t.to} 100%)` : 'linear-gradient(135deg,#dcebef 0%,#e9f1f2 55%,#fbe6d6 100%)';
  return (
    <div className={`relative flex w-full items-center overflow-hidden ${left ? 'justify-start px-5' : 'justify-center'} ${className}`} style={{ backgroundImage: bg }} aria-hidden>
      <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-[0_10px_24px_-12px_rgba(22,56,68,0.45)] ring-1 ring-line transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-4deg]">
        <BookOpenText className="h-6 w-6" style={{ color: t ? t.icon : 'var(--color-orange)' }} strokeWidth={1.6} />
      </span>
    </div>
  );
}

export function ArticleCard({ a, compact = false }: { a: Article; compact?: boolean }) {
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5">
      <ArticleArt className="h-20" left />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {a.category && <span className="chip" style={{ backgroundColor: categoryTone(a.category).chipBg, color: categoryTone(a.category).chipText }}>{a.category}</span>}
          <span className="inline-flex items-center gap-1 text-mute"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{fmtShort(a.published_at)}</span>
        </div>
        <h3 className="mt-3 font-display text-xl font-bold leading-snug text-ink">
          <Link to={`/articulos/${a.slug}`} className="after:absolute after:inset-0 focus:outline-none group-hover:text-orange-deep">{a.title}</Link>
        </h3>
        {!compact && (a.excerpt || a.summary) && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{a.excerpt || plainText(a.summary, 200)}</p>}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-orange-deep">Leer artículo <ArrowRight className="h-4 w-4" aria-hidden /></span>
      </div>
    </article>
  );
}

export function PublicationCard({ p }: { p: Publication }) {
  return (
    <article className="card group relative flex h-full gap-4 p-4 transition hover:-translate-y-0.5 sm:p-5">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap gap-2 text-xs">
          {p.year && <span className="chip">{p.year}</span>}
        </div>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">
          <Link to={`/publicaciones/${p.slug}`} className="after:absolute after:inset-0 focus:outline-none group-hover:text-orange-deep">{p.title}</Link>
        </h3>
        {p.authors && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.authors}</p>}
        {p.source && <p className="mt-1 flex items-center gap-1.5 text-xs italic text-mute"><BookOpen className="h-3.5 w-3.5 not-italic" aria-hidden />{p.source}</p>}
        {p.abstract && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{plainText(p.abstract, 160)}</p>}
      </div>
    </article>
  );
}

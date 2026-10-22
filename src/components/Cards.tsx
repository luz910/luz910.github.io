import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock3, Gauge, MonitorPlay, BookOpen, FileText } from 'lucide-react';
import type { Article, Course, Publication, EnrollmentStatus } from '../lib/types';
import { ENROLLMENT_LABEL, fmtShort, plainText } from '../lib/format';
import { useSettings } from '../lib/settings';
import { Img } from './Img';

export function EnrollmentBadge({ s, className = '' }: { s: EnrollmentStatus; className?: string }) {
  const tone = s === 'open' ? 'bg-orange text-white' : s === 'soon' ? 'bg-petrol text-white' : 'bg-ink/10 text-ink-soft';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${tone} ${className}`}>
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-card-line bg-card transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-18px_rgba(31,75,90,0.45)]">
      <div className="flex items-center justify-between gap-2 border-b border-card-line/80 bg-[#dfe8ed] px-5 py-2.5">
        <span className="text-sm font-bold text-petrol-deep">Curso</span>
        <EnrollmentBadge s={c.enrollment_status} />
      </div>
      <div className="relative h-36 overflow-hidden">
        <Img src={c.cover_url} alt={c.cover_alt} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-4 top-4"><LogoStrip keys={c.logos} /></div>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="line-clamp-2 text-xl font-extrabold leading-snug text-ink">
          <Link to={`/cursos/${c.slug}`} className="after:absolute after:inset-0 focus:outline-none">{c.title}</Link>
        </h3>
        {c.institution && <p className="mt-1 text-[0.95rem] text-ink-soft">{c.institution}</p>}
        <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
          {c.duration && <li className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-petrol" aria-hidden />{c.duration}</li>}
          {c.modality && <li className="flex items-center gap-2"><MonitorPlay className="h-4 w-4 text-petrol" aria-hidden />{c.modality}</li>}
          {c.level && <li className="flex items-center gap-2"><Gauge className="h-4 w-4 text-petrol" aria-hidden />Nivel {c.level.toLowerCase()}</li>}
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

export function ArticleCard({ a, compact = false }: { a: Article; compact?: boolean }) {
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5">
      <Img src={a.cover_url} alt={a.cover_alt} className={`${compact ? 'h-40' : 'h-48'} w-full`} fallbackTone="mist" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {a.category && <span className="chip bg-orange-soft text-orange-deep">{a.category}</span>}
          <span className="inline-flex items-center gap-1 text-mute"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{fmtShort(a.published_at)}</span>
        </div>
        <h3 className="mt-3 font-serif text-xl font-medium leading-snug text-ink">
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
      <div className="w-24 shrink-0 sm:w-28">
        {p.thumbnail_url
          ? <img src={p.thumbnail_url} alt={p.thumbnail_alt ?? ''} loading="lazy" className="aspect-[3/4] w-full rounded-lg object-cover ring-1 ring-line" />
          : <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-petrol-soft text-petrol" aria-hidden><FileText className="h-8 w-8" /></div>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap gap-2 text-xs">
          {p.year && <span className="chip">{p.year}</span>}
          {p.pub_type && <span className="chip bg-petrol-soft text-petrol-deep">{p.pub_type}</span>}
        </div>
        <h3 className="mt-2 font-serif text-lg font-medium leading-snug text-ink">
          <Link to={`/publicaciones/${p.slug}`} className="after:absolute after:inset-0 focus:outline-none group-hover:text-orange-deep">{p.title}</Link>
        </h3>
        {p.authors && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.authors}</p>}
        {p.source && <p className="mt-1 flex items-center gap-1.5 text-xs italic text-mute"><BookOpen className="h-3.5 w-3.5 not-italic" aria-hidden />{p.source}</p>}
        {p.abstract && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{plainText(p.abstract, 160)}</p>}
      </div>
    </article>
  );
}

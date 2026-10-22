import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowRight, CalendarDays, Download, MapPin, Mic2, Users } from 'lucide-react';
import { usePublicInfinite, usePublicList } from '../lib/api';
import type { Congress, Photo, Poster, Talk } from '../lib/types';
import { fmtDate, fmtRange, plainText } from '../lib/format';
import { Empty, ErrorBox, LoadMore, PageHeader, SkeletonGrid } from '../components/ui';
import { Seo } from '../components/Seo';
import { Lightbox } from '../components/Lightbox';
import { Img } from '../components/Img';

const TABS = [
  { to: '/congresos', label: 'Participación', end: true },
  { to: '/congresos/disertaciones', label: 'Conferencias y disertaciones' },
  { to: '/congresos/posteres', label: 'Pósteres científicos' },
  { to: '/congresos/galeria', label: 'Galería' },
];

export function CongressesLayout() {
  return (
    <>
      <PageHeader eyebrow="Eventos académicos" title="Congresos, conferencias y disertaciones" intro="La participación de BIOQUNS en congresos científicos, jornadas, simposios y otros eventos académicos." />
      <div className="sticky top-16 z-20 border-b border-line bg-white/95 backdrop-blur">
        <nav aria-label="Secciones de congresos" className="container-x flex gap-1 overflow-x-auto py-2">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-mist'}`}>{t.label}</NavLink>
          ))}
        </nav>
      </div>
      <div className="container-x py-12"><Outlet /></div>
    </>
  );
}

export function CongressTimeline() {
  const list = usePublicInfinite<Congress>('congresses', { order: [{ col: 'start_date' }, { col: 'sort_order', asc: true }] });
  const rows = list.data?.pages.flatMap((p) => p.rows) ?? [];
  if (list.isLoading) return <SkeletonGrid n={3} h="h-40" />;
  if (list.error) return <ErrorBox error={list.error} />;
  if (!rows.length) return <Empty title="Todavía no hay congresos cargados" />;
  return (
    <>
      <Seo title="Participación en congresos" description="Congresos, jornadas y simposios en los que participaron integrantes de BIOQUNS." />
      <ol className="relative space-y-8 border-l-2 border-line pl-6 sm:pl-10">
        {rows.map((c) => (
          <li key={c.id} className="relative">
            <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-4 border-paper bg-orange sm:-left-[49px]" aria-hidden />
            <article className="card group relative grid overflow-hidden sm:grid-cols-[13rem_1fr]">
              <Img src={c.cover_url} alt={c.cover_alt} className="h-40 w-full sm:h-full" />
              <div className="p-5 sm:p-6">
                <p className="text-sm font-bold text-orange-deep">{fmtRange(c.start_date, c.end_date)}</p>
                <h2 className="mt-1 font-serif text-2xl leading-snug text-ink"><Link to={`/congresos/${c.slug}`} className="after:absolute after:inset-0 group-hover:text-orange-deep">{c.name}</Link></h2>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                  {c.organizer && <span>{c.organizer}</span>}
                  {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{c.location}</span>}
                </div>
                {c.participation_type && <span className="chip mt-3 bg-petrol-soft text-petrol-deep">{c.participation_type}</span>}
                {c.description && <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{plainText(c.description, 220)}</p>}
              </div>
            </article>
          </li>
        ))}
      </ol>
      <LoadMore hasNext={list.hasNextPage} loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()} shown={rows.length} total={list.data?.pages[0]?.count ?? 0} />
    </>
  );
}

export function TalkList({ congressId }: { congressId?: string }) {
  const list = usePublicInfinite<Talk>('talks', { eq: { congress_id: congressId }, order: [{ col: 'date' }, { col: 'sort_order', asc: true }] });
  const rows = list.data?.pages.flatMap((p) => p.rows) ?? [];
  if (list.isLoading) return <SkeletonGrid n={3} h="h-48" />;
  if (list.error) return <ErrorBox error={list.error} />;
  if (!rows.length) return congressId ? null : <Empty title="Todavía no hay disertaciones cargadas" />;
  return (
    <>
      {!congressId && <Seo title="Conferencias y disertaciones" description="Conferencias y disertaciones brindadas por integrantes de BIOQUNS." />}
      <div className="grid gap-5 md:grid-cols-2">
        {rows.map((t) => (
          <article key={t.id} className="card group relative flex gap-4 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-soft text-orange-deep" aria-hidden><Mic2 className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h3 className="font-serif text-xl leading-snug text-ink"><Link to={`/congresos/disertaciones/${t.slug}`} className="after:absolute after:inset-0 group-hover:text-orange-deep">{t.title}</Link></h3>
              {t.speaker && <p className="mt-1 text-sm font-semibold text-ink-soft">{t.speaker}</p>}
              <p className="mt-1 text-sm text-mute">{[t.event_name, fmtDate(t.date), t.location].filter(Boolean).join(' · ')}</p>
              {t.topics?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{t.topics.map((x) => <span key={x} className="chip">{x}</span>)}</div>}
            </div>
          </article>
        ))}
      </div>
      <LoadMore hasNext={list.hasNextPage} loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()} shown={rows.length} total={list.data?.pages[0]?.count ?? 0} />
    </>
  );
}

export function PosterGrid({ congressId }: { congressId?: string }) {
  const list = usePublicInfinite<Poster>('posters', { eq: { congress_id: congressId }, order: [{ col: 'year' }, { col: 'sort_order', asc: true }] });
  const rows = list.data?.pages.flatMap((p) => p.rows) ?? [];
  if (list.isLoading) return <SkeletonGrid n={4} h="h-96" />;
  if (list.error) return <ErrorBox error={list.error} />;
  if (!rows.length) return congressId ? null : <Empty title="Todavía no hay pósteres cargados" />;
  return (
    <>
      {!congressId && <Seo title="Pósteres científicos" description="Biblioteca de pósteres científicos presentados por BIOQUNS en congresos." />}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((p) => (
          <article key={p.id} className="card group relative flex flex-col overflow-hidden">
            <div className="aspect-[3/4] overflow-hidden bg-mist">
              {p.thumbnail_url ? <img src={p.thumbnail_url} alt={`Miniatura del póster ${p.title}`} loading="lazy" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" /> : <Img className="h-full w-full" />}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-xs font-bold text-orange-deep">{[p.event_name, p.year].filter(Boolean).join(' · ')}</p>
              <h3 className="mt-1 line-clamp-3 font-semibold leading-snug text-ink"><Link to={`/congresos/posteres/${p.slug}`} className="after:absolute after:inset-0">{p.title}</Link></h3>
              {p.authors && <p className="mt-1 line-clamp-2 text-xs text-mute">{p.authors}</p>}
              <div className="relative z-10 mt-auto flex gap-2 pt-4">
                <Link to={`/congresos/posteres/${p.slug}`} className="btn-outline flex-1 !px-3 !py-1.5 text-xs">Ver</Link>
                {p.pdf_url && <a href={p.pdf_url} download target="_blank" rel="noopener noreferrer" className="btn-dark !px-3 !py-1.5 text-xs" aria-label={`Descargar PDF de ${p.title}`}><Download className="h-3.5 w-3.5" aria-hidden />PDF</a>}
              </div>
            </div>
          </article>
        ))}
      </div>
      <LoadMore hasNext={list.hasNextPage} loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()} shown={rows.length} total={list.data?.pages[0]?.count ?? 0} />
    </>
  );
}

export function Gallery({ congressId }: { congressId?: string }) {
  const photos = usePublicList<Photo>('gallery_photos', { eq: { congress_id: congressId }, order: [{ col: 'year' }, { col: 'sort_order', asc: true }, { col: 'created_at' }], limit: 600 });
  const congresses = usePublicList<Congress>('congresses', { select: 'id,name,slug,status,published_at', limit: 500, order: [{ col: 'start_date' }] });
  const [open, setOpen] = useState<{ group: number; i: number } | null>(null);
  const groups = useMemo(() => {
    const names = new Map((congresses.data ?? []).map((c) => [c.id, c.name]));
    const map = new Map<string, { title: string; year: number | null; photos: Photo[] }>();
    for (const p of photos.data ?? []) {
      const ev = p.event_label || (p.congress_id ? names.get(p.congress_id) : '') || 'Actividades académicas';
      const key = `${p.year ?? ''}|${ev}`;
      if (!map.has(key)) map.set(key, { title: ev, year: p.year, photos: [] });
      map.get(key)!.photos.push(p);
    }
    return [...map.values()];
  }, [photos.data, congresses.data]);

  if (photos.isLoading) return <SkeletonGrid n={6} h="h-56" />;
  if (photos.error) return <ErrorBox error={photos.error} />;
  if (!groups.length) return congressId ? null : <Empty title="Todavía no hay fotografías en la galería" />;
  return (
    <div className="space-y-12">
      {!congressId && <Seo title="Galería" description="Fotografías de congresos, jornadas, presentaciones y actividades académicas de BIOQUNS." />}
      {groups.map((g, gi) => (
        <section key={gi}>
          {!congressId && <h2 className="mb-4 flex items-baseline gap-3"><span className="font-serif text-2xl text-ink">{g.title}</span>{g.year && <span className="text-sm font-bold text-orange-deep">{g.year}</span>}</h2>}
          <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
            {g.photos.map((p, i) => (
              <li key={p.id} className="break-inside-avoid">
                <button className="group block w-full overflow-hidden rounded-xl" onClick={() => setOpen({ group: gi, i })} aria-label={`Ampliar: ${p.title || p.alt || 'fotografía'}`}>
                  <img src={p.image_url} alt={p.alt || p.title || ''} loading="lazy" className="w-full transition duration-500 group-hover:scale-105" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {open && <Lightbox photos={groups[open.group].photos} index={open.i} onClose={() => setOpen(null)} onIndex={(i) => setOpen({ ...open, i })} />}
    </div>
  );
}

export function CongressMeta({ c }: { c: Congress }) {
  return (
    <ul className="space-y-2 text-sm text-ink-soft">
      {(c.start_date || c.end_date) && <li className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 text-petrol" aria-hidden />{fmtRange(c.start_date, c.end_date)}</li>}
      {c.location && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-petrol" aria-hidden />{c.location}</li>}
      {c.members && <li className="flex gap-2"><Users className="mt-0.5 h-4 w-4 text-petrol" aria-hidden />{c.members}</li>}
    </ul>
  );
}

export const MoreLink = ({ to, children }: { to: string; children: string }) => (
  <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-orange-deep">{children}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
);

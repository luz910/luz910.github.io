import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, CalendarDays, Download, MapPin, Mic2, Users } from 'lucide-react';
import { usePublicInfinite, usePublicList } from '../lib/api';
import type { Congress, Photo, Poster, Talk } from '../lib/types';
import { fmtDate, fmtMonth, plainText } from '../lib/format';
import { Empty, ErrorBox, LoadMore, PageHeader, SkeletonGrid } from '../components/ui';
import { Seo } from '../components/Seo';
import { Lightbox } from '../components/Lightbox';

/** Encabezado de cada sección de "Nuestro trabajo" (cada una se muestra por separado). */
const HEADERS: { match: (p: string) => boolean; title: string; intro: string }[] = [
  { match: (p) => p.startsWith('/congresos/posteres'), title: 'Nuestros pósteres', intro: 'Pósteres científicos presentados por BIOQUNS en congresos y jornadas.' },
  { match: (p) => p.startsWith('/congresos/galeria'), title: 'Galería', intro: 'Fotografías de congresos, jornadas, presentaciones y actividades académicas.' },
  { match: (p) => p.startsWith('/congresos/disertaciones'), title: 'Conferencias y disertaciones', intro: 'Conferencias y disertaciones brindadas por integrantes de BIOQUNS.' },
  { match: () => true, title: 'Actividades científicas y académicas', intro: 'La participación de BIOQUNS en congresos científicos, jornadas, simposios y otros eventos académicos.' },
];

export function CongressesLayout() {
  const { pathname } = useLocation();
  const h = HEADERS.find((x) => x.match(pathname))!;
  return (
    <>
      <PageHeader title={h.title} intro={h.intro} />
      <div className="container-x py-12"><Outlet /></div>
    </>
  );
}

export function CongressTimeline() {
  const list = usePublicInfinite<Congress>('congresses', { order: [{ col: 'start_date' }, { col: 'sort_order', asc: true }] });
  const rows = list.data?.pages.flatMap((p) => p.rows) ?? [];
  if (list.isLoading) return <SkeletonGrid n={3} h="h-40" />;
  if (list.error) return <ErrorBox error={list.error} />;
  if (!rows.length) return <Empty title="Todavía no hay actividades cargadas" />;
  return (
    <>
      <Seo title="Actividades científicas y académicas" description="Congresos, jornadas, simposios y otras actividades científicas y académicas en las que participaron integrantes de BIOQUNS." />
      <ol className="relative space-y-8 border-l-2 border-line pl-6 sm:pl-10">
        {rows.map((c) => (
          <li key={c.id} className="relative">
            <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-4 border-paper bg-orange sm:-left-[49px]" aria-hidden />
            <article className="card group relative overflow-hidden">
              <div className="p-5 sm:p-6">
                <p className="text-sm font-bold text-orange-deep">{fmtMonth(c.start_date)}</p>
                <h2 className="mt-1 font-display text-2xl font-bold leading-snug text-ink"><Link to={`/congresos/${c.slug}`} className="after:absolute after:inset-0 group-hover:text-orange-deep">{c.name}</Link></h2>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                  {c.organizer && <span>{c.organizer}</span>}
                  {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{c.location}</span>}
                </div>
                {c.participation_type && <span className="chip mt-3 bg-petrol-soft text-petrol-deep">{c.participation_type}</span>}
                {(c.cover_alt || c.description) && <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{c.cover_alt || plainText(c.description, 220)}</p>}
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
              <h3 className="font-display text-xl font-bold leading-snug text-ink"><Link to={`/congresos/disertaciones/${t.slug}`} className="after:absolute after:inset-0 group-hover:text-orange-deep">{t.title}</Link></h3>
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

/** Iconito de póster científico: hoja con encabezado, columnas de texto y un gráfico de barras. */
function PosterIcon() {
  return (
    <svg viewBox="0 0 40 48" className="h-12 w-10 transition duration-500 group-hover:-translate-y-0.5" aria-hidden>
      <rect x="1" y="1" width="38" height="46" rx="4" fill="#fff" stroke="#d5dde0" strokeWidth="1.5" />
      <rect x="1" y="1" width="38" height="10" rx="4" fill="#1f4b5a" />
      <rect x="1" y="7" width="38" height="4" fill="#1f4b5a" />
      <rect x="5" y="4.5" width="20" height="2" rx="1" fill="#fff" />
      <rect x="1" y="11" width="38" height="1.5" fill="#e86a2a" />
      <rect x="5" y="16" width="13" height="1.6" rx=".8" fill="#e86a2a" />
      <rect x="5" y="19.5" width="13" height="1.3" rx=".65" fill="#b9c2c7" />
      <rect x="5" y="22.5" width="11" height="1.3" rx=".65" fill="#b9c2c7" />
      <rect x="5" y="25.5" width="13" height="1.3" rx=".65" fill="#b9c2c7" />
      <rect x="5" y="28.5" width="10" height="1.3" rx=".65" fill="#b9c2c7" />
      <rect x="22" y="16" width="13" height="1.3" rx=".65" fill="#b9c2c7" />
      <rect x="22" y="19" width="11" height="1.3" rx=".65" fill="#b9c2c7" />
      <rect x="21.5" y="23" width="14" height="10" rx="1.2" fill="#eef3f5" />
      <rect x="23.5" y="27" width="2.2" height="5" fill="#1f4b5a" />
      <rect x="26.8" y="25" width="2.2" height="7" fill="#e86a2a" />
      <rect x="30.1" y="28.5" width="2.2" height="3.5" fill="#1f4b5a" />
      <rect x="5" y="36" width="30" height="1.3" rx=".65" fill="#b9c2c7" />
      <rect x="5" y="39" width="24" height="1.3" rx=".65" fill="#b9c2c7" />
      <rect x="5" y="42" width="27" height="1.3" rx=".65" fill="#b9c2c7" />
    </svg>
  );
}

export function PosterGrid({ congressId, heading }: { congressId?: string; heading?: string }) {
  const list = usePublicInfinite<Poster>('posters', { eq: { congress_id: congressId }, order: [{ col: 'year' }, { col: 'sort_order', asc: true }] });
  const rows = list.data?.pages.flatMap((p) => p.rows) ?? [];
  if (list.isLoading) return <SkeletonGrid n={4} h="h-96" />;
  if (list.error) return <ErrorBox error={list.error} />;
  if (!rows.length) return congressId ? null : <Empty title="Todavía no hay pósteres cargados" />;
  return (
    <>
      {heading && <h2 className="h-display mb-5 mt-12 text-2xl">{heading}</h2>}
      {!congressId && <Seo title="Pósteres científicos" description="Biblioteca de pósteres científicos presentados por BIOQUNS en congresos." />}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((p) => (
          <article key={p.id} className="card group relative flex flex-col overflow-hidden">
            <div className="flex flex-1 flex-col p-5">
              <PosterIcon />
              <p className="mt-4 text-sm font-bold text-orange-deep">{[p.event_name, p.year].filter(Boolean).join(' · ')}</p>
              <h3 className="mt-2 line-clamp-3 font-display text-lg font-bold leading-snug text-ink"><Link to={`/congresos/posteres/${p.slug}`} className="after:absolute after:inset-0">{p.title}</Link></h3>
              {p.authors && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.authors}</p>}
              <div className="relative z-10 mt-auto flex gap-2 pt-4">
                <Link to={`/congresos/posteres/${p.slug}`} className="btn-outline flex-1 !px-3 !py-1.5 text-xs">Ver</Link>
                {p.pdf_url && <a href={p.pdf_url} download target="_blank" rel="noopener noreferrer" className="btn-dark !px-3 !py-1.5 text-xs" aria-label={`Descargar ${p.title}`}><Download className="h-3.5 w-3.5" aria-hidden />Descargar</a>}
              </div>
            </div>
          </article>
        ))}
      </div>
      <LoadMore hasNext={list.hasNextPage} loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()} shown={rows.length} total={list.data?.pages[0]?.count ?? 0} />
    </>
  );
}

export function Gallery({ congressId, heading }: { congressId?: string; heading?: string }) {
  const photos = usePublicList<Photo>('gallery_photos', { eq: { congress_id: congressId }, order: [{ col: 'year' }, { col: 'sort_order', asc: true }, { col: 'created_at' }], limit: 600 });
  const [open, setOpen] = useState<{ group: number; i: number } | null>(null);
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; year: number | null; photos: Photo[] }>();
    for (const p of photos.data ?? []) {
      // En la Galería general las fotos se agrupan solo por año; dentro de una actividad, todas juntas.
      const key = congressId ? 'all' : String(p.year ?? '');
      if (!map.has(key)) map.set(key, { title: p.year ? String(p.year) : 'Sin año', year: p.year, photos: [] });
      map.get(key)!.photos.push(p);
    }
    return [...map.values()].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  }, [photos.data, congressId]);

  if (photos.isLoading) return <SkeletonGrid n={6} h="h-56" />;
  if (photos.error) return <ErrorBox error={photos.error} />;
  if (!groups.length) return congressId ? null : <Empty title="Todavía no hay fotografías en la galería" />;
  return (
    <div className={heading ? 'mt-12' : ''}>
    {heading && <h2 className="h-display mb-5 text-2xl">{heading}</h2>}
    <div className="space-y-12">
      {!congressId && <Seo title="Galería" description="Fotografías de congresos, jornadas, presentaciones y actividades académicas de BIOQUNS." />}
      {groups.map((g, gi) => (
        <section key={gi}>
          {!congressId && <h2 className="mb-4 font-display text-2xl font-bold text-orange-deep">{g.title}</h2>}
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
    </div>
  );
}

export function CongressMeta({ c, inline = false }: { c: Congress; inline?: boolean }) {
  return (
    <ul className={inline ? 'flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft' : 'space-y-2 text-sm text-ink-soft'}>
      {c.start_date && <li className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 text-petrol" aria-hidden />{fmtMonth(c.start_date)}</li>}
      {c.location && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-petrol" aria-hidden />{c.location}</li>}
      {c.members && <li className="flex gap-2"><Users className="mt-0.5 h-4 w-4 text-petrol" aria-hidden />{c.members}</li>}
    </ul>
  );
}

export const MoreLink = ({ to, children }: { to: string; children: string }) => (
  <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-orange-deep">{children}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
);

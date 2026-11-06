import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { usePublicItem, usePublicList } from '../lib/api';
import type { Congress, Poster, Talk } from '../lib/types';
import { fmtDate, plainText } from '../lib/format';
import { usePreview } from '../lib/usePreview';
import { Markdown } from '../components/Markdown';
import { Seo } from '../components/Seo';
import { Share } from '../components/Share';
import { DnaLoader } from '../components/DnaSymbol';
import { ErrorBox, PreviewBanner } from '../components/ui';
import { PdfViewer } from '../components/PdfViewer';
import { CongressMeta, Gallery, PosterGrid, TalkList } from './Congresses';
import NotFound from './NotFound';

const Back = ({ to, label }: { to: string; label: string }) => (
  <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden /> {label}</Link>
);

export function CongressDetail() {
  const { slug } = useParams();
  const preview = usePreview();
  const { data: c, isLoading, error } = usePublicItem<Congress>('congresses', slug, preview);
  if (isLoading) return <DnaLoader />;
  if (error) return <ErrorBox error={error} />;
  if (!c) return <NotFound />;
  return (
    <article>
      <Seo title={c.name} description={plainText(c.description, 160)} image={c.cover_url} jsonLd={{ '@type': 'Event', name: c.name, startDate: c.start_date || undefined, endDate: c.end_date || undefined, location: c.location ? { '@type': 'Place', name: c.location } : undefined, organizer: c.organizer ? { '@type': 'Organization', name: c.organizer } : undefined }} />
      {preview && <PreviewBanner />}
      <Back to="/congresos" label="Actividades científicas y académicas" />
      <div className="mt-6">
        <h1 className="h-display mt-2 text-4xl leading-tight">{c.name}</h1>
        {c.organizer && <p className="mt-2 text-lg text-ink-soft">{c.organizer}</p>}
        <div className="mt-4"><CongressMeta c={c} inline /></div>
        {c.description && <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Resumen</h2><Markdown>{c.description}</Markdown></section>}
      </div>
      <PosterGrid congressId={c.id} heading="Pósteres presentados" />
      <Gallery congressId={c.id} heading="Fotografías" />
    </article>
  );
}

export function TalkDetail() {
  const { slug } = useParams();
  const preview = usePreview();
  const { data: t, isLoading, error } = usePublicItem<Talk>('talks', slug, preview);
  const congress = usePublicList<Congress>('congresses', { eq: { id: t?.congress_id ?? '00000000-0000-0000-0000-000000000000' }, limit: 1 });
  if (isLoading) return <DnaLoader />;
  if (error) return <ErrorBox error={error} />;
  if (!t) return <NotFound />;
  const c = congress.data?.[0];
  return (
    <article>
      <Seo title={t.title} description={plainText(t.summary, 160)} image={t.photo_url} type="article" />
      {preview && <PreviewBanner />}
      <Back to="/congresos/disertaciones" label="Conferencias y disertaciones" />
      <h1 className="h-display mt-6 text-4xl leading-tight">{t.title}</h1>
      <dl className="mt-6 grid gap-3 rounded-2xl border border-line bg-white p-5 text-sm sm:grid-cols-2">
        {t.speaker && <div><dt className="text-xs font-bold uppercase text-mute">Disertante</dt><dd className="font-semibold text-ink">{t.speaker}</dd></div>}
        {(t.event_name || c) && <div><dt className="text-xs font-bold uppercase text-mute">Evento</dt><dd>{c ? <Link className="link" to={`/congresos/${c.slug}`}>{c.name}</Link> : t.event_name}</dd></div>}
        {t.date && <div><dt className="text-xs font-bold uppercase text-mute">Fecha</dt><dd>{fmtDate(t.date)}</dd></div>}
        {t.location && <div><dt className="text-xs font-bold uppercase text-mute">Lugar</dt><dd>{t.location}</dd></div>}
      </dl>
      {t.photo_url && <img src={t.photo_url} alt={t.photo_alt ?? ''} className="mt-8 w-full rounded-2xl object-cover" />}
      {t.summary && <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Resumen</h2><Markdown>{t.summary}</Markdown></section>}
      {t.topics?.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{t.topics.map((x) => <span key={x} className="chip">{x}</span>)}</div>}
      {t.files?.length > 0 && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {t.files?.length > 0 && <div className="card p-4"><h2 className="eyebrow mb-2">Material complementario</h2><ul className="space-y-1">{t.files.map((f) => <li key={f.url}><a className="flex items-center gap-2 rounded p-1.5 text-sm font-semibold hover:bg-mist" href={f.url} download target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4 text-orange" aria-hidden />{f.name}</a></li>)}</ul></div>}
        </section>
      )}
      <div className="mt-10 border-t border-line pt-6"><Share title={t.title} /></div>
    </article>
  );
}

export function PosterDetail() {
  const { slug } = useParams();
  const preview = usePreview();
  const { data: p, isLoading, error } = usePublicItem<Poster>('posters', slug, preview);
  if (isLoading) return <DnaLoader />;
  if (error) return <ErrorBox error={error} />;
  if (!p) return <NotFound />;
  return (
    <article>
      <Seo title={p.title} description={p.description || `Póster científico${p.event_name ? ' presentado en ' + p.event_name : ''}.`} image={p.thumbnail_url} />
      {preview && <PreviewBanner />}
      <Back to="/congresos/posteres" label="Pósteres científicos" />
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="h-display mt-2 text-3xl leading-tight sm:text-4xl">{p.title}</h1>
          {p.authors && <p className="mt-2 text-ink-soft">{p.authors}</p>}
          {p.description && <p className="mt-3 text-ink-soft">{p.description}</p>}
        </div>
        {p.pdf_url && <a href={p.pdf_url} download target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0"><Download className="h-4 w-4" aria-hidden />Descargar</a>}
      </div>
      <div className="mt-8">
        {p.pdf_url && !isImageFile(p.pdf_url, p.thumbnail_url) ? <PdfViewer url={p.pdf_url} title={p.title} thumb={p.thumbnail_url} /> : (p.pdf_url || p.thumbnail_url) ? <img src={p.pdf_url || p.thumbnail_url!} alt={p.title} className="mx-auto rounded-xl ring-1 ring-line" /> : null}
      </div>
      <div className="mt-8"><Share title={p.title} /></div>
    </article>
  );
}

/** El archivo del póster es una imagen (no un PDF). */
function isImageFile(url: string, thumb?: string | null) {
  return url === thumb || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url);
}

export { Gallery, PosterGrid, TalkList };

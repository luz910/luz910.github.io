import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, Download, ExternalLink, Users } from 'lucide-react';
import { usePublicItem, usePublicList } from '../lib/api';
import type { Article } from '../lib/types';
import { doiUrl, fmtDate, plainText } from '../lib/format';
import { usePreview } from '../lib/usePreview';
import { Markdown } from '../components/Markdown';
import { Seo } from '../components/Seo';
import { Share } from '../components/Share';
import { ArticleCard } from '../components/Cards';
import { DnaLoader } from '../components/DnaSymbol';
import { ErrorBox, PreviewBanner } from '../components/ui';
import { NewsletterForm } from '../components/NewsletterForm';
import NotFound from './NotFound';

function Related({ a }: { a: Article }) {
  const rel = usePublicList<Article>('articles', { eq: { category: a.category ?? undefined }, limit: 4 });
  const rows = (rel.data ?? []).filter((x) => x.id !== a.id).slice(0, 3);
  if (!rows.length) return null;
  return (
    <section className="border-t border-line bg-white py-16">
      <div className="container-x">
        <h2 className="h-display mb-8 text-3xl">Artículos relacionados</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((r) => <ArticleCard key={r.id} a={r} compact />)}</div>
      </div>
    </section>
  );
}

/** Los archivos guardados en Supabase se descargan directo (sin abrirse en otra pestaña) agregando ?download= */
function downloadUrl(url: string) {
  return url.includes('/storage/v1/object/public/') && !url.includes('?') ? `${url}?download=` : url;
}

export default function ArticleDetail() {
  const { slug } = useParams();
  const preview = usePreview();
  const { data: a, isLoading, error } = usePublicItem<Article>('articles', slug, preview);
  if (isLoading) return <DnaLoader />;
  if (error) return <div className="container-x py-16"><ErrorBox error={error} /></div>;
  if (!a) return <NotFound />;
  const doi = doiUrl(a.doi);
  return (
    <>
      <Seo
        title={a.seo_title || a.title}
        description={a.seo_description || a.excerpt || plainText(a.summary, 160)}
        image={a.cover_url}
        type="article"
        jsonLd={{ '@type': 'Article', headline: a.title, image: a.cover_url || undefined, datePublished: a.published_at, dateModified: a.updated_at, author: a.authors ? a.authors.split(/[,;]/).map((n) => ({ '@type': 'Person', name: n.trim() })) : undefined, publisher: { '@type': 'Organization', name: 'BIOQUNS' }, description: a.excerpt || undefined }}
      />
      {preview && <PreviewBanner />}
      <article>
        <header className="border-b border-line bg-white">
          <div className="container-x py-10 sm:py-14">
            <Link to="/articulos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden /> Artículos de interés</Link>
            <h1 className="h-display mt-6 text-4xl leading-tight sm:text-5xl">{a.title}</h1>
            {a.authors && <p className="mt-6 inline-flex items-center gap-2 text-sm text-ink-soft"><Users className="h-4 w-4 text-petrol" aria-hidden />{a.authors}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
              {a.published_at && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-petrol" aria-hidden /><time dateTime={a.published_at}>{fmtDate(a.published_at)}</time></span>}
              {a.source && <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-petrol" aria-hidden />{a.source}</span>}
            </div>
          </div>
        </header>
        <div className="container-x grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            {a.summary && <section><h2 className="h-display mb-4 text-2xl">Resumen</h2><Markdown>{a.summary}</Markdown></section>}
            {a.tags?.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-3 text-sm font-bold text-ink">Palabras clave</h2>
                <div className="flex flex-wrap gap-2">{a.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
              </div>
            )}
            <div className="mt-12 border-t border-line pt-6"><Share title={a.title} /></div>
          </div>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {(doi || a.external_url || a.pdf_url) && (
              <div className="card space-y-3 p-5 text-sm">
                <h2 className="eyebrow font-display !text-[0.8rem] !font-extrabold">Fuente</h2>
                {doi && <p><span className="font-semibold">DOI: </span><a href={doi} className="link break-all" target="_blank" rel="noopener noreferrer">{a.doi}</a></p>}
                {a.pdf_url && <a href={downloadUrl(a.pdf_url)} download target="_blank" rel="noopener noreferrer" className="btn-primary w-full">Descargar artículo (PDF) <Download className="h-4 w-4" aria-hidden /></a>}
                {a.external_url && <a href={a.external_url} target="_blank" rel="noopener noreferrer" className="btn-dark w-full">Ver artículo completo <ExternalLink className="h-4 w-4" aria-hidden /></a>}
              </div>
            )}
            <div className="rounded-2xl bg-petrol-soft p-5">
              <p className="font-display font-bold text-lg text-petrol-deep">¿Te interesan estos temas?</p>
              <p className="mb-3 mt-1 text-sm text-ink-soft">Recibí nuevos artículos y cursos por correo.</p>
              <NewsletterForm variant="compact" topic="articulos" />
            </div>
          </aside>
        </div>
      </article>
      <Related a={a} />
    </>
  );
}

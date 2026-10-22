import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ExternalLink, Users } from 'lucide-react';
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
          <div className="container-x max-w-4xl py-10 sm:py-14">
            <Link to="/articulos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden /> Artículos de interés</Link>
            {a.category && <p className="eyebrow mt-6">{a.category}</p>}
            <h1 className="h-display mt-3 text-4xl leading-tight sm:text-5xl">{a.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
              {a.authors && <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-petrol" aria-hidden />{a.authors}</span>}
              {a.published_at && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-petrol" aria-hidden /><time dateTime={a.published_at}>{fmtDate(a.published_at)}</time></span>}
            </div>
          </div>
        </header>
        {a.cover_url && (
          <div className="container-x max-w-5xl -mb-4 pt-8">
            <img src={a.cover_url} alt={a.cover_alt ?? ''} className="aspect-[16/8] w-full rounded-3xl object-cover" />
          </div>
        )}
        <div className="container-x grid max-w-5xl gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0">
            {a.summary && (
              <section className="mb-10 rounded-2xl border-l-4 border-orange bg-orange-soft/50 p-6">
                <h2 className="eyebrow mb-2">Resumen</h2>
                <Markdown className="!text-ink">{a.summary}</Markdown>
              </section>
            )}
            <Markdown>{a.body}</Markdown>
            {a.references_md && (
              <section className="mt-12 border-t border-line pt-8">
                <h2 className="h-display mb-4 text-2xl">Referencias bibliográficas</h2>
                <Markdown className="text-sm">{a.references_md}</Markdown>
              </section>
            )}
            <div className="mt-12 border-t border-line pt-6"><Share title={a.title} /></div>
          </div>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {(a.source || doi || a.external_url) && (
              <div className="card space-y-3 p-5 text-sm">
                <h2 className="eyebrow">Fuente</h2>
                {a.source && <p className="text-ink">{a.source}</p>}
                {doi && <p><span className="font-semibold">DOI: </span><a href={doi} className="link break-all" target="_blank" rel="noopener noreferrer">{a.doi}</a></p>}
                {a.external_url && <a href={a.external_url} target="_blank" rel="noopener noreferrer" className="btn-dark w-full">Ver artículo completo <ExternalLink className="h-4 w-4" aria-hidden /></a>}
              </div>
            )}
            {a.tags?.length > 0 && <div className="flex flex-wrap gap-2">{a.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>}
            <div className="rounded-2xl bg-petrol-soft p-5">
              <p className="font-serif text-lg text-petrol-deep">¿Te interesan estos temas?</p>
              <p className="mb-3 mt-1 text-sm text-ink-soft">Recibí nuevos artículos y cursos por correo.</p>
              <NewsletterForm variant="compact" />
            </div>
          </aside>
        </div>
      </article>
      <Related a={a} />
    </>
  );
}

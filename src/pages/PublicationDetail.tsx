import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, FileText } from 'lucide-react';
import { usePublicItem } from '../lib/api';
import type { Publication } from '../lib/types';
import { plainText } from '../lib/format';
import { usePreview } from '../lib/usePreview';
import { Markdown } from '../components/Markdown';
import { Seo } from '../components/Seo';
import { Share } from '../components/Share';
import { DnaLoader } from '../components/DnaSymbol';
import { ErrorBox, PreviewBanner } from '../components/ui';
import NotFound from './NotFound';

export default function PublicationDetail() {
  const { slug } = useParams();
  const preview = usePreview();
  const { data: p, isLoading, error } = usePublicItem<Publication>('publications', slug, preview);
  if (isLoading) return <DnaLoader />;
  if (error) return <div className="container-x py-16"><ErrorBox error={error} /></div>;
  if (!p) return <NotFound />;
  const doi = '';
  const rows = [['Autores', p.authors], ['Año', p.year], ['Revista / fuente', p.source]].filter((r) => r[1]);
  return (
    <>
      <Seo title={p.seo_title || p.title} description={p.seo_description || plainText(p.abstract, 160)} image={p.thumbnail_url}
        jsonLd={{ '@type': 'ScholarlyArticle', headline: p.title, author: p.authors ? p.authors.split(/[,;]/).map((n) => ({ '@type': 'Person', name: n.trim() })) : undefined, datePublished: p.year ? String(p.year) : undefined, isPartOf: p.source || undefined, sameAs: doi || p.external_url || undefined }} />
      {preview && <PreviewBanner />}
      <div className="container-x py-10 sm:py-14">
        <Link to="/publicaciones" className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden /> Nuestras publicaciones</Link>
        <div className="mt-8">
          <h1 className="h-display mt-3 text-3xl leading-tight sm:text-4xl">{p.title}</h1>
          {(p.external_url || doi) && <a href={p.external_url || doi} target="_blank" rel="noopener noreferrer" className="btn-dark mt-6 px-6 py-3">Consultar publicación <ExternalLink className="h-4 w-4" aria-hidden /></a>}
          <dl className="mt-8 divide-y divide-line rounded-2xl border border-line bg-white text-sm">
            {rows.map(([k, v]) => <div key={k as string} className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_1fr]"><dt className="font-semibold text-mute">{k}</dt><dd className="text-ink">{v}</dd></div>)}
            {doi && <div className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_1fr]"><dt className="font-semibold text-mute">DOI</dt><dd><a className="link break-all" href={doi} target="_blank" rel="noopener noreferrer">{p.doi}</a></dd></div>}
          </dl>
          {p.abstract && <section className="mt-10"><h2 className="h-display mb-4 text-2xl">Resumen</h2><Markdown>{p.abstract}</Markdown></section>}
          {p.files?.length > 0 && (
            <section className="mt-10">
              <h2 className="h-display mb-4 text-2xl">Archivos</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {p.files.map((f) => (
                  <li key={f.url}><a href={f.url} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-line bg-white p-3 text-sm font-semibold text-ink hover:bg-mist"><FileText className="h-4 w-4 text-orange" aria-hidden /><span className="flex-1 truncate">{f.name}</span><Download className="h-4 w-4 text-mute" aria-hidden /></a></li>
                ))}
              </ul>
            </section>
          )}
          <div className="mt-10 border-t border-line pt-6"><Share title={p.title} /></div>
        </div>
      </div>
    </>
  );
}

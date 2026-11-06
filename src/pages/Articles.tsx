import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { usePublicInfinite } from '../lib/api';
import type { Article } from '../lib/types';
import { ArticleCard } from '../components/Cards';
import { Empty, ErrorBox, LoadMore, PageHeader, SkeletonGrid } from '../components/ui';
import { Seo } from '../components/Seo';
import { NewsletterForm } from '../components/NewsletterForm';
import { useDebounced } from '../lib/useDebounced';

export default function Articles() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const cat = params.get('categoria') ?? '';
  const search = useDebounced(q, 350);
  const list = usePublicInfinite<Article>('articles', {
    search, searchCols: ['title', 'excerpt', 'summary', 'authors', 'category'], eq: { category: cat },
    order: [{ col: 'published_at' }],
  });
  const rows = list.data?.pages.flatMap((p) => p.rows) ?? [];
  const total = list.data?.pages[0]?.count ?? 0;
  const set = (k: string, v: string) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n, { replace: true }); };

  return (
    <>
      <Seo title="Artículos de interés" description="Biblioteca de artículos de divulgación, actualización y formación en bioquímica y áreas relacionadas." />
      <PageHeader eyebrow="Biblioteca" title="Artículos de interés" intro="Divulgación, actualización y formación en bioquímica y áreas relacionadas." />
      <div className="container-x py-12">
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3">
          <div className="relative flex-1">
            <label htmlFor="buscar" className="sr-only">Buscar artículos</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
            <input id="buscar" type="search" className="input border-transparent bg-mist pl-9" placeholder="Buscar por título, autor o tema…" value={q} onChange={(e) => set('q', e.target.value)} />
          </div>
        </div>
        <div className="mb-10 rounded-2xl bg-petrol-soft p-6">
          <NewsletterForm variant="strip" topic="articulos" heading="Recibí los nuevos artículos" text="No te pierdas lo nuevo en bioquímica y ciencias de la salud." />
        </div>
        {list.isLoading ? <SkeletonGrid /> : list.error ? <ErrorBox error={list.error} /> : rows.length === 0 ? (
          <Empty title={q ? 'No encontramos artículos con esos criterios' : 'Todavía no hay artículos publicados'} text={q ? 'Probá con otras palabras o quitá el filtro.' : undefined} />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
            <LoadMore hasNext={list.hasNextPage} loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()} shown={rows.length} total={total} />
          </>
        )}
      </div>
    </>
  );
}

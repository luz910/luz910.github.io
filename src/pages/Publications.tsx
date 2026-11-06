import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { usePublicInfinite } from '../lib/api';
import type { Publication } from '../lib/types';
import { PublicationCard } from '../components/Cards';
import { Empty, ErrorBox, FilterBar, LoadMore, PageHeader, SkeletonGrid } from '../components/ui';
import { Seo } from '../components/Seo';
import { useDebounced } from '../lib/useDebounced';

export default function Publications() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const search = useDebounced(q, 350);
  const list = usePublicInfinite<Publication>('publications', {
    search, searchCols: ['title', 'authors', 'source', 'abstract', 'topic'],
    order: [{ col: 'year' }, { col: 'sort_order', asc: true }, { col: 'published_at' }],
  });
  const rows = list.data?.pages.flatMap((p) => p.rows) ?? [];
  const total = list.data?.pages[0]?.count ?? 0;
  const set = (k: string, v: string) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n, { replace: true }); };

  return (
    <>
      <Seo title="Nuestras publicaciones" description="Publicaciones científicas, trabajos académicos y contribuciones de BIOQUNS." />
      <PageHeader eyebrow="Producción científica" title="Nuestras publicaciones" intro="Publicaciones científicas, trabajos académicos, artículos de investigación y otras contribuciones de BIOQUNS." />
      <div className="container-x py-12">
        <FilterBar>
          <div className="relative flex-1">
            <label htmlFor="buscar-pub" className="sr-only">Buscar publicaciones</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
            <input id="buscar-pub" type="search" className="input border-transparent bg-mist pl-9" placeholder="Título, autor, revista…" value={q} onChange={(e) => set('q', e.target.value)} />
          </div>
        </FilterBar>
        {list.isLoading ? <SkeletonGrid n={4} h="h-44" /> : list.error ? <ErrorBox error={list.error} /> : rows.length === 0 ? (
          <Empty title={q ? 'No hay publicaciones con esos criterios' : 'Todavía no hay publicaciones cargadas'} />
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">{rows.map((p) => <PublicationCard key={p.id} p={p} />)}</div>
            <LoadMore hasNext={list.hasNextPage} loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()} shown={rows.length} total={total} />
          </>
        )}
      </div>
    </>
  );
}

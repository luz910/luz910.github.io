import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { usePublicInfinite } from '../lib/api';
import type { Course } from '../lib/types';
import { CourseCard } from '../components/Cards';
import { Empty, ErrorBox, FilterBar, LoadMore, PageHeader, SkeletonGrid } from '../components/ui';
import { Seo } from '../components/Seo';
import { NewsletterForm } from '../components/NewsletterForm';
import { useDebounced } from '../lib/useDebounced';

const STATES = [['', 'Todos'], ['open', 'Inscripciones abiertas'], ['soon', 'Próximamente'], ['closed', 'Finalizados']] as const;

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const st = params.get('estado') ?? '';
  const search = useDebounced(q, 350);
  const list = usePublicInfinite<Course>('courses', {
    search, searchCols: ['title', 'short_description', 'institution'], eq: { enrollment_status: st },
    order: [{ col: 'sort_order', asc: true }, { col: 'published_at' }],
  });
  const rows = list.data?.pages.flatMap((p) => p.rows) ?? [];
  const total = list.data?.pages[0]?.count ?? 0;
  const set = (k: string, v: string) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n, { replace: true }); };

  return (
    <>
      <Seo title="Nuestros cursos" description="Cursos de actualización profesional en bioquímica: programas, modalidad, docentes e inscripciones." />
      <PageHeader eyebrow="Formación profesional continua" title="Nuestros cursos" intro="Cursos de actualización profesional en bioquímica. Consultá programas, modalidades, fechas e inscripciones." />
      <div className="container-x py-12">
        <FilterBar>
          <div className="relative flex-1">
            <label htmlFor="buscar-cursos" className="sr-only">Buscar cursos</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
            <input id="buscar-cursos" type="search" className="input border-transparent bg-mist pl-9" placeholder="Buscar cursos…" value={q} onChange={(e) => set('q', e.target.value)} />
          </div>
          <label className="sr-only" htmlFor="f-estado">Estado de inscripción</label>
          <select id="f-estado" className="input sm:w-56" value={st} onChange={(e) => set('estado', e.target.value)}>
            {STATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FilterBar>
        <div className="mb-10 rounded-2xl bg-petrol-soft p-6">
          <NewsletterForm variant="strip" topic="cursos" heading="Enterate de las próximas inscripciones" text="Descubrí nuevas oportunidades para seguir aprendiendo, actualizándote y creciendo profesionalmente." />
        </div>
        {list.isLoading ? <SkeletonGrid h="h-96" /> : list.error ? <ErrorBox error={list.error} /> : rows.length === 0 ? (
          <Empty title={q || st ? 'No hay cursos con esos criterios' : 'Pronto publicaremos nuevos cursos'} text="Suscribite al newsletter para enterarte de las próximas inscripciones." />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((c) => <CourseCard key={c.id} c={c} />)}</div>
            <LoadMore hasNext={list.hasNextPage} loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()} shown={rows.length} total={total} />
          </>
        )}
      </div>
    </>
  );
}

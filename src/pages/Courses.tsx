import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useDistinct, usePublicInfinite } from '../lib/api';
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
  const mod = params.get('modalidad') ?? '';
  const search = useDebounced(q, 350);
  const modalities = useDistinct('courses', 'modality');
  const list = usePublicInfinite<Course>('courses', {
    search, searchCols: ['title', 'short_description', 'institution'], eq: { enrollment_status: st, modality: mod },
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
          {!!modalities.data?.length && (
            <>
              <label className="sr-only" htmlFor="f-mod">Modalidad</label>
              <select id="f-mod" className="input sm:w-48" value={mod} onChange={(e) => set('modalidad', e.target.value)}>
                <option value="">Toda modalidad</option>
                {modalities.data.map((m) => <option key={m}>{m}</option>)}
              </select>
            </>
          )}
        </FilterBar>
        {list.isLoading ? <SkeletonGrid h="h-96" /> : list.error ? <ErrorBox error={list.error} /> : rows.length === 0 ? (
          <Empty title={q || st || mod ? 'No hay cursos con esos criterios' : 'Pronto publicaremos nuevos cursos'} text="Suscribite al newsletter para enterarte de las próximas inscripciones." />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((c) => <CourseCard key={c.id} c={c} />)}</div>
            <LoadMore hasNext={list.hasNextPage} loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()} shown={rows.length} total={total} />
          </>
        )}
        <div className="mt-16 rounded-3xl bg-petrol-soft p-8 sm:p-10">
          <h2 className="h-display text-2xl text-petrol-deep">Enterate de las próximas inscripciones</h2>
          <p className="mb-4 mt-1 text-ink-soft">Te avisamos por correo cuando abramos nuevos cursos.</p>
          <div className="max-w-2xl"><NewsletterForm variant="card" /></div>
        </div>
      </div>
    </>
  );
}

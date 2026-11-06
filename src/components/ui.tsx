import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { DnaSymbol } from './DnaSymbol';

export function PageHeader({ title, children }: { eyebrow?: string; title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-card-line bg-bar">
      <div className="container-x relative flex items-center justify-between gap-6 py-6 sm:py-8">
        <div className="max-w-3xl">
          <h1 className="font-display text-2xl font-extrabold uppercase leading-tight tracking-[0.01em] text-petrol-deep sm:text-3xl">{title}</h1>
          {children}
        </div>
        <DnaSymbol className="hidden h-14 w-auto opacity-90 md:block" />
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, to, linkLabel = 'Ver todo' }: { eyebrow?: string; title: string; to?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="h-display mt-1 text-3xl sm:text-[2.1rem]">{title}</h2>
      </div>
      {to && <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-deep hover:gap-2.5 transition-all">{linkLabel} <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
    </div>
  );
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <DnaSymbol className="mx-auto h-12 w-auto opacity-50" />
      <p className="mt-4 font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 text-sm text-mute">{text}</p>}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div><strong>No pudimos cargar este contenido.</strong> Revisá tu conexión y recargá la página.<span className="block text-xs opacity-70">{(error as Error)?.message}</span></div>
    </div>
  );
}

export function SkeletonGrid({ n = 6, h = 'h-80' }: { n?: number; h?: string }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: n }).map((_, i) => <div key={i} className={`${h} animate-pulse rounded-2xl bg-mist`} />)}
    </div>
  );
}

export function LoadMore({ hasNext, loading, onClick, shown, total }: { hasNext?: boolean; loading: boolean; onClick: () => void; shown: number; total: number }) {
  if (!total) return null;
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <p className="text-xs text-mute">Mostrando {shown} de {total}</p>
      {hasNext && <button className="btn-outline" onClick={onClick} disabled={loading}>{loading ? 'Cargando…' : 'Cargar más'}</button>}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 sm:flex-row sm:items-center">{children}</div>;
}

export function PreviewBanner() {
  return (
    <div className="sticky top-20 z-30 bg-petrol px-4 py-2 text-center text-sm font-semibold text-white">
      Vista previa para editores — este contenido puede no estar publicado todavía.
    </div>
  );
}

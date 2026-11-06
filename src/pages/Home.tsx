import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText, GraduationCap } from 'lucide-react';
import { useSettings, DEFAULT_SETTINGS } from '../lib/settings';
import { DnaSymbol } from '../components/DnaSymbol';
import { usePublicList } from '../lib/api';
import type { Article, Course } from '../lib/types';
import { fmtShort, plainText } from '../lib/format';
import { categoryTone } from '../components/Cards';
import { Empty, SkeletonGrid } from '../components/ui';
import { Seo } from '../components/Seo';

function Hero() {
  const { settings } = useSettings();
  // La portada ya no se edita desde el panel: se usan siempre los textos definidos acá.
  void settings;
  const h = DEFAULT_SETTINGS.home;
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Imagen de fondo (editable desde el panel) con un velo blanco para que el texto se lea bien */}
      <img src={h.hero_image_url || '/brand/portada.jpg'} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center hero-zoom" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.93)_0%,rgba(255,255,255,0.87)_50%,rgba(255,255,255,0.8)_100%)]" aria-hidden />
      <div className="container-x relative flex flex-col items-center pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
        <h1 className="flex items-center justify-center gap-3 sm:gap-5">
          <span className="hero-in hero-word brand-gradient font-display text-[clamp(2.7rem,11vw,7.5rem)] font-extrabold leading-none tracking-[-0.02em]">BIOQUNS</span>
          <DnaSymbol className="h-[clamp(4rem,13vw,9rem)] w-auto" alt="" />
          {h.hero_title && <span className="sr-only">: {h.hero_title}</span>}
        </h1>
        {h.hero_title && <p aria-hidden className="hero-in [animation-delay:450ms] mt-6 max-w-4xl font-display text-[clamp(1.5rem,3.6vw,2.6rem)] font-bold leading-tight text-brown">{h.hero_title}</p>}
        {h.hero_text && <p className="hero-in [animation-delay:650ms] mt-6 max-w-3xl text-lg leading-relaxed text-mute sm:text-xl">{h.hero_text}</p>}
        {(h.hero_primary_label || h.hero_secondary_label) && (
          <div className="hero-in [animation-delay:850ms] mt-9 flex flex-wrap justify-center gap-3">
            {h.hero_primary_label && <Link to={h.hero_primary_url || '/cursos'} className="btn-primary px-6 py-3">{h.hero_primary_label} <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
            {h.hero_secondary_label && <Link to={h.hero_secondary_url || '/articulos'} className="btn-outline px-6 py-3">{h.hero_secondary_label}</Link>}
          </div>
        )}
      </div>
    </section>
  );
}

type NewsItem = { id: string; kind: 'curso' | 'articulo'; title: string; href: string; image: string | null; alt: string | null; tag: string | null; date: string | null; text: string | null };

function NewsCard({ n }: { n: NewsItem }) {
  const isCourse = n.kind === 'curso';
  return (
    <article className="group relative flex items-center gap-5 rounded-2xl border border-line bg-white px-5 py-4 transition hover:border-orange/40 hover:shadow-[0_8px_24px_-16px_rgba(20,30,40,0.35)] sm:px-6 sm:py-5">
      <span className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:flex ${isCourse ? 'bg-orange-soft text-orange' : 'bg-petrol-soft text-petrol'}`} aria-hidden>
        {isCourse ? <GraduationCap className="h-6 w-6" strokeWidth={1.7} /> : <BookOpenText className="h-6 w-6" strokeWidth={1.7} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`badge-center inline-flex items-center rounded-md px-2 py-[0.35rem] font-bold ${isCourse ? 'bg-orange text-white' : 'bg-petrol text-white'}`}>{isCourse ? 'Curso' : 'Artículo'}</span>
          {n.tag && <span className="chip" style={!isCourse ? { backgroundColor: categoryTone(n.tag).chipBg, color: categoryTone(n.tag).chipText } : undefined}>{n.tag}</span>}
          {n.date && <span className="text-mute">{fmtShort(n.date)}</span>}
        </div>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">
          <Link to={n.href} className="after:absolute after:inset-0 focus:outline-none group-hover:text-orange-deep">{n.title}</Link>
        </h3>
        {n.text && <p className="mt-1 line-clamp-1 text-sm text-ink-soft">{n.text}</p>}
      </div>
      <span className="hidden shrink-0 items-center gap-1.5 text-sm font-bold text-orange-deep md:inline-flex">{isCourse ? 'Ver curso' : 'Leer artículo'} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden /></span>
    </article>
  );
}

/** Novedades: los 3 últimos cursos y artículos publicados, mezclados por fecha. */
function Novedades() {
  const courses = usePublicList<Course>('courses', { order: [{ col: 'published_at' }], limit: 3 });
  const articles = usePublicList<Article>('articles', { order: [{ col: 'published_at' }], limit: 3 });
  const loading = courses.isLoading || articles.isLoading;
  const items: NewsItem[] = [
    ...(courses.data ?? []).map((c) => ({ id: c.id, kind: 'curso' as const, title: c.title, href: `/cursos/${c.slug}`, image: c.cover_url, alt: c.cover_alt, tag: c.enrollment_status === 'open' ? 'Inscripciones abiertas' : c.modality, date: c.published_at, text: c.short_description })),
    ...(articles.data ?? []).map((a) => ({ id: a.id, kind: 'articulo' as const, title: a.title, href: `/articulos/${a.slug}`, image: a.cover_url, alt: a.cover_alt, tag: a.category, date: a.published_at, text: a.excerpt || plainText(a.summary, 140) })),
  ].sort((x, y) => (y.date ?? '').localeCompare(x.date ?? '')).slice(0, 3);

  return (
    <section className="bg-white pb-4 pt-14">
      <div className="container-x">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold uppercase leading-tight tracking-[0.01em] text-brown sm:text-3xl">Novedades</h2>
          <div className="flex gap-5 text-sm font-semibold">
            <Link to="/cursos" className="inline-flex items-center gap-1 text-orange-deep hover:underline">Todos los cursos <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link to="/articulos" className="inline-flex items-center gap-1 text-orange-deep hover:underline">Todos los artículos <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </div>
        {loading ? <SkeletonGrid n={3} h="h-24" /> : items.length === 0 ? (
          <Empty title="Pronto vas a encontrar acá los últimos cursos y artículos" />
        ) : (
          <div className="space-y-3">{items.map((n) => <NewsCard key={n.kind + n.id} n={n} />)}</div>
        )}
      </div>
    </section>
  );
}

/** Cartel de llamada a la acción hacia los cursos (debajo de Novedades). */
function CtaCursos() {
  // El cartel se anima cuando aparece en pantalla al bajar
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section className="-mb-24 bg-white pb-28 pt-10">
      <div className="container-x">
        <div ref={ref} className={`cta-card relative overflow-hidden rounded-3xl border border-[#f6dcc3] bg-[linear-gradient(90deg,#fdbf7e_0%,#fdd2a6_14%,#fde6cf_34%,#fdeedf_60%,#fdf1e4_100%)] px-6 py-12 text-center shadow-[0_18px_44px_-26px_rgba(242,105,20,0.45)] sm:px-12 sm:py-14 ${visible ? 'is-visible' : ''}`}>
          {/* Curvas suaves decorativas a la izquierda */}
          <span aria-hidden className="pointer-events-none absolute -left-[22%] -top-[60%] h-[220%] w-[48%] rounded-[50%] bg-[#fdc28a]/45" />
          <span aria-hidden className="pointer-events-none absolute -left-[30%] -top-[40%] h-[200%] w-[52%] rounded-[50%] border border-white/50" />
          <span aria-hidden className="pointer-events-none absolute -left-[8%] top-[10%] h-[160%] w-[30%] rounded-[50%] bg-white/15" />
          <span aria-hidden className="cta-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3" />
          <h2 className="relative font-display text-[clamp(1.6rem,3.6vw,2.6rem)] leading-tight">
            <span className="cta-l1 inline-block font-extrabold text-[#5a250f]">Actualizá tus conocimientos.</span><br className="hidden sm:block" /> <span className="cta-l2 cta-glow inline-block font-extrabold">Potenciá tu futuro.</span>
          </h2>
          <div className="cta-btn relative mt-8">
            <Link to="/cursos" className="cta-pulse group inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#fba25f] bg-[#f26914] px-8 py-3.5 font-display text-base font-extrabold uppercase tracking-[0.06em] text-white shadow-[0_8px_20px_-8px_rgba(242,105,20,0.7)] transition hover:-translate-y-0.5 hover:bg-[#d95a0c]">
              Quiero capacitarme <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { settings } = useSettings();
  return (
    <>
      <Seo jsonLd={{ '@type': 'Organization', name: 'BIOQUNS', url: settings.general.site_url || window.location.origin, logo: (settings.general.site_url || window.location.origin) + '/brand/logo-completo.png', description: settings.general.default_seo_description }} />
      <Hero />
      <Novedades />
      <CtaCursos />
    </>
  );
}

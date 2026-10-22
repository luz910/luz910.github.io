import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText, GraduationCap, Microscope, Presentation } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { usePublicList } from '../lib/api';
import type { Article, Course, Publication } from '../lib/types';
import { DnaSymbol } from '../components/DnaSymbol';
import { CourseCard, PublicationCard } from '../components/Cards';
import { Empty, ErrorBox, SectionHead, SkeletonGrid } from '../components/ui';
import { NewsletterForm } from '../components/NewsletterForm';
import { Seo } from '../components/Seo';
import { Markdown } from '../components/Markdown';

function Hero() {
  const { settings } = useSettings();
  const h = settings.home;
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="helix-bg absolute inset-0" aria-hidden />
      <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-orange-soft blur-3xl opacity-70" aria-hidden />
      <div className="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-petrol-soft blur-3xl opacity-80" aria-hidden />
      <div className="container-x relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.25fr_1fr]">
        <div>
          {h.hero_kicker && <p className="eyebrow">{h.hero_kicker}</p>}
          <h1 className="h-display mt-4 text-[2.6rem] leading-[1.05] sm:text-6xl">{h.hero_title}</h1>
          {h.hero_text && <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{h.hero_text}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {h.hero_primary_label && <Link to={h.hero_primary_url || '/cursos'} className="btn-primary px-6 py-3">{h.hero_primary_label} <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
            {h.hero_secondary_label && <Link to={h.hero_secondary_url || '/articulos'} className="btn-outline px-6 py-3">{h.hero_secondary_label}</Link>}
          </div>
        </div>
        <div className="relative flex justify-center">
          {h.hero_image_url ? (
            <div className="relative">
              <img src={h.hero_image_url} alt="" className="aspect-[4/5] w-full max-w-sm rounded-[2rem] object-cover shadow-2xl" />
              <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-xl"><DnaSymbol className="h-16 w-auto" /></div>
            </div>
          ) : (
            <figure className="flex flex-col items-center">
              <DnaSymbol className="h-56 w-auto drop-shadow-[0_20px_30px_rgba(232,106,42,0.25)] sm:h-72" alt="" />
              <img src="/brand/wordmark.png" alt="BIOQUNS" className="mt-6 h-12 w-auto sm:h-14" />
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}

const ACCESOS = [
  { to: '/articulos', icon: BookOpenText, title: 'Artículos de interés', text: 'Divulgación y actualización en bioquímica.' },
  { to: '/cursos', icon: GraduationCap, title: 'Cursos', text: 'Formación profesional continua.' },
  { to: '/publicaciones', icon: Microscope, title: 'Publicaciones', text: 'Producción científica y académica.' },
  { to: '/congresos', icon: Presentation, title: 'Congresos', text: 'Disertaciones, pósteres y galería.' },
];

function Accesos() {
  return (
    <section className="container-x -mt-8 relative z-10">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACCESOS.map(({ to, icon: Icon, title, text }) => (
          <li key={to}>
            <Link to={to} className="card group flex h-full items-start gap-4 p-5 transition hover:border-orange/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-soft text-orange-deep transition group-hover:bg-orange group-hover:text-white"><Icon className="h-5 w-5" aria-hidden /></span>
              <span>
                <span className="block font-bold text-ink">{title}</span>
                <span className="mt-0.5 block text-sm text-mute">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeaturedCourses() {
  const featured = usePublicList<Course>('courses', { featured: true, order: [{ col: 'sort_order', asc: true }, { col: 'published_at' }], limit: 6 });
  const latest = usePublicList<Course>('courses', { order: [{ col: 'published_at' }], limit: 3 });
  const rows = featured.data?.length ? featured.data : latest.data ?? [];
  return (
    <section className="container-x py-20">
      <SectionHead eyebrow="Formación profesional" title="Cursos destacados" to="/cursos" linkLabel="Ver todos los cursos" />
      {featured.isLoading || latest.isLoading ? <SkeletonGrid n={3} h="h-96" /> : featured.error ? <ErrorBox error={featured.error} /> :
        rows.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((c) => <CourseCard key={c.id} c={c} />)}</div>
          : <Empty title="Pronto publicaremos nuevos cursos" text="Suscribite al newsletter para enterarte primero." />}
    </section>
  );
}

function RecentArticles() {
  const featured = usePublicList<Article>('articles', { featured: true, order: [{ col: 'sort_order', asc: true }, { col: 'published_at' }], limit: 1 });
  const recent = usePublicList<Article>('articles', { order: [{ col: 'published_at' }], limit: 4 });
  if (recent.isLoading) return <section className="container-x py-20"><SkeletonGrid n={3} /></section>;
  const lead = featured.data?.[0] ?? recent.data?.[0];
  const rest = (recent.data ?? []).filter((a) => a.id !== lead?.id).slice(0, 3);
  return (
    <section className="bg-white py-20">
      <div className="container-x">
        <SectionHead eyebrow="Divulgación" title="Artículos recientes" to="/articulos" linkLabel="Ir a la biblioteca" />
        {recent.error ? <ErrorBox error={recent.error} /> : !lead ? <Empty title="Todavía no hay artículos publicados" /> : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Link to={`/articulos/${lead.slug}`} className="group relative flex min-h-[22rem] overflow-hidden rounded-3xl bg-petrol-deep">
              {lead.cover_url && <img src={lead.cover_url} alt={lead.cover_alt ?? ''} className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-petrol-deep via-petrol-deep/60 to-transparent" aria-hidden />
              <div className="relative mt-auto p-7 text-white">
                {lead.category && <span className="rounded-full bg-orange px-2.5 py-1 text-xs font-bold">{lead.category}</span>}
                <h3 className="mt-3 font-serif text-2xl leading-snug sm:text-3xl">{lead.title}</h3>
                {lead.excerpt && <p className="mt-2 line-clamp-2 text-sm text-white/80">{lead.excerpt}</p>}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold">Leer artículo <ArrowRight className="h-4 w-4" aria-hidden /></span>
              </div>
            </Link>
            <div className="grid gap-4">
              {rest.map((a) => (
                <Link key={a.id} to={`/articulos/${a.slug}`} className="group flex gap-4 rounded-2xl border border-line p-3 transition hover:border-orange/40">
                  {a.cover_url ? <img src={a.cover_url} alt="" className="h-24 w-28 shrink-0 rounded-xl object-cover" loading="lazy" /> : <div className="h-24 w-28 shrink-0 rounded-xl bg-mist" />}
                  <div className="min-w-0">
                    {a.category && <p className="text-xs font-bold text-orange-deep">{a.category}</p>}
                    <p className="mt-1 line-clamp-3 font-serif text-lg leading-snug text-ink group-hover:text-orange-deep">{a.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedPublications() {
  const featured = usePublicList<Publication>('publications', { featured: true, order: [{ col: 'sort_order', asc: true }, { col: 'year' }], limit: 4 });
  const latest = usePublicList<Publication>('publications', { order: [{ col: 'year' }, { col: 'published_at' }], limit: 4 });
  const rows = featured.data?.length ? featured.data : latest.data ?? [];
  if (!featured.isLoading && !latest.isLoading && !rows.length) return null;
  return (
    <section className="container-x py-20">
      <SectionHead eyebrow="Producción científica" title="Publicaciones destacadas" to="/publicaciones" linkLabel="Ver publicaciones" />
      {featured.isLoading ? <SkeletonGrid n={2} h="h-44" /> : <div className="grid gap-5 md:grid-cols-2">{rows.map((p) => <PublicationCard key={p.id} p={p} />)}</div>}
    </section>
  );
}

function About() {
  const { settings } = useSettings();
  const h = settings.home;
  return (
    <section className="py-6">
      <div className="container-x">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-12 lg:grid-cols-[auto_1fr]">
          <DnaSymbol className="h-32 w-auto justify-self-center sm:h-40" />
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-orange">Institucional</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">{h.about_title}</h2>
            <Markdown className="mt-4 max-w-2xl !text-white/80 [&_strong]:!text-white [&_a]:!text-orange">{h.about_text}</Markdown>
            <Link to="/quienes-somos" className="btn mt-6 bg-white text-ink hover:bg-orange hover:text-white">{h.about_link_label} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoursesCta() {
  const { settings } = useSettings();
  const h = settings.home;
  return (
    <section className="container-x py-20">
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-card-line bg-card p-8 sm:flex-row sm:items-center sm:p-10">
        <div>
          <h2 className="h-display text-3xl">{h.courses_cta_title}</h2>
          {h.courses_cta_text && <p className="mt-2 max-w-xl text-ink-soft">{h.courses_cta_text}</p>}
        </div>
        <Link to={h.courses_cta_url || '/cursos'} className="btn-primary shrink-0 px-6 py-3">{h.courses_cta_label} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </div>
    </section>
  );
}

function NewsletterBand() {
  const { settings } = useSettings();
  return (
    <section className="relative overflow-hidden bg-petrol-deep py-16 text-white">
      <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-[0.07]" aria-hidden><img src="/brand/simbolo-adn.png" alt="" className="h-96 w-auto" /></div>
      <div className="container-x relative grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-orange">Newsletter</p>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">{settings.newsletter.title}</h2>
          <p className="mt-3 max-w-lg text-white/75">{settings.newsletter.text}</p>
        </div>
        <NewsletterForm variant="band" showInterests />
      </div>
    </section>
  );
}

const BLOCKS: Record<string, () => React.JSX.Element | null> = {
  accesos: Accesos, cursos: FeaturedCourses, articulos: RecentArticles, presentacion: About,
  publicaciones: FeaturedPublications, cta_cursos: CoursesCta, newsletter: NewsletterBand,
};

export default function Home() {
  const { settings } = useSettings();
  return (
    <>
      <Seo jsonLd={{ '@type': 'Organization', name: 'BIOQUNS', url: settings.general.site_url || window.location.origin, logo: (settings.general.site_url || window.location.origin) + '/brand/logo-completo.png', description: settings.general.default_seo_description }} />
      <Hero />
      {settings.home.sections.filter((s) => s.visible && BLOCKS[s.id]).map((s) => { const B = BLOCKS[s.id]; return <B key={s.id} />; })}
    </>
  );
}

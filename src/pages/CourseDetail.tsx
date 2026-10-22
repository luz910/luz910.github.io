import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, CalendarRange, Clock3, Gauge, Mail, MonitorPlay, Tag, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { usePublicItem } from '../lib/api';
import type { Course } from '../lib/types';
import { fmtRange, plainText } from '../lib/format';
import { usePreview } from '../lib/usePreview';
import { Markdown } from '../components/Markdown';
import { Seo } from '../components/Seo';
import { Share } from '../components/Share';
import { EnrollmentBadge, LogoStrip } from '../components/Cards';
import { DnaLoader } from '../components/DnaSymbol';
import { Img } from '../components/Img';
import { ErrorBox, PreviewBanner } from '../components/ui';
import { NewsletterForm } from '../components/NewsletterForm';
import NotFound from './NotFound';

export function courseCta(c: Course): { href: string; label: string; external: boolean } | null {
  const label = c.cta_label || (c.enrollment_status === 'open' ? 'Inscribirme' : 'Consultar por el curso');
  const v = c.cta_url?.trim();
  if (!v) return null;
  switch (c.cta_type) {
    case 'email': return { href: `mailto:${v}?subject=${encodeURIComponent('Consulta: ' + c.title)}`, label, external: true };
    case 'whatsapp': return { href: `https://wa.me/${v.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero consultar por el curso "' + c.title + '".')}`, label, external: true };
    case 'internal': return { href: v, label, external: false };
    default: return { href: v, label, external: true };
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="h-display mb-4 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const preview = usePreview();
  const { data: c, isLoading, error } = usePublicItem<Course>('courses', slug, preview);
  if (isLoading) return <DnaLoader />;
  if (error) return <div className="container-x py-16"><ErrorBox error={error} /></div>;
  if (!c) return <NotFound />;
  const cta = courseCta(c);
  const facts = [
    { icon: CalendarRange, label: 'Fechas', value: fmtRange(c.start_date, c.end_date) },
    { icon: Clock3, label: 'Duración', value: c.duration },
    { icon: Timer, label: 'Carga horaria', value: c.workload },
    { icon: MonitorPlay, label: 'Modalidad', value: c.modality },
    { icon: Gauge, label: 'Nivel', value: c.level },
    { icon: Tag, label: 'Arancel', value: c.price },
  ].filter((f) => f.value);
  const CtaBtn = ({ className = '' }: { className?: string }) => !cta ? null : cta.external
    ? <a href={cta.href} target="_blank" rel="noopener noreferrer" className={`btn-primary px-6 py-3 ${className}`}>{cta.label}</a>
    : <Link to={cta.href} className={`btn-primary px-6 py-3 ${className}`}>{cta.label}</Link>;

  return (
    <>
      <Seo
        title={c.seo_title || c.title}
        description={c.seo_description || c.short_description || plainText(c.description, 160)}
        image={c.cover_url}
        jsonLd={{ '@type': 'Course', name: c.title, description: c.short_description || plainText(c.description, 300) || c.title, provider: { '@type': 'Organization', name: c.institution || 'BIOQUNS' }, ...(c.start_date ? { hasCourseInstance: { '@type': 'CourseInstance', courseMode: c.modality || undefined, startDate: c.start_date, endDate: c.end_date || undefined } } : {}) }}
      />
      {preview && <PreviewBanner />}
      <section className="relative overflow-hidden bg-petrol-deep text-white">
        <Img src={c.cover_url} alt={c.cover_alt} className="absolute inset-0 h-full w-full opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-petrol-deep via-petrol-deep/90 to-petrol-deep/40" aria-hidden />
        <div className="container-x relative py-12 sm:py-16">
          <Link to="/cursos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden /> Nuestros cursos</Link>
          <div className="mt-6 flex flex-wrap items-center gap-3"><EnrollmentBadge s={c.enrollment_status} /><LogoStrip keys={c.logos} size="md" /></div>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">{c.title}</h1>
          {c.institution && <p className="mt-3 text-lg text-white/80">{c.institution}</p>}
          {c.short_description && <p className="mt-4 max-w-2xl text-white/80">{c.short_description}</p>}
          <div className="mt-8 flex flex-wrap gap-3"><CtaBtn />{c.program && <button type="button" onClick={() => document.getElementById('programa')?.scrollIntoView({ behavior: 'smooth' })} className="btn border border-white/30 text-white hover:bg-white/10">Ver programa</button>}</div>
        </div>
      </section>

      <div className="container-x grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          {c.description && <Markdown>{c.description}</Markdown>}
          {c.objectives && <Section title="Objetivos"><Markdown>{c.objectives}</Markdown></Section>}
          {c.audience && <Section title="Destinatarios"><Markdown>{c.audience}</Markdown></Section>}
          {c.program && <div id="programa" className="scroll-mt-24"><Section title="Programa y contenidos"><Markdown>{c.program}</Markdown></Section></div>}
          {c.teachers?.length > 0 && (
            <Section title={c.teachers.length > 1 ? 'Docentes' : 'Docente'}>
              <ul className="grid gap-5 sm:grid-cols-2">
                {c.teachers.map((t, i) => (
                  <li key={i} className="card flex gap-4 p-5">
                    {t.photo_url ? <img src={t.photo_url} alt={t.name} className="h-16 w-16 shrink-0 rounded-full object-cover" loading="lazy" />
                      : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-petrol-soft font-bold text-petrol" aria-hidden>{t.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>}
                    <div><p className="font-bold text-ink">{t.name}</p>{t.bio && <Markdown className="mt-1 !text-sm">{t.bio}</Markdown>}</div>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {c.requirements && <Section title="Requisitos"><Markdown>{c.requirements}</Markdown></Section>}
          {c.certification && <Section title="Certificación"><div className="flex gap-3"><Award className="mt-1 h-5 w-5 shrink-0 text-orange" aria-hidden /><Markdown>{c.certification}</Markdown></div></Section>}
          <div className="border-t border-line pt-6"><Share title={c.title} /></div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-card-line bg-card">
            <div className="border-b border-card-line bg-[#dfe8ed] px-5 py-3"><EnrollmentBadge s={c.enrollment_status} /></div>
            <dl className="space-y-3 p-5 text-sm">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-petrol" aria-hidden /><div><dt className="text-xs font-bold uppercase tracking-wide text-mute">{label}</dt><dd className="text-ink">{value}</dd></div></div>
              ))}
            </dl>
            {cta && <div className="px-5 pb-5"><CtaBtn className="w-full" /></div>}
            {!cta && <p className="px-5 pb-5 text-sm text-mute">Las consultas e inscripciones se habilitarán próximamente.</p>}
          </div>
          {c.contact && (
            <div className="card p-5 text-sm">
              <h2 className="eyebrow mb-2 flex items-center gap-2"><Mail className="h-3.5 w-3.5" aria-hidden />Contacto</h2>
              <Markdown className="!text-sm">{c.contact}</Markdown>
            </div>
          )}
          <div className="rounded-2xl bg-petrol-soft p-5">
            <p className="font-serif text-lg text-petrol-deep">No te pierdas nuevas fechas</p>
            <p className="mb-3 mt-1 text-sm text-ink-soft">Te avisamos cuando abran inscripciones.</p>
            <NewsletterForm variant="compact" />
          </div>
        </aside>
      </div>
      {cta && (
        <div className="sticky bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
          <CtaBtn className="w-full" />
        </div>
      )}
    </>
  );
}

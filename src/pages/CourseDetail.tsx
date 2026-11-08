import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, CalendarRange, Clock3, MonitorPlay, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { usePublicItem } from '../lib/api';
import type { Course, Teacher } from '../lib/types';
import { fmtRange, plainText } from '../lib/format';
import { usePreview } from '../lib/usePreview';
import { Markdown } from '../components/Markdown';
import { Seo } from '../components/Seo';
import { Share } from '../components/Share';
import { EnrollmentBadge, LogoStrip } from '../components/Cards';
import { DnaLoader } from '../components/DnaSymbol';
import { ErrorBox, PreviewBanner } from '../components/ui';
import { NewsletterForm } from '../components/NewsletterForm';
import NotFound from './NotFound';

export function courseCta(c: Course): { href: string; label: string; external: boolean } | null {
  const label = c.enrollment_status === 'open' ? 'Inscribirme' : 'Ir a la inscripción';
  const v = c.cta_url?.trim();
  if (!v) return null;
  switch (c.cta_type) {
    case 'email': return { href: `mailto:${v}?subject=${encodeURIComponent('Consulta: ' + c.title)}`, label, external: true };
    case 'whatsapp': return { href: `https://wa.me/${v.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero consultar por el curso "' + c.title + '".')}`, label, external: true };
    case 'internal': return { href: v, label, external: false };
    default: return { href: v, label, external: true };
  }
}

function TeacherList({ list }: { list: Teacher[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {list.map((t, i) => (
        <li key={i} className="card flex gap-4 p-5">
          {t.photo_url ? <img src={t.photo_url} alt={t.name} className="h-16 w-16 shrink-0 rounded-full object-cover" loading="lazy" />
            : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-petrol-soft font-bold text-petrol" aria-hidden>{t.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>}
          <div><p className="font-bold text-ink">{t.name}</p>{t.bio && <Markdown className="mt-1 !text-sm">{t.bio}</Markdown>}</div>
        </li>
      ))}
    </ul>
  );
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
  const coordText = (c.teachers ?? []).find((t) => t.text && t.coordinator)?.bio;
  const staffText = (c.teachers ?? []).find((t) => t.text && !t.coordinator)?.bio;
  const coordinators = (c.teachers ?? []).filter((t) => !t.text && t.coordinator);
  const staff = (c.teachers ?? []).filter((t) => !t.text && !t.coordinator);
  const facts = [
    { icon: CalendarRange, label: 'Duración', value: fmtRange(c.start_date, c.end_date) },
    { icon: Clock3, label: 'Duración ', value: c.duration },
    { icon: Timer, label: 'Carga horaria', value: c.workload },
    { icon: MonitorPlay, label: 'Modalidad', value: c.modality },
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
        <div className="container-x relative py-12 sm:py-16">
          <Link to="/cursos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden /> Nuestros cursos</Link>
          {c.logos?.length > 0 && <div className="mt-6"><LogoStrip keys={c.logos} size="md" /></div>}
          <h1 className="mt-5 font-display font-bold text-4xl leading-tight sm:text-5xl">{c.title}</h1>
        </div>
      </section>

      <div className="container-x grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          {c.description && <Section title="Presentación"><Markdown>{c.description}</Markdown></Section>}
          {c.audience && <Section title="Destinatarios"><Markdown>{c.audience}</Markdown></Section>}
          {(coordText || coordinators.length > 0) && <Section title="Docente coordinador">{coordText && <Markdown>{coordText}</Markdown>}{coordinators.length > 0 && <TeacherList list={coordinators} />}</Section>}
          {(staffText || staff.length > 0) && <Section title="Plantel docente">{staffText && <Markdown>{staffText}</Markdown>}{staff.length > 0 && <TeacherList list={staff} />}</Section>}
          {c.program && <div id="programa" className="scroll-mt-24"><Section title="Programa de estudio"><Markdown>{c.program}</Markdown></Section></div>}
          {c.objectives && <Section title="Objetivos"><Markdown>{c.objectives}</Markdown></Section>}
          {c.certification && (
            <Section title="Certificación">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-card-line bg-card px-5 py-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-soft"><Award className="h-6 w-6 text-orange" aria-hidden /></span>
                <span className="font-display text-lg font-bold text-ink">Certificado UNS</span>
              </div>
            </Section>
          )}
          <div className="border-t border-line pt-6"><Share title={c.title} /></div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-card-line bg-card">
            <div className="border-b border-card-line bg-card-head px-5 py-3"><EnrollmentBadge s={c.enrollment_status} /></div>
            <dl className="space-y-3 p-5 text-sm">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-petrol" aria-hidden /><div><dt className="text-xs font-bold uppercase tracking-wide text-mute">{label}</dt><dd className="text-ink">{value}</dd></div></div>
              ))}
            </dl>
            {cta && <div className="px-5 pb-5"><CtaBtn className="w-full" /></div>}
            {!cta && <p className="px-5 pb-5 text-sm text-mute">Las consultas e inscripciones se habilitarán próximamente.</p>}
          </div>
          <div className="rounded-2xl bg-petrol-soft p-5">
            <p className="font-display font-bold text-lg text-petrol-deep">No te pierdas nuevas fechas</p>
            <p className="mb-3 mt-1 text-sm text-ink-soft">Te avisamos cuando abran inscripciones.</p>
            <NewsletterForm variant="compact" topic="cursos" />
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

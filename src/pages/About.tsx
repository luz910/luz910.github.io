import { useSettings } from '../lib/settings';
import { usePublicList } from '../lib/api';
import type { Member } from '../lib/types';
import { Markdown } from '../components/Markdown';
import { Seo } from '../components/Seo';
import { DnaSymbol } from '../components/DnaSymbol';
import { Empty, PageHeader, SkeletonGrid } from '../components/ui';
import type { ReactNode } from 'react';

function Block({ title, children }: { title: string; children: ReactNode }) {
  return <div><h4 className="text-xs font-bold uppercase tracking-[0.14em] text-petrol">{title}</h4><div className="mt-1.5">{children}</div></div>;
}

function Photo({ m, className }: { m: Member; className: string }) {
  return m.photo_url
    ? <img src={m.photo_url} alt={m.photo_alt || m.name} className={`object-cover ${className}`} />
    : <div className={`flex items-center justify-center bg-[#f1f4f5] ${className}`}><DnaSymbol spin={false} className="h-16 w-auto opacity-40" /></div>;
}

function Details({ m }: { m: Member }) {
  return (
    <>
      {m.bio && <Markdown className="!text-[0.95rem]">{m.bio}</Markdown>}
      {m.education && <Block title="Formación"><Markdown className="!text-sm">{m.education}</Markdown></Block>}
      {m.career && <Block title="Trayectoria académica y profesional"><Markdown className="!text-sm">{m.career}</Markdown></Block>}
      {m.specialties?.length > 0 && <Block title="Áreas de especialización"><div className="flex flex-wrap gap-1.5">{m.specialties.map((s) => <span key={s} className="chip bg-petrol-soft text-petrol-deep">{s}</span>)}</div></Block>}
      {m.activities && <Block title="Docencia e investigación"><Markdown className="!text-sm">{m.activities}</Markdown></Block>}
      {m.highlights && <Block title="Publicaciones y antecedentes destacados"><Markdown className="!text-sm">{m.highlights}</Markdown></Block>}
    </>
  );
}

function MemberCard({ m }: { m: Member }) {
  // Tarjeta blanca con una línea azul arriba; foto redonda con borde fino, nombre en azul petróleo
  // y cargo en mayúsculas grises. En la compu, la foto va a la izquierda del nombre.
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line border-t-[3px] border-t-petrol bg-white">
      <div className="flex flex-col items-center gap-5 px-6 pt-8 pb-6 text-center sm:flex-row sm:text-left">
        <Photo m={m} className="h-32 w-32 shrink-0 rounded-full ring-1 ring-line ring-offset-4" />
        <div>
          <h3 className="font-display text-[1.35rem] font-semibold leading-tight tracking-[-0.01em] text-petrol-deep">{m.name}</h3>
          {m.role && <p className="mt-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-mute">{m.role}</p>}
        </div>
      </div>
      <div className="flex-1 space-y-5 border-t border-line px-6 pt-6 pb-7 text-sm">
        <Details m={m} />
      </div>
    </article>
  );
}

export default function About() {
  const { settings } = useSettings();
  const a = settings.about;
  const members = usePublicList<Member>('members', { order: [{ col: 'sort_order', asc: true }, { col: 'created_at', asc: true }] });
  const leaders = (members.data ?? []).filter((m) => m.is_leader);
  const others = (members.data ?? []).filter((m) => !m.is_leader);
  return (
    <>
      <Seo title={a.title} description={settings.general.default_seo_description} />
      <PageHeader eyebrow="Institucional" title={a.title} />
      <div className="container-x py-14">
        <div className="relative overflow-hidden rounded-3xl bg-[#f2f6f8] p-8 sm:p-12">
          <Markdown className="relative max-w-4xl text-lg leading-relaxed [&_p:first-child]:text-xl [&_p:first-child]:text-ink">{a.intro}</Markdown>
        </div>
        <section className="mt-20">
          <h2 className="h-display mb-8 text-center text-3xl">{a.team_title}</h2>
          {members.isLoading ? <SkeletonGrid n={2} h="h-[30rem]" /> : leaders.length === 0 && others.length === 0 ? (
            <Empty title="Perfiles a completar" text="Los responsables se cargan desde el panel de editores (Administrar integrantes)." />
          ) : (
            <div className={`mx-auto grid gap-8 ${leaders.length === 1 ? 'max-w-xl' : 'max-w-5xl md:grid-cols-2'}`}>
              {leaders.map((m) => <MemberCard key={m.id} m={m} />)}
            </div>
          )}
          {others.length > 0 && (
            <>
              <h3 className="h-display mb-6 mt-16 text-center text-2xl">Equipo</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{others.map((m) => <MemberCard key={m.id} m={m} />)}</div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

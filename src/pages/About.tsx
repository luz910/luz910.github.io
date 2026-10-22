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

function MemberCard({ m }: { m: Member }) {
  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <div className="relative bg-gradient-to-br from-petrol-soft to-white px-6 pt-8 pb-6 text-center">
        {m.photo_url
          ? <img src={m.photo_url} alt={m.photo_alt || m.name} className="mx-auto h-40 w-40 rounded-full object-cover shadow-lg ring-4 ring-white" />
          : <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-inner ring-4 ring-white"><DnaSymbol spin={false} className="h-20 w-auto opacity-40" /></div>}
        <h3 className="mt-5 font-serif text-2xl text-ink">{m.name}</h3>
        {m.role && <p className="mt-1 text-sm font-bold text-orange-deep">{m.role}</p>}
      </div>
      <div className="flex-1 space-y-5 p-6 text-sm">
        {m.bio && <Markdown className="!text-[0.95rem]">{m.bio}</Markdown>}
        {m.education && <Block title="Formación"><Markdown className="!text-sm">{m.education}</Markdown></Block>}
        {m.career && <Block title="Trayectoria académica y profesional"><Markdown className="!text-sm">{m.career}</Markdown></Block>}
        {m.specialties?.length > 0 && <Block title="Áreas de especialización"><div className="flex flex-wrap gap-1.5">{m.specialties.map((s) => <span key={s} className="chip bg-petrol-soft text-petrol-deep">{s}</span>)}</div></Block>}
        {m.activities && <Block title="Docencia e investigación"><Markdown className="!text-sm">{m.activities}</Markdown></Block>}
        {m.highlights && <Block title="Publicaciones y antecedentes destacados"><Markdown className="!text-sm">{m.highlights}</Markdown></Block>}
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
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <Markdown className="text-lg">{a.intro}</Markdown>
          {a.mission && (
            <aside className="h-fit rounded-3xl bg-ink p-8 text-white">
              <DnaSymbol className="h-14 w-auto" />
              <h2 className="mt-4 font-serif text-2xl">{a.mission_title}</h2>
              <Markdown className="mt-3 !text-white/80">{a.mission}</Markdown>
            </aside>
          )}
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

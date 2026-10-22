-- =====================================================================
-- BIOQUNS — Esquema inicial de base de datos (Supabase / PostgreSQL)
-- Ejecutar una sola vez en el SQL Editor de Supabase (o con `supabase db push`).
-- =====================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Editores: quién puede modificar el sitio
-- ---------------------------------------------------------------------
create table if not exists public.editors (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.editors where user_id = auth.uid());
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.editors where user_id = auth.uid() and role = 'admin');
$$;

grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Configuración editable (portada, quiénes somos, pie, logos, SEO, correo)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Contenidos
-- Estados comunes: draft (borrador), published (publicado), archived (archivado).
-- Un contenido es público si status = 'published' y published_at <= now()
-- (permite programar publicaciones a futuro).
-- ---------------------------------------------------------------------
create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (length(title) between 3 and 300),
  excerpt         text,
  summary         text,
  body            text,
  cover_url       text,
  cover_alt       text,
  authors         text,
  category        text,
  tags            text[] not null default '{}',
  source          text,
  doi             text,
  external_url    text,
  references_md   text,
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  published_at    timestamptz,
  featured        boolean not null default false,
  sort_order      integer not null default 0,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.courses (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title             text not null check (length(title) between 3 and 300),
  institution       text,
  short_description text,
  cover_url         text,
  cover_alt         text,
  logos             text[] not null default '{uns,bioquns,dirEaD}',
  duration          text,
  workload          text,
  modality          text,
  level             text,
  enrollment_status text not null default 'soon' check (enrollment_status in ('open','soon','closed')),
  description       text,
  objectives        text,
  audience          text,
  program           text,
  teachers          jsonb not null default '[]'::jsonb,
  requirements      text,
  start_date        date,
  end_date          date,
  price             text,
  certification     text,
  cta_label         text,
  cta_type          text not null default 'external' check (cta_type in ('external','email','whatsapp','internal')),
  cta_url           text,
  contact           text,
  status            text not null default 'draft' check (status in ('draft','published','archived')),
  published_at      timestamptz,
  featured          boolean not null default false,
  sort_order        integer not null default 0,
  seo_title         text,
  seo_description   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.publications (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (length(title) between 3 and 400),
  authors         text,
  year            integer check (year between 1900 and 2200),
  pub_type        text,
  topic           text,
  source          text,
  abstract        text,
  thumbnail_url   text,
  thumbnail_alt   text,
  doi             text,
  external_url    text,
  files           jsonb not null default '[]'::jsonb,
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  published_at    timestamptz,
  featured        boolean not null default false,
  sort_order      integer not null default 0,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.congresses (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name               text not null,
  organizer          text,
  location           text,
  start_date         date,
  end_date           date,
  participation_type text,
  members            text,
  description        text,
  works              text,
  cover_url          text,
  cover_alt          text,
  status             text not null default 'draft' check (status in ('draft','published','archived')),
  published_at       timestamptz,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.talks (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null,
  speaker      text,
  congress_id  uuid references public.congresses(id) on delete set null,
  event_name   text,
  date         date,
  location     text,
  summary      text,
  topics       text[] not null default '{}',
  photo_url    text,
  photo_alt    text,
  links        jsonb not null default '[]'::jsonb,
  files        jsonb not null default '[]'::jsonb,
  status       text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.posters (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null,
  authors       text,
  congress_id   uuid references public.congresses(id) on delete set null,
  event_name    text,
  year          integer check (year between 1900 and 2200),
  description   text,
  pdf_url       text,
  thumbnail_url text,
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  published_at  timestamptz,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id           uuid primary key default gen_random_uuid(),
  image_url    text not null,
  title        text,
  description  text,
  alt          text,
  congress_id  uuid references public.congresses(id) on delete set null,
  event_label  text,
  year         integer check (year between 1900 and 2200),
  status       text not null default 'published' check (status in ('draft','published','archived')),
  published_at timestamptz default now(),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null,
  role         text,
  photo_url    text,
  photo_alt    text,
  bio          text,
  career       text,
  education    text,
  specialties  text[] not null default '{}',
  activities   text,
  highlights   text,
  is_leader    boolean not null default true,
  status       text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Newsletter
-- ---------------------------------------------------------------------
create table if not exists public.subscribers (
  id                uuid primary key default gen_random_uuid(),
  email             citext not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name              text,
  interests         text[] not null default '{}',
  status            text not null default 'pending' check (status in ('pending','active','unsubscribed')),
  confirm_token     uuid not null default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  consent_text      text,
  consent_at        timestamptz,
  confirmed_at      timestamptz,
  unsubscribed_at   timestamptz,
  last_confirm_sent timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Una fila por contenido notificado: la restricción UNIQUE es la que impide
-- enviar dos veces el mismo aviso aunque haya reintentos o ejecuciones simultáneas.
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('article','course','publication')),
  content_id   uuid not null,
  title        text,
  status       text not null default 'sending' check (status in ('sending','partial','sent','failed','skipped')),
  sent_count   integer not null default 0,
  error        text,
  attempts     integer not null default 0,
  locked_at    timestamptz not null default now(),
  -- Último suscriptor alcanzado: permite retomar un envío interrumpido sin repetir destinatarios
  last_created_at    timestamptz,
  last_subscriber_id uuid,
  created_at   timestamptz not null default now(),
  finished_at  timestamptz,
  unique (content_type, content_id)
);

create table if not exists public.campaigns (
  id         uuid primary key default gen_random_uuid(),
  subject    text not null,
  preheader  text,
  heading    text,
  body       text,
  image_url  text,
  cta_label  text,
  cta_url    text,
  status     text not null default 'draft' check (status in ('draft','sending','partial','sent','failed')),
  sent_count integer not null default 0,
  error      text,
  attempts   integer not null default 0,
  locked_at  timestamptz,
  last_created_at    timestamptz,
  last_subscriber_id uuid,
  sent_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists articles_public_idx     on public.articles (status, published_at desc);
create index if not exists articles_category_idx   on public.articles (category);
create index if not exists courses_public_idx      on public.courses (status, sort_order, published_at desc);
create index if not exists publications_public_idx on public.publications (status, year desc);
create index if not exists congresses_date_idx     on public.congresses (start_date desc);
create index if not exists talks_date_idx          on public.talks (date desc);
create index if not exists posters_year_idx        on public.posters (year desc);
create index if not exists gallery_order_idx       on public.gallery_photos (year desc, sort_order);
create index if not exists subscribers_status_idx  on public.subscribers (status);

-- ---------------------------------------------------------------------
-- Disparadores updated_at
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['settings','articles','courses','publications','congresses','talks','posters','gallery_photos','members','subscribers','campaigns'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- Al publicar sin fecha, se toma la fecha actual.
create or replace function public.set_published_at() returns trigger
language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['articles','courses','publications','congresses','talks','posters','gallery_photos','members'] loop
    execute format('drop trigger if exists %I_pubdate on public.%I', t, t);
    execute format('create trigger %I_pubdate before insert or update on public.%I for each row execute function public.set_published_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Seguridad a nivel de fila (RLS)
-- El público solo LEE lo publicado. Solo los editores escriben.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['articles','courses','publications','congresses','talks','posters','gallery_photos','members'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "lectura publica" on public.%I', t);
    execute format('create policy "lectura publica" on public.%I for select using ((status = ''published'' and published_at <= now()) or public.is_editor())', t);
    execute format('drop policy if exists "editores insertan" on public.%I', t);
    execute format('create policy "editores insertan" on public.%I for insert to authenticated with check (public.is_editor())', t);
    execute format('drop policy if exists "editores actualizan" on public.%I', t);
    execute format('create policy "editores actualizan" on public.%I for update to authenticated using (public.is_editor()) with check (public.is_editor())', t);
    execute format('drop policy if exists "editores eliminan" on public.%I', t);
    execute format('create policy "editores eliminan" on public.%I for delete to authenticated using (public.is_editor())', t);
  end loop;
end $$;

alter table public.settings enable row level security;
drop policy if exists "lectura publica" on public.settings;
create policy "lectura publica" on public.settings for select using (key not like 'private.%' or public.is_editor());
drop policy if exists "editores escriben" on public.settings;
create policy "editores escriben" on public.settings for all to authenticated using (public.is_editor()) with check (public.is_editor());

alter table public.editors enable row level security;
drop policy if exists "editores se ven" on public.editors;
create policy "editores se ven" on public.editors for select to authenticated using (public.is_editor());
drop policy if exists "admins gestionan" on public.editors;
create policy "admins gestionan" on public.editors for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Suscriptores, notificaciones y campañas: nunca visibles para el público.
-- Las altas se hacen desde la Edge Function "newsletter" con la clave secreta.
alter table public.subscribers enable row level security;
drop policy if exists "editores gestionan" on public.subscribers;
create policy "editores gestionan" on public.subscribers for all to authenticated using (public.is_editor()) with check (public.is_editor());

alter table public.notifications enable row level security;
drop policy if exists "editores leen" on public.notifications;
create policy "editores leen" on public.notifications for select to authenticated using (public.is_editor());

alter table public.campaigns enable row level security;
drop policy if exists "editores gestionan" on public.campaigns;
create policy "editores gestionan" on public.campaigns for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- ---------------------------------------------------------------------
-- Almacenamiento de archivos (imágenes y PDF)
-- Bucket público para lectura; solo editores suben, reemplazan o borran.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 26214400,
        array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','application/pdf'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media lectura publica" on storage.objects;
create policy "media lectura publica" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media editores suben" on storage.objects;
create policy "media editores suben" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_editor());
drop policy if exists "media editores actualizan" on storage.objects;
create policy "media editores actualizan" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_editor());
drop policy if exists "media editores borran" on storage.objects;
create policy "media editores borran" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_editor());

-- ---------------------------------------------------------------------
-- Contenido inicial editable (textos neutros, sin datos inventados)
-- ---------------------------------------------------------------------
insert into public.settings (key, value) values
('general', jsonb_build_object(
  'site_name', 'BIOQUNS',
  'site_url', '',
  'tagline', 'Bioquímica, docencia y actualización profesional',
  'default_seo_description', 'BIOQUNS: artículos de interés, cursos de actualización profesional, publicaciones científicas y participación en congresos de bioquímica.'
)),
('home', jsonb_build_object(
  'hero_kicker', 'Bioquímica · Docencia · Ciencia',
  'hero_title', 'Formación y divulgación en bioquímica',
  'hero_text', 'Cursos de actualización profesional, artículos de interés, publicaciones científicas y participación en congresos. [Reemplazá este texto desde el panel de editores.]',
  'hero_image_url', '',
  'hero_primary_label', 'Ver cursos',
  'hero_primary_url', '/cursos',
  'hero_secondary_label', 'Leer artículos',
  'hero_secondary_url', '/articulos',
  'about_title', 'Qué es BIOQUNS',
  'about_text', '[Completá aquí una breve presentación institucional de BIOQUNS desde el panel de editores.]',
  'about_link_label', 'Conocé quiénes somos',
  'courses_cta_title', '¿Querés actualizar tu formación?',
  'courses_cta_text', 'Consultá los cursos disponibles y sus inscripciones.',
  'courses_cta_label', 'Ver cursos y programas',
  'courses_cta_url', '/cursos',
  'sections', jsonb_build_array(
     jsonb_build_object('id','accesos','visible',true),
     jsonb_build_object('id','cursos','visible',true),
     jsonb_build_object('id','articulos','visible',true),
     jsonb_build_object('id','presentacion','visible',true),
     jsonb_build_object('id','publicaciones','visible',true),
     jsonb_build_object('id','cta_cursos','visible',true),
     jsonb_build_object('id','newsletter','visible',true))
)),
('about', jsonb_build_object(
  'title', 'Quiénes somos',
  'intro', '[Texto pendiente] Explicá qué es BIOQUNS, su propósito y misión, su relación con la docencia y la formación en bioquímica, sus actividades de actualización profesional y su participación en publicaciones y congresos.',
  'mission_title', 'Propósito',
  'mission', '',
  'team_title', 'Responsables'
)),
('footer', jsonb_build_object(
  'description', 'Bioquímica, docencia universitaria, divulgación científica y formación profesional continua.',
  'email', '',
  'phone', '',
  'address', '',
  'instagram', 'https://www.instagram.com/bioquns/',
  'linkedin', '',
  'facebook', '',
  'youtube', '',
  'website_links', '[]'::jsonb,
  'privacy_text', 'Los datos que nos envíes (por ejemplo, tu correo electrónico al suscribirte al newsletter) se usan únicamente para enviarte las novedades de BIOQUNS. Podés darte de baja en cualquier momento desde el enlace incluido en cada correo. No compartimos tus datos con terceros, salvo el proveedor técnico que realiza los envíos.'
)),
('logos', jsonb_build_object(
  'uns',     jsonb_build_object('label','Universidad Nacional del Sur','url','/logos/uns.png'),
  'bioquns', jsonb_build_object('label','BIOQUNS','url','/brand/simbolo-adn.png'),
  'dirEaD',  jsonb_build_object('label','DirEaD','url','/logos/dirEaD.png')
)),
('newsletter', jsonb_build_object(
  'title', 'Recibí novedades de BIOQUNS',
  'text', 'Enterate de nuevos cursos de actualización profesional, artículos de interés y publicaciones científicas directamente en tu correo.',
  'button', 'Suscribirme',
  'consent', 'Acepto recibir correos de BIOQUNS con novedades. Puedo darme de baja en cualquier momento.',
  'auto_article', true,
  'auto_course', true,
  'auto_publication', false,
  'auto_since', to_jsonb(now())
))
on conflict (key) do nothing;

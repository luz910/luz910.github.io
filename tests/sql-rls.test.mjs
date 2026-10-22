// Prueba del esquema SQL y de las reglas de seguridad (RLS) en un Postgres real (PGlite).
// Simula los esquemas auth y storage de Supabase con lo mínimo necesario.
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync } from 'node:fs';

const db = new PGlite({ extensions: { citext, pgcrypto } });
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fails++; };

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.uid', true),'')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema auth, storage, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);
await db.exec(readFileSync(new URL('../supabase/migrations/20261021000000_esquema_inicial.sql', import.meta.url), 'utf8'));
await db.exec(`
  grant select on all tables in schema public to anon;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
  insert into auth.users values ('11111111-1111-1111-1111-111111111111','editor@x.org'), ('22222222-2222-2222-2222-222222222222','intruso@x.org');
  insert into public.editors values ('11111111-1111-1111-1111-111111111111','editor@x.org','admin');
  insert into public.articles (slug,title,status) values ('publicado','Artículo publicado','published');
  insert into public.articles (slug,title,status) values ('borrador','Artículo borrador','draft');
  insert into public.articles (slug,title,status,published_at) values ('futuro','Artículo programado','published', now() + interval '3 days');
  insert into public.subscribers (email,status) values ('a@b.com','active');
`);
console.log('Esquema creado y datos de prueba cargados');

const as = async (role, uid, sql) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.uid','${uid ?? ''}',false);`);
  try { return await db.query(sql); } finally { await db.exec('reset role;'); }
};
const tryAs = async (role, uid, sql) => { try { const r = await as(role, uid, sql); return { ok: true, r }; } catch (e) { return { ok: false, e: e.message }; } };

const pub = await as('anon', null, `select slug from articles order by slug`);
ok(pub.rows.map(r => r.slug).join() === 'publicado', 'Visitante anónimo ve solo lo publicado (ni borradores ni programados)');
const ed = await as('authenticated', '11111111-1111-1111-1111-111111111111', `select slug from articles`);
ok(ed.rows.length === 3, 'Editor ve borradores y programados (vista previa)');
const pa = await as('anon', null, `select published_at from articles where slug='publicado'`);
ok(pa.rows[0].published_at !== null, 'Al publicar sin fecha se completa la fecha automáticamente');

const ins = await tryAs('anon', null, `insert into articles (slug,title) values ('hack','Hackeo')`);
ok(!ins.ok, 'Anónimo NO puede crear artículos');
const upd = await tryAs('authenticated', '22222222-2222-2222-2222-222222222222', `update articles set title='X' where slug='publicado' returning id`);
ok(upd.ok && upd.r.rows.length === 0, 'Usuario logueado que no es editor NO puede modificar');
const del = await tryAs('authenticated', '22222222-2222-2222-2222-222222222222', `delete from articles returning id`);
ok(del.ok && del.r.rows.length === 0, 'Usuario no editor NO puede eliminar');
const insE = await tryAs('authenticated', '11111111-1111-1111-1111-111111111111', `insert into articles (slug,title,status) values ('nuevo','Nuevo artículo','draft') returning id`);
ok(insE.ok, 'Editor SÍ puede crear');
const updE = await tryAs('authenticated', '11111111-1111-1111-1111-111111111111', `update articles set title='Editado' where slug='nuevo' returning id`);
ok(updE.ok && updE.r.rows.length === 1, 'Editor SÍ puede editar');
const delE = await tryAs('authenticated', '11111111-1111-1111-1111-111111111111', `delete from articles where slug='nuevo' returning id`);
ok(delE.ok && delE.r.rows.length === 1, 'Editor SÍ puede eliminar');

const subs = await as('anon', null, `select * from subscribers`);
ok(subs.rows.length === 0, 'El público NO puede leer la lista de suscriptores');
const subsIns = await tryAs('anon', null, `insert into subscribers (email) values ('z@z.com')`);
ok(!subsIns.ok, 'El público NO puede insertar suscriptores directamente (solo vía función)');
const dup = await tryAs('authenticated', '11111111-1111-1111-1111-111111111111', `insert into subscribers (email) values ('A@B.com')`);
ok(!dup.ok, 'No se permiten correos duplicados (ni con mayúsculas distintas)');
const badMail = await tryAs('authenticated', '11111111-1111-1111-1111-111111111111', `insert into subscribers (email) values ('no-es-correo')`);
ok(!badMail.ok, 'Se rechazan correos con formato inválido');

await db.exec(`insert into notifications (content_type, content_id) values ('article', gen_random_uuid())`);
const n1 = await db.query(`insert into notifications (content_type, content_id) select content_type, content_id from notifications limit 1 on conflict do nothing returning id`);
ok(n1.rows.length === 0, 'Una misma novedad no puede registrarse/enviarse dos veces');

const stA = await tryAs('anon', null, `insert into storage.objects (bucket_id,name) values ('media','x.png')`);
ok(!stA.ok, 'Anónimo NO puede subir archivos');
const stE = await tryAs('authenticated', '11111111-1111-1111-1111-111111111111', `insert into storage.objects (bucket_id,name) values ('media','x.png') returning id`);
ok(stE.ok, 'Editor SÍ puede subir archivos');
const stR = await as('anon', null, `select name from storage.objects`);
ok(stR.rows.length === 1, 'Los archivos subidos son públicos para lectura');

const ed2 = await tryAs('authenticated', '22222222-2222-2222-2222-222222222222', `insert into editors values ('22222222-2222-2222-2222-222222222222','intruso@x.org','admin')`);
ok(!ed2.ok, 'Un usuario no puede darse permisos de editor a sí mismo');
const badSlug = await tryAs('authenticated', '11111111-1111-1111-1111-111111111111', `insert into articles (slug,title) values ('Slug Malo!','Título')`);
ok(!badSlug.ok, 'Se validan las direcciones (slug) de los contenidos');
const settings = await as('anon', null, `select key from settings order by key`);
ok(settings.rows.length === 6, 'Configuración inicial cargada y visible al público (' + settings.rows.map(r => r.key).join(', ') + ')');

console.log(fails ? `\n${fails} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
process.exit(fails ? 1 : 0);

// Edge Function privada del panel: estado del correo, avisos automáticos, campañas y gestión de editores.
// Toda acción exige un editor autenticado (JWT verificado aquí) o, para "dispatch", el secreto del cron.
import { adminClient, cors, EMAIL_RE, getSettings, json, siteUrl } from '../_shared/env.ts';
import { mailConfig, MailError, sendOne, type Mail } from '../_shared/mail.ts';
import { layout, mdToHtml, mdToText } from '../_shared/templates.ts';
import { sendToAll } from '../_shared/broadcast.ts';

type DB = ReturnType<typeof adminClient>;
const FN_NEWSLETTER = `${Deno.env.get('SUPABASE_URL')}/functions/v1/newsletter`;
const LOCK_MINUTES = 15;
const MAX_ATTEMPTS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  const db = adminClient();
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida.' }, 400); }

  // Autorización
  const cronSecret = Deno.env.get('CRON_SECRET');
  const isCron = !!cronSecret && req.headers.get('x-cron-secret') === cronSecret;
  let editor: { user_id: string; email: string; role: string } | null = null;
  if (!isCron) {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Necesitás iniciar sesión como editor.' }, 401);
    const { data: u, error } = await db.auth.getUser(token);
    if (error || !u.user) return json({ error: 'Tu sesión expiró. Volvé a iniciar sesión.' }, 401);
    const { data: ed } = await db.from('editors').select('*').eq('user_id', u.user.id).maybeSingle();
    if (!ed) return json({ error: 'Esta cuenta no tiene permisos de edición.' }, 403);
    editor = ed;
  } else if (body.action !== 'dispatch') {
    return json({ error: 'Acción no permitida para el cron.' }, 403);
  }

  try {
    switch (body.action) {
      case 'status': return json(await status(db));
      case 'dispatch': return json(await dispatch(db));
      case 'campaign': return json(await campaign(db, String(body.id ?? ''), !!body.test, editor!.email));
      case 'create-editor': return await createEditor(db, editor!, body);
      case 'revoke-editor': return await revokeEditor(db, editor!, String(body.user_id ?? ''));
      default: return json({ error: 'Acción desconocida.' }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof MailError ? e.message : 'Error del servidor: ' + (e as Error).message }, 500);
  }
});

/* ------------------------------------------------------------------ estado */
async function status(db: DB) {
  const cfg = mailConfig();
  const settings = await getSettings(db);
  const site = siteUrl(settings);
  const problems: string[] = [];
  if (!cfg.key) problems.push('Falta el secreto RESEND_API_KEY (clave de la API de Resend).');
  if (!cfg.from) problems.push('Falta el secreto MAIL_FROM (remitente, por ejemplo: BIOQUNS <novedades@tudominio.com>).');
  if (!site) problems.push('Falta la dirección pública del sitio: completala en Configuración general o como secreto SITE_URL.');
  if (!Deno.env.get('CRON_SECRET')) problems.push('Falta CRON_SECRET: los avisos programados no se revisarán automáticamente (sí al publicar desde el panel).');
  if (cfg.key && cfg.from) {
    // Si la clave lo permite, verifica que el dominio del remitente esté verificado en Resend.
    try {
      const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${cfg.key}` } });
      if (r.status === 200) {
        const d = await r.json();
        const domain = cfg.from.match(/@([^>\s]+)/)?.[1]?.toLowerCase();
        const found = (d.data ?? []).find((x: any) => x.name?.toLowerCase() === domain);
        if (domain && domain !== 'resend.dev' && (!found || found.status !== 'verified')) problems.push(`El dominio ${domain} todavía no está verificado en Resend (registros DNS pendientes).`);
        if (domain === 'resend.dev') problems.push('Estás usando el remitente de prueba de Resend: solo puede enviar a tu propio correo. Verificá tu dominio para enviar a suscriptores.');
      } else if (r.status === 401 || r.status === 403) {
        const t = await r.text();
        if (!/restricted/i.test(t)) problems.push('La clave RESEND_API_KEY no es válida.');
      }
    } catch { /* sin conexión con Resend: no bloquea */ }
  }
  return { configured: cfg.configured && !!site, from: cfg.from || null, site_url: site || null, cron_secret: !!Deno.env.get('CRON_SECRET'), problems };
}

function unsubLinks(site: string, s: any) {
  return { unsubscribeUrl: `${site}/newsletter/baja?token=${s.unsubscribe_token}`, oneClickUrl: `${FN_NEWSLETTER}?one-click=1&token=${s.unsubscribe_token}` };
}

/* -------------------------------------------- avisos automáticos de novedades */
const TYPES = {
  article: { table: 'articles', path: 'articulos', title: 'title', image: 'cover_url', desc: (r: any) => r.excerpt || mdToText(r.summary ?? '').slice(0, 260), kicker: 'Nuevo artículo', cta: 'Leer el artículo', setting: 'auto_article', audience: 'Artículos' },
  course: { table: 'courses', path: 'cursos', title: 'title', image: 'cover_url', desc: (r: any) => r.short_description || mdToText(r.description ?? '').slice(0, 260), kicker: 'Nuevo curso', cta: 'Ver el curso', setting: 'auto_course', audience: null },
  publication: { table: 'publications', path: 'publicaciones', title: 'title', image: 'thumbnail_url', desc: (r: any) => mdToText(r.abstract ?? '').slice(0, 260) || [r.authors, r.source].filter(Boolean).join(' · '), kicker: 'Nueva publicación', cta: 'Ver la publicación', setting: 'auto_publication', audience: 'Artículos' },
} as const;

async function dispatch(db: DB) {
  const settings = await getSettings(db);
  const nl = settings.newsletter ?? {};
  const site = siteUrl(settings);
  const since = nl.auto_since ?? new Date(0).toISOString();
  const now = new Date().toISOString();

  // 1) Registra las novedades publicadas que aún no tienen aviso. La restricción UNIQUE
  //    (tipo, contenido) garantiza que cada contenido se registre una sola vez.
  for (const [type, t] of Object.entries(TYPES)) {
    const { data: rows } = await db.from(t.table).select('id,title').eq('status', 'published').lte('published_at', now).gte('published_at', since)
      .order('published_at', { ascending: false }).limit(50);
    if (!rows?.length) continue;
    // Los avisos se envían siempre: los cursos a todos los suscriptores; artículos y publicaciones solo a quienes los pidieron.
    const enabled = true;
    await db.from('notifications').upsert(
      rows.map((r: any) => ({ content_type: type, content_id: r.id, title: r.title, status: enabled ? 'sending' : 'skipped', error: enabled ? null : 'Envío automático desactivado para este tipo de contenido', locked_at: new Date(0).toISOString(), finished_at: enabled ? null : now })),
      { onConflict: 'content_type,content_id', ignoreDuplicates: true },
    );
  }

  // 2) Toma (de forma atómica) los avisos pendientes o interrumpidos y los envía.
  const stale = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
  const { data: pending } = await db.from('notifications').select('*').in('status', ['sending', 'partial']).lt('locked_at', stale).lt('attempts', MAX_ATTEMPTS).limit(5);
  const cfg = mailConfig();
  const results: string[] = [];
  for (const n of pending ?? []) {
    if (!cfg.configured || !site) { results.push(`"${n.title}": pendiente (correo sin configurar)`); continue; }
    const { data: claimed } = await db.from('notifications').update({ locked_at: new Date().toISOString(), attempts: n.attempts + 1 })
      .eq('id', n.id).eq('locked_at', n.locked_at).select().maybeSingle();
    if (!claimed) continue; // otra ejecución lo tomó
    const t = TYPES[n.content_type as keyof typeof TYPES];
    const { data: item } = await db.from(t.table).select('*').eq('id', n.content_id).maybeSingle();
    if (!item || item.status !== 'published') {
      await db.from('notifications').update({ status: 'skipped', error: 'El contenido ya no está publicado', finished_at: new Date().toISOString() }).eq('id', n.id);
      continue;
    }
    const link = `${site}/${t.path}/${item.slug}`;
    const desc = t.desc(item);
    try {
      const sent = await sendToAll(db, 'notifications', claimed, (s) => ({
        to: s.email,
        subject: `${t.kicker}: ${item[t.title]}`,
        html: layout({ site, preheader: desc, kicker: t.kicker, heading: item[t.title], imageUrl: item[t.image], bodyHtml: desc ? `<p style="margin:0 0 16px">${mdToHtml(desc).replace(/^<p[^>]*>|<\/p>$/g, '')}</p>` : '', ctaLabel: t.cta, ctaUrl: link, footerNote: 'Recibís este correo porque te suscribiste a las novedades de BIOQUNS.', unsubscribeUrl: unsubLinks(site, s).unsubscribeUrl }),
        text: `${t.kicker}: ${item[t.title]}\n\n${desc}\n\n${link}\n\nCancelar suscripción: ${unsubLinks(site, s).unsubscribeUrl}`,
        ...unsubLinks(site, s),
      }), undefined, t.audience);
      await db.from('notifications').update({ status: sent ? 'sent' : 'skipped', error: sent ? null : (t.audience ? 'No había suscriptores que pidieran artículos' : 'No había suscriptores activos'), finished_at: new Date().toISOString() }).eq('id', n.id);
      results.push(`"${item[t.title]}": enviado a ${sent}`);
    } catch (e) {
      await db.from('notifications').update({ status: 'partial', error: (e as Error).message }).eq('id', n.id);
      results.push(`"${item[t.title]}": interrumpido (${(e as Error).message}); se reintentará`);
    }
  }
  return { message: results.length ? results.join(' · ') : 'No hay avisos pendientes.' };
}

/* ------------------------------------------------------- campañas manuales */
async function campaign(db: DB, id: string, test: boolean, editorEmail: string) {
  const settings = await getSettings(db);
  const site = siteUrl(settings);
  const cfg = mailConfig();
  if (!cfg.configured) throw new MailError('El servicio de correo no está configurado: no se envió nada.');
  if (!site) throw new MailError('Falta la dirección pública del sitio (Configuración general).');
  const { data: c } = await db.from('campaigns').select('*').eq('id', id).maybeSingle();
  if (!c) throw new Error('No se encontró la campaña.');
  const build = (s: { email: string; unsubscribe_token?: string }) => {
    const links = s.unsubscribe_token ? unsubLinks(site, s) : {};
    return {
      to: s.email, subject: (test ? '[PRUEBA] ' : '') + c.subject,
      html: layout({ site, preheader: c.preheader, heading: c.heading || c.subject, imageUrl: c.image_url, bodyHtml: mdToHtml(c.body ?? ''), ctaLabel: c.cta_label, ctaUrl: c.cta_url, footerNote: 'Recibís este correo porque te suscribiste a las novedades de BIOQUNS.', unsubscribeUrl: (links as any).unsubscribeUrl ?? `${site}/newsletter/baja` }),
      text: `${c.heading || c.subject}\n\n${mdToText(c.body ?? '')}\n\n${c.cta_url ?? ''}`,
      ...links,
    } as Mail;
  };
  if (test) {
    await sendOne(build({ email: editorEmail }));
    return { message: `Enviamos una prueba a ${editorEmail}.` };
  }
  // Toma atómica: solo una ejecución puede pasar la campaña a "enviando".
  const stale = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
  const { data: claimed } = await db.from('campaigns').update({ status: 'sending', locked_at: new Date().toISOString(), attempts: (c.attempts ?? 0) + 1, error: null })
    .eq('id', id).or(`status.eq.draft,status.eq.failed,and(status.in.(sending,partial),locked_at.lt."${stale}")`).select().maybeSingle();
  if (!claimed) {
    if (c.status === 'sent') return { message: 'Esta campaña ya había sido enviada.' };
    throw new Error('La campaña ya se está enviando. Esperá unos minutos.');
  }
  try {
    const sent = await sendToAll(db, 'campaigns', claimed, build);
    await db.from('campaigns').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id);
    return { message: `Campaña enviada a ${sent} suscriptores.` };
  } catch (e) {
    await db.from('campaigns').update({ status: 'partial', error: (e as Error).message }).eq('id', id);
    throw new MailError(`El envío se interrumpió: ${(e as Error).message}. Podés reintentar más tarde: continuará donde quedó, sin repetir destinatarios.`);
  }
}

/* -------------------------------------------------------- gestión de editores */
async function createEditor(db: DB, me: { role: string }, b: any) {
  if (me.role !== 'admin') return json({ error: 'Solo un administrador puede crear accesos.' }, 403);
  const email = String(b.email ?? '').trim().toLowerCase();
  const password = String(b.password ?? '');
  const role = b.role === 'admin' ? 'admin' : 'editor';
  if (!EMAIL_RE.test(email)) return json({ error: 'Correo inválido.' }, 400);
  if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return json({ error: /already/i.test(error.message) ? 'Ya existe un usuario con ese correo.' : error.message }, 400);
  const { error: e2 } = await db.from('editors').insert({ user_id: data.user.id, email, role });
  if (e2) return json({ error: e2.message }, 400);
  return json({ ok: true });
}

async function revokeEditor(db: DB, me: { role: string; user_id: string }, userId: string) {
  if (me.role !== 'admin') return json({ error: 'Solo un administrador puede revocar accesos.' }, 403);
  if (userId === me.user_id) return json({ error: 'No podés revocar tu propio acceso.' }, 400);
  await db.from('editors').delete().eq('user_id', userId);
  await db.auth.admin.deleteUser(userId); // cierra el acceso por completo
  return json({ ok: true });
}

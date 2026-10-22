// Edge Function pública: alta (con doble confirmación), confirmación y baja del newsletter.
// Se despliega con verificación JWT desactivada porque la usan visitantes sin cuenta.
import { adminClient, cors, EMAIL_RE, getSettings, json, siteUrl } from '../_shared/env.ts';
import { mailConfig, sendOne } from '../_shared/mail.ts';
import { layout } from '../_shared/templates.ts';

const FN_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/newsletter`;
const RESEND_CONFIRM_AFTER_MIN = 10;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const db = adminClient();
  const url = new URL(req.url);

  // Baja en un clic desde el cliente de correo (encabezado List-Unsubscribe-Post, RFC 8058)
  if (url.searchParams.get('one-click') && url.searchParams.get('token')) {
    await unsubscribe(db, url.searchParams.get('token')!);
    return new Response('Suscripción cancelada.', { headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida.' }, 400); }

  try {
    switch (body.action) {
      case 'subscribe': return await subscribe(db, body);
      case 'confirm': return await confirm(db, String(body.token ?? ''));
      case 'unsubscribe': {
        const ok = await unsubscribe(db, String(body.token ?? ''));
        return ok ? json({ message: 'Listo: cancelaste tu suscripción. No vas a recibir más correos de BIOQUNS.' })
          : json({ error: 'El enlace de baja no es válido o ya fue utilizado.' }, 400);
      }
      case 'request-unsubscribe': return await requestUnsubscribe(db, String(body.email ?? ''));
      default: return json({ error: 'Acción desconocida.' }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: 'No pudimos procesar tu solicitud. Probá de nuevo en unos minutos.' }, 500);
  }
});

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

async function subscribe(db: ReturnType<typeof adminClient>, b: any) {
  // Campo trampa: los robots lo completan, las personas no lo ven.
  if (b.website) return json({ message: 'Gracias. Revisá tu correo para confirmar la suscripción.' });
  const email = String(b.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'El correo no parece válido.' }, 400);
  const consent = String(b.consent ?? '').slice(0, 500);
  if (!consent) return json({ error: 'Falta el consentimiento.' }, 400);
  const name = String(b.name ?? '').trim().slice(0, 120) || null;
  const interests = Array.isArray(b.interests) ? b.interests.map(String).slice(0, 10) : [];

  const { data: existing } = await db.from('subscribers').select('*').eq('email', email).maybeSingle();
  if (existing?.status === 'active') {
    // Mensaje genérico: no revela si un correo está o no en la lista.
    return json({ message: 'Gracias. Si tu correo no estaba confirmado, te enviamos un mensaje para hacerlo.' });
  }

  let row = existing;
  const now = new Date().toISOString();
  if (!existing) {
    const { data, error } = await db.from('subscribers').insert({ email, name, interests, status: 'pending', consent_text: consent, consent_at: now }).select().single();
    if (error) {
      if (error.code === '23505') return json({ message: 'Gracias. Revisá tu correo para confirmar la suscripción.' });
      throw error;
    }
    row = data;
  } else {
    const recent = existing.last_confirm_sent && Date.now() - new Date(existing.last_confirm_sent).getTime() < RESEND_CONFIRM_AFTER_MIN * 60_000;
    if (recent) return json({ message: 'Ya te enviamos el correo de confirmación hace unos minutos. Revisá también la carpeta de spam.' });
    const { data, error } = await db.from('subscribers').update({
      status: 'pending', name: name ?? existing.name, interests: interests.length ? interests : existing.interests,
      consent_text: consent, consent_at: now, confirm_token: crypto.randomUUID(), unsubscribed_at: null,
    }).eq('id', existing.id).select().single();
    if (error) throw error;
    row = data;
  }

  const cfg = mailConfig();
  const settings = await getSettings(db);
  const site = siteUrl(settings);
  if (!cfg.configured || !site) {
    console.warn('Suscripción registrada sin correo de confirmación: falta configurar el envío.');
    return json({ message: 'Registramos tu correo. Te enviaremos el mensaje de confirmación en cuanto el servicio de correo esté activo.' });
  }
  const link = `${site}/newsletter/confirmar?token=${row.confirm_token}`;
  await sendOne({
    to: email,
    subject: 'Confirmá tu suscripción a BIOQUNS',
    html: layout({
      site, preheader: 'Un clic para empezar a recibir novedades.', kicker: 'Newsletter', heading: 'Confirmá tu suscripción',
      bodyHtml: `<p style="margin:0 0 16px">${name ? `Hola ${name.replace(/[<>&"]/g, '')}, g` : 'G'}racias por tu interés en BIOQUNS. Para empezar a recibir novedades sobre cursos de actualización profesional, artículos de interés y publicaciones científicas, confirmá tu correo:</p>`,
      ctaLabel: 'Confirmar suscripción', ctaUrl: link,
      footerNote: 'Recibiste este mensaje porque alguien ingresó esta dirección en el formulario de BIOQUNS. Si no fuiste vos, ignoralo: no te vamos a enviar nada más.',
    }),
    text: `Confirmá tu suscripción a BIOQUNS abriendo este enlace: ${link}\n\nSi no fuiste vos, ignorá este mensaje.`,
  }, `confirm-${row.id}-${row.confirm_token}`);
  await db.from('subscribers').update({ last_confirm_sent: new Date().toISOString() }).eq('id', row.id);
  return json({ message: '¡Casi listo! Te enviamos un correo para confirmar la suscripción. Revisá también la carpeta de spam.' });
}

async function confirm(db: ReturnType<typeof adminClient>, token: string) {
  if (!isUuid(token)) return json({ error: 'El enlace de confirmación no es válido.' }, 400);
  const { data: row } = await db.from('subscribers').select('id,status').eq('confirm_token', token).maybeSingle();
  if (!row) return json({ error: 'El enlace de confirmación no es válido o ya fue utilizado.' }, 400);
  if (row.status === 'active') return json({ message: 'Tu suscripción ya estaba confirmada. ¡Gracias!' });
  const { error } = await db.from('subscribers').update({ status: 'active', confirmed_at: new Date().toISOString() }).eq('id', row.id);
  if (error) throw error;
  return json({ message: '¡Suscripción confirmada! Vas a recibir las novedades de BIOQUNS en tu correo.' });
}

async function unsubscribe(db: ReturnType<typeof adminClient>, token: string) {
  if (!isUuid(token)) return false;
  const { data } = await db.from('subscribers').update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token).select('id');
  return !!data?.length;
}

async function requestUnsubscribe(db: ReturnType<typeof adminClient>, emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const generic = { message: 'Si ese correo está suscripto, te enviamos un enlace para confirmar la baja.' };
  if (!EMAIL_RE.test(email)) return json({ error: 'El correo no parece válido.' }, 400);
  const { data: row } = await db.from('subscribers').select('*').eq('email', email).maybeSingle();
  if (!row || row.status === 'unsubscribed') return json(generic);
  const settings = await getSettings(db);
  const site = siteUrl(settings);
  if (!mailConfig().configured || !site) return json({ error: 'El envío de correos no está disponible en este momento. Escribinos para pedir la baja.' }, 503);
  const link = `${site}/newsletter/baja?token=${row.unsubscribe_token}`;
  await sendOne({
    to: email, subject: 'Cancelar tu suscripción a BIOQUNS',
    html: layout({ site, heading: 'Cancelar suscripción', bodyHtml: '<p style="margin:0 0 16px">Recibimos un pedido para dar de baja este correo del newsletter de BIOQUNS.</p>', ctaLabel: 'Confirmar baja', ctaUrl: link, footerNote: 'Si no lo pediste, ignorá este mensaje y seguirás suscripto.' }),
    text: `Para cancelar tu suscripción a BIOQUNS abrí: ${link}`,
    oneClickUrl: `${FN_URL}?one-click=1&token=${row.unsubscribe_token}`,
  });
  return json(generic);
}

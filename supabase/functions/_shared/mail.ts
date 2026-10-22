// Envío real de correos mediante Resend (https://resend.com). Sin clave configurada, no se envía nada.

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl?: string;
  oneClickUrl?: string;
}

export function mailConfig() {
  const key = Deno.env.get('RESEND_API_KEY') ?? '';
  const from = Deno.env.get('MAIL_FROM') ?? '';
  const replyTo = Deno.env.get('MAIL_REPLY_TO') ?? '';
  return { key, from, replyTo, configured: Boolean(key && from) };
}

export class MailError extends Error {}

function toResend(m: Mail, cfg: ReturnType<typeof mailConfig>) {
  const headers: Record<string, string> = {};
  if (m.oneClickUrl) {
    headers['List-Unsubscribe'] = `<${m.oneClickUrl}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }
  return {
    from: cfg.from, to: [m.to], subject: m.subject, html: m.html, text: m.text,
    ...(cfg.replyTo ? { reply_to: cfg.replyTo } : {}),
    ...(Object.keys(headers).length ? { headers } : {}),
  };
}

async function post(path: string, body: unknown, idempotencyKey?: string) {
  const cfg = mailConfig();
  if (!cfg.configured) throw new MailError('El servicio de correo no está configurado (faltan RESEND_API_KEY o MAIL_FROM).');
  const res = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new MailError(`Resend respondió ${res.status}: ${data?.message ?? data?.name ?? 'error desconocido'}`);
  return data;
}

export async function sendOne(m: Mail, idempotencyKey?: string) {
  return post('/emails', toResend(m, mailConfig()), idempotencyKey);
}

/** Hasta 100 correos individuales por llamada (cada destinatario recibe el suyo, sin ver a los demás). */
export async function sendBatch(mails: Mail[], idempotencyKey: string) {
  if (!mails.length) return;
  const cfg = mailConfig();
  return post('/emails/batch', mails.map((m) => toResend(m, cfg)), idempotencyKey);
}

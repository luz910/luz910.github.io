// Envío por tandas a todos los suscriptores activos, con progreso guardado para retomar sin duplicar.
import { sendBatch, type Mail } from './mail.ts';

export const BATCH = 100;
// deno-lint-ignore no-explicit-any
type DB = any;

interface Cursor { last_created_at: string | null; last_subscriber_id: string | null }

export async function nextBatch(db: DB, c: Cursor) {
  let q = db.from('subscribers').select('id,email,name,unsubscribe_token,created_at').eq('status', 'active')
    .order('created_at', { ascending: true }).order('id', { ascending: true }).limit(BATCH);
  if (c.last_created_at && c.last_subscriber_id) {
    q = q.or(`created_at.gt."${c.last_created_at}",and(created_at.eq."${c.last_created_at}",id.gt.${c.last_subscriber_id})`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/** Envía a todos los suscriptores activos, retomando desde el cursor. Guarda el progreso tras cada tanda. */
export async function sendToAll(db: DB, table: 'notifications' | 'campaigns', row: any, build: (s: any) => Mail, send: typeof sendBatch = sendBatch) {
  let cursor: Cursor = { last_created_at: row.last_created_at, last_subscriber_id: row.last_subscriber_id };
  let sent = row.sent_count ?? 0;
  for (;;) {
    const subs = await nextBatch(db, cursor);
    if (!subs.length) break;
    const mails = subs.map(build);
    // La clave de idempotencia impide que Resend envíe dos veces la misma tanda ante reintentos.
    await send(mails, `${table}-${row.id}-${subs[0].id}`);
    const last = subs[subs.length - 1];
    cursor = { last_created_at: last.created_at, last_subscriber_id: last.id };
    sent += subs.length;
    await db.from(table).update({ ...cursor, sent_count: sent, locked_at: new Date().toISOString() }).eq('id', row.id);
    if (subs.length < BATCH) break;
  }
  return sent;
}


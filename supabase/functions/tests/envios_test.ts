// Pruebas de la lógica de envío: tandas, reanudación sin duplicados, plantillas y configuración.
// Ejecutar: deno test --allow-env supabase/functions/tests/
function assert(c: unknown, m = 'falló la condición') { if (!c) throw new Error(m); }
function assertEquals(a: unknown, b: unknown, m = '') { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m} esperado ${JSON.stringify(b)}, obtenido ${JSON.stringify(a)}`); }
function assertStringIncludes(s: string, sub: string) { if (!s.includes(sub)) throw new Error(`no contiene: ${sub}`); }
async function assertRejects(fn: () => Promise<unknown>, cls?: any, msg?: string) {
  try { await fn(); } catch (e) { if (cls && !(e instanceof cls)) throw new Error('tipo de error inesperado'); if (msg && !(e as Error).message.includes(msg)) throw new Error('mensaje inesperado: ' + (e as Error).message); return; }
  throw new Error('se esperaba un error');
}
import { sendToAll } from '../_shared/broadcast.ts';
import { layout, mdToHtml } from '../_shared/templates.ts';
import { MailError, sendOne } from '../_shared/mail.ts';

/** Base de datos falsa con solo lo que usa sendToAll (suscriptores ordenados + update del progreso). */
function fakeDb(n: number) {
  const subs = Array.from({ length: n }, (_, i) => ({
    id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
    email: `s${i}@ejemplo.com`, unsubscribe_token: crypto.randomUUID(),
    created_at: new Date(Date.UTC(2026, 0, 1, 0, 0, Math.floor(i / 3))).toISOString(), // varios con la misma fecha
    status: 'active',
  }));
  const rows: Record<string, any> = {};
  return {
    rows,
    from(table: string) {
      if (table === 'subscribers') {
        let cur: { at?: string; id?: string } = {};
        let lim = 1000;
        const q: any = {
          select: () => q, eq: () => q, order: () => q,
          limit: (l: number) => { lim = l; return q; },
          or: (f: string) => { const m = f.match(/created_at\.gt\."([^"]+)".*id\.gt\.([0-9a-f-]+)\)/); cur = { at: m![1], id: m![2] }; return q; },
          then: (res: any) => res({ data: subs.filter((s) => !cur.at || s.created_at > cur.at! || (s.created_at === cur.at && s.id > cur.id!)).slice(0, lim), error: null }),
        };
        return q;
      }
      return { update: (p: any) => ({ eq: (_c: string, id: string) => { rows[id] = { ...(rows[id] ?? {}), ...p }; return Promise.resolve({ error: null }); } }) };
    },
  };
}

Deno.test('envía a 250 suscriptores en tandas de 100', async () => {
  const db = fakeDb(250);
  const got: string[] = [];
  const sent = await sendToAll(db, 'notifications', { id: 'n1' }, (s) => ({ to: s.email, subject: 'x', html: '', text: '' }), async (m) => { got.push(...m.map((x) => x.to)); });
  assertEquals(sent, 250);
  assertEquals(got.length, 250);
  assertEquals(new Set(got).size, 250);
});

Deno.test('si el envío se corta, al reintentar retoma donde quedó sin repetir destinatarios', async () => {
  const db = fakeDb(250);
  const got: string[] = [];
  let calls = 0;
  const flaky = async (m: any[]) => { calls++; if (calls === 2) throw new Error('límite diario'); got.push(...m.map((x) => x.to)); };
  await assertRejects(() => sendToAll(db, 'notifications', { id: 'n1' }, (s) => ({ to: s.email, subject: '', html: '', text: '' }), flaky));
  assertEquals(got.length, 100);
  const saved = db.rows['n1'];
  assertEquals(saved.sent_count, 100);
  const sent = await sendToAll(db, 'notifications', { id: 'n1', ...saved }, (s) => ({ to: s.email, subject: '', html: '', text: '' }), flaky);
  assertEquals(sent, 250);
  assertEquals(got.length, 250);
  assertEquals(new Set(got).size, 250, 'nadie recibió el correo dos veces');
});

Deno.test('la clave de idempotencia es estable por tanda (reintentos no duplican en Resend)', async () => {
  const keys: string[][] = [[], []];
  for (const k of [0, 1]) await sendToAll(fakeDb(150), 'campaigns', { id: 'c1' }, (s) => ({ to: s.email, subject: '', html: '', text: '' }), async (_m, key) => { keys[k].push(key); });
  assertEquals(keys[0], keys[1]);
  assertEquals(keys[0].length, 2);
});

Deno.test('plantilla de correo: escapa HTML y agrega baja', () => {
  const html = layout({ site: 'https://bioquns.test', heading: '<script>x</script> Curso', bodyHtml: mdToHtml('**Hola** [web](https://a.b)\n\n- uno\n- dos'), ctaLabel: 'Ver', ctaUrl: 'https://bioquns.test/cursos/x', footerNote: 'nota', unsubscribeUrl: 'https://bioquns.test/newsletter/baja?token=t' });
  assert(!html.includes('<script>'));
  assertStringIncludes(html, '&lt;script&gt;');
  assertStringIncludes(html, '<strong>Hola</strong>');
  assertStringIncludes(html, '<li>uno</li>');
  assertStringIncludes(html, 'Cancelar suscripción');
  assertStringIncludes(html, 'https://bioquns.test/brand/logo-completo.png');
});

Deno.test('sin credenciales de correo NO se simula el envío: se informa el error', async () => {
  Deno.env.delete('RESEND_API_KEY');
  await assertRejects(() => sendOne({ to: 'a@b.com', subject: 's', html: '', text: '' }), MailError, 'no está configurado');
});

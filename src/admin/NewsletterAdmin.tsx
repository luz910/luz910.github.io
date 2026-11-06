import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Download, Plus, RefreshCw, Send, Trash2, UserX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { callFunction } from '../lib/functions';
import { fmtShort } from '../lib/format';
import { useAuth } from '../lib/auth';
import { SettingsForm } from './SettingsEditors';
import { FieldInput, type Field } from './fields';
import { ConfirmDialog, useToast } from './toast';

interface MailStatus { configured: boolean; from: string | null; site_url: string | null; cron_secret: boolean; problems: string[] }

function useMailStatus() {
  return useQuery({ queryKey: ['mail-status'], queryFn: () => callFunction<MailStatus>('admin', { action: 'status' }, true), retry: 0 });
}

function MailStatusBox() {
  const st = useMailStatus();
  if (st.isLoading) return null;
  if (st.error) return (
    <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <div><strong>El servicio de correo no está disponible.</strong> {(st.error as Error).message} Hasta que se configure (ver README → Correo electrónico), no se envía ningún correo: ni confirmaciones de suscripción, ni avisos, ni campañas.</div>
    </div>
  );
  const s = st.data!;
  return s.configured && !s.problems.length ? (
    <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"><CheckCircle2 className="h-5 w-5 shrink-0" /><div>Correo configurado. Remitente: <strong>{s.from}</strong>.</div></div>
  ) : (
    <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <div><strong>Faltan configuraciones: los correos NO se están enviando.</strong><ul className="mt-1 list-disc pl-5">{s.problems.map((p) => <li key={p}>{p}</li>)}</ul></div>
    </div>
  );
}

function Subscribers() {
  const toast = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [st, setSt] = useState('active');
  const [del, setDel] = useState<any>(null);
  const counts = useQuery({
    queryKey: ['subs-counts'],
    queryFn: async () => {
      const out: Record<string, number> = {};
      for (const s of ['active', 'pending', 'unsubscribed']) out[s] = (await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('status', s)).count ?? 0;
      return out;
    },
  });
  const list = useQuery({
    queryKey: ['subs', q, st],
    queryFn: async () => {
      let qb = supabase.from('subscribers').select('*').order('created_at', { ascending: false }).limit(500);
      if (st) qb = qb.eq('status', st);
      if (q.trim()) qb = qb.ilike('email', `%${q.trim().replace(/[%_]/g, '')}%`);
      const { data, error } = await qb; if (error) throw error; return data;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['subs'] }); qc.invalidateQueries({ queryKey: ['subs-counts'] }); };
  async function unsub(row: any) {
    const { error } = await supabase.from('subscribers').update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() }).eq('id', row.id);
    if (error) return toast.error(error.message); toast.ok('Dado de baja.'); refresh();
  }
  async function remove(row: any) {
    setDel(null);
    const { error } = await supabase.from('subscribers').delete().eq('id', row.id);
    if (error) return toast.error(error.message); toast.ok('Datos eliminados.'); refresh();
  }
  async function exportCsv() {
    const { data, error } = await supabase.from('subscribers').select('email,name,interests,status,confirmed_at,created_at').eq('status', 'active').limit(10000);
    if (error) return toast.error(error.message);
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['correo,nombre,intereses,estado,confirmado,alta', ...(data ?? []).map((r: any) => [r.email, r.name, (r.interests ?? []).join(' / '), r.status, r.confirmed_at, r.created_at].map(esc).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `suscriptores-bioquns-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }
  const label: Record<string, string> = { active: 'Activos', pending: 'Sin confirmar', unsubscribed: 'Bajas' };
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(label).map(([k, l]) => (
          <button key={k} onClick={() => setSt(k)} className={`rounded-xl border p-4 text-left ${st === k ? 'border-orange bg-orange-soft' : 'border-line bg-white'}`}>
            <p className="text-2xl font-extrabold text-ink">{counts.data?.[k] ?? '–'}</p><p className="text-xs font-semibold text-mute">{l}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input className="input flex-1" placeholder="Buscar correo…" aria-label="Buscar correo" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-outline" onClick={exportCsv}><Download className="h-4 w-4" />Exportar activos (CSV)</button>
      </div>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-mist text-left text-xs uppercase text-mute"><tr><th className="p-3">Correo</th><th className="p-3">Nombre</th><th className="p-3">Recibe</th><th className="p-3">Alta</th><th className="p-3">Consentimiento</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-line">
            {list.data?.map((r: any) => (
              <tr key={r.id}>
                <td className="p-3 font-semibold">{r.email}</td><td className="p-3">{r.name}</td><td className="p-3 text-xs">{(r.interests ?? []).includes('Artículos') ? 'Cursos y artículos' : 'Solo cursos'}</td>
                <td className="whitespace-nowrap p-3 text-xs">{fmtShort(r.created_at)}</td>
                <td className="p-3 text-xs text-mute" title={r.consent_text ?? ''}>{r.confirmed_at ? `Confirmado ${fmtShort(r.confirmed_at)}` : r.consent_at ? 'Aceptado, sin confirmar' : '—'}</td>
                <td className="whitespace-nowrap p-3 text-right">
                  {r.status !== 'unsubscribed' && <button className="rounded p-1.5 text-mute hover:bg-mist" title="Dar de baja" aria-label="Dar de baja" onClick={() => unsub(r)}><UserX className="h-4 w-4" /></button>}
                  <button className="rounded p-1.5 text-red-700 hover:bg-red-50" title="Eliminar datos" aria-label="Eliminar datos" onClick={() => setDel(r)}><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-mute">Sin suscriptores en esta categoría.</td></tr>}
          </tbody>
        </table>
      </div>
      <ConfirmDialog open={!!del} title={`¿Eliminar los datos de ${del?.email}?`} text="Se borra el registro por completo (por ejemplo, ante un pedido de supresión de datos)." onCancel={() => setDel(null)} onConfirm={() => remove(del)} />
    </div>
  );
}

// @ts-ignore — pestaña oculta a pedido: los avisos se envían siempre según lo que eligió cada suscriptor
function AutoSettings() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function runNow() {
    setBusy(true);
    try { const r = await callFunction<{ message: string }>('admin', { action: 'dispatch' }, true); toast.ok(r.message); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <div>
      <SettingsForm k="newsletter" title="Envíos automáticos y textos del formulario"
        intro="Cuando se publica (o llega la fecha programada de) un contenido de los tipos activados, se envía un aviso a los suscriptores activos. Cada contenido se avisa una sola vez; los borradores nunca generan correos."
        groups={[
          { title: 'Avisar automáticamente cuando se publique…', fields: [
            { name: 'auto_course', label: 'Un curso nuevo', type: 'checkbox' },
            { name: 'auto_article', label: 'Un artículo nuevo', type: 'checkbox' },
            { name: 'auto_publication', label: 'Una publicación científica nueva', type: 'checkbox' },
          ] },
          { title: 'Textos del formulario de suscripción', fields: [
            { name: 'title', label: 'Título', type: 'text', wide: true },
            { name: 'text', label: 'Texto que explica qué novedades se reciben', type: 'textarea', rows: 2, wide: true },
            { name: 'button', label: 'Texto del botón', type: 'text' },
            { name: 'consent', label: 'Texto de consentimiento (queda registrado con cada suscripción)', type: 'textarea', rows: 2, wide: true },
          ] },
        ]}
        extra={() => (
          <div className="rounded-xl border border-line bg-white p-5">
            <p className="text-sm text-ink-soft">El servidor revisa novedades cada 10 minutos. Si querés, podés procesarlas ahora:</p>
            <button className="btn-outline mt-3" onClick={runNow} disabled={busy}><RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />Procesar avisos pendientes ahora</button>
          </div>
        )}
      />
    </div>
  );
}

const CAMPAIGN_FIELDS: Field[] = [
  { name: 'subject', label: 'Asunto del correo', type: 'text', required: true, wide: true },
  { name: 'preheader', label: 'Texto de vista previa (aparece junto al asunto)', type: 'text', wide: true },
  { name: 'heading', label: 'Título dentro del correo', type: 'text', wide: true },
  { name: 'image_url', label: 'Imagen (opcional)', type: 'image', folder: 'campanias' },
  { name: 'body', label: 'Mensaje', type: 'markdown', rows: 10 },
  { name: 'cta_label', label: 'Texto del botón', type: 'text', placeholder: 'Ver curso' },
  { name: 'cta_url', label: 'Enlace del botón', type: 'url', placeholder: 'https://…' },
];

// @ts-ignore — sección de campañas manuales oculta a pedido; se conserva por si se quiere volver a usar
function Campaigns() {
  const toast = useToast();
  const qc = useQueryClient();
  const { session } = useAuth();
  const [edit, setEdit] = useState<any>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [busy, setBusy] = useState(false);
  const list = useQuery({ queryKey: ['campaigns'], queryFn: async () => (await supabase.from('campaigns').select('*').order('created_at', { ascending: false })).data ?? [] });
  const active = useQuery({ queryKey: ['subs-active-count'], queryFn: async () => (await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active')).count ?? 0 });

  async function save(): Promise<string | null> {
    if (!edit.subject?.trim()) { toast.error('El asunto es obligatorio.'); return null; }
    const { id, created_at: _c, updated_at: _u, ...rest } = edit;
    const q = id ? supabase.from('campaigns').update(rest).eq('id', id).select().single() : supabase.from('campaigns').insert(rest).select().single();
    const { data, error } = await q;
    if (error) { toast.error(error.message); return null; }
    setEdit(data); qc.invalidateQueries({ queryKey: ['campaigns'] });
    return data.id;
  }
  async function send(test: boolean) {
    setConfirmSend(false);
    const id = await save(); if (!id) return;
    setBusy(true);
    try {
      const r = await callFunction<{ message: string }>('admin', { action: 'campaign', id, test }, true);
      toast.ok(r.message);
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      if (!test) setEdit(null);
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  if (edit) {
    const locked = edit.status === 'sent';
    return (
      <div className="space-y-4">
        <button className="link text-sm" onClick={() => setEdit(null)}>← Volver a campañas</button>
        <div className="grid gap-5 rounded-xl border border-line bg-white p-5 md:grid-cols-2">
          {CAMPAIGN_FIELDS.map((f) => <div key={f.name} className={f.wide || ['markdown', 'image'].includes(f.type) ? 'md:col-span-2' : ''}><FieldInput f={f} data={edit} set={(p) => setEdit({ ...edit, ...p })} /></div>)}
        </div>
        {locked ? <p className="rounded-lg bg-mist p-3 text-sm">Esta campaña ya fue enviada a {edit.sent_count} suscriptores.</p> : (
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" disabled={busy} onClick={save}>Guardar borrador</button>
            <button className="btn-outline" disabled={busy} onClick={() => send(true)}>Enviarme una prueba ({session?.user.email})</button>
            <button className="btn-primary" disabled={busy || !active.data} onClick={() => setConfirmSend(true)}><Send className="h-4 w-4" />Enviar a {active.data ?? 0} suscriptores</button>
          </div>
        )}
        <ConfirmDialog open={confirmSend} danger={false} title="¿Enviar la campaña ahora?" text={`Se enviará a ${active.data} suscriptores activos. No se puede deshacer.`} confirmLabel="Enviar" onCancel={() => setConfirmSend(false)} onConfirm={() => send(false)} />
      </div>
    );
  }
  return (
    <div>
      <button className="btn-primary" onClick={() => setEdit({ subject: '', heading: '', body: '' })}><Plus className="h-4 w-4" />Nueva campaña</button>
      <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
        {list.data?.map((c: any) => (
          <li key={c.id} className="flex items-center gap-3 p-3 text-sm">
            <button className="flex-1 text-left font-semibold hover:text-orange-deep" onClick={() => setEdit(c)}>{c.subject}</button>
            <span className="text-xs text-mute">{c.status === 'sent' ? `Enviada ${fmtShort(c.sent_at)} · ${c.sent_count} destinatarios` : c.status === 'failed' || c.status === 'partial' ? `Interrumpida: ${c.error} — abrila y reenviá para continuar` : c.status === 'sending' ? 'Enviando…' : 'Borrador'}</span>
          </li>
        ))}
        {list.data?.length === 0 && <li className="p-8 text-center text-sm text-mute">Todavía no hay campañas.</li>}
      </ul>
    </div>
  );
}

function History() {
  const list = useQuery({ queryKey: ['notifications'], queryFn: async () => (await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)).data ?? [] });
  const T: Record<string, string> = { article: 'Artículo', course: 'Curso', publication: 'Publicación' };
  const S: Record<string, string> = { sent: 'Enviado', sending: 'Pendiente', partial: 'Interrumpido (se reintentará)', failed: 'Error', skipped: 'No enviado' };
  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
      {list.data?.map((n: any) => (
        <li key={n.id} className="flex flex-wrap items-center gap-3 p-3">
          <span className="chip">{T[n.content_type]}</span><span className="flex-1 font-semibold">{n.title}</span>
          <span className={`text-xs font-bold ${n.status === 'failed' ? 'text-red-700' : 'text-mute'}`}>{S[n.status]}{n.status === 'sent' ? ` a ${n.sent_count}` : ''}{n.error ? ` — ${n.error}` : ''}</span>
          <span className="text-xs text-mute">{fmtShort(n.created_at)}</span>
        </li>
      ))}
      {list.data?.length === 0 && <li className="p-8 text-center text-mute">Todavía no se enviaron avisos automáticos.</li>}
    </ul>
  );
}

export default function NewsletterAdmin() {
  const [tab, setTab] = useState<'subs' | 'hist'>('subs');
  const tabs = [['subs', 'Suscriptores'], ['hist', 'Historial de avisos']] as const;
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Newsletter y suscriptores</h1>
      <div className="mt-4"><MailStatusBox /></div>
      <div className="mt-4 rounded-xl border border-line bg-white p-5 text-sm text-ink-soft">
        <p className="font-bold text-ink">¿Cómo funcionan los avisos?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Cuando publicás un <strong>curso</strong>, el aviso les llega a <strong>todos</strong> los suscriptores.</li>
          <li>Cuando publicás un <strong>artículo</strong> o una <strong>publicación</strong>, les llega solo a quienes lo pidieron: los que se anotaron en Artículos de interés o en el pie de página. Quienes se anotan en Nuestros cursos reciben solo los cursos.</li>
          <li>Cada contenido se avisa una sola vez y los borradores nunca generan correos.</li>
        </ul>
      </div>
      <div className="my-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
        {tabs.map(([k, l]) => <button key={k} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-ink text-white' : 'text-ink-soft hover:bg-mist'}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'subs' && <Subscribers />}
      {tab === 'hist' && <History />}
    </div>
  );
}

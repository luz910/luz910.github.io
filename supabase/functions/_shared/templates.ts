// Plantillas de correo con la identidad de BIOQUNS (HTML compatible con clientes de correo).

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Markdown muy básico → HTML seguro para correos (párrafos, negritas, cursivas, enlaces, listas). */
export function mdToHtml(md = '') {
  const inline = (t: string) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" style="color:#b9501a">$1</a>');
  return md.trim().split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return `<ul style="margin:0 0 16px;padding-left:20px">${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`;
    if (/^#{1,3}\s/.test(block)) return `<h3 style="margin:20px 0 8px;font-size:18px;color:#24272b">${inline(block.replace(/^#{1,3}\s/, ''))}</h3>`;
    return `<p style="margin:0 0 16px">${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}

export function mdToText(md = '') {
  return md.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').replace(/[*_#>]/g, '').trim();
}

interface Layout {
  site: string;
  preheader?: string;
  kicker?: string;
  heading: string;
  imageUrl?: string | null;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** HTML opcional debajo del botón (por ejemplo, un enlace secundario) */
  afterCtaHtml?: string;
  footerNote: string;
  unsubscribeUrl?: string;
}

export function layout(o: Layout) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet"><title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f3;font-family:Arial,Helvetica,sans-serif;color:#4a5057">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader ?? '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f3;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e6e8;border-top:4px solid #e86a2a">
${o.imageUrl ? `<tr><td style="padding:24px 32px 0"><img src="${esc(o.imageUrl)}" alt="" width="536" style="display:block;width:100%;height:auto;border-radius:12px;border:0"></td></tr>` : ''}
<tr><td style="padding:28px 32px 8px">
${o.kicker ? `<p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#b9501a">${esc(o.kicker)}</p>` : ''}
<h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;font-weight:800;color:#24272b">${esc(o.heading)}</h1>
<div style="font-size:16px;line-height:1.6">${o.bodyHtml}</div>
${o.ctaUrl && o.ctaLabel ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:#e86a2a"><a href="${esc(o.ctaUrl)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">${esc(o.ctaLabel)}</a></td></tr></table>` : ''}
${o.afterCtaHtml ?? ''}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #e3e6e8;font-size:12px;line-height:1.5;color:#6b727a">
${esc(o.footerNote)}
${o.unsubscribeUrl ? `<br><a href="${o.unsubscribeUrl}" style="color:#6b727a">Cancelar suscripción</a>` : ''}
</td></tr></table></td></tr></table></body></html>`;
}

/* ------------------------------------------------------- mail de curso nuevo */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function fecha(d?: string | null) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d ?? '');
  return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : '';
}
const limpio = (t = '') => t.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_#>`]/g, '').replace(/\s+/g, ' ').trim();
export function courseEmail(c: any, site: string, link: string, unsubscribeUrl: string) {
  const presentacion = (c.description ?? '').trim();
  const duracion = [c.duration, c.workload ? (c.duration ? `(${c.workload})` : c.workload) : ''].filter(Boolean).join(' ');
  const datos: [string, string, string][] = ([
    ['📅', 'Inicio', fecha(c.start_date)],
    ['💻', 'Modalidad', c.modality ?? ''],
    ['⏳', 'Duración', duracion],
  ] as [string, string, string][]).filter(([, , v]) => v);
  const P = (h: string) => `<p style="margin:0 0 16px">${h}</p>`;
  const inscribirse = c.cta_url && c.enrollment_status !== 'closed';
  const body =
    P('En BioqUNS seguimos generando espacios de aprendizaje y actualización profesional.') +
    P('Te invitamos a conocer nuestro nuevo curso:') +
    `<p style="margin:0 0 16px;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:20px;line-height:1.3;font-weight:800;color:#b9501a">${esc(c.title)}</p>` +
    P('Una propuesta de formación pensada para ampliar tus conocimientos y brindarte herramientas que puedas aplicar en tu práctica profesional.') +
    (presentacion ? `<p style="margin:0 0 8px;font-weight:bold;color:#24272b">📚 ¿Qué vas a encontrar en este curso?</p>${mdToHtml(presentacion)}` : '') +
    (datos.length ? `<p style="margin:0 0 16px">${datos.map(([e, k, v]) => `${e} <strong style="color:#24272b">${k}:</strong> ${esc(v)}`).join('<br>')}</p>` : '') +
    P('<strong style="color:#24272b">¡Sumate a esta nueva experiencia de aprendizaje!</strong>');
  const html = layout({
    site, preheader: `Te invitamos a conocer nuestro nuevo curso: ${c.title}`, kicker: 'Nuevo curso',
    heading: '¡Tenemos una nueva propuesta de formación para vos!', bodyHtml: body,
    ctaLabel: inscribirse ? '👉 Inscribite acá' : 'Ver el curso', ctaUrl: inscribirse ? c.cta_url : link,
    afterCtaHtml: `${inscribirse ? `<p style="margin:0 0 16px;font-size:14px"><a href="${esc(link)}" style="color:#b9501a">Ver toda la información del curso</a></p>` : ''}<p style="margin:0 0 8px">Te esperamos para seguir aprendiendo y creciendo juntos.</p>`,
    footerNote: 'Recibís este correo porque te suscribiste a las novedades de BIOQUNS.', unsubscribeUrl,
  });
  const text = ['¡Tenemos una nueva propuesta de formación para vos!', '', 'En BioqUNS seguimos generando espacios de aprendizaje y actualización profesional.', 'Te invitamos a conocer nuestro nuevo curso:', '', c.title, '',
    'Una propuesta de formación pensada para ampliar tus conocimientos y brindarte herramientas que puedas aplicar en tu práctica profesional.', '',
    ...(presentacion ? ['¿Qué vas a encontrar en este curso?', mdToText(presentacion), ''] : []),
    ...datos.map(([, k, v]) => `${k}: ${v}`), '', '¡Sumate a esta nueva experiencia de aprendizaje!',
    inscribirse ? `Inscribite acá: ${c.cta_url}` : '', `Más información: ${link}`, '', 'Te esperamos para seguir aprendiendo y creciendo juntos.', '', `Cancelar suscripción: ${unsubscribeUrl}`].join('\n');
  return { subject: '¡Nuevo curso en BioqUNS! 🎓', html, text };
}

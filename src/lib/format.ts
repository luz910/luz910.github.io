const dateFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });
const shortFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });

/** Fechas tipo "2026-10-21" (sin hora) se interpretan como día local, no UTC. */
function parse(d: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00-03:00') : new Date(d);
}
export const fmtDate = (d?: string | null) => (d ? dateFmt.format(parse(d)) : '');
export const fmtShort = (d?: string | null) => (d ? shortFmt.format(parse(d)) : '');
export function fmtRange(a?: string | null, b?: string | null) {
  if (!a) return fmtDate(b);
  if (!b || a === b) return fmtDate(a);
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}

export function slugify(s: string) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 90).replace(/-+$/g, '');
}

export function plainText(md?: string | null, max = 180) {
  if (!md) return '';
  const t = md.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

export const doiUrl = (doi?: string | null) =>
  !doi ? '' : doi.startsWith('http') ? doi : `https://doi.org/${doi.replace(/^doi:\s*/i, '')}`;

export const ENROLLMENT_LABEL = { open: 'Inscripciones abiertas', soon: 'Próximamente', closed: 'Finalizado' } as const;

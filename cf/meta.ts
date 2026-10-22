// Cloudflare Pages Functions: inserta título, descripción, imagen y datos estructurados en el HTML
// de las páginas de artículos, cursos y publicaciones, para buscadores y vistas previas en redes sociales
// (WhatsApp, LinkedIn, Facebook no ejecutan JavaScript).

export interface Env { VITE_SUPABASE_URL: string; VITE_SUPABASE_ANON_KEY: string; ASSETS: Fetcher }

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (md = '', max = 170) => {
  const t = md.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*_`~|-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
};

export async function rest(env: Env, path: string) {
  const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` },
    cf: { cacheTtl: 300 },
  } as RequestInit);
  if (!r.ok) return [];
  return (await r.json()) as any[];
}

export const publicFilter = () => `status=eq.published&published_at=lte.${encodeURIComponent(new Date().toISOString())}`;

export async function siteOrigin(env: Env, req: Request) {
  const rows = await rest(env, 'settings?key=eq.general&select=value');
  return (rows[0]?.value?.site_url || new URL(req.url).origin).replace(/\/$/, '');
}

interface Meta { title: string; description: string; image?: string | null; type: string; jsonLd: Record<string, unknown> }

export async function withMeta(ctx: EventContext<Env, string, unknown>, table: string, build: (row: any, origin: string) => Meta) {
  const res = await ctx.next();
  const slug = String(ctx.params.slug ?? '');
  if (!/^[a-z0-9-]+$/.test(slug) || !ctx.env.VITE_SUPABASE_URL || !(res.headers.get('content-type') ?? '').includes('text/html')) return res;
  try {
    const [rows, origin] = await Promise.all([rest(ctx.env, `${table}?slug=eq.${slug}&${publicFilter()}&select=*`), siteOrigin(ctx.env, ctx.request)]);
    const row = rows[0];
    if (!row) return res;
    const m = build(row, origin);
    const url = `${origin}${new URL(ctx.request.url).pathname}`;
    const img = m.image ? (m.image.startsWith('http') ? m.image : origin + m.image) : `${origin}/brand/og-default.jpg`;
    const desc = plain(m.description);
    const tags = `
<link rel="canonical" href="${esc(url)}" />
<meta name="description" content="${esc(desc)}" />
<meta property="og:type" content="${m.type}" /><meta property="og:site_name" content="BIOQUNS" />
<meta property="og:title" content="${esc(m.title)}" /><meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${esc(url)}" /><meta property="og:image" content="${esc(img)}" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...m.jsonLd }).replace(/</g, '\\u003c')}</script>`;
    return new HTMLRewriter()
      .on('title', { element: (e) => { e.setInnerContent(`${m.title} | BIOQUNS`); } })
      .on('meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]', { element: (e) => { e.remove(); } })
      .on('head', { element: (e) => { e.append(tags, { html: true }); } })
      .transform(res);
  } catch {
    return res;
  }
}

export { plain };

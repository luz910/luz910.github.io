// Se ejecuta en GitHub después de "npm run build".
// GitHub Pages no tiene servidor, así que acá se preparan de antemano:
//   • una copia de la página por cada dirección (artículos, cursos, etc.), con su título,
//     descripción e imagen, para que Google las encuentre y WhatsApp/Facebook muestren la vista previa;
//   • sitemap.xml (la lista de páginas para Google) y robots.txt.
// Si Supabase no responde, el sitio se publica igual (solo sin estas mejoras).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const DIST = 'dist';
const URL_BASE = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ORIGIN = (process.env.SITE_URL || 'https://bioquns.com.ar').replace(/\/$/, '');

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (md = '', max = 170) => {
  const t = String(md).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*_`~|-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
};
const people = (s) => (s ? String(s).split(/[,;]/).map((n) => ({ '@type': 'Person', name: n.trim() })).filter((p) => p.name) : undefined);

async function rest(path) {
  if (!URL_BASE || !KEY) return [];
  try {
    const r = await fetch(`${URL_BASE}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) { console.warn('Supabase', r.status, path); return []; }
    return await r.json();
  } catch (e) { console.warn('Supabase sin respuesta:', e.message); return []; }
}
const published = `status=eq.published&published_at=lte.${encodeURIComponent(new Date().toISOString())}`;

const base = await readFile(join(DIST, 'index.html'), 'utf8');

/** Escribe la página con sus datos para buscadores y redes. */
async function page(path, m) {
  const url = ORIGIN + path;
  let html = base;
  if (m) {
    const img = m.image ? (m.image.startsWith('http') ? m.image : ORIGIN + m.image) : `${ORIGIN}/brand/og-default.jpg`;
    const desc = plain(m.description || '');
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)} | BIOQUNS</title>`)
      .replace(/\s*<meta (name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/g, '')
      .replace('</head>', `    <meta name="description" content="${esc(desc)}" />
    <meta property="og:type" content="${m.type || 'website'}" /><meta property="og:site_name" content="BIOQUNS" />
    <meta property="og:title" content="${esc(m.title)}" /><meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${esc(url)}" /><meta property="og:image" content="${esc(img)}" />
    <meta name="twitter:card" content="summary_large_image" />
    ${m.jsonLd ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...m.jsonLd }).replace(/</g, '\\u003c')}</script>` : ''}
  </head>`);
  }
  html = html.replace('</head>', `    <link rel="canonical" href="${esc(url)}" />\n  </head>`);
  // Se guarda como "ruta.html" y también "ruta/index.html": GitHub Pages abre cualquiera de las dos.
  for (const file of [join(DIST, path + '.html'), join(DIST, path, 'index.html')]) {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
}

const statics = [
  ['/articulos', 'Artículos de interés'], ['/cursos', 'Nuestros cursos'], ['/publicaciones', 'Publicaciones'],
  ['/congresos', 'Actividades científicas y académicas'], ['/congresos/posteres', 'Pósteres'], ['/congresos/galeria', 'Galería'],
  ['/quienes-somos', 'Quiénes somos'], ['/privacidad', 'Aviso de privacidad'],
];
const urls = [`${ORIGIN}/`];
for (const [p, title] of statics) {
  await page(p, { title, description: 'BIOQUNS: bioquímica, docencia y actualización profesional.' });
  if (p !== '/privacidad') urls.push(ORIGIN + p);
}

const sets = [
  ['articles', '/articulos', (a) => ({
    title: a.seo_title || a.title, description: a.seo_description || a.excerpt || plain(a.summary || a.body || ''), image: a.cover_url, type: 'article',
    jsonLd: { '@type': 'Article', headline: a.title, image: a.cover_url || undefined, datePublished: a.published_at, dateModified: a.updated_at, author: people(a.authors), publisher: { '@type': 'Organization', name: 'BIOQUNS' } },
  })],
  ['courses', '/cursos', (c) => ({
    title: c.seo_title || c.title, description: c.seo_description || c.short_description || plain(c.description || ''), image: c.cover_url,
    jsonLd: { '@type': 'Course', name: c.title, description: c.short_description || plain(c.description || '', 300) || c.title, provider: { '@type': 'Organization', name: c.institution || 'BIOQUNS' } },
  })],
  ['publications', '/publicaciones', (p) => ({
    title: p.seo_title || p.title, description: p.seo_description || plain(p.abstract || '') || [p.authors, p.source, p.year].filter(Boolean).join(' · '), image: p.thumbnail_url, type: 'article',
    jsonLd: { '@type': 'ScholarlyArticle', headline: p.title, author: people(p.authors), datePublished: p.year ? String(p.year) : undefined },
  })],
  ['congresses', '/congresos', (c) => ({ title: c.name || c.title, description: c.cover_alt || plain(c.description || '') })],
  ['posters', '/congresos/posteres', (p) => ({ title: p.title, description: p.authors ? `Autores: ${p.authors}` : 'Póster presentado', image: p.thumbnail_url })],
];
let n = 0;
for (const [table, prefix, build] of sets) {
  const rows = await rest(`${table}?${published}&select=*&limit=5000`);
  for (const r of rows) {
    if (!/^[a-z0-9-]+$/.test(r.slug ?? '')) continue;
    await page(`${prefix}/${r.slug}`, build(r));
    urls.push(`${ORIGIN}${prefix}/${r.slug}`);
    n++;
  }
}

await writeFile(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /editores\nDisallow: /admin\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
console.log(`SEO: ${urls.length} direcciones en el sitemap (${n} contenidos).`);

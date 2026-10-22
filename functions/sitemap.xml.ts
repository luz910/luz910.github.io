import { rest, publicFilter, siteOrigin, type Env } from '../cf/meta';

// Sitemap generado en el momento a partir del contenido publicado.
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const origin = await siteOrigin(env, request);
  const statics = ['', '/articulos', '/cursos', '/publicaciones', '/congresos', '/congresos/disertaciones', '/congresos/posteres', '/congresos/galeria', '/quienes-somos'];
  const sets: [string, string][] = [['articles', 'articulos'], ['courses', 'cursos'], ['publications', 'publicaciones'], ['congresses', 'congresos'], ['talks', 'congresos/disertaciones'], ['posters', 'congresos/posteres']];
  const urls = statics.map((p) => `<url><loc>${origin}${p}</loc></url>`);
  const lists = await Promise.all(sets.map(([t]) => rest(env, `${t}?${publicFilter()}&select=slug,updated_at&limit=5000`)));
  lists.forEach((rows, i) => rows.forEach((r) => urls.push(`<url><loc>${origin}/${sets[i][1]}/${r.slug}</loc><lastmod>${String(r.updated_at).slice(0, 10)}</lastmod></url>`)));
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};

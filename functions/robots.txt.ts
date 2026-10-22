import { siteOrigin, type Env } from '../cf/meta';
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const origin = await siteOrigin(env, request).catch(() => new URL(request.url).origin);
  return new Response(`User-agent: *\nAllow: /\nDisallow: /editores\nDisallow: /admin\n\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

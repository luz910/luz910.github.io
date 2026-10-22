import { withMeta, plain, type Env } from '../../cf/meta';
export const onRequestGet: PagesFunction<Env> = (ctx) => withMeta(ctx, 'articles', (a) => ({
  title: a.seo_title || a.title,
  description: a.seo_description || a.excerpt || plain(a.summary || a.body || ''),
  image: a.cover_url, type: 'article',
  jsonLd: { '@type': 'Article', headline: a.title, image: a.cover_url || undefined, datePublished: a.published_at, dateModified: a.updated_at, author: a.authors ? String(a.authors).split(/[,;]/).map((n: string) => ({ '@type': 'Person', name: n.trim() })) : undefined, publisher: { '@type': 'Organization', name: 'BIOQUNS' } },
}));

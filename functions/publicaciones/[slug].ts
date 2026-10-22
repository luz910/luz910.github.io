import { withMeta, plain, type Env } from '../../cf/meta';
export const onRequestGet: PagesFunction<Env> = (ctx) => withMeta(ctx, 'publications', (p) => ({
  title: p.seo_title || p.title,
  description: p.seo_description || plain(p.abstract || '') || [p.authors, p.source, p.year].filter(Boolean).join(' · '),
  image: p.thumbnail_url, type: 'article',
  jsonLd: { '@type': 'ScholarlyArticle', headline: p.title, author: p.authors ? String(p.authors).split(/[,;]/).map((n: string) => ({ '@type': 'Person', name: n.trim() })) : undefined, datePublished: p.year ? String(p.year) : undefined },
}));

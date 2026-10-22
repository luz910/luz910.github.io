import { withMeta, plain, type Env } from '../../cf/meta';
export const onRequestGet: PagesFunction<Env> = (ctx) => withMeta(ctx, 'courses', (c) => ({
  title: c.seo_title || c.title,
  description: c.seo_description || c.short_description || plain(c.description || ''),
  image: c.cover_url, type: 'website',
  jsonLd: { '@type': 'Course', name: c.title, description: c.short_description || plain(c.description || '', 300) || c.title, provider: { '@type': 'Organization', name: c.institution || 'BIOQUNS' }, ...(c.start_date ? { hasCourseInstance: { '@type': 'CourseInstance', courseMode: c.modality || undefined, startDate: c.start_date, endDate: c.end_date || undefined } } : {}) },
}));

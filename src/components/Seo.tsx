import { useLocation } from 'react-router-dom';
import { useSettings } from '../lib/settings';

interface Props {
  title?: string;
  description?: string | null;
  image?: string | null;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | null;
  noindex?: boolean;
}

/** Título, descripción, URL canónica, metadatos para redes y datos estructurados. */
export function Seo({ title, description, image, type = 'website', jsonLd, noindex }: Props) {
  const { settings } = useSettings();
  const { pathname } = useLocation();
  const origin = (settings.general.site_url || window.location.origin).replace(/\/$/, '');
  const url = origin + pathname;
  const full = title ? `${title} | BIOQUNS` : `BIOQUNS — ${settings.general.tagline}`;
  const desc = description || settings.general.default_seo_description;
  const img = image ? (image.startsWith('http') ? image : origin + image) : origin + '/brand/og-default.jpg';
  return (
    <>
      <title>{full}</title>
      {desc && <meta name="description" content={desc} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={full} />
      {desc && <meta property="og:description" content={desc} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify({ '@context': 'https://schema.org', ...jsonLd })}</script>}
    </>
  );
}

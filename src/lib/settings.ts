import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export interface HomeSection { id: string; visible: boolean }
export interface SiteSettings {
  general: { site_name: string; site_url: string; tagline: string; default_seo_description: string };
  home: {
    hero_kicker: string; hero_title: string; hero_text: string; hero_image_url: string;
    hero_primary_label: string; hero_primary_url: string; hero_secondary_label: string; hero_secondary_url: string;
    about_title: string; about_text: string; about_link_label: string;
    courses_cta_title: string; courses_cta_text: string; courses_cta_label: string; courses_cta_url: string;
    sections: HomeSection[];
  };
  about: { title: string; intro: string; mission_title: string; mission: string; team_title: string };
  footer: {
    description: string; email: string; phone: string; address: string;
    instagram: string; linkedin: string; facebook: string; youtube: string;
    website_links: { label: string; url: string }[]; privacy_text: string;
  };
  logos: Record<string, { label: string; url: string }>;
  newsletter: {
    title: string; text: string; button: string; consent: string;
    auto_article: boolean; auto_course: boolean; auto_publication: boolean; auto_since?: string;
  };
}

export const DEFAULT_SETTINGS: SiteSettings = {
  general: { site_name: 'BIOQUNS', site_url: '', tagline: 'Bioquímica, docencia y actualización profesional', default_seo_description: '' },
  home: {
    hero_kicker: 'Bioquímica · Docencia · Ciencia', hero_title: 'Impulsá tu crecimiento profesional.', hero_text: 'Bioquns es un espacio dedicado a la educación a distancia, para profesionales que desean mantenerse actualizados en el ámbito bioquímico y de la salud.', hero_image_url: '',
    hero_primary_label: 'Ver cursos', hero_primary_url: '/cursos', hero_secondary_label: 'Explorar artículos', hero_secondary_url: '/articulos',
    about_title: 'Qué es BIOQUNS', about_text: '', about_link_label: 'Conocé quiénes somos',
    courses_cta_title: '¿Querés actualizar tu formación?', courses_cta_text: '', courses_cta_label: 'Ver cursos', courses_cta_url: '/cursos',
    sections: ['cursos', 'articulos', 'presentacion', 'publicaciones', 'cta_cursos', 'newsletter'].map((id) => ({ id, visible: true })),
  },
  about: { title: 'Quiénes somos', intro: '', mission_title: 'Propósito', mission: '', team_title: 'Responsables' },
  footer: {
    description: '', email: '', phone: '', address: '', instagram: '', linkedin: '', facebook: '', youtube: '',
    website_links: [], privacy_text: '',
  },
  logos: {
    uns: { label: 'Universidad Nacional del Sur', url: '/logos/uns.png' },
    bioquns: { label: 'BIOQUNS', url: '/brand/simbolo-adn.png' },
    dirEaD: { label: 'DirEaD', url: '/logos/dirEaD.png' },
  },
  newsletter: {
    title: 'Recibí novedades de BIOQUNS',
    text: 'Sé un profesional actualizado. Recibí novedades del ámbito bioquímico, contenidos de interés profesional y todas las novedades sobre nuestros próximos cursos y actividades de formación.',
    button: 'Suscribirme', consent: 'Acepto recibir correos de BIOQUNS con novedades. Puedo darme de baja en cualquier momento.',
    auto_article: true, auto_course: true, auto_publication: false,
  },
};

export type SettingsKey = keyof SiteSettings;

export async function fetchSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from('settings').select('key,value');
  if (error) throw error;
  const out: any = structuredClone(DEFAULT_SETTINGS);
  for (const row of data ?? []) {
    if (row.key in out) out[row.key] = { ...out[row.key], ...(row.value as object) };
  }
  return out as SiteSettings;
}

export function useSettings() {
  const q = useQuery({ queryKey: ['settings'], queryFn: fetchSettings, staleTime: 60_000 });
  return { settings: q.data ?? DEFAULT_SETTINGS, loading: q.isLoading, error: q.error };
}

export async function saveSetting<K extends SettingsKey>(key: K, value: SiteSettings[K]) {
  const { error } = await supabase.from('settings').upsert({ key, value });
  if (error) throw error;
}

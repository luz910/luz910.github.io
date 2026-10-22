import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export const PAGE_SIZE = 12;
export type Table = 'articles' | 'courses' | 'publications' | 'congresses' | 'talks' | 'posters' | 'gallery_photos' | 'members';

export interface ListOptions {
  search?: string;
  searchCols?: string[];
  eq?: Record<string, string | number | boolean | null | undefined>;
  order?: { col: string; asc?: boolean }[];
  limit?: number;
  featured?: boolean;
  select?: string;
}

/** Limpia el texto de búsqueda para usarlo de forma segura dentro de un filtro .or() */
const cleanSearch = (s: string) => s.replace(/[%,()*\\:."']/g, ' ').trim();

function build(table: Table, o: ListOptions) {
  let q = supabase.from(table).select(o.select ?? '*', { count: 'exact' })
    .eq('status', 'published').lte('published_at', new Date().toISOString());
  for (const [k, v] of Object.entries(o.eq ?? {})) if (v !== undefined && v !== '' && v !== null) q = q.eq(k, v);
  if (o.featured) q = q.eq('featured', true);
  const s = o.search ? cleanSearch(o.search) : '';
  if (s && o.searchCols?.length) q = q.or(o.searchCols.map((c) => `${c}.ilike.%${s}%`).join(','));
  for (const ord of o.order ?? [{ col: 'published_at', asc: false }]) q = q.order(ord.col, { ascending: !!ord.asc, nullsFirst: false });
  return q;
}

/** Lista pública paginada con "Cargar más" (carga progresiva). */
export function usePublicInfinite<T>(table: Table, o: ListOptions) {
  return useInfiniteQuery({
    queryKey: ['public', table, o],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam * PAGE_SIZE;
      const { data, error, count } = await build(table, o).range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: (data ?? []) as T[], count: count ?? 0, page: pageParam };
    },
    getNextPageParam: (last) => ((last.page + 1) * PAGE_SIZE < last.count ? last.page + 1 : undefined),
  });
}

export function usePublicList<T>(table: Table, o: ListOptions) {
  return useQuery({
    queryKey: ['public-list', table, o],
    queryFn: async () => {
      const { data, error } = await build(table, o).limit(o.limit ?? 100);
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

/** Un contenido por su dirección. Con preview=true (solo editores) muestra borradores. */
export function usePublicItem<T>(table: Table, slug: string | undefined, preview = false) {
  return useQuery({
    queryKey: ['item', table, slug, preview],
    enabled: !!slug,
    queryFn: async () => {
      let q = supabase.from(table).select('*').eq('slug', slug!);
      if (!preview) q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data as T | null;
    },
  });
}

/** Valores distintos de una columna (para armar filtros de categorías, años, etc.). */
export function useDistinct(table: Table, col: string) {
  return useQuery({
    queryKey: ['distinct', table, col],
    queryFn: async () => {
      const { data, error } = await build(table, { select: col, order: [{ col, asc: true }] }).limit(1000);
      if (error) throw error;
      const vals = new Set<string>();
      for (const r of (data ?? []) as any[]) if (r[col] !== null && r[col] !== '') vals.add(String(r[col]));
      return [...vals];
    },
    staleTime: 5 * 60_000,
  });
}

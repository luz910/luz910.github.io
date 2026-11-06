export type Status = 'draft' | 'published' | 'archived';

export interface Base {
  id: string;
  status: Status;
  published_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FileRef { name: string; url: string }
export interface LinkRef { label: string; url: string }
export interface Teacher { name: string; bio?: string; photo_url?: string; coordinator?: boolean; text?: boolean }

export interface Article extends Base {
  slug: string; title: string; excerpt: string | null; summary: string | null; body: string | null;
  cover_url: string | null; cover_alt: string | null; authors: string | null; category: string | null;
  tags: string[]; source: string | null; doi: string | null; external_url: string | null;
  references_md: string | null; featured: boolean; seo_title: string | null; seo_description: string | null;
}

export type EnrollmentStatus = 'open' | 'soon' | 'closed';
export interface Course extends Base {
  slug: string; title: string; institution: string | null; short_description: string | null;
  cover_url: string | null; cover_alt: string | null; logos: string[]; duration: string | null;
  workload: string | null; modality: string | null; level: string | null; enrollment_status: EnrollmentStatus;
  description: string | null; objectives: string | null; audience: string | null; program: string | null;
  teachers: Teacher[]; requirements: string | null; start_date: string | null; end_date: string | null;
  price: string | null; certification: string | null; cta_label: string | null;
  cta_type: 'external' | 'email' | 'whatsapp' | 'internal'; cta_url: string | null; contact: string | null;
  featured: boolean; seo_title: string | null; seo_description: string | null;
}

export interface Publication extends Base {
  slug: string; title: string; authors: string | null; year: number | null; pub_type: string | null;
  topic: string | null; source: string | null; abstract: string | null; thumbnail_url: string | null;
  thumbnail_alt: string | null; doi: string | null; external_url: string | null; files: FileRef[];
  featured: boolean; seo_title: string | null; seo_description: string | null;
}

export interface Congress extends Base {
  slug: string; name: string; organizer: string | null; location: string | null; start_date: string | null;
  end_date: string | null; participation_type: string | null; members: string | null; description: string | null;
  works: string | null; cover_url: string | null; cover_alt: string | null;
}

export interface Talk extends Base {
  slug: string; title: string; speaker: string | null; congress_id: string | null; event_name: string | null;
  date: string | null; location: string | null; summary: string | null; topics: string[];
  photo_url: string | null; photo_alt: string | null; links: LinkRef[]; files: FileRef[];
}

export interface Poster extends Base {
  slug: string; title: string; authors: string | null; congress_id: string | null; event_name: string | null;
  year: number | null; description: string | null; pdf_url: string | null; thumbnail_url: string | null;
}

export interface Photo extends Base {
  image_url: string; title: string | null; description: string | null; alt: string | null;
  congress_id: string | null; event_label: string | null; year: number | null;
}

export interface Member extends Base {
  slug: string; name: string; role: string | null; photo_url: string | null; photo_alt: string | null;
  bio: string | null; career: string | null; education: string | null; specialties: string[];
  activities: string | null; highlights: string | null; is_leader: boolean;
}

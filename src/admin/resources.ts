import type { Field } from './fields';
import type { Table } from '../lib/api';

export interface Resource {
  key: string;
  table: Table;
  label: string;        // plural, para el menú
  singular: string;     // "artículo", "curso"…
  female?: boolean;     // para "nueva"/"nuevo"
  titleField: string;
  dateField?: string;   // columna de fecha para mostrar en la lista
  subtitle?: (r: any) => string;
  publicPath?: (r: any) => string;
  featured?: boolean;
  duplicate?: boolean;
  slugFrom?: string;    // genera la dirección desde este campo
  searchCols: string[];
  order: { col: string; asc?: boolean }[];
  fields: Field[];
  notifies?: 'article' | 'course' | 'publication';
}

const seo: Field[] = [
  { name: 'seo_title', label: 'Título para buscadores (opcional)', type: 'text', section: 'SEO y redes sociales', help: 'Si queda vacío se usa el título. Ideal: hasta 60 caracteres.' },
  { name: 'seo_description', label: 'Descripción para buscadores (opcional)', type: 'textarea', rows: 2, section: 'SEO y redes sociales', help: 'Aparece en Google y al compartir en redes. Ideal: 140–160 caracteres.' },
];

const STATUS_LEVELS = ['Introductorio', 'Intermedio', 'Avanzado'].map((v) => ({ value: v, label: v }));

export const RESOURCES: Resource[] = [
  {
    key: 'articulos', table: 'articles', label: 'Artículos', singular: 'artículo', titleField: 'title', dateField: 'published_at',
    subtitle: (r) => r.category ?? '', publicPath: (r) => `/articulos/${r.slug}`, featured: true, slugFrom: 'title',
    searchCols: ['title', 'authors', 'category'], order: [{ col: 'sort_order', asc: true }, { col: 'published_at' }], notifies: 'article',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, wide: true, section: 'Contenido' },
      { name: 'excerpt', label: 'Descripción breve para la tarjeta', type: 'textarea', rows: 2, wide: true, section: 'Contenido' },
      { name: 'category', label: 'Categoría o temática', type: 'text', section: 'Contenido', placeholder: 'Ej.: Hematología' },
      { name: 'authors', label: 'Autores', type: 'text', section: 'Contenido', placeholder: 'Separados por coma' },
      { name: 'cover_url', label: 'Imagen de portada', type: 'image', altField: 'cover_alt', folder: 'articulos', wide: true, section: 'Contenido' },
      { name: 'summary', label: 'Resumen', type: 'markdown', rows: 5, wide: true, section: 'Contenido' },
      { name: 'body', label: 'Desarrollo del artículo', type: 'markdown', rows: 18, wide: true, section: 'Contenido' },
      { name: 'references_md', label: 'Referencias bibliográficas', type: 'markdown', rows: 6, wide: true, section: 'Contenido' },
      { name: 'source', label: 'Revista o fuente', type: 'text', section: 'Fuente' },
      { name: 'doi', label: 'DOI', type: 'text', section: 'Fuente', placeholder: '10.1000/xyz123' },
      { name: 'external_url', label: 'Enlace al artículo original', type: 'url', wide: true, section: 'Fuente', placeholder: 'https://…' },
      { name: 'tags', label: 'Palabras clave', type: 'tags', wide: true, section: 'Fuente' },
      ...seo,
    ],
  },
  {
    key: 'cursos', table: 'courses', label: 'Cursos', singular: 'curso', titleField: 'title', dateField: 'start_date',
    subtitle: (r) => ({ open: 'Inscripciones abiertas', soon: 'Próximamente', closed: 'Finalizado' } as any)[r.enrollment_status] ?? '',
    publicPath: (r) => `/cursos/${r.slug}`, featured: true, duplicate: true, slugFrom: 'title',
    searchCols: ['title', 'institution'], order: [{ col: 'sort_order', asc: true }, { col: 'created_at' }], notifies: 'course',
    fields: [
      { name: 'title', label: 'Título del curso', type: 'text', required: true, wide: true, section: 'Tarjeta del curso' },
      { name: 'institution', label: 'Institución organizadora', type: 'text', section: 'Tarjeta del curso', placeholder: 'Ej.: Universidad Nacional del Sur' },
      { name: 'enrollment_status', label: 'Estado de inscripción', type: 'select', required: true, section: 'Tarjeta del curso', options: [{ value: 'open', label: 'Inscripciones abiertas' }, { value: 'soon', label: 'Próximamente' }, { value: 'closed', label: 'Finalizado' }] },
      { name: 'cover_url', label: 'Imagen o banner del curso', type: 'image', altField: 'cover_alt', folder: 'cursos', wide: true, section: 'Tarjeta del curso' },
      { name: 'logos', label: 'Logos institucionales en la tarjeta', type: 'logos', wide: true, section: 'Tarjeta del curso', help: 'Los logos se reemplazan desde Configuración general → Logos.' },
      { name: 'duration', label: 'Duración estimada', type: 'text', section: 'Tarjeta del curso', placeholder: 'Ej.: 6 semanas' },
      { name: 'modality', label: 'Modalidad', type: 'text', section: 'Tarjeta del curso', placeholder: 'Ej.: Virtual, Presencial, Híbrida', suggestions: ['Virtual', 'Presencial', 'Híbrida', 'Virtual asincrónica'] },
      { name: 'level', label: 'Nivel', type: 'select', section: 'Tarjeta del curso', options: STATUS_LEVELS },
      { name: 'short_description', label: 'Descripción breve', type: 'textarea', rows: 2, wide: true, section: 'Tarjeta del curso' },
      { name: 'description', label: 'Descripción general', type: 'markdown', rows: 8, wide: true, section: 'Página del curso' },
      { name: 'objectives', label: 'Objetivos', type: 'markdown', rows: 5, wide: true, section: 'Página del curso' },
      { name: 'audience', label: 'Destinatarios', type: 'markdown', rows: 3, wide: true, section: 'Página del curso' },
      { name: 'program', label: 'Programa y contenidos', type: 'markdown', rows: 12, wide: true, section: 'Página del curso' },
      { name: 'teachers', label: 'Docentes y antecedentes', type: 'teachers', wide: true, section: 'Página del curso' },
      { name: 'requirements', label: 'Requisitos', type: 'markdown', rows: 3, wide: true, section: 'Página del curso' },
      { name: 'certification', label: 'Certificación', type: 'markdown', rows: 3, wide: true, section: 'Página del curso' },
      { name: 'start_date', label: 'Fecha de inicio', type: 'date', section: 'Fechas, precio e inscripción' },
      { name: 'end_date', label: 'Fecha de finalización', type: 'date', section: 'Fechas, precio e inscripción' },
      { name: 'workload', label: 'Carga horaria', type: 'text', section: 'Fechas, precio e inscripción', placeholder: 'Ej.: 40 horas' },
      { name: 'price', label: 'Precio / arancel', type: 'text', section: 'Fechas, precio e inscripción', placeholder: 'Ej.: Gratuito, o $ 25.000' },
      { name: 'cta_type', label: 'El botón de inscripción lleva a…', type: 'select', required: true, section: 'Fechas, precio e inscripción', options: [{ value: 'external', label: 'Un formulario o enlace externo' }, { value: 'email', label: 'Un correo electrónico' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'internal', label: 'Una página de este sitio' }] },
      { name: 'cta_url', label: 'Destino del botón', type: 'text', section: 'Fechas, precio e inscripción', help: 'Enlace (https://…), correo, número de WhatsApp con código de país (549291…) o ruta interna (/quienes-somos).' },
      { name: 'cta_label', label: 'Texto del botón (opcional)', type: 'text', section: 'Fechas, precio e inscripción', placeholder: 'Inscribirme / Consultar por el curso' },
      { name: 'contact', label: 'Información de contacto', type: 'markdown', rows: 3, wide: true, section: 'Fechas, precio e inscripción' },
      ...seo,
    ],
  },
  {
    key: 'publicaciones', table: 'publications', label: 'Publicaciones', singular: 'publicación', female: true, titleField: 'title', dateField: 'year',
    subtitle: (r) => [r.pub_type, r.source].filter(Boolean).join(' · '), publicPath: (r) => `/publicaciones/${r.slug}`, featured: true, slugFrom: 'title',
    searchCols: ['title', 'authors', 'source'], order: [{ col: 'year' }, { col: 'sort_order', asc: true }], notifies: 'publication',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, wide: true, section: 'Datos bibliográficos' },
      { name: 'authors', label: 'Autores', type: 'text', wide: true, section: 'Datos bibliográficos' },
      { name: 'year', label: 'Año', type: 'number', section: 'Datos bibliográficos' },
      { name: 'pub_type', label: 'Tipo de publicación', type: 'text', section: 'Datos bibliográficos', suggestions: ['Artículo científico', 'Trabajo en congreso', 'Capítulo de libro', 'Libro', 'Tesis', 'Revisión'] },
      { name: 'source', label: 'Revista, congreso o fuente', type: 'text', section: 'Datos bibliográficos' },
      { name: 'topic', label: 'Temática', type: 'text', section: 'Datos bibliográficos' },
      { name: 'doi', label: 'DOI', type: 'text', section: 'Datos bibliográficos' },
      { name: 'external_url', label: 'Enlace para consultar la publicación', type: 'url', wide: true, section: 'Datos bibliográficos' },
      { name: 'thumbnail_url', label: 'Imagen o miniatura', type: 'image', altField: 'thumbnail_alt', folder: 'publicaciones', wide: true, section: 'Contenido' },
      { name: 'abstract', label: 'Resumen', type: 'markdown', rows: 8, wide: true, section: 'Contenido' },
      { name: 'files', label: 'Archivos descargables', type: 'files', folder: 'publicaciones', wide: true, section: 'Contenido' },
      ...seo,
    ],
  },
  {
    key: 'congresos', table: 'congresses', label: 'Congresos', singular: 'congreso', titleField: 'name', dateField: 'start_date',
    subtitle: (r) => [r.location, r.participation_type].filter(Boolean).join(' · '), publicPath: (r) => `/congresos/${r.slug}`, slugFrom: 'name',
    searchCols: ['name', 'organizer', 'location'], order: [{ col: 'start_date' }],
    fields: [
      { name: 'name', label: 'Nombre del congreso', type: 'text', required: true, wide: true },
      { name: 'organizer', label: 'Institución organizadora', type: 'text' },
      { name: 'location', label: 'Lugar', type: 'text' },
      { name: 'start_date', label: 'Fecha de inicio', type: 'date' },
      { name: 'end_date', label: 'Fecha de finalización', type: 'date' },
      { name: 'participation_type', label: 'Tipo de participación', type: 'text', suggestions: ['Asistentes', 'Presentación de pósteres', 'Disertantes', 'Comité organizador', 'Comunicación oral'] },
      { name: 'members', label: 'Integrantes participantes', type: 'text' },
      { name: 'cover_url', label: 'Foto principal', type: 'image', altField: 'cover_alt', folder: 'congresos', wide: true },
      { name: 'description', label: 'Descripción', type: 'markdown', rows: 6, wide: true },
      { name: 'works', label: 'Trabajos presentados', type: 'markdown', rows: 5, wide: true, help: 'Las disertaciones, pósteres y fotos se vinculan desde sus propias secciones eligiendo este congreso.' },
    ],
  },
  {
    key: 'disertaciones', table: 'talks', label: 'Disertaciones', singular: 'disertación', female: true, titleField: 'title', dateField: 'date',
    subtitle: (r) => [r.speaker, r.event_name].filter(Boolean).join(' · '), publicPath: (r) => `/congresos/disertaciones/${r.slug}`, slugFrom: 'title',
    searchCols: ['title', 'speaker', 'event_name'], order: [{ col: 'date' }],
    fields: [
      { name: 'title', label: 'Título de la conferencia', type: 'text', required: true, wide: true },
      { name: 'speaker', label: 'Disertante', type: 'text' },
      { name: 'congress_id', label: 'Congreso (si está cargado)', type: 'relation', relation: { table: 'congresses', labelCol: 'name' } },
      { name: 'event_name', label: 'Nombre del evento (texto)', type: 'text', help: 'Se muestra si no elegís un congreso de la lista.' },
      { name: 'date', label: 'Fecha', type: 'date' },
      { name: 'location', label: 'Lugar', type: 'text' },
      { name: 'summary', label: 'Resumen del contenido expuesto', type: 'markdown', rows: 10, wide: true },
      { name: 'topics', label: 'Temáticas abordadas', type: 'tags', wide: true },
      { name: 'photo_url', label: 'Fotografía (opcional)', type: 'image', altField: 'photo_alt', folder: 'disertaciones', wide: true },
      { name: 'links', label: 'Enlaces relacionados', type: 'links', wide: true },
      { name: 'files', label: 'Material complementario descargable', type: 'files', folder: 'disertaciones', wide: true },
    ],
  },
  {
    key: 'posteres', table: 'posters', label: 'Pósteres', singular: 'póster', titleField: 'title', dateField: 'year',
    subtitle: (r) => [r.event_name, r.authors].filter(Boolean).join(' · '), publicPath: (r) => `/congresos/posteres/${r.slug}`, slugFrom: 'title',
    searchCols: ['title', 'authors', 'event_name'], order: [{ col: 'year' }, { col: 'sort_order', asc: true }],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, wide: true },
      { name: 'authors', label: 'Autores', type: 'text', wide: true },
      { name: 'congress_id', label: 'Congreso (si está cargado)', type: 'relation', relation: { table: 'congresses', labelCol: 'name' } },
      { name: 'event_name', label: 'Congreso o evento (texto)', type: 'text' },
      { name: 'year', label: 'Año', type: 'number' },
      { name: 'description', label: 'Breve descripción', type: 'textarea', rows: 3, wide: true },
      { name: 'pdf_url', label: 'Archivo PDF del póster', type: 'pdf', thumbField: 'thumbnail_url', folder: 'posteres', wide: true, help: 'Al subir el PDF se genera automáticamente una miniatura de la primera página.' },
      { name: 'thumbnail_url', label: 'Miniatura (se genera sola; podés reemplazarla)', type: 'image', folder: 'miniaturas', wide: true },
    ],
  },
  {
    key: 'integrantes', table: 'members', label: 'Integrantes', singular: 'integrante', titleField: 'name',
    subtitle: (r) => [r.role, r.is_leader ? 'Responsable' : 'Equipo'].filter(Boolean).join(' · '), publicPath: () => '/quienes-somos', slugFrom: 'name',
    searchCols: ['name', 'role'], order: [{ col: 'sort_order', asc: true }, { col: 'created_at', asc: true }],
    fields: [
      { name: 'name', label: 'Nombre completo', type: 'text', required: true },
      { name: 'role', label: 'Cargo o función', type: 'text' },
      { name: 'is_leader', label: 'Mostrar como responsable de BIOQUNS', type: 'checkbox', wide: true, help: 'Los responsables aparecen primero, con la misma jerarquía visual. El resto se muestra como "Equipo".' },
      { name: 'photo_url', label: 'Fotografía profesional', type: 'image', altField: 'photo_alt', folder: 'integrantes', wide: true },
      { name: 'bio', label: 'Descripción biográfica', type: 'markdown', rows: 5, wide: true },
      { name: 'education', label: 'Formación', type: 'markdown', rows: 4, wide: true },
      { name: 'career', label: 'Trayectoria académica y profesional', type: 'markdown', rows: 5, wide: true },
      { name: 'specialties', label: 'Áreas de especialización', type: 'tags', wide: true },
      { name: 'activities', label: 'Actividades docentes o de investigación', type: 'markdown', rows: 4, wide: true },
      { name: 'highlights', label: 'Publicaciones o antecedentes destacados', type: 'markdown', rows: 4, wide: true },
    ],
  },
];

export const resourceByKey = (k: string) => RESOURCES.find((r) => r.key === k);

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
  simple?: boolean;     // formulario de una columna: fecha bajo el título y botones al final
  noDate?: boolean;     // en el formulario simple, no mostrar la fecha de publicación
  fixed?: Record<string, any>; // valores que se guardan siempre
  congressChildren?: boolean; // muestra conferencias, pósteres y fotos dentro del formulario
}



export const RESOURCES: Resource[] = [
  {
    key: 'articulos', table: 'articles', label: 'Artículos', singular: 'artículo', titleField: 'title', dateField: 'published_at',
    subtitle: (r) => r.category ?? '', publicPath: (r) => `/articulos/${r.slug}`, slugFrom: 'title', simple: true,
    searchCols: ['title', 'authors', 'category'], order: [{ col: 'published_at' }], notifies: 'article',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, wide: true, section: 'Contenido' },
      { name: 'excerpt', label: 'Descripción breve para la tarjeta', type: 'textarea', rows: 2, wide: true, section: 'Contenido' },
      { name: 'category', label: 'Categoría (opcional)', type: 'select', emptyLabel: '— Sin categoría —', section: 'Contenido', options: [{ value: 'Química clínica', label: 'Química clínica' }, { value: 'Hematología y hemostasia', label: 'Hematología y hemostasia' }, { value: 'Inmunología y serología', label: 'Inmunología y serología' }, { value: 'Microbiología clínica', label: 'Microbiología clínica' }, { value: 'Biología molecular y genética', label: 'Biología molecular y genética' }, { value: 'Endocrinología', label: 'Endocrinología' }, { value: 'Toxicología', label: 'Toxicología' }, { value: 'Ética y legislación', label: 'Ética y legislación' }, { value: 'Gestión de calidad', label: 'Gestión de calidad' }] },
      { name: 'authors', label: 'Autores', type: 'text', section: 'Contenido', placeholder: 'Separados por coma' },
      { name: 'summary', label: 'Resumen (se ve al entrar al artículo)', type: 'markdown', rows: 8, wide: true, section: 'Contenido' },
      { name: 'source', label: 'Revista o fuente', type: 'text', section: 'Fuente' },
      { name: 'doi', label: 'DOI', type: 'text', section: 'Fuente', placeholder: '10.1000/xyz123' },
      { name: 'external_url', label: 'Enlace al artículo original', type: 'url', wide: true, section: 'Fuente', placeholder: 'https://…' },
      { name: 'pdf_url', label: 'Artículo completo en PDF (opcional, para descargar)', type: 'pdf', pdfOnly: true, folder: 'articulos', wide: true, section: 'Fuente' },
      { name: 'tags', label: 'Palabras clave', type: 'tags', wide: true, section: 'Fuente' },
    ],
  },
  {
    key: 'cursos', table: 'courses', label: 'Cursos', singular: 'curso', titleField: 'title', dateField: 'start_date',
    subtitle: (r) => ({ open: 'Inscripciones abiertas', soon: 'Próximamente', closed: 'Finalizado' } as any)[r.enrollment_status] ?? '',
    publicPath: (r) => `/cursos/${r.slug}`, duplicate: true, slugFrom: 'title', simple: true, noDate: true, fixed: { cta_type: 'external' },
    searchCols: ['title', 'institution'], order: [{ col: 'created_at' }], notifies: 'course',
    fields: [
      { name: 'title', label: 'Título del curso', type: 'text', required: true, wide: true, section: 'Tarjeta del curso' },
      { name: 'institution', label: 'Institución organizadora', type: 'text', section: 'Tarjeta del curso', placeholder: 'Ej.: Universidad Nacional del Sur' },
      { name: 'enrollment_status', label: 'Estado de inscripción', type: 'select', required: true, section: 'Tarjeta del curso', options: [{ value: 'open', label: 'Inscripciones abiertas' }, { value: 'soon', label: 'Próximamente' }, { value: 'closed', label: 'Finalizado' }] },
      { name: 'cover_url', label: 'Imagen o banner del curso', type: 'image', folder: 'cursos', wide: true, section: 'Tarjeta del curso' },
      { name: 'logos', label: 'Logos institucionales en la tarjeta', type: 'logos', wide: true, section: 'Tarjeta del curso', help: 'Los logos se reemplazan desde Configuración general → Logos.' },
      { name: 'duration', label: 'Duración estimada', type: 'text', section: 'Tarjeta del curso', placeholder: 'Ej.: 6 semanas' },
      { name: 'modality', label: 'Modalidad', type: 'text', section: 'Tarjeta del curso', placeholder: 'Ej.: Virtual, Presencial, Híbrida', suggestions: ['Virtual', 'Presencial', 'Híbrida', 'Virtual asincrónica'] },
      { name: 'description', label: 'Presentación', type: 'markdown', rows: 8, wide: true, section: 'Cuando entrás a la tarjeta' },
      { name: 'audience', label: 'Destinatarios', type: 'markdown', rows: 3, wide: true, section: 'Cuando entrás a la tarjeta' },
      { name: 'teachers', label: 'Docente coordinador', type: 'teachers', teacherRole: 'coordinator', rows: 4, wide: true, section: 'Cuando entrás a la tarjeta' },
      { name: 'teachers_staff', label: 'Plantel docente', type: 'teachers', teacherRole: 'staff', rows: 3, wide: true, section: 'Cuando entrás a la tarjeta' },
      { name: 'program', label: 'Programa de estudio', type: 'markdown', rows: 12, wide: true, section: 'Cuando entrás a la tarjeta' },
      { name: 'objectives', label: 'Objetivos', type: 'markdown', rows: 5, wide: true, section: 'Cuando entrás a la tarjeta' },
      { name: 'certification', label: '¿El curso cuenta con certificación?', type: 'select', emptyLabel: 'No', section: 'Cuando entrás a la tarjeta', options: [{ value: 'Certificado UNS', label: 'Sí — Certificado UNS' }], help: 'Si elegís Sí, en la página del curso aparece "Certificado UNS" con un ícono de certificado.' },
      { name: 'start_date', label: 'Fecha de inicio', type: 'date', section: 'Fechas e inscripción' },
      { name: 'end_date', label: 'Fecha de finalización', type: 'date', section: 'Fechas e inscripción' },
      { name: 'workload', label: 'Carga horaria', type: 'text', section: 'Fechas e inscripción', placeholder: 'Ej.: 40 horas' },
      { name: 'cta_url', label: 'Enlace de inscripción', type: 'url', wide: true, section: 'Fechas e inscripción', placeholder: 'https://…', help: 'El botón "Inscribirme" de la página del curso lleva a este enlace. Si queda vacío, no se muestra el botón.' },
    ],
  },
  {
    key: 'publicaciones', table: 'publications', label: 'Publicaciones', singular: 'publicación', female: true, titleField: 'title', dateField: 'year',
    subtitle: (r) => [r.year, r.source].filter(Boolean).join(' · '), publicPath: (r) => `/publicaciones/${r.slug}`, slugFrom: 'title', simple: true, noDate: true,
    searchCols: ['title', 'authors', 'source'], order: [{ col: 'year' }, { col: 'created_at' }], notifies: 'publication',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, wide: true, section: 'Datos bibliográficos' },
      { name: 'authors', label: 'Autores', type: 'text', wide: true, section: 'Datos bibliográficos' },
      { name: 'year', label: 'Año', type: 'number', section: 'Datos bibliográficos' },
      { name: 'source', label: 'Revista, congreso o fuente', type: 'text', section: 'Datos bibliográficos' },
      { name: 'external_url', label: 'Enlace para consultar la publicación', type: 'url', wide: true, section: 'Datos bibliográficos' },
      { name: 'abstract', label: 'Resumen', type: 'markdown', rows: 8, wide: true, section: 'Contenido' },
      { name: 'files', label: 'Archivos descargables', type: 'files', folder: 'publicaciones', wide: true, section: 'Contenido' },
    ],
  },
  {
    key: 'congresos', table: 'congresses', label: 'Actividades científicas y académicas', singular: 'actividad', female: true, titleField: 'name', dateField: 'start_date',
    subtitle: (r) => [r.location, r.participation_type].filter(Boolean).join(' · '), publicPath: (r) => `/congresos/${r.slug}`, slugFrom: 'name', simple: true, noDate: true, congressChildren: true, fixed: { end_date: null },
    searchCols: ['name', 'organizer', 'location'], order: [{ col: 'start_date' }],
    fields: [
      { name: 'name', label: 'Nombre de la actividad', type: 'text', required: true, wide: true, placeholder: 'Ej.: Congreso Argentino de Bioquímica, Jornadas, Simposio, Curso…' },
      { name: 'organizer', label: 'Institución organizadora', type: 'text' },
      { name: 'location', label: 'Lugar', type: 'text' },
      { name: 'start_date', label: 'Mes y año', type: 'month' },
      { name: 'participation_type', label: 'Tipo de participación', type: 'text', suggestions: ['Asistentes', 'Presentación de pósteres', 'Disertantes', 'Comité organizador', 'Comunicación oral'] },
      { name: 'members', label: 'Integrantes participantes', type: 'text' },
      // cover_alt ya no se usa como texto alternativo: guarda el resumen breve que se ve en la tarjeta
      { name: 'cover_alt', label: 'Resumen breve para la tarjeta', type: 'textarea', rows: 2, wide: true, help: 'Una o dos líneas. Es lo que se ve en la tarjeta de la lista de actividades.' },
      { name: 'description', label: 'Resumen', type: 'markdown', rows: 6, wide: true, help: 'Se ve al entrar a la actividad.' },
    ],
  },
  {
    key: 'disertaciones', table: 'talks', label: 'Disertaciones', singular: 'disertación', female: true, titleField: 'title', dateField: 'date',
    subtitle: (r) => [r.speaker, r.event_name].filter(Boolean).join(' · '), publicPath: (r) => `/congresos/disertaciones/${r.slug}`, slugFrom: 'title', simple: true, noDate: true,
    searchCols: ['title', 'speaker', 'event_name'], order: [{ col: 'date' }],
    fields: [
      { name: 'title', label: 'Título de la conferencia', type: 'text', required: true, wide: true },
      { name: 'speaker', label: 'Disertante', type: 'text' },
      { name: 'congress_id', label: 'Actividad científica o académica (si está cargada)', type: 'relation', relation: { table: 'congresses', labelCol: 'name' } },
      { name: 'event_name', label: 'Nombre del evento (texto)', type: 'text', help: 'Se muestra si no elegís una actividad de la lista.' },
      { name: 'date', label: 'Fecha', type: 'date' },
      { name: 'location', label: 'Lugar', type: 'text' },
      { name: 'summary', label: 'Resumen del contenido expuesto', type: 'markdown', rows: 10, wide: true },
      { name: 'topics', label: 'Temáticas abordadas', type: 'tags', wide: true },
      { name: 'photo_url', label: 'Fotografía (opcional)', type: 'image', altField: 'photo_alt', folder: 'disertaciones', wide: true },
      { name: 'files', label: 'Material complementario descargable', type: 'files', folder: 'disertaciones', wide: true },
    ],
  },
  {
    key: 'posteres', table: 'posters', label: 'Pósteres', singular: 'póster', titleField: 'title', dateField: 'year',
    subtitle: (r) => [r.event_name, r.authors].filter(Boolean).join(' · '), publicPath: (r) => `/congresos/posteres/${r.slug}`, slugFrom: 'title', simple: true, noDate: true,
    searchCols: ['title', 'authors', 'event_name'], order: [{ col: 'year' }, { col: 'created_at' }],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, wide: true },
      { name: 'authors', label: 'Autores', type: 'text', wide: true },
      { name: 'congress_id', label: 'Actividad científica o académica (si está cargada)', type: 'relation', relation: { table: 'congresses', labelCol: 'name' } },
      { name: 'event_name', label: 'Nombre del evento (texto)', type: 'text', help: 'Se muestra si no elegís una actividad de la lista.' },
      { name: 'year', label: 'Año', type: 'number' },
      { name: 'description', label: 'Breve descripción', type: 'textarea', rows: 3, wide: true },
      { name: 'pdf_url', label: 'Archivo del póster (PDF o imagen)', type: 'pdf', thumbField: 'thumbnail_url', folder: 'posteres', wide: true },
    ],
  },
  {
    key: 'integrantes', table: 'members', label: 'Integrantes', singular: 'integrante', titleField: 'name',
    subtitle: (r) => [r.role, r.is_leader ? 'Responsable' : 'Equipo'].filter(Boolean).join(' · '), publicPath: () => '/quienes-somos', slugFrom: 'name', simple: true, noDate: true,
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

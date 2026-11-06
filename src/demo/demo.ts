// MODO DEMOSTRACIÓN — solo se incluye con `npm run build:demo`.
// Reemplaza la conexión a Supabase por una base de datos en memoria con contenido de EJEMPLO,
// para mostrar el diseño sin cuentas ni servidores. Nada de esto llega a la versión real.
import IMG from './images.json';

const NOW = Date.now();
const day = (n: number) => new Date(NOW - n * 86400000).toISOString();
const date = (n: number) => new Date(NOW + n * 86400000).toISOString().slice(0, 10);
let seq = 1;
const uid = () => `00000000-0000-4000-8000-${String(seq++).padStart(12, '0')}`;
const base = (o: Record<string, any>): Record<string, any> => ({ id: uid(), status: 'published', published_at: day(o._d ?? 3), sort_order: 0, created_at: day(o._d ?? 3), updated_at: day(o._d ?? 3), featured: false, ...o });
const C = IMG.covers;

const courses = [
  base({ _d: 2, slug: 'actualizacion-en-hemostasia-y-coagulacion', title: 'Actualización en hemostasia y coagulación', institution: 'Universidad Nacional del Sur', enrollment_status: 'open', featured: true, sort_order: 0, logos: ['uns', 'bioquns', 'dirEaD'], cover_url: C[2], cover_alt: 'Ilustración de células sanguíneas', duration: '6 semanas', workload: '40 horas', modality: 'Virtual', level: 'Intermedio', start_date: date(18), end_date: date(60), price: 'Consultar aranceles', short_description: 'Fisiología de la hemostasia, pruebas de laboratorio y su interpretación en la práctica clínica.',
    description: 'Curso de actualización orientado a profesionales del laboratorio clínico. Recorre la fisiología de la hemostasia primaria y secundaria, las pruebas de screening y confirmatorias, y la interpretación de resultados con **casos clínicos reales**.',
    objectives: '- Integrar el modelo celular de la coagulación.\n- Seleccionar las pruebas adecuadas según la sospecha clínica.\n- Interpretar TP, KPTT, fibrinógeno y dímero D en contexto.\n- Reconocer interferencias preanalíticas frecuentes.',
    audience: 'Bioquímicos/as, técnicos/as de laboratorio y estudiantes avanzados de carreras de la salud.',
    program: '## Módulo 1 · Fisiología de la hemostasia\n- Hemostasia primaria: plaquetas y factor de von Willebrand\n- Modelo celular de la coagulación\n\n## Módulo 2 · Fase preanalítica\n- Toma de muestra, anticoagulantes y conservación\n- Interferencias: hemólisis, lipemia, ictericia\n\n## Módulo 3 · Pruebas de laboratorio\n- TP/RIN, KPTT, fibrinógeno, dímero D\n- Estudio de mezclas e inhibidores\n\n## Módulo 4 · Casos clínicos integradores',
    teachers: [{ name: '', text: true, coordinator: true, bio: 'Prof. Mg. Docente de ejemplo 1' }, { name: '', text: true, bio: 'Bioq. Docente de ejemplo 2, Prof. Lic. Docente de ejemplo 3, Dra. Docente de ejemplo 4.' }],
    requirements: 'Título de grado en carreras de la salud o ser estudiante avanzado/a.', certification: 'Certificado UNS', cta_type: 'external', cta_url: 'https://ejemplo.org/inscripcion', contact: 'Consultas: **cursos@ejemplo.org**' }),
  base({ _d: 5, slug: 'control-de-calidad-en-el-laboratorio-clinico', title: 'Control de calidad en el laboratorio clínico', institution: 'Universidad Nacional del Sur', enrollment_status: 'open', featured: true, sort_order: 10, logos: ['uns', 'bioquns', 'dirEaD'], cover_url: C[1], cover_alt: 'Tubos de ensayo de colores', duration: '5 semanas', workload: '30 horas', modality: 'Virtual asincrónica', level: 'Introductorio', start_date: date(30), end_date: date(65), short_description: 'Reglas de Westgard, gráficos de Levey-Jennings y control externo de la calidad.', description: 'Herramientas prácticas para implementar y sostener un programa de control interno y externo de la calidad.', program: '## Módulo 1\n- Conceptos de error total y especificaciones\n## Módulo 2\n- Gráficos de Levey-Jennings y reglas de Westgard', teachers: [{ name: 'Docente de ejemplo 3', bio: 'Bioquímica, gestión de la calidad.' }], cta_type: 'email', cta_url: 'cursos@ejemplo.org' }),
  base({ _d: 9, slug: 'inmunologia-diagnostica-aplicada', title: 'Inmunología diagnóstica aplicada', institution: 'Universidad Nacional del Sur', enrollment_status: 'soon', featured: true, sort_order: 20, logos: ['uns', 'bioquns'], cover_url: C[4], cover_alt: 'Ilustración de células', duration: '8 semanas', modality: 'Híbrida', level: 'Avanzado', short_description: 'Autoinmunidad, inmunodeficiencias y técnicas inmunológicas en el laboratorio.', description: 'Próximamente abriremos la inscripción.', teachers: [], cta_type: 'external', cta_url: '' }),
  base({ _d: 40, slug: 'bioquimica-de-la-diabetes', title: 'Bioquímica de la diabetes: diagnóstico y seguimiento', institution: 'Universidad Nacional del Sur', enrollment_status: 'closed', sort_order: 30, logos: ['uns', 'bioquns', 'dirEaD'], cover_url: C[6], duration: '4 semanas', modality: 'Virtual', level: 'Intermedio', short_description: 'HbA1c, glucemia, microalbuminuria e interpretación integrada.', teachers: [], cta_type: 'external', cta_url: '' }),
  base({ _d: 50, slug: 'biologia-molecular-en-el-laboratorio', title: 'Biología molecular en el laboratorio clínico', institution: 'Universidad Nacional del Sur', enrollment_status: 'closed', sort_order: 40, logos: ['uns', 'bioquns', 'dirEaD'], cover_url: C[3], duration: '6 semanas', modality: 'Virtual', level: 'Intermedio', short_description: 'PCR, qPCR y sus aplicaciones diagnósticas.', teachers: [], cta_type: 'external', cta_url: '' }),
];

const body = `## Introducción
Los biomarcadores cardíacos son herramientas fundamentales en la evaluación del dolor torácico. La **troponina cardíaca de alta sensibilidad** permitió acortar los tiempos de diagnóstico del infarto agudo de miocardio.

## Qué mide el laboratorio
- **Troponina I o T de alta sensibilidad**: marcador de daño miocárdico.
- **NT-proBNP**: marcador de sobrecarga de presión y volumen.
- **CK-MB**: hoy con un rol mucho más limitado.

> Un valor elevado de troponina indica daño miocárdico, pero no necesariamente un infarto: siempre se interpreta junto con la clínica y la cinética.

## Interpretación en la práctica
Los algoritmos de 0/1 h y 0/2 h se basan en valores absolutos y en la variación (delta) entre determinaciones. Conocer el percentil 99 del método utilizado es indispensable.

## Conclusión
El trabajo conjunto entre el laboratorio y el equipo clínico mejora la calidad diagnóstica y la seguridad del paciente.`;

const articles = [
  base({ _d: 1, slug: 'troponina-de-alta-sensibilidad', title: 'Troponina de alta sensibilidad: qué cambió en el diagnóstico del infarto', category: 'Química clínica', excerpt: 'Algoritmos rápidos, percentil 99 y la importancia de interpretar la cinética.', cover_url: C[0], cover_alt: 'Ilustración de células', authors: 'Autora de ejemplo, Autor de ejemplo', featured: true, summary: 'Revisamos el rol de la troponina de alta sensibilidad, los algoritmos 0/1 h y los errores de interpretación más frecuentes.', body, source: 'Revista de ejemplo de Bioquímica Clínica', doi: '10.0000/ejemplo.2026.001', external_url: 'https://ejemplo.org/articulo', references_md: '1. Referencia bibliográfica de ejemplo. *Revista*. 2025;12(3):45-52.\n2. Otra referencia de ejemplo. *Journal*. 2024;8:101-9.', tags: ['troponina', 'cardiología', 'urgencias'] }),
  base({ _d: 6, slug: 'fase-preanalitica-errores-frecuentes', title: 'Fase preanalítica: los errores más frecuentes y cómo evitarlos', category: 'Gestión de calidad', excerpt: 'La mayoría de los errores del laboratorio ocurre antes de que la muestra llegue al analizador.', cover_url: C[1], authors: 'Autora de ejemplo', summary: 'Hemólisis, tubos incorrectos y tiempos de transporte.', body, tags: [] }),
  base({ _d: 12, slug: 'hemograma-mas-alla-de-los-numeros', title: 'Hemograma: más allá de los números', category: 'Hematología y hemostasia', excerpt: 'Índices eritrocitarios, alarmas del contador y cuándo mirar el frotis.', cover_url: C[2], authors: 'Autor de ejemplo', summary: 'Una guía práctica para la lectura del hemograma.', body, tags: [] }),
  base({ _d: 20, slug: 'anticuerpos-antinucleares', title: 'Anticuerpos antinucleares: patrones y su significado clínico', category: 'Inmunología y serología', excerpt: 'La nomenclatura ICAP y la interpretación de los patrones por IFI.', cover_url: C[4], authors: 'Autora de ejemplo', body, tags: [] }),
  base({ _d: 28, slug: 'pcr-en-tiempo-real', title: 'PCR en tiempo real explicada para el laboratorio clínico', category: 'Biología molecular y genética', excerpt: 'Ct, curvas de amplificación y controles: lo esencial.', cover_url: C[3], authors: 'Autor de ejemplo', body, tags: [] }),
  base({ _d: 35, slug: 'hba1c-interferencias', title: 'HbA1c: interferencias analíticas que conviene conocer', category: 'Química clínica', excerpt: 'Hemoglobinopatías, anemias y otras situaciones que alteran el resultado.', cover_url: C[6], authors: 'Autora de ejemplo', body, tags: [] }),
  base({ _d: 44, slug: 'gasometria-arterial', title: 'Gasometría arterial paso a paso', category: 'Química clínica', excerpt: 'Un método ordenado para interpretar el equilibrio ácido-base.', cover_url: C[5], authors: 'Autor de ejemplo', body, tags: [] }),
];

const publications = [
  base({ _d: 4, slug: 'evaluacion-de-un-metodo-de-troponina', title: 'Evaluación analítica de un método de troponina I de alta sensibilidad en un laboratorio de referencia', authors: 'Autora A, Autor B, Autora C', year: 2026, pub_type: 'Artículo científico', topic: 'Química clínica', source: 'Revista de ejemplo de Bioquímica Clínica', abstract: 'Se evaluaron la imprecisión, la linealidad y el límite de detección de un método de troponina I de alta sensibilidad. Los resultados cumplieron las especificaciones de calidad propuestas.', thumbnail_url: IMG.posters[1], doi: '10.0000/ejemplo.2026.014', external_url: 'https://ejemplo.org', files: [], featured: true }),
  base({ _d: 30, slug: 'prevalencia-de-hemoglobinopatias', title: 'Prevalencia de variantes de hemoglobina detectadas durante la medición de HbA1c', authors: 'Autor B, Autora D', year: 2025, pub_type: 'Trabajo en congreso', topic: 'Hematología', source: 'Congreso de ejemplo de Bioquímica', abstract: 'Estudio retrospectivo de cromatogramas de HPLC.', thumbnail_url: IMG.posters[2], files: [], featured: true }),
  base({ _d: 60, slug: 'control-de-calidad-interno', title: 'Implementación de reglas de Westgard en un laboratorio universitario', authors: 'Autora A, Autor E', year: 2024, pub_type: 'Artículo científico', topic: 'Gestión de la calidad', source: 'Revista de ejemplo', thumbnail_url: null, files: [] }),
  base({ _d: 90, slug: 'ensenanza-de-la-bioquimica-clinica', title: 'Aprendizaje basado en casos en la enseñanza de la bioquímica clínica', authors: 'Autora C, Autor B', year: 2024, pub_type: 'Capítulo de libro', topic: 'Docencia', source: 'Libro de ejemplo sobre educación en ciencias de la salud', thumbnail_url: null, files: [] }),
];

const congresses = [
  base({ _d: 15, cover_alt: 'Dos pósteres científicos y una conferencia sobre hemostasia.', slug: 'congreso-de-ejemplo-2025', name: 'Congreso de ejemplo de Bioquímica Clínica 2025', organizer: 'Institución organizadora de ejemplo', location: 'Bahía Blanca, Buenos Aires', start_date: '2025-09-10', end_date: '2025-09-12', participation_type: 'Presentación de pósteres y disertación', members: 'Integrantes de ejemplo', description: 'Participamos con dos pósteres científicos y una conferencia sobre hemostasia.', works: '- Póster: Prevalencia de variantes de hemoglobina\n- Póster: Evaluación de un método de troponina', cover_url: C[3] }),
  base({ _d: 200, cover_alt: 'Trabajo sobre enseñanza de la bioquímica clínica.', slug: 'jornadas-de-ejemplo-2024', name: 'Jornadas de ejemplo de Ciencias de la Salud 2024', organizer: 'Universidad de ejemplo', location: 'Ciudad Autónoma de Buenos Aires', start_date: '2024-05-22', end_date: '2024-05-23', participation_type: 'Comunicación oral', members: 'Integrante de ejemplo', description: 'Presentamos un trabajo sobre enseñanza de la bioquímica clínica.', cover_url: C[5] }),
];
const [g1, g2] = congresses;

const talks = [
  base({ _d: 15, slug: 'hemostasia-en-la-practica-diaria', title: 'Hemostasia en la práctica diaria: lo que el laboratorio puede aportar', speaker: 'Disertante de ejemplo', congress_id: g1.id, event_name: g1.name, date: '2025-09-11', location: 'Bahía Blanca', summary: 'La conferencia repasó el modelo celular de la coagulación y su traducción a las pruebas de laboratorio, con énfasis en la fase preanalítica y en la comunicación con el equipo clínico.\n\n## Puntos principales\n- Selección racional de pruebas\n- Interferencias más frecuentes\n- Casos clínicos', topics: ['Hemostasia', 'Preanalítica'], links: [{ label: 'Material de lectura sugerido', url: 'https://ejemplo.org' }], files: [] }),
  base({ _d: 200, slug: 'aprendizaje-basado-en-casos', title: 'Aprendizaje basado en casos en bioquímica clínica', speaker: 'Disertante de ejemplo', congress_id: g2.id, event_name: g2.name, date: '2024-05-22', location: 'CABA', summary: 'Experiencia docente con casos clínicos integradores.', topics: ['Docencia'], links: [], files: [] }),
];

const posters = [
  base({ _d: 15, slug: 'poster-troponina', title: 'Evaluación analítica de un método de troponina I de alta sensibilidad', authors: 'Autora A, Autor B, Autora C', congress_id: g1.id, event_name: 'Congreso de ejemplo 2025', year: 2025, description: 'Póster presentado en la sesión de química clínica.', pdf_url: IMG.posterPdf, thumbnail_url: IMG.posters[0] }),
  base({ _d: 15, slug: 'poster-hemoglobinopatias', title: 'Variantes de hemoglobina detectadas durante la medición de HbA1c', authors: 'Autor B, Autora D', congress_id: g1.id, event_name: 'Congreso de ejemplo 2025', year: 2025, pdf_url: IMG.posterPdf, thumbnail_url: IMG.posters[1] }),
  base({ _d: 200, slug: 'poster-calidad', title: 'Reglas de Westgard en un laboratorio universitario', authors: 'Autora A, Autor E', event_name: 'Jornadas de ejemplo 2024', year: 2024, pdf_url: IMG.posterPdf, thumbnail_url: IMG.posters[2] }),
  base({ _d: 200, slug: 'poster-docencia', title: 'Casos clínicos integradores en la enseñanza', authors: 'Autora C', event_name: 'Jornadas de ejemplo 2024', year: 2024, pdf_url: IMG.posterPdf, thumbnail_url: IMG.posters[3] }),
];

const gallery_photos = IMG.gallery.map((src: string, i: number) => base({
  image_url: src, title: `Fotografía de ejemplo ${i + 1}`, description: 'Imagen ilustrativa de ejemplo.', alt: 'Imagen ilustrativa de ejemplo',
  congress_id: i < 6 ? g1.id : g2.id, event_label: i < 6 ? 'Congreso de ejemplo 2025' : 'Jornadas de ejemplo 2024', year: i < 6 ? 2025 : 2024, sort_order: i * 10,
}));

const members = [1, 2].map((n) => base({
  slug: `responsable-${n}`, name: `Nombre y apellido ${n}`, role: 'Cargo o función (a completar)', is_leader: true, photo_url: null, sort_order: n * 10,
  bio: 'Aquí va la descripción biográfica real. Este es un texto de ejemplo para mostrar cómo se ve el perfil.',
  education: '- Título de grado (a completar)\n- Posgrado (a completar)', career: 'Trayectoria académica y profesional (a completar).',
  specialties: ['Área de ejemplo', 'Otra área'], activities: 'Actividades docentes y de investigación (a completar).', highlights: '',
}));

const settings = [
  { key: 'home', value: { hero_title: 'Impulsá tu crecimiento profesional.', hero_text: 'Bioquns es un espacio dedicado a la educación a distancia, para profesionales que desean mantenerse actualizados en el ámbito bioquímico y de la salud.', about_text: 'BIOQUNS reúne docencia universitaria, divulgación científica y formación profesional continua en bioquímica. _(Texto de ejemplo: se reemplaza desde el panel.)_', courses_cta_text: 'Consultá los programas, modalidades y fechas de inscripción.' } },
  { key: 'about', value: { intro: 'Texto institucional de ejemplo. Acá se explica qué es BIOQUNS, su propósito, su relación con la docencia y la formación en bioquímica, sus actividades de actualización profesional y su participación en publicaciones y congresos.\n\nTodo este texto se edita desde **Panel → Quiénes somos**.', mission: 'Texto de ejemplo para el propósito o la misión de BIOQUNS.' } },
  { key: 'footer', value: { description: 'Educación a distancia y actualización profesional continua.', instagram: 'https://www.instagram.com/bioquns/', email: 'contacto@ejemplo.org', privacy_text: 'Texto de ejemplo del aviso de privacidad.' } },
  { key: 'general', value: { site_url: '' } },
];

const DB: Record<string, any[]> = {
  courses, articles, publications, congresses, talks, posters, gallery_photos, members, settings,
  editors: [{ user_id: 'demo-user', email: 'editor@bioquns.demo', role: 'admin', created_at: day(30) }],
  subscribers: ['ana', 'bruno', 'carla', 'diego', 'elena'].map((n, i) => ({ id: uid(), email: `${n}@ejemplo.com`, name: n[0].toUpperCase() + n.slice(1), interests: i % 2 ? ['Cursos', 'Artículos'] : ['Cursos'], status: i === 4 ? 'pending' : 'active', consent_at: day(i + 1), confirmed_at: i === 4 ? null : day(i + 1), created_at: day(i + 1) })),
  notifications: [{ id: uid(), content_type: 'course', title: courses[0].title, status: 'sent', sent_count: 4, created_at: day(2) }],
  campaigns: [],
};

/* ------------------------------------------------------------ PostgREST mínimo */
const cmp = (a: any, b: any) => (a === b ? 0 : a === null || a === undefined ? 1 : b === null || b === undefined ? -1 : a < b ? -1 : 1);
function test(row: any, col: string, expr: string): boolean {
  const i = expr.indexOf('.');
  const op = expr.slice(0, i); let v: any = expr.slice(i + 1).replace(/^"|"$/g, '');
  const x = row[col];
  switch (op) {
    case 'eq': return String(x) === v;
    case 'neq': return String(x) !== v;
    case 'lte': return x !== null && x !== undefined && String(x) <= v;
    case 'lt': return x !== null && x !== undefined && String(x) < v;
    case 'gte': return x !== null && x !== undefined && String(x) >= v;
    case 'gt': return x !== null && x !== undefined && String(x) > v;
    case 'in': return v.replace(/[()]/g, '').split(',').includes(String(x));
    case 'ilike': { const re = new RegExp('^' + v.split('%').map((s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i'); return re.test(String(x ?? '')); }
    case 'is': return v === 'null' ? x === null || x === undefined : String(x) === v;
    default: return true;
  }
}
function filterRows(rows: any[], params: URLSearchParams) {
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue;
    if (k === 'or') {
      const parts = v.slice(1, -1).split(/,(?![^(]*\))/).map((p) => { const j = p.indexOf('.'); return [p.slice(0, j), p.slice(j + 1)]; });
      rows = rows.filter((r) => parts.some(([c, e]) => test(r, c, e)));
    } else rows = rows.filter((r) => test(r, k, v));
  }
  return rows;
}
const jsonRes = (body: any, status = 200, headers: Record<string, string> = {}) =>
  new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

function rest(table: string, method: string, params: URLSearchParams, headers: Headers, bodyText: string | null) {
  DB[table] ??= [];
  const all = DB[table];
  const single = (headers.get('accept') ?? '').includes('vnd.pgrst.object');
  const prefer = headers.get('prefer') ?? '';
  const out = (rows: any[], status = 200, total?: number) => {
    if (single) return rows.length === 1 ? jsonRes(rows[0], status) : jsonRes({ code: 'PGRST116', message: 'No rows' }, 406);
    const h: Record<string, string> = {};
    if (prefer.includes('count=')) h['content-range'] = `0-${Math.max(rows.length - 1, 0)}/${total ?? rows.length}`;
    return jsonRes(method === 'HEAD' ? null : rows, status, h);
  };
  if (method === 'GET' || method === 'HEAD') {
    let rows = filterRows(all, params);
    const order = params.get('order');
    if (order) {
      const keys = order.split(',').map((o) => o.split('.'));
      rows = [...rows].sort((a, b) => { for (const [c, dir] of keys) { const r = cmp(a[c], b[c]); if (r) return dir === 'desc' ? (a[c] == null || b[c] == null ? r : -r) : r; } return 0; });
    }
    const total = rows.length;
    const off = Number(params.get('offset') ?? 0); const lim = params.get('limit') ? Number(params.get('limit')) : undefined;
    rows = rows.slice(off, lim !== undefined ? off + lim : undefined);
    return out(rows, 200, total);
  }
  const data = bodyText ? JSON.parse(bodyText) : null;
  if (method === 'POST') {
    const items = Array.isArray(data) ? data : [data];
    const conflict = params.get('on_conflict');
    const res = items.map((it: any) => {
      const key = conflict ?? (table === 'settings' ? 'key' : null);
      const ex = key ? all.find((r) => r[key] === it[key]) : null;
      if (ex) { if (!prefer.includes('ignore-duplicates')) Object.assign(ex, it, { updated_at: new Date().toISOString() }); return ex; }
      if (it.slug && all.some((r) => r.slug === it.slug)) throw Object.assign(new Error('dup'), { dup: true });
      const row = { id: uid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sort_order: 0, featured: false, tags: [], files: [], links: [], topics: [], specialties: [], teachers: [], ...it };
      if (row.status === 'published' && !row.published_at) row.published_at = new Date().toISOString();
      all.unshift(row); return row;
    });
    return out(res, 201);
  }
  if (method === 'PATCH') {
    const rows = filterRows(all, params);
    rows.forEach((r) => { Object.assign(r, data, { updated_at: new Date().toISOString() }); if (r.status === 'published' && !r.published_at) r.published_at = new Date().toISOString(); });
    return out(rows);
  }
  if (method === 'DELETE') {
    const rows = filterRows(all, params);
    DB[table] = all.filter((r) => !rows.includes(r));
    return out(rows);
  }
  return jsonRes({ message: 'no soportado' }, 400);
}

/* ------------------------------------------------------------ Auth y funciones */
const b64u = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const USER = { id: 'demo-user', aud: 'authenticated', role: 'authenticated', email: 'editor@bioquns.demo', app_metadata: {}, user_metadata: {}, created_at: day(30) };
function session() {
  const exp = Math.floor(Date.now() / 1000) + 86400;
  return { access_token: `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub: USER.id, exp, role: 'authenticated', aud: 'authenticated', email: USER.email })}.demo`, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'demo-refresh', user: USER };
}

function auth(path: string, method: string, bodyText: string | null) {
  if (path.endsWith('/token')) {
    const b = bodyText ? JSON.parse(bodyText) : {};
    if (b.grant_type === 'refresh_token' || b.refresh_token) return jsonRes(session());
    if (b.password === '25/10/01') return jsonRes(session());
    return jsonRes({ code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400);
  }
  if (path.endsWith('/user')) return jsonRes(USER);
  if (path.endsWith('/logout')) return new Response(null, { status: 204 });
  if (path.endsWith('/recover')) return jsonRes({});
  return jsonRes({}, method === 'GET' ? 200 : 200);
}

function fn(name: string, bodyText: string | null) {
  const b = bodyText ? JSON.parse(bodyText) : {};
  if (name === 'newsletter') {
    if (b.action === 'subscribe') return jsonRes({ message: '¡Listo! (Demostración: en el sitio real te llegaría un correo para confirmar la suscripción.)' });
    if (b.action === 'confirm') return jsonRes({ message: '¡Suscripción confirmada! (demostración)' });
    return jsonRes({ message: 'Listo: cancelaste tu suscripción. (demostración)' });
  }
  if (b.action === 'status') return jsonRes({ configured: false, from: null, site_url: null, cron_secret: false, problems: ['Esta es una demostración: el envío de correos no está conectado.'] });
  if (b.action === 'dispatch') return jsonRes({ message: 'Demostración: no se envían correos.' });
  return jsonRes({ error: 'En la demostración no se envían correos ni se crean usuarios.' }, 400);
}

/* ------------------------------------------------------------ Intercepción */
const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const req = new Request(input, init);
  const url = new URL(req.url);
  if (!url.hostname.endsWith('demo.supabase.co')) return realFetch(input as any, init);
  await new Promise((r) => setTimeout(r, 120)); // latencia simulada
  const bodyText = ['GET', 'HEAD'].includes(req.method) ? null : await req.text();
  try {
    if (url.pathname.startsWith('/rest/v1/')) return rest(url.pathname.split('/')[3], req.method, url.searchParams, req.headers, bodyText);
    if (url.pathname.startsWith('/auth/v1/')) return auth(url.pathname, req.method, bodyText);
    if (url.pathname.startsWith('/functions/v1/')) return fn(url.pathname.split('/')[3], bodyText);
    return jsonRes({ message: 'No disponible en la demostración' }, 400);
  } catch (e: any) {
    if (e?.dup) return jsonRes({ code: '23505', message: 'duplicate key value violates unique constraint' }, 409);
    return jsonRes({ message: String(e?.message ?? e) }, 500);
  }
};

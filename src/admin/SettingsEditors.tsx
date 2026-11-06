import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Save } from 'lucide-react';
import { saveSetting, useSettings, type SettingsKey, type SiteSettings } from '../lib/settings';
import { FieldInput, validate, type Field } from './fields';
import { useToast } from './toast';
import { appHref, newTab } from '../lib/paths';

/** Formulario genérico para un bloque de configuración editable. */
export function SettingsForm<K extends SettingsKey>({ k, title, intro, groups, extra }: {
  k: K; title: string; intro?: string;
  groups: { title: string; fields: Field[] }[];
  extra?: (data: any, set: (p: Record<string, any>) => void) => ReactNode;
}) {
  const { settings, loading } = useSettings();
  const qc = useQueryClient();
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!loading && !data) setData(structuredClone(settings[k])); }, [loading, settings, k, data]);
  if (!data) return <p className="text-sm text-mute">Cargando…</p>;
  const set = (p: Record<string, any>) => { setDirty(true); setData((d: any) => ({ ...d, ...p })); };

  async function save() {
    const errs = validate(groups.flatMap((g) => g.fields), data);
    if (Object.keys(errs).length) return toast.error(Object.values(errs)[0]);
    setSaving(true);
    try {
      await saveSetting(k, data as SiteSettings[K]);
      await qc.invalidateQueries({ queryKey: ['settings'] });
      setDirty(false);
      toast.ok('Cambios guardados y publicados en el sitio.');
    } catch (e) { toast.error('No se pudo guardar: ' + (e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
      {intro && <p className="mt-1 text-sm text-mute">{intro}</p>}
      <div className="mt-6 space-y-6">
        {groups.map((g) => (
          <section key={g.title} className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-petrol">{g.title}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {g.fields.map((f) => <div key={f.name} className={f.wide || ['markdown', 'image', 'links'].includes(f.type) ? 'md:col-span-2' : ''}><FieldInput f={f} data={data} set={set} /></div>)}
            </div>
          </section>
        ))}
        {extra?.(data, set)}
      </div>
      <div className="fixed bottom-0 right-0 z-20 flex w-full items-center justify-end gap-3 border-t border-line bg-white/95 px-6 py-3 backdrop-blur lg:w-[calc(100%-16rem)]">
        {dirty && <span className="text-xs font-semibold text-amber-700">Cambios sin guardar</span>}
        <a href={appHref('/')} {...newTab} className="btn-ghost"><Eye className="h-4 w-4" />Ver sitio</a>
        <button className="btn-primary" onClick={save} disabled={saving || !dirty}><Save className="h-4 w-4" />{saving ? 'Guardando…' : 'Guardar y publicar'}</button>
      </div>
    </div>
  );
}

export function HomeEditor() {
  return (
    <SettingsForm
      k="home" title="Editar portada" intro="Textos y botones de la portada. El recuadro de suscripción de abajo se edita en Newsletter y suscriptores → Envíos automáticos (Textos del formulario)."
      groups={[
        { title: 'Portada principal (los botones se ocultan si dejás su texto vacío)', fields: [
          { name: 'hero_title', label: 'Frase principal (debajo de BIOQUNS, en negrita)', type: 'text', required: true, wide: true },
          { name: 'hero_text', label: 'Texto de presentación', type: 'textarea', rows: 3, wide: true },
          { name: 'hero_image_url', label: 'Imagen de fondo de la portada', type: 'image', folder: 'portada', wide: true, help: 'Si queda vacía se usa la foto de laboratorio original. Ideal: foto horizontal, de al menos 1600 px de ancho.' },
          { name: 'hero_primary_label', label: 'Botón principal: texto', type: 'text' },
          { name: 'hero_primary_url', label: 'Botón principal: enlace', type: 'text', placeholder: '/cursos' },
          { name: 'hero_secondary_label', label: 'Botón secundario: texto', type: 'text' },
          { name: 'hero_secondary_url', label: 'Botón secundario: enlace', type: 'text', placeholder: '/articulos' },
        ] },
      ]}
    />
  );
}

export function AboutEditor() {
  return (
    <SettingsForm
      k="about" title="Editar Quiénes somos" intro="Texto institucional. Las personas responsables se editan en Integrantes."
      groups={[{ title: 'Texto institucional', fields: [
        { name: 'title', label: 'Título de la página', type: 'text', required: true },
        { name: 'team_title', label: 'Título de la sección de responsables', type: 'text' },
        { name: 'intro', label: 'Qué es BIOQUNS, propósito, docencia, actualización profesional, publicaciones y actividades científicas y académicas', type: 'markdown', rows: 14 },
      ] }]}
    />
  );
}

export function FooterEditor() {
  return (
    <SettingsForm
      k="footer" title="Pie de página y datos de contacto" intro="Solo se muestran los campos completos. No se inventan datos."
      groups={[
        { title: 'Institucional', fields: [{ name: 'description', label: 'Breve descripción institucional', type: 'textarea', rows: 2, wide: true }] },
        { title: 'Contacto', fields: [
          { name: 'email', label: 'Correo de contacto', type: 'email' },
          { name: 'phone', label: 'Teléfono / WhatsApp', type: 'text' },
          { name: 'address', label: 'Dirección', type: 'text', wide: true },
        ] },
        { title: 'Redes sociales', fields: [
          { name: 'instagram', label: 'Instagram (enlace completo)', type: 'url', placeholder: 'https://www.instagram.com/…' },
          { name: 'linkedin', label: 'LinkedIn', type: 'url' },
          { name: 'facebook', label: 'Facebook', type: 'url' },
          { name: 'youtube', label: 'YouTube', type: 'url' },
          { name: 'website_links', label: 'Enlaces institucionales', type: 'links' },
        ] },
        { title: 'Aviso de privacidad', fields: [{ name: 'privacy_text', label: 'Texto del aviso de privacidad (página /privacidad)', type: 'markdown', rows: 8 }] },
      ]}
    />
  );
}

import { supabase } from './supabase';
import { slugify } from './format';

const MAX_IMAGE_SIDE = 2000;

/** Reduce imágenes grandes antes de subirlas (más rápido para quien visita la web). */
async function optimizeImage(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 350_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const type = file.type === 'image/png' ? 'image/png' : 'image/webp';
    const out = await new Promise<Blob | null>((r) => c.toBlob(r, type, 0.86));
    return out && out.size < file.size ? out : file;
  } catch { return file; }
}

export async function uploadFile(file: File | Blob, folder: string, nameHint = 'archivo'): Promise<string> {
  const original = file instanceof File ? file.name : nameHint;
  const ext = (original.split('.').pop() || 'bin').toLowerCase();
  const isImg = file.type.startsWith('image/');
  const body = isImg && file instanceof File ? await optimizeImage(file) : file;
  if (import.meta.env.VITE_DEMO) return URL.createObjectURL(body);
  const outExt = body.type === 'image/webp' ? 'webp' : ext;
  const base = slugify(original.replace(/\.[^.]+$/, '')) || 'archivo';
  const path = `${folder}/${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}-${base}.${outExt}`;
  const { error } = await supabase.storage.from('media').upload(path, body, {
    cacheControl: '31536000', upsert: false, contentType: body.type || undefined,
  });
  if (error) {
    if (/row-level|unauthorized|403/i.test(error.message)) throw new Error('No tenés permiso para subir archivos. Volvé a iniciar sesión.');
    if (/size|too large|413/i.test(error.message)) throw new Error('El archivo supera el tamaño máximo (25 MB).');
    if (/mime|type/i.test(error.message)) throw new Error('Tipo de archivo no permitido. Usá JPG, PNG, WEBP, GIF, SVG o PDF.');
    throw new Error('No se pudo subir el archivo: ' + error.message);
  }
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

/** Borra del almacenamiento un archivo que ya no se usa (si pertenece a nuestro bucket). */
export async function removeStoredFile(url?: string | null) {
  if (!url) return;
  const marker = '/storage/v1/object/public/media/';
  const i = url.indexOf(marker);
  if (i === -1) return;
  await supabase.storage.from('media').remove([decodeURIComponent(url.slice(i + marker.length))]);
}

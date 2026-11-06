import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Photo } from '../lib/types';

export function Lightbox({ photos, index, onClose, onIndex }: { photos: Photo[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const p = photos[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % photos.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; prev?.focus(); };
  }, [index, photos.length, onClose, onIndex]);
  if (!p) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={p.title || 'Fotografía'} className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4" onClick={onClose}>
      <div className="flex justify-end"><button ref={closeRef} className="rounded-full p-2 text-white hover:bg-white/10" aria-label="Cerrar" onClick={onClose}><X className="h-6 w-6" /></button></div>
      <div className="relative flex flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {photos.length > 1 && <button className="absolute left-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Foto anterior" onClick={() => onIndex((index - 1 + photos.length) % photos.length)}><ChevronLeft className="h-6 w-6" /></button>}
        <img src={p.image_url} alt={p.alt || p.title || ''} className="max-h-[78vh] max-w-full rounded-lg object-contain" />
        {photos.length > 1 && <button className="absolute right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Foto siguiente" onClick={() => onIndex((index + 1) % photos.length)}><ChevronRight className="h-6 w-6" /></button>}
      </div>
      <div className="mx-auto max-w-2xl pt-3 text-center text-white" onClick={(e) => e.stopPropagation()}>
        <p className="mt-1 text-xs text-white/50">{index + 1} / {photos.length}</p>
      </div>
    </div>
  );
}

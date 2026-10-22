import { useState } from 'react';
import { DnaSymbol } from './DnaSymbol';

/** Imagen con carga diferida y un fondo de marca si falta o falla. */
export function Img({ src, alt, className = '', fallbackTone = 'petrol' }: { src?: string | null; alt?: string | null; className?: string; fallbackTone?: 'petrol' | 'mist' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden ${fallbackTone === 'petrol' ? 'bg-gradient-to-br from-petrol to-petrol-deep' : 'bg-mist'} ${className}`} aria-hidden>
        <div className="helix-bg absolute inset-0 opacity-60" />
        <DnaSymbol spin={false} className={`relative h-1/2 max-h-24 w-auto ${fallbackTone === 'petrol' ? 'opacity-90' : 'opacity-40'}`} />
      </div>
    );
  }
  return <img src={src} alt={alt ?? ''} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}

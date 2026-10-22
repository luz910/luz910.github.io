import { useEffect, useRef } from 'react';

/**
 * Símbolo de ADN de BIOQUNS (recortado del logo original, sin redibujar).
 * Gira sobre su eje cada vez que vuelve a entrar en pantalla.
 * Si el dispositivo pide reducir animaciones, se muestra quieto.
 */
export function DnaSymbol({ className = '', alt = '', spin = true }: { className?: string; alt?: string; spin?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !spin) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.remove('is-spinning');
            void el.offsetWidth; // reinicia la animación
            el.classList.add('is-spinning');
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [spin]);
  return (
    <img
      ref={ref}
      src="/brand/simbolo-adn.png"
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={`dna-spin select-none ${className}`}
      draggable={false}
      width={267}
      height={364}
    />
  );
}

/** Indicador de carga con el símbolo girando. */
export function DnaLoader({ label = 'Cargando…', className = '' }: { label?: string; className?: string }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 py-16 text-sm text-mute ${className}`}>
      <img src="/brand/simbolo-adn.png" alt="" aria-hidden className="dna-loading h-12 w-auto" />
      <span>{label}</span>
    </div>
  );
}

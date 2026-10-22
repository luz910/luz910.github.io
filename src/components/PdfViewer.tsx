import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { DnaLoader } from './DnaSymbol';

/** Visor de PDF propio (pdf.js): funciona igual en computadoras y celulares. */
export function PdfViewer({ url, title }: { url: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    let doc: any;
    (async () => {
      try {
        setState('loading');
        const pdfjs = await import('pdfjs-dist');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        doc = await pdfjs.getDocument({ url }).promise;
        const el = box.current!;
        el.innerHTML = '';
        const width = el.clientWidth * zoom;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let i = 1; i <= doc.numPages && !cancelled; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width; canvas.height = vp.height;
          canvas.style.width = `${width}px`;
          canvas.className = 'mx-auto mb-4 block rounded-lg bg-white shadow-md';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `${title} — página ${i} de ${doc.numPages}`);
          el.appendChild(canvas);
          await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: vp } as any).promise;
        }
        if (!cancelled) setState('ok');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; doc?.cleanup?.(); };
  }, [url, zoom, title]);

  return (
    <div className="rounded-2xl bg-mist p-3 sm:p-5">
      <div className="mb-3 flex justify-end gap-2">
        <button className="btn-ghost h-9 w-9 !p-0" aria-label="Alejar" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}><ZoomOut className="h-4 w-4" /></button>
        <button className="btn-ghost h-9 w-9 !p-0" aria-label="Acercar" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}><ZoomIn className="h-4 w-4" /></button>
      </div>
      {state === 'loading' && <DnaLoader label="Cargando póster…" />}
      {state === 'error' && <p className="py-10 text-center text-sm text-mute">No se pudo mostrar el PDF en el navegador. Usá el botón de descarga.</p>}
      <div className="overflow-auto" style={{ maxHeight: '80vh' }}><div ref={box} /></div>
    </div>
  );
}

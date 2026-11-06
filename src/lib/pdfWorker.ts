/** Devuelve la dirección del "worker" de pdf.js envuelta con los parches (polyfills) que necesita,
 *  para que funcione también en navegadores que todavía no tienen las funciones nuevas de JavaScript. */
const POLY = `for (const C of [Map, WeakMap]) { const P = C.prototype;
  if (!P.getOrInsert) P.getOrInsert = function (k, v) { if (!this.has(k)) this.set(k, v); return this.get(k); };
  if (!P.getOrInsertComputed) P.getOrInsertComputed = function (k, f) { if (!this.has(k)) this.set(k, f(k)); return this.get(k); }; }`;
let cached: string | null = null;
export async function workerUrl(src: string): Promise<string> {
  if (cached) return cached;
  const abs = new URL(src, window.location.href).href;
  // Primero se evalúa el módulo de parches y después el worker real (los import se ejecutan en orden).
  const poly = URL.createObjectURL(new Blob([POLY], { type: 'text/javascript' }));
  const code = `import ${JSON.stringify(poly)};\nexport * from ${JSON.stringify(abs)};`;
  cached = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  return cached;
}

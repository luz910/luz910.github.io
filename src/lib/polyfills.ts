// Funciones muy nuevas de JavaScript que usa el lector de PDF (pdf.js) y que muchos navegadores todavía no tienen.
for (const C of [Map, WeakMap] as any[]) {
  const P = C.prototype;
  if (!P.getOrInsert) P.getOrInsert = function (k: any, v: any) { if (!this.has(k)) this.set(k, v); return this.get(k); };
  if (!P.getOrInsertComputed) P.getOrInsertComputed = function (k: any, f: (k: any) => any) { if (!this.has(k)) this.set(k, f(k)); return this.get(k); };
}
export {};

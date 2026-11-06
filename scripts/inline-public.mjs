// Inserta como data: URI las imágenes de /public que la demostración referencia por ruta absoluta.
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'dist-demo/index.html';
let html = readFileSync(file, 'utf8');
const assets = ['/brand/simbolo-adn.png', '/brand/wordmark.png', '/brand/portada.jpg', '/brand/poster-tarjeta.jpg', '/brand/logo-completo.png', '/brand/og-default.jpg', '/brand/icon-192.png', '/logos/uns.png', '/logos/dirEaD.png', '/favicon.png'];
for (const a of assets) {
  const mime = a.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
  const uri = `data:${mime};base64,${readFileSync('public' + a).toString('base64')}`;
  html = html.split(`"${a}"`).join(`"${uri}"`).split(`'${a}'`).join(`'${uri}'`).split('`' + a + '`').join('`' + uri + '`');
}
writeFileSync(file, html);
const left = assets.filter((a) => html.includes(a));
console.log('demo:', (html.length / 1e6).toFixed(2), 'MB', left.length ? 'SIN REEMPLAZAR: ' + left : 'ok');

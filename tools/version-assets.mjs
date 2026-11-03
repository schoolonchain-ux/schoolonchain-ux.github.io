// Añade a cada <script>/<link> de assets/ un ?v=<huella del contenido>, para que ningún navegador use una copia vieja tras un cambio.
// Uso: node tools/version-assets.mjs   (ejecutar antes de cada commit que toque assets/; es idempotente)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const paginas = fs.readdirSync(raiz).filter((f) => f.endsWith('.html'));
let cambios = 0;
for (const p of paginas) {
  const f = path.join(raiz, p); const src = fs.readFileSync(f, 'utf8');
  const out = src.replace(/((?:href|src)=")(assets\/[^"?]+\.(?:css|js))(?:\?v=[0-9a-f]+)?(")/g, (m, a, ruta, c) => {
    const fa = path.join(raiz, ruta); if (!fs.existsSync(fa)) return m;
    const h = crypto.createHash('sha1').update(fs.readFileSync(fa)).digest('hex').slice(0, 8);
    return a + ruta + '?v=' + h + c;
  });
  if (out !== src) { fs.writeFileSync(f, out); cambios++; console.log('actualizado', p); }
}
console.log(cambios ? cambios + ' página(s) actualizada(s)' : 'sin cambios');

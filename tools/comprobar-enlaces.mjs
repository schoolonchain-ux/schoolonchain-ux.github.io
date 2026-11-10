// Comprobador de enlaces del sitio: recorre las páginas HTML de la raíz y los ficheros de datos que llevan enlaces
// (reports/index.json, data/cambios.json, data/novedades.json, data/busqueda.json) y avisa de todo enlace interno
// que apunte a un fichero que no existe, y de toda página de la raíz a la que no enlaza ninguna otra (huérfana).
// No sale a Internet: los enlaces externos solo se cuentan. Uso: node tools/comprobar-enlaces.mjs [carpeta]  (termina con código 1 si hay rotos)
import fs from 'node:fs'; import path from 'node:path';
const R = process.argv[2] || '.'; const p = (f) => path.join(R, f); const existe = (f) => fs.existsSync(p(f));
const paginas = fs.readdirSync(R).filter((f) => f.endsWith('.html'));
const rotos = []; const entrantes = new Map(paginas.map((f) => [f, new Set()])); let internos = 0, externos = 0;
const destino = (h) => { let u = h.split('#')[0]; if (u.startsWith('doc.html?f=')) return [decodeURIComponent(u.slice(11).split('&')[0]), 'doc.html']; u = u.split('?')[0]; if (u === '' || u === './') u = 'index.html'; return [u.replace(/^\.\//, ''), null]; };
const mira = (h, origen) => {
  if (!h || /^(mailto:|javascript:|data:|#)/.test(h)) return; if (/^https?:\/\//.test(h)) { externos++; return; }
  internos++; const [f, via] = destino(h); const fichero = f.endsWith('/') ? f.slice(0, -1) : f;
  if (!existe(fichero)) rotos.push(origen + ' -> ' + h); if (via && !existe(via)) rotos.push(origen + ' -> ' + via);
  const pg = via || fichero; if (entrantes.has(pg) && pg !== origen) entrantes.get(pg).add(origen);
};
for (const f of paginas) { const s = fs.readFileSync(p(f), 'utf8'); for (const m of s.matchAll(/\b(?:href|src)="([^"]+)"/g)) mira(m[1], f); }
// marca.js define la barra y el pie de todas las páginas
{ const s = fs.readFileSync(p('assets/marca.js'), 'utf8'); for (const m of s.matchAll(/['"]([a-z0-9-]+\.(?:html|xml)|\.\/#[a-z]+)['"]/g)) for (const f of paginas) mira(m[1], f); }
const json = (f) => (existe(f) ? JSON.parse(fs.readFileSync(p(f), 'utf8')) : null);
const I = json('reports/index.json');
if (I) for (const r of I.informes) { const o = 'reports/index.json (' + r.slug + ')'; const base = 'reports/' + r.slug + '/';
  if (r.url) mira(r.url, o); for (const a of r.archivos || []) mira(path.posix.normalize(base + a.ruta), o);
  for (const e of (r.aviso && r.aviso.enlaces) || []) mira(e.href, o); for (const x of r.ficha || []) if (x.enlace) mira(x.enlace, o);
  for (const e of (r.versiones && r.versiones.ediciones) || []) { for (const a of e.archivos || []) mira(a.ruta, o); if (e.resumen) mira(e.resumen, o); }
  if (r.versiones && r.versiones.noPublicadas && r.versiones.noPublicadas.enlace) mira(r.versiones.noPublicadas.enlace, o);
  if (r.seguimiento && r.seguimiento.datos) mira(base + r.seguimiento.datos, o); if (r.imagen) mira(r.imagen, o); }
const K = json('data/cambios.json'); if (K) for (const c of K.cambios) for (const e of c.evidencia || []) mira(e.href, 'data/cambios.json (' + c.id + ')');
const N = json('data/novedades.json'); if (N) for (const x of N.novedades) mira(x.url || './', 'data/novedades.json');
const B = json('data/busqueda.json'); if (B) { for (const e of B.entradas) mira(e.u, 'data/busqueda.json'); for (const d of B.direcciones) if (d.u) mira(d.u, 'data/busqueda.json'); for (const t of B.transacciones) if (t.u) mira(t.u, 'data/busqueda.json'); }
const huerfanas = [...entrantes].filter(([f, s]) => f !== 'index.html' && s.size === 0).map(([f]) => f);
const unicos = [...new Set(rotos)];
console.log(paginas.length + ' páginas, ' + internos + ' enlaces internos comprobados, ' + externos + ' externos sin comprobar');
console.log('rotos: ' + unicos.length); for (const r of unicos.slice(0, 40)) console.log('  ' + r);
console.log('páginas huérfanas: ' + (huerfanas.length ? huerfanas.join(', ') : 'ninguna'));
process.exit(unicos.length || huerfanas.length ? 1 : 0);

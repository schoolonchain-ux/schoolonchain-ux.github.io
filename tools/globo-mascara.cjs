// Genera la mascara de tierra firme para el globo de puntos: una rejilla de paso fijo en latitud
// y un bit por punto (1 = tierra). Entrada: land-110m.json (Natural Earth, dominio publico, via world-atlas).
// Uso: node mascara-tierra.cjs <land-110m.json> <paso en grados>
const fs = require('node:fs');
const topo = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const PASO = Number(process.argv[3] || 1.5);
const { scale, translate } = topo.transform;
const arcos = topo.arcs.map((a) => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; }); });
const anillos = [];
for (const g of topo.objects.land.geometries) {
  const polis = g.type === 'MultiPolygon' ? g.arcs : [g.arcs];
  for (const poli of polis) for (const anillo of poli) {
    const pts = [];
    for (const i of anillo) { const a = i >= 0 ? arcos[i] : arcos[~i].slice().reverse(); for (let k = pts.length ? 1 : 0; k < a.length; k++) pts.push(a[k]); }
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    anillos.push({ pts, x0, x1, y0, y1 });
  }
}
function tierra(lon, lat) {
  if (lat < -84) return true; // el contorno de la Antartida esta recortado a -85,6: mas al sur todo es tierra
  let dentro = false;
  for (const r of anillos) {
    if (lon < r.x0 || lon > r.x1 || lat < r.y0 || lat > r.y1) continue;
    const p = r.pts;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
  }
  return dentro;
}
const filas = Math.round(180 / PASO);
const bits = []; let total = 0, nTierra = 0;
for (let i = 0; i < filas; i++) {
  const lat = -90 + (i + 0.5) * PASO;
  const n = Math.max(1, Math.round((360 / PASO) * Math.cos((lat * Math.PI) / 180)));
  for (let j = 0; j < n; j++) { const lon = -180 + ((j + 0.5) * 360) / n; const t = tierra(lon, lat) ? 1 : 0; bits.push(t); total++; nTierra += t; }
}
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
let s = '';
for (let i = 0; i < bits.length; i += 6) { let v = 0; for (let k = 0; k < 6; k++) v = (v << 1) | (bits[i + k] || 0); s += ABC[v]; }
// comprobaciones de cordura: lugares conocidos
const pruebas = [['Madrid', -3.7, 40.4, 1], ['Atlantico', -30, 30, 0], ['Pacifico', -150, 0, 0], ['Sahara', 10, 23, 1], ['Siberia', 100, 62, 1], ['Australia', 134, -25, 1], ['Amazonas', -60, -5, 1], ['Indico', 80, -30, 0], ['Antartida', 0, -85, 1], ['Groenlandia', -40, 72, 1]];
let fallos = 0;
for (const [n, lon, lat, esp] of pruebas) { const r = tierra(lon, lat) ? 1 : 0; if (r !== esp) { fallos++; console.error('FALLA', n, r); } }
console.error(JSON.stringify({ paso: PASO, filas, total, tierra: nTierra, pct: +(100 * nTierra / total).toFixed(1), letras: s.length, fallos }));
if (fallos) process.exit(1);
process.stdout.write(s);

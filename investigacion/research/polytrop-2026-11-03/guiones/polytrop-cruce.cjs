'use strict';
// Cruce del CSV de direcciones de Polytrop con las direcciones que ya tenemos. Solo lectura. v2 (3-nov, tras la revisión de Codex): excluye los materiales de esta propia comparación
// (research/polytrop-2026-11-03 y las salidas del informe de trazabilidad v0.2, blockchain-investigator/state/informe-trazabilidad) para que la búsqueda de menciones no sea circular, separa Bitcoin de la dirección no-Bitcoin no-TRON/EVM (Solana) y escribe en datos/.
// Definiciones: «rastreada» = clave de rec/term de las cachés de los tramos 3-6, nodos de eth-adelante-v2 (tramos 5 y 6) o semillas; «solo mencionada» = su texto aparece en algún fichero de los directorios
// examinados (extensiones json, jsonl, md, txt, csv, html, cjs, js; se omiten ficheros > 60 MB, nombres con «antes-de», .bak o .v1., carpetas node_modules/.git/respaldo/figuras y profundidad > 6); «no tenemos» = ninguna de las dos.
const fs = require('fs'); const path = require('path');
const R = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/'; const DATOS = path.join(__dirname, '..', 'datos') + '/';
const lines = fs.readFileSync(DATOS + 'polytrop-binance-hack-addresses.csv', 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
const csv = new Map(); for (const l of lines) { const [a, r] = l.split(','); csv.set(a.startsWith('0x') ? a.toLowerCase() : a, r); }
const norm = a => a.startsWith('0x') ? a.toLowerCase() : a;
const red = a => a.startsWith('T') ? 'tron' : a.startsWith('0x') ? 'evm' : /^bc1/.test(a) ? 'bitcoin' : 'otra (probable Solana)';
const RE_T = /\bT[1-9A-HJ-NP-Za-km-z]{33}\b/g, RE_E = /\b0x[0-9a-fA-F]{40}\b/g, RE_B = /\bbc1[ac-hj-np-z02-9]{20,60}\b/g;
const A = new Map(); const addA = (a, f) => { a = norm(a); if (!A.has(a)) A.set(a, new Set()); A.get(a).add(f); };
for (const t of ['tramo3', 'tramo4', 'tramo5', 'tramo6']) {
  const f = R + t + '/' + t + '-cache.json'; if (!fs.existsSync(f)) continue; const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const k of Object.keys(j.rec || {})) addA(k, t + ':rastreada'); for (const k of Object.keys(j.term || {})) addA(k, t + ':terminal');
  const fs_ = R + t + '/semillas.json'; if (fs.existsSync(fs_)) for (const s of JSON.parse(fs.readFileSync(fs_, 'utf8'))) if (s.a) addA(s.a, t + ':semilla');
}
for (const t of (process.env.ETH_DIRS || 'tramo5,tramo6').split(',')) { const f = R + t + '/eth-adelante-v2.json';   // ETH_DIRS: carpetas cuyos nodos de Ethereum cuentan como «rastreadas» (v0.3: tramo5,tramo6,tramo5-v03,tramo6-v03)
  if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f, 'utf8')); for (const k of Object.keys(j.nodos || {})) addA(k, t + ':eth-rastreada'); } }
const B = new Map(); const addB = (a, f) => { a = norm(a); if (!csv.has(a)) return; if (!B.has(a)) B.set(a, new Set()); B.get(a).add(f); };
const otras = [...csv.keys()].filter(a => red(a) === 'otra (probable Solana)');   // direcciones de formato distinto: se buscan por texto exacto
let ficherosLeidos = 0, omitidos = 0;
function barrer(dir, depth = 0) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name); if (e.isDirectory()) { if (/node_modules|\.git$|respaldo|figuras|polytrop-2026-11-03|informe-trazabilidad/.test(e.name) || depth > 6) continue; barrer(p, depth + 1); continue; }
    if (!/\.(json|jsonl|md|txt|csv|html|cjs|js)$/.test(e.name)) continue; let st; try { st = fs.statSync(p); } catch { continue; } if (st.size > 60e6 || /antes-de|\.bak|\.v1\./.test(e.name)) { omitidos++; continue; }
    let s; try { s = fs.readFileSync(p, 'utf8'); } catch { continue; } ficherosLeidos++; const rel = p.replace(/\\/g, '/').replace('C:/EquipoIA/', '');
    for (const m of s.match(RE_T) || []) addB(m, rel); for (const m of s.match(RE_E) || []) addB(m, rel); for (const m of s.match(RE_B) || []) addB(m, rel); for (const o of otras) if (s.includes(o)) addB(o, rel);
  }
}
for (const d of ['research', 'blockchain-investigator', 'docs', 'tron-salidas-watch', 'eth-salidas-watch', 'chainscope/data', 'audits']) barrer('C:/EquipoIA/' + d);
const out = { total: csv.size, ficherosLeidos, omitidos, leidoEn: new Date().toISOString(), filas: [] };
const cuenta = { source: { A: 0, B: 0, no: 0 }, flagged: { A: 0, B: 0, no: 0 } }; const noTenemos = [];
for (const [a, rol] of csv) { const enA = A.has(a), enB = B.has(a); const k = enA ? 'A' : enB ? 'B' : 'no'; cuenta[rol][k]++; if (k === 'no') noTenemos.push({ a, rol, red: red(a) }); out.filas.push({ a, rol, red: red(a), rastreada: enA ? [...A.get(a)].slice(0, 4) : null, mencionada: enB ? [...B.get(a)].slice(0, 3) : null }); }
console.log(JSON.stringify(cuenta), 'ficheros leídos', ficherosLeidos, 'omitidos', omitidos);
const porRed = {}; for (const x of noTenemos) { const k = x.rol + ' ' + x.red; porRed[k] = (porRed[k] || 0) + 1; } console.log('NO tenemos por rol/red', JSON.stringify(porRed));
fs.writeFileSync(DATOS + 'polytrop-cruce.json', JSON.stringify(out)); fs.writeFileSync(DATOS + 'polytrop-no-tenemos.json', JSON.stringify(noTenemos));

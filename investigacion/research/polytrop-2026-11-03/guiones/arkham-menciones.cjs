'use strict';
// Para cada dirección del CSV de Arkham: ¿aparece su texto en algún fichero nuestro? (mismos directorios y filtros que polytrop-cruce.cjs; sin los materiales de esta comparación). Solo lectura.
const fs = require('fs'); const path = require('path');
const A = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'datos', 'arkham-cruce.json'), 'utf8')).filas;
const dirs = new Map(); for (const f of A) for (const [a, e] of [[f.de, f.deEtiqueta], [f.a, f.aEtiqueta]]) dirs.set(a.startsWith('0x') ? a.toLowerCase() : a, e);
const hashes = new Map(A.map(f => [f.tx.toLowerCase().replace(/^0x/, ''), f.tx]));
const hallA = new Map(), hallH = new Map(); let leidos = 0;
function barrer(dir, depth = 0) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) { const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (/node_modules|\.git$|respaldo|figuras|polytrop-2026-11-03|informe-trazabilidad/.test(e.name) || depth > 6) continue; barrer(p, depth + 1); continue; }
    if (!/\.(json|jsonl|md|txt|csv|html|cjs|js)$/.test(e.name)) continue; let st; try { st = fs.statSync(p); } catch { continue; } if (st.size > 60e6 || /antes-de|\.bak|\.v1\./.test(e.name)) continue;
    let s; try { s = fs.readFileSync(p, 'utf8'); } catch { continue; } leidos++; const lo = s.toLowerCase(); const rel = p.replace(/\\/g, '/').replace('C:/EquipoIA/', '');
    for (const [a] of dirs) { if (s.includes(a) || (a.startsWith('0x') && lo.includes(a))) { if (!hallA.has(a)) hallA.set(a, new Set()); hallA.get(a).add(rel); } }
    for (const [h, orig] of hashes) { if (lo.includes(h)) { if (!hallH.has(orig)) hallH.set(orig, new Set()); hallH.get(orig).add(rel); } } }
}
for (const d of ['research', 'blockchain-investigator', 'docs', 'tron-salidas-watch', 'eth-salidas-watch', 'chainscope/data', 'audits']) barrer('C:/EquipoIA/' + d);
const out = { leidos, direcciones: [...dirs].map(([a, e]) => ({ a, etiqueta: e, ficheros: hallA.has(a) ? [...hallA.get(a)].slice(0, 4) : [] })), hashes: [...hashes.values()].map(h => ({ h, ficheros: hallH.has(h) ? [...hallH.get(h)].slice(0, 4) : [] })) };
fs.writeFileSync(path.join(__dirname, '..', 'datos', 'arkham-menciones.json'), JSON.stringify(out, null, 1));
console.log('ficheros leídos', leidos, '| direcciones', out.direcciones.length, 'con mención', out.direcciones.filter(x => x.ficheros.length).length, '| hashes con mención', out.hashes.filter(x => x.ficheros.length).length, 'de', out.hashes.length);
for (const d of out.direcciones) console.log((d.ficheros.length ? 'SI ' : 'no ') + d.a.slice(0, 12) + ' ' + (d.etiqueta || '').slice(0, 36) + (d.ficheros.length ? ' ← ' + d.ficheros.slice(0, 2).join(', ').slice(0, 150) : ''));

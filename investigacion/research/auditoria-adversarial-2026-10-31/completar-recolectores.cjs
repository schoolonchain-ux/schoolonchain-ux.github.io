'use strict';
// TRAMO 4 · hueco «contrato recolector»: TXtEs6t2… es un contrato de depósito (método depositErc20 con un identificador) que barre TODO lo recibido a una única dirección, TYVWGh8X…
// (comprobado en cadena: de 58.826.875 USDT que salieron del contrato en 2 días, 58.826.752 fueron a esa dirección). Se anota cada depósito como salto «recolector» hacia esa dirección.
// Hace copia de la caché antes de tocarla.
const fs = require('fs');
const OUT = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo4/'; const SEG = 3520;
const RECOLECTORES = { TXtEs6t2oUWQsNos7m68gbHdE9Q5n6x2oN: 'TYVWGh8XkmU49Hi9PkGAZXiiJPB3J5zJZy' };
const cachePath = OUT + 'tramo4-cache.json'; const resp = OUT + 'tramo4-cache.antes-de-recolectores.json'; if (!fs.existsSync(resp)) fs.copyFileSync(cachePath, resp);
const { rec, term } = JSON.parse(fs.readFileSync(cachePath, 'utf8')); let n = 0, total = 0; const porContrato = {};
for (const w of Object.keys(rec)) { if (!rec[w].ok) continue; for (const e of rec[w].sal || []) { const dest = RECOLECTORES[e.a]; if (!dest || e.v < SEG) continue; rec[w].via = rec[w].via || []; if (rec[w].via.some(v => v.tx === e.tx && v.via === 'recolector')) continue; rec[w].via.push({ a: dest, v: e.v, at: e.at, tx: e.tx, sim: e.sim, cant: e.cant, via: 'recolector', contrato: e.a }); rec[w].viaHechas = (rec[w].viaHechas || []).concat(e.tx); n++; total += e.v; porContrato[e.a] = (porContrato[e.a] || 0) + e.v; } }
fs.writeFileSync(cachePath, JSON.stringify({ rec, term, t: new Date().toISOString() }));
fs.writeFileSync(OUT + 'recolectores-informe.json', JSON.stringify({ recolectores: RECOLECTORES, saltos: n, total, porContrato }, null, 1));
console.log('saltos anotados', n, 'por', Math.round(total).toLocaleString('en'), '$');

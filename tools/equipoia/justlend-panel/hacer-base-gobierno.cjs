'use strict';
// Referencia de gobierno del 13-nov-2026 (lectura de la investigación, solo lectura): quién es dueño, qué implementación y qué modelo de tipos tiene cada mercado.
// El panel compara con ello la lectura en vivo y avisa de cualquier cambio. Uso: node hacer-base-gobierno.cjs <resultados/02-gobierno.json> <resultados/03-timelock-y-precios.json>
const fs = require('node:fs'), path = require('node:path');
const g = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), t = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const out = {
  fecha: g.leido, comptroller: g.comptroller, comp: g.comp,
  timelock: { admin: t.timelock.admin, retardoSeg: Number(t.timelock.delaySeg) },
  mercados: Object.fromEntries(g.mercados.map((m) => [m.jToken, { simbolo: m.simbolo, admin: m.admin, implementacion: m.implementacion, comptroller: m.comptroller, modeloTipos: m.modeloTipos }])),
};
fs.writeFileSync(path.join(__dirname, 'base-gobierno.json'), JSON.stringify(out, null, 1));
console.log('base-gobierno.json:', Object.keys(out.mercados).length, 'mercados; comp', JSON.stringify(out.comp).slice(0, 200));

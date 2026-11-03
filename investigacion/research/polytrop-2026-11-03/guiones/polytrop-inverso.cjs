'use strict';
const fs = require('fs'); const R = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const csv = new Map(fs.readFileSync('C:/Users/Equipo/Downloads/polytrop-binance-hack-addresses.csv', 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map(l => { const [a, r] = l.split(','); return [a.toLowerCase(), r]; }));
const fmt = n => Math.round(n).toLocaleString('en');
for (const t of ['tramo3', 'tramo4', 'tramo5', 'tramo6']) {
  const j = JSON.parse(fs.readFileSync(R + t + '/' + t + '-cache.json', 'utf8')); const filas = [];
  for (const [w, r] of Object.entries(j.rec)) { if (!r.ok) continue; const ent = (r.ent || []).reduce((s, e) => s + (e.v || 0), 0); filas.push({ w, ent, enCsv: csv.get(w.toLowerCase()) || null }); }
  const tot = filas.reduce((s, f) => s + f.ent, 0), en = filas.filter(f => f.enCsv), fuera = filas.filter(f => !f.enCsv);
  console.log(`${t}: billeteras ${filas.length} | en CSV ${en.length} (${fmt(en.reduce((s, f) => s + f.ent, 0))} $ de entradas) | FUERA del CSV ${fuera.length} (${fmt(fuera.reduce((s, f) => s + f.ent, 0))} $)`);
  console.log('  mayores fuera del CSV:', fuera.sort((a, b) => b.ent - a.ent).slice(0, 6).map(f => f.w.slice(0, 8) + ' ' + fmt(f.ent)).join(' | '));
  // terminales nuestros (casas de cambio, servicios) que el CSV marca
  const ter = Object.entries(j.term || {}); const tEn = ter.filter(([w]) => csv.has(w.toLowerCase()));
  console.log(`  terminales ${ter.length}; en CSV ${tEn.length}: ${tEn.slice(0, 4).map(([w, x]) => w.slice(0, 8) + ' ' + (x.clase && x.clase.nombre || x.clase && x.clase.tipo || '')).join(' | ')}`);
}

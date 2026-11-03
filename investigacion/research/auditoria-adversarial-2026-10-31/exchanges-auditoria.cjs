'use strict';
// Auditoría de casas de cambio: por cada casa, bruto recibido desde el recorrido vs atribuido (pureza) vs depósitos identificados; sensibilidad a la pureza; concentración.
// Entrada: aristas terminales de los dos tramos (CSV originales, no se modifican). Solo lectura.
const fs = require('fs');
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';
const leer = (f, tramo) => fs.readFileSync(D + f, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/).slice(1).map(l => {
  const c = l.split(';'); return { tramo, hora: c[0], de: c[1], a: c[2], tipo: c[3], nombre: c[4] || '(sin nombre)', imp: Number(c[5]), tok: c[6], pur: Number(c[7]), robo: Number(c[8]), niv: Number(c[9]), tx: c[10] };
});
const E = leer('traza-aristas-terminales.csv', 1).concat(leer('traza-post-aristas-terminales.csv', 2));
const toks = {}; for (const e of E) toks[e.tok] = (toks[e.tok] || 0) + 1; console.log('aristas', E.length, 'tokens', JSON.stringify(toks));
const usd = e => (e.tok === 'TRX' ? e.imp * 0.352 : e.imp);
const fmt = n => Math.round(n).toLocaleString('en');
const casas = E.filter(e => e.tipo === 'casa'), porNombre = {};
for (const e of casas) {
  const x = porNombre[e.nombre] || (porNombre[e.nombre] = { n: 0, bruto: 0, atrib: 0, dep: new Set(), rem: new Set(), maxDep: 0, pur: [], porTramo: { 1: 0, 2: 0 }, bajaPureza: 0, altaPureza: 0 });
  x.n++; x.bruto += usd(e); x.atrib += e.robo; x.dep.add(e.a); x.rem.add(e.de); x.maxDep = Math.max(x.maxDep, usd(e)); x.pur.push(e.pur); x.porTramo[e.tramo] += e.robo;
  if (e.pur < 0.5) x.bajaPureza += e.robo; if (e.pur >= 0.9) x.altaPureza += e.robo;
}
console.log('\nCASA                aristas  bruto$        atribuido$   %atrib  pureza_media  atrib(pureza≥0,9)  atrib(pureza<0,5)  depósitos  remitentes  mayor_depósito$  tramo1/tramo2 atrib$');
const tot = { bruto: 0, atrib: 0 };
for (const [n, x] of Object.entries(porNombre).sort((a, b) => b[1].atrib - a[1].atrib)) {
  tot.bruto += x.bruto; tot.atrib += x.atrib;
  console.log(n.padEnd(20), String(x.n).padStart(6), fmt(x.bruto).padStart(12), fmt(x.atrib).padStart(12), (x.atrib / x.bruto * 100).toFixed(0).padStart(5) + '%', (x.pur.reduce((s, v) => s + v, 0) / x.pur.length).toFixed(2).padStart(10), fmt(x.altaPureza).padStart(16), fmt(x.bajaPureza).padStart(17), String(x.dep.size).padStart(9), String(x.rem.size).padStart(10), fmt(x.maxDep).padStart(14), fmt(x.porTramo[1]) + ' / ' + fmt(x.porTramo[2]));
}
console.log('TOTAL casas: bruto', fmt(tot.bruto), '| atribuido', fmt(tot.atrib), '| ratio', (tot.atrib / tot.bruto * 100).toFixed(1) + '%');
// ¿qué parte de lo atribuido a casas entra desde nodos de servicio vs. desde carteras corrientes del recorrido?
const clases = JSON.parse(fs.readFileSync(D + 'traza-clases.json', 'utf8'));
const cl = a => (clases[a] && clases[a].tipo) || (clases.clases && clases.clases[a] && clases.clases[a].tipo) || 'cartera';
const pr = {}; for (const e of casas) { const t = cl(e.de); pr[t] = (pr[t] || 0) + e.robo; } console.log('atribuido a casas según la clase de quien envía:', JSON.stringify(Object.fromEntries(Object.entries(pr).map(([k, v]) => [k, Math.round(v)]))));
// concentración: los 10 mayores depósitos individuales (tx) y la parte del total
const top = casas.slice().sort((a, b) => b.robo - a.robo).slice(0, 10);
console.log('\nTop 10 aristas casa por atribuido:'); for (const e of top) console.log(' ', e.hora, e.nombre.padEnd(14), 'de', e.de.slice(0, 10), '→', e.a.slice(0, 10), 'bruto', fmt(usd(e)), 'pureza', e.pur, 'atrib', fmt(e.robo), 'nivel', e.niv, e.tx.slice(0, 12));
console.log('top10 = ', (top.reduce((s, e) => s + e.robo, 0) / tot.atrib * 100).toFixed(1) + '% de lo atribuido a casas');
// sensibilidad: atribuido si se exige pureza mínima (solo aristas con pureza >= umbral) → cota inferior de lo «casi seguro»
console.log('\nSensibilidad (atribuido a casas contando solo aristas con pureza ≥ umbral):'); for (const u of [0, 0.25, 0.5, 0.75, 0.9, 0.99]) console.log('  ≥', u, fmt(casas.filter(e => e.pur >= u).reduce((s, e) => s + e.robo, 0)));
// verificación de coherencia interna: robo ≈ imp·pureza
let desv = 0, nd = 0; for (const e of casas) { const esperado = usd(e) * e.pur; if (Math.abs(esperado - e.robo) > Math.max(2, esperado * 0.02)) { desv++; nd += Math.abs(esperado - e.robo); } } console.log('\naristas casa donde atribuido ≠ bruto·pureza (±2 %):', desv, 'de', casas.length, '| diferencia absoluta acumulada', fmt(nd));
fs.writeFileSync(__dirname + '/resultados/exchanges.json', JSON.stringify({ porNombre: Object.fromEntries(Object.entries(porNombre).map(([k, x]) => [k, { n: x.n, bruto: x.bruto, atrib: x.atrib, depositos: x.dep.size, remitentes: x.rem.size, maxDep: x.maxDep, altaPureza: x.altaPureza, bajaPureza: x.bajaPureza, porTramo: x.porTramo }])), total: tot, top: top.map(e => ({ hora: e.hora, nombre: e.nombre, de: e.de, a: e.a, bruto: usd(e), pur: e.pur, atrib: e.robo, nivel: e.niv, tx: e.tx })) }, null, 1));

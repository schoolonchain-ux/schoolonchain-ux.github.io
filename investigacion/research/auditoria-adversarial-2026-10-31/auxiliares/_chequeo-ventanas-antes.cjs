// Comprobación de R6-01: ¿alguna billetera tiene una llegada conocida (>= 3.520 $) anterior a su ventana de lectura (desde - 120 s)?
const fs = require('fs'); const rec = JSON.parse(fs.readFileSync(__dirname + '/../tramo3/tramo3-cache.antes-de-ventanas.json', 'utf8')).rec;
const SEG = 3520; const primera = {}; let n = 0, bruto = 0, nw = new Set();
for (const [w, r] of Object.entries(rec)) for (const e of [...(r.sal || []), ...(r.via || [])]) { if (!(e.v >= SEG)) continue; const x = primera[e.a]; if (x === undefined || e.at < x) primera[e.a] = e.at; }
for (const [w, r] of Object.entries(rec)) for (const e of [...(r.sal || []), ...(r.via || [])]) { const d = rec[e.a]; if (d && d.desde && e.v >= SEG && e.at < d.desde - 120000) { n++; bruto += e.v; nw.add(e.a); } }
console.log('wallets leidas', Object.keys(rec).length, '| con llegadas conocidas anteriores a su ventana:', nw.size, '| llegadas', n, '| bruto $', Math.round(bruto));

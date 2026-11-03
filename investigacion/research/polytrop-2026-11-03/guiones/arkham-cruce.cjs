'use strict';
// Cruce del CSV de transacciones de Arkham (descarga del propietario, 3-nov) con lo que tenemos. Solo lectura.
// Para cada transacción: ¿su hash está en nuestros datos? ¿están sus direcciones en nuestras cachés / vigilantes / lista de Polytrop? Y qué etiquetas pone Arkham.
const fs = require('fs'); const path = require('path');
const F = 'C:/Users/Equipo/Downloads/arkham_txns.csv'; const R = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
function parse(s) { const rows = []; let r = [], c = '', q = false; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (q) { if (ch === '"') { if (s[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { r.push(c); c = ''; } else if (ch === '\n') { r.push(c.replace(/\r$/, '')); rows.push(r); r = []; c = ''; } else c += ch; } if (c || r.length) { r.push(c); rows.push(r); } return rows; }
const T = parse(fs.readFileSync(F, 'utf8')).filter(x => x.length > 5); const H = T[0]; const tx = T.slice(1).map(x => Object.fromEntries(H.map((k, i) => [k, x[i]])));
const norm = a => (a || '').startsWith('0x') ? a.toLowerCase() : a;
const polytrop = new Map(fs.readFileSync(path.join(__dirname, '..', 'datos', 'polytrop-binance-hack-addresses.csv'), 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map(l => { const [a, r] = l.split(','); return [norm(a), r]; }));
const dirs = new Map(); const add = (a, f) => { a = norm(a); if (!dirs.has(a)) dirs.set(a, new Set()); dirs.get(a).add(f); };
const textos = {}; // texto crudo de las cachés, para buscar hashes
for (const t of ['tramo3', 'tramo4', 'tramo5', 'tramo6']) { const f = R + t + '/' + t + '-cache.json'; const s = fs.readFileSync(f, 'utf8'); textos[t] = s; const j = JSON.parse(s); for (const k of Object.keys(j.rec || {})) add(k, t + ':rastreada'); for (const k of Object.keys(j.term || {})) add(k, t + ':terminal'); }
for (const t of ['tramo5', 'tramo6']) { const f = R + t + '/eth-adelante-v2.json'; if (fs.existsSync(f)) { const s = fs.readFileSync(f, 'utf8'); textos[t + '-eth'] = s; for (const k of Object.keys(JSON.parse(s).nodos || {})) add(k, t + ':eth'); } }
for (const f of ['C:/EquipoIA/eth-salidas-watch/config/cuentas.json', 'C:/EquipoIA/tron-salidas-watch/config/cuentas.json']) { const s = fs.readFileSync(f, 'utf8'); for (const m of s.match(/\bT[1-9A-HJ-NP-Za-km-z]{33}\b|\b0x[0-9a-fA-F]{40}\b/g) || []) add(m, 'vigilante'); }
const hashEnNuestros = h => Object.entries(textos).filter(([, s]) => s.includes(h)).map(([k]) => k);
const out = []; const res = { total: tx.length, porRed: {}, hashNuestro: 0, deNuestro: 0, aNuestro: 0, deCSV: 0, aCSV: 0, ninguna: 0, usd: 0 };
for (const x of tx) { const de = norm(x.fromAddress), a = norm(x.toAddress); const hn = hashEnNuestros(x.transactionHash); const dN = dirs.has(de), aN = dirs.has(a), dP = polytrop.has(de), aP = polytrop.has(a);
  res.porRed[x.chain] = (res.porRed[x.chain] || 0) + 1; res.usd += +x.historicalUSD || 0; if (hn.length) res.hashNuestro++; if (dN) res.deNuestro++; if (aN) res.aNuestro++; if (dP) res.deCSV++; if (aP) res.aCSV++; if (!dN && !aN && !dP && !aP) res.ninguna++;
  out.push({ red: x.chain, t: x.blockTimestamp, tx: x.transactionHash, de: x.fromAddress, deEtiqueta: x.fromLabel, a: x.toAddress, aEtiqueta: x.toLabel, token: x.tokenSymbol, cantidad: +x.unitValue, usd: +x.historicalUSD, tipo: x.type, hashNuestro: hn, deNuestra: dN ? [...dirs.get(de)].slice(0, 2) : null, aNuestra: aN ? [...dirs.get(a)].slice(0, 2) : null, dePolytrop: dP ? polytrop.get(de) : null, aPolytrop: aP ? polytrop.get(a) : null }); }
console.log(JSON.stringify(res)); fs.writeFileSync(path.join(__dirname, '..', 'datos', 'arkham-cruce.json'), JSON.stringify({ resumen: res, filas: out }, null, 1));
for (const o of out) console.log([o.red, o.t.slice(5, 16), o.token, Math.round(o.usd), o.de.slice(0, 7) + '(' + (o.deEtiqueta || '').slice(0, 34) + ')', '→', o.a.slice(0, 7) + '(' + (o.aEtiqueta || '').slice(0, 34) + ')', 'hash:' + (o.hashNuestro.length ? 'SI' : 'no'), 'de:' + (o.deNuestra ? 'SI' : 'no') + (o.dePolytrop ? '/P' : ''), 'a:' + (o.aNuestra ? 'SI' : 'no') + (o.aPolytrop ? '/P' : '')].join(' '));

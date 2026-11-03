'use strict';
// Analiza datos/financiadora-gas-completa.json: a quién delegó recursos, a quién mandó TRX/creó cuentas, y cuáles de esas direcciones están en nuestros datos o en Polytrop.
const fs = require('fs'); const path = require('path'); const D = path.join(__dirname, '..', 'datos') + '/'; const R = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const J = JSON.parse(fs.readFileSync(D + 'financiadora-gas-completa.json', 'utf8')); const A = J.direccion;
const cach = ['tramo3', 'tramo4', 'tramo5', 'tramo6'].map(t => fs.readFileSync(R + t + '/' + t + '-cache.json', 'utf8')); const csv = fs.readFileSync(D + 'polytrop-binance-hack-addresses.csv', 'utf8');
const en = a => ({ nuestra: cach.some(s => s.includes(a)), polytrop: csv.includes(a) });
const por = (tipo) => { const m = new Map(); for (const f of J.filas.filter(f => f.tipo === tipo && f.de === A)) { const x = m.get(f.a) || { a: f.a, n: 0, trx: 0, primero: f.t, ultimo: f.t, recursos: {} }; x.n++; x.trx += f.trx || 0; x.ultimo = f.t; x.recursos[f.recurso || '-'] = (x.recursos[f.recurso || '-'] || 0) + 1; m.set(f.a, x); } return [...m.values()].map(x => ({ ...x, ...en(x.a) })); };
const res = {}; for (const tipo of ['DelegateResourceContract', 'TransferContract', 'AccountCreateContract']) { const l = por(tipo); res[tipo] = l;
  const n = l.length, nu = l.filter(x => x.nuestra).length, po = l.filter(x => x.polytrop).length, amb = l.filter(x => x.nuestra && x.polytrop).length, nin = l.filter(x => !x.nuestra && !x.polytrop).length;
  console.log(tipo, '| receptoras distintas', n, '| en nuestros datos', nu, '| en Polytrop', po, '| en ambas', amb, '| en ninguna', nin); }
const rec = {}; for (const f of J.filas.filter(f => f.tipo === 'DelegateResourceContract')) rec[f.recurso || '?'] = (rec[f.recurso || '?'] || 0) + 1; console.log('delegaciones por recurso', JSON.stringify(rec));
const d = res.DelegateResourceContract.sort((x, y) => y.n - x.n); console.log('delegaciones por receptora: máx', d[0].n, '| mediana', d[Math.floor(d.length / 2)].n, '| receptoras con ≥10:', d.filter(x => x.n >= 10).length);
console.log('top 10 receptoras de delegación:'); for (const x of d.slice(0, 10)) console.log(' ', x.a, x.n, 'veces', 'nuestra', x.nuestra, 'polytrop', x.polytrop);
const t0 = Math.min(...J.filas.map(f => f.t)), t1 = Math.max(...J.filas.map(f => f.t)); console.log('rango', new Date(t0).toISOString().slice(0, 16), '→', new Date(t1).toISOString().slice(0, 16));
const ent = J.filas.filter(f => f.a === A && f.tipo === 'TransferContract'); const rem = {}; for (const f of ent) { const x = rem[f.de] = rem[f.de] || { n: 0, trx: 0 }; x.n++; x.trx += f.trx; } console.log('remitentes de TRX a la cuenta:', JSON.stringify(Object.entries(rem).sort((a, b) => b[1].trx - a[1].trx).slice(0, 6)));
for (const a of ['TAT51WDhqSgozpH5pypBkEhe9kYXBAF8XJ', 'TUcEx932hBn1MtW6Mj7UMARCJaNo8ncac1']) console.log(a, JSON.stringify(en(a)));
fs.writeFileSync(D + 'financiadora-gas-analisis.json', JSON.stringify(res, null, 0));

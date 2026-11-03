'use strict';
// ¿Qué clientes que pagaron a TAT51WDhq… (el negocio que alimenta a la cuenta de gas) son billeteras de nuestro rastreo o de Polytrop, y cuándo? Cruza con las 129 receptoras de TRX de la cuenta de gas.
const fs = require('fs'); const path = require('path'); const D = path.join(__dirname, '..', 'datos') + '/'; const R = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const T = JSON.parse(fs.readFileSync(D + 'cuenta-TAT51WDh.json', 'utf8')); const G = JSON.parse(fs.readFileSync(D + 'financiadora-gas-completa.json', 'utf8'));
const cach = ['tramo3', 'tramo4', 'tramo5', 'tramo6'].map(t => fs.readFileSync(R + t + '/' + t + '-cache.json', 'utf8')); const csv = fs.readFileSync(D + 'polytrop-binance-hack-addresses.csv', 'utf8');
const marca = a => (cach.some(s => s.includes(a)) ? 'N' : '') + (csv.includes(a) ? 'P' : ''); const A = T.direccion;
const recGas = new Map(); for (const f of G.filas) if (f.tipo === 'TransferContract' && f.de === G.direccion && f.a) recGas.set(f.a, (recGas.get(f.a) || 0) + 1);
const pagos = [...T.trx.filter(x => x.a === A).map(x => ({ ...x, mon: 'TRX' })), ...T.u20.filter(x => x.a === A).map(x => ({ ...x, mon: 'USDT' }))].filter(x => x.v >= 1);
const desde = Date.UTC(2026, 9, 28); const hack = pagos.filter(x => x.t >= desde); const f = x => new Date(x).toISOString().slice(5, 16);
console.log('pagos a TAT51 (≥1 unidad):', pagos.length, '| desde 28-oct:', hack.length, '| clientes distintos desde 28-oct:', new Set(hack.map(x => x.de)).size);
const m = new Map(); for (const x of pagos) { const k = x.de; const e = m.get(k) || { a: k, n: 0, TRX: 0, USDT: 0, primero: x.t, ultimo: x.t, marca: marca(k), recibioGas: recGas.get(k) || 0 }; e.n++; e[x.mon] += x.v; e.ultimo = x.t; m.set(k, e); }
const cl = [...m.values()]; const dentro = cl.filter(e => e.marca); console.log('clientes del negocio en todo octubre-nov:', cl.length, '| de ellos en nuestro rastreo o Polytrop:', dentro.length, '| de ellos que también recibieron TRX de la cuenta de gas:', dentro.filter(e => e.recibioGas).length);
const hk = new Map(); for (const x of hack) { const e = hk.get(x.de) || { a: x.de, n: 0, TRX: 0, USDT: 0, marca: marca(x.de), recibioGas: recGas.get(x.de) || 0, primero: x.t }; e.n++; e[x.mon] += x.v; hk.set(x.de, e); } const hl = [...hk.values()];
console.log('clientes desde 28-oct:', hl.length, '| marcados N/P:', hl.filter(e => e.marca).length, '| recibieron gas:', hl.filter(e => e.recibioGas).length);
console.log('-- clientes marcados desde 28-oct'); for (const e of hl.filter(e => e.marca).sort((a, b) => a.primero - b.primero)) console.log('  ', e.a, '[' + e.marca + ']', f(e.primero), 'TRX', Math.round(e.TRX), 'USDT', Math.round(e.USDT), 'gas recibido', e.recibioGas);
// receptoras de gas que además pagaron al negocio
const ambos = [...recGas.keys()].filter(a => m.has(a)); console.log('receptoras de TRX de la cuenta de gas que también pagaron a TAT51:', ambos.length, 'de', recGas.size);
fs.writeFileSync(D + 'pagadores-tat51.json', JSON.stringify({ clientesMarcados: dentro, clientesDesde28oct: hl, receptorasQuePagaron: ambos }, null, 0));

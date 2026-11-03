'use strict';
// ¿Cae el precio de TRX por ventas del hacker? Contrasta el precio por hora (Binance TRXUSDT, API pública) con lo que las billeteras rastreadas
// mandan a contratos de intercambio (TRX enviado = venta de TRX; USDT enviado = compra de TRX), por hora UTC. Solo lectura; usa las cachés guardadas.
const fs = require('fs');
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/', T3 = __dirname + '/tramo3/';
const clases = Object.assign({}, JSON.parse(fs.readFileSync(D + 'traza-clases.json', 'utf8')), JSON.parse(fs.readFileSync(T3 + 'traza-clases.json', 'utf8')));
const esSwap = a => clases[a] && clases[a].tipo === 'swap';
const vistos = new Set(); const H = {};
const hora = t => Math.floor(t / 3600000) * 3600000;
const sumar = (rec, etiqueta) => { for (const [w, r] of Object.entries(rec)) for (const e of (r.sal || [])) { if (!esSwap(e.a)) continue; const k = e.tx + '|' + w + '|' + e.a + '|' + e.sim; if (vistos.has(k)) continue; vistos.add(k); const h = hora(e.at); const x = H[h] || (H[h] = { trx: 0, usdt: 0, n: 0 }); if (e.sim === 'TRX') x.trx += e.cant; else x.usdt += e.cant; x.n++; } };
for (const f of [D + 'traza-cache.json', D + 'traza-post-cache.json', T3 + 'tramo3-cache.json']) sumar(JSON.parse(fs.readFileSync(f, 'utf8')).rec, f);
(async () => {
  const t0 = Date.UTC(2026, 9, 29, 0, 0); const r = await fetch('https://api.binance.com/api/v3/klines?symbol=TRXUSDT&interval=1h&startTime=' + t0 + '&limit=200'); const K = await r.json();
  const precio = {}; for (const k of K) precio[k[0]] = { o: +k[1], h: +k[2], l: +k[3], c: +k[4], vol: +k[7] };   // k[7] = volumen en USDT de esa hora (todo el mercado de Binance)
  const fm = n => n.toFixed(1).padStart(7);
  console.log('hora UTC        cierre  var%   volumen Binance M$ | rastreadas: TRX a routers (M TRX)  USDT a routers (M$)  → venta neta (M$)');
  const claves = Object.keys(precio).map(Number).sort((a, b) => a - b); let prev = null; const filas = [];
  for (const h of claves) { const p = precio[h], x = H[h] || { trx: 0, usdt: 0, n: 0 }; const venta = x.trx * p.c / 1e6, compra = x.usdt / 1e6; const var_ = prev ? (p.c / prev - 1) * 100 : 0; prev = p.c;
    filas.push({ h, c: p.c, var: var_, vol: p.vol / 1e6, trxM: x.trx / 1e6, usdtM: compra, netaM: venta - compra, n: x.n });
    if (h >= Date.UTC(2026, 9, 29, 18) && (x.n || Math.abs(var_) > 0.6 || h % 21600000 === 0)) console.log(new Date(h).toISOString().slice(5, 16), p.c.toFixed(4), var_.toFixed(2).padStart(6), (p.vol / 1e6).toFixed(1).padStart(10), '     |', fm(x.trx / 1e6), fm(compra), fm(venta - compra)); }
  const pc = Date.UTC(2026, 9, 29, 20, 0), pe = Date.UTC(2026, 9, 29, 21, 20), p30 = Date.UTC(2026, 9, 30, 12, 0), p31 = claves[claves.length - 1];
  const px = t => (precio[hora(t)] || {}).c;
  console.log('\nPRECIOS: antes del robo (29-oct 20:00)', px(pc), '| tras las compras (29-oct 21:00)', px(pe), '| 30-oct 12:00', px(p30), '| último dato', new Date(p31).toISOString().slice(0, 16), precio[p31].c);
  const sum = (a, b, k) => filas.filter(f => f.h >= a && f.h < b).reduce((s, f) => s + f[k], 0);
  const tramos = [['29-oct 20:00–23:00 (compra de 638 M TRX)', Date.UTC(2026, 9, 29, 20), Date.UTC(2026, 9, 29, 23)], ['30-oct (día completo)', Date.UTC(2026, 9, 30), Date.UTC(2026, 9, 31)], ['31-oct (hasta ahora)', Date.UTC(2026, 9, 31), p31 + 3600000]];
  for (const [n, a, b] of tramos) console.log(n.padEnd(44), 'TRX a routers', sum(a, b, 'trxM').toFixed(1), 'M | USDT a routers', sum(a, b, 'usdtM').toFixed(1), 'M$ | volumen Binance', sum(a, b, 'vol').toFixed(0), 'M$');
  const maxCaida = filas.filter(f => f.h >= pc).sort((a, b) => a.var - b.var).slice(0, 5); console.log('\nmayores caídas horarias desde el robo:', maxCaida.map(f => new Date(f.h).toISOString().slice(5, 16) + ' ' + f.var.toFixed(2) + '%').join(' | '));
  fs.writeFileSync(__dirname + '/resultados/precio-trx-vs-ventas.json', JSON.stringify({ consultadoUTC: new Date().toISOString(), fuentePrecio: 'Binance TRXUSDT 1h (api.binance.com)', filas }, null, 1));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });

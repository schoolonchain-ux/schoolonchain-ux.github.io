'use strict';
// Serie de precios HORA A HORA (TRX y ETH en USDT) desde el 29-oct-2026 hasta hoy, de la API pública de klines de Binance. Sustituye al precio fijo de 0,352 $ en el libro mayor.
// Cada importe en dólares del libro usa el precio de APERTURA de la hora en que ocurre el movimiento (se declara en el informe). Solo lectura. Salida: src/libro-mayor/datos/precios-1h.json
const fs = require('node:fs'); const path = require('node:path');
const DESDE = Date.UTC(2026, 9, 28, 0, 0, 0); const sleep = ms => new Promise(r => setTimeout(r, ms));
async function klines(par) { const out = []; let t = DESDE; for (let i = 0; i < 20; i++) { const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${par}&interval=1h&startTime=${t}&limit=1000`, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error('klines ' + par + ' http ' + r.status); const j = await r.json(); if (!j.length) break; for (const k of j) out.push([k[0], Number(k[1]), Number(k[4])]); t = j[j.length - 1][0] + 3600000; if (j.length < 1000) break; await sleep(300); } return out; }
(async () => {
  const P = { fuente: 'Binance klines 1h (api.binance.com): TRXUSDT y ETHUSDT; precio = apertura de la hora (UTC); USDT/USDC nominales 1 $', leidoEn: new Date().toISOString(), TRX: await klines('TRXUSDT'), ETH: await klines('ETHUSDT'), PAXG: await klines('PAXGUSDT'), XAUT: await klines('XAUTUSDT'), POL: await klines('POLUSDT'), ARB: await klines('ARBUSDT') };
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'libro-mayor', 'datos', 'precios-1h.json'), JSON.stringify(P));
  const f = a => a.length + ' horas, ' + new Date(a[0][0]).toISOString().slice(0, 13) + ' → ' + new Date(a[a.length - 1][0]).toISOString().slice(0, 13) + ', min ' + Math.min(...a.map(x => x[1])).toFixed(4) + ' máx ' + Math.max(...a.map(x => x[1])).toFixed(4);
  console.log('TRX', f(P.TRX)); console.log('ETH', f(P.ETH)); console.log('PAXG', f(P.PAXG)); console.log('XAUT', f(P.XAUT)); console.log('POL', f(P.POL)); console.log('ARB', f(P.ARB));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });

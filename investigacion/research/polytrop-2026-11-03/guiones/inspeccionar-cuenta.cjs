'use strict';
// Ficha rápida de una dirección TRON: creación, saldo, tipos de operaciones desde una fecha, mayores entradas/salidas de TRX y de USDT, contrapartes más frecuentes y cuáles son nuestras o de Polytrop.
// Solo lectura, TronGrid sin clave. Uso: node inspeccionar-cuenta.cjs <dirección> [AAAA-MM-DD desde] → datos/cuenta-<prefijo>.json
const fs = require('fs'); const path = require('path'); const sl = ms => new Promise(r => setTimeout(r, ms));
const D = path.join(__dirname, '..', 'datos') + '/'; const R = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const b58 = hex => { const b = Buffer.from(hex, 'hex'); const c = require('crypto'); const h = c.createHash('sha256').update(c.createHash('sha256').update(b).digest()).digest().slice(0, 4); let n = BigInt('0x' + Buffer.concat([b, h]).toString('hex')), s = ''; while (n > 0n) { s = AL[Number(n % 58n)] + s; n /= 58n; } return s; };
async function g(u) { for (let i = 0; i < 6; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (r.status === 429) { await sl(2500 * (i + 1)); continue; } return { http: r.status, cuerpo: await r.json() }; } catch { await sl(1500); } } return { http: 0, cuerpo: null }; }
async function paginar(url, max) { const out = []; for (let p = 0; p < max && url; p++) { const r = await g(url); await sl(1100); const d = r.cuerpo && r.cuerpo.data || []; out.push(...d); url = r.cuerpo && r.cuerpo.meta && r.cuerpo.meta.links && r.cuerpo.meta.links.next || null; if (d.length < 200) break; } return out; }
(async () => {
  const A = process.argv[2]; const desde = process.argv[3] ? Date.parse(process.argv[3] + 'T00:00:00Z') : Date.UTC(2026, 9, 1);
  const cach = ['tramo3', 'tramo4', 'tramo5', 'tramo6'].map(t => fs.readFileSync(R + t + '/' + t + '-cache.json', 'utf8')); const csv = fs.readFileSync(D + 'polytrop-binance-hack-addresses.csv', 'utf8'); const mia = a => (cach.some(s => s.includes(a)) ? 'N' : '') + (csv.includes(a) ? 'P' : '');
  const c = await g('https://api.trongrid.io/v1/accounts/' + A); await sl(1100); const cu = c.cuerpo && c.cuerpo.data && c.cuerpo.data[0];
  const tx = await paginar('https://api.trongrid.io/v1/accounts/' + A + '/transactions?limit=200&order_by=block_timestamp,asc&min_timestamp=' + desde, 40);
  const t20 = await paginar('https://api.trongrid.io/v1/accounts/' + A + '/transactions/trc20?limit=200&order_by=block_timestamp,asc&min_timestamp=' + desde, 40);
  const tipos = {}; const trx = []; for (const t of tx) { const k = t.raw_data.contract[0]; tipos[k.type] = (tipos[k.type] || 0) + 1; if (k.type === 'TransferContract') { const v = k.parameter.value; trx.push({ tx: t.txID, t: t.block_timestamp, de: b58(v.owner_address), a: b58(v.to_address), v: v.amount / 1e6, msg: t.raw_data.data || null }); } }
  const u20 = t20.filter(t => t.token_info && t.token_info.symbol === 'USDT').map(t => ({ tx: t.transaction_id, t: t.block_timestamp, de: t.from, a: t.to, v: +t.value / 1e6 }));
  const resumen = (l, lado) => { const m = {}; for (const x of l) { const o = lado === 'in' ? x.de : x.a; const e = m[o] = m[o] || { a: o, n: 0, v: 0, mia: mia(o), primero: x.t, ultimo: x.t }; e.n++; e.v += x.v; e.ultimo = x.t; } return Object.values(m).sort((x, y) => y.v - x.v); };
  const out = { direccion: A, leidoEn: new Date().toISOString(), desde: new Date(desde).toISOString().slice(0, 10), creada: cu && cu.create_time ? new Date(cu.create_time).toISOString().slice(0, 16) : null, saldoTRX: cu ? (cu.balance || 0) / 1e6 : null, tipos, trxEntra: resumen(trx.filter(x => x.a === A), 'in'), trxSale: resumen(trx.filter(x => x.de === A), 'out'), usdtEntra: resumen(u20.filter(x => x.a === A), 'in'), usdtSale: resumen(u20.filter(x => x.de === A), 'out'), mensajes: trx.filter(x => x.msg).length, trx, u20 };
  fs.writeFileSync(D + 'cuenta-' + A.slice(0, 8) + '.json', JSON.stringify(out));
  const f = x => new Date(x).toISOString().slice(5, 16);
  console.log('cuenta', A, '| creada', out.creada, '| saldo TRX', out.saldoTRX, '| tipos', JSON.stringify(tipos), '| TRX con mensaje', out.mensajes);
  for (const [t, l] of [['TRX entra', out.trxEntra], ['TRX sale', out.trxSale], ['USDT entra', out.usdtEntra], ['USDT sale', out.usdtSale]]) { console.log('--', t, '(' + l.length + ' contrapartes)'); for (const x of l.slice(0, 8)) console.log('  ', x.a, Math.round(x.v).toLocaleString('es'), 'en', x.n, 'ops', f(x.primero), '→', f(x.ultimo), x.mia ? '[' + x.mia + ']' : ''); }
})();

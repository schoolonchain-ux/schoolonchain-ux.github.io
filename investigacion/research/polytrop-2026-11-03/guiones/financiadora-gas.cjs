'use strict';
// Todo lo que la cuenta TBEbSQuJwp… (que puso 50 TRX de gas a las billeteras del ladrón que usaron Across) envió desde el 28-oct-2026 a las 00:00 UTC, y qué receptoras están en nuestros datos o en Polytrop.
// Solo lectura, TronGrid sin clave. Guarda lo leído en datos/financiadora-gas.json. Uso: node financiadora-gas.cjs <dirección>
const fs = require('fs'); const path = require('path'); const sl = ms => new Promise(r => setTimeout(r, ms));
const D = path.join(__dirname, '..', 'datos') + '/'; const R = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const b58 = hex => { const b = Buffer.from(hex, 'hex'); const c = require('crypto'); const h = c.createHash('sha256').update(c.createHash('sha256').update(b).digest()).digest().slice(0, 4); let n = BigInt('0x' + Buffer.concat([b, h]).toString('hex')), s = ''; while (n > 0n) { s = AL[Number(n % 58n)] + s; n /= 58n; } return s; };
async function g(u) { for (let i = 0; i < 5; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (r.status === 429) { await sl(2500 * (i + 1)); continue; } return { http: r.status, cuerpo: await r.json() }; } catch { await sl(1500); } } return { http: 0, cuerpo: null }; }
(async () => {
  const A = process.argv[2]; if (!A) { console.error('uso: node financiadora-gas.cjs <dirección TRON completa>'); process.exit(1); }
  const cach = ['tramo3', 'tramo4', 'tramo5', 'tramo6'].map(t => fs.readFileSync(R + t + '/' + t + '-cache.json', 'utf8')); const csv = fs.readFileSync(D + 'polytrop-binance-hack-addresses.csv', 'utf8');
  const desde = Date.UTC(2026, 9, 28); let url = 'https://api.trongrid.io/v1/accounts/' + A + '/transactions?limit=200&order_by=block_timestamp,asc&min_timestamp=' + desde; const tx = []; let http = 0;
  for (let p = 0; p < 30 && url; p++) { const r = await g(url); http = r.http; await sl(1100); const d = r.cuerpo && r.cuerpo.data || []; tx.push(...d); url = r.cuerpo && r.cuerpo.meta && r.cuerpo.meta.links && r.cuerpo.meta.links.next || null; if (d.length < 200) break; }
  const sal = []; for (const t of tx) { const c = t.raw_data.contract[0]; if (c.type !== 'TransferContract') continue; const v = c.parameter.value; if (b58(v.owner_address) !== A) continue; sal.push({ tx: t.txID, t: t.block_timestamp, a: b58(v.to_address), trx: v.amount / 1e6 }); }
  const por = new Map(); for (const s of sal) { const x = por.get(s.a) || { a: s.a, n: 0, trx: 0, primero: s.t, ultimo: s.t }; x.n++; x.trx += s.trx; x.ultimo = s.t; por.set(s.a, x); }
  const rec = [...por.values()].map(x => ({ ...x, nuestra: cach.some(s => s.includes(x.a)), polytrop: csv.includes(x.a) }));
  fs.writeFileSync(D + 'financiadora-gas.json', JSON.stringify({ leidoEn: new Date().toISOString(), direccion: A, http, txLeidas: tx.length, salidasTRX: sal, receptoras: rec }, null, 1));
  const imp = {}; for (const s of sal) { const k = s.trx; imp[k] = (imp[k] || 0) + 1; }
  console.log('cuenta', A, '| tx leídas', tx.length, '| envíos de TRX', sal.length, '| receptoras distintas', rec.length, '| http', http);
  console.log('importes más repetidos', JSON.stringify(Object.entries(imp).sort((a, b) => b[1] - a[1]).slice(0, 6)));
  console.log('receptoras en nuestros datos:', rec.filter(x => x.nuestra).length, '| en Polytrop:', rec.filter(x => x.polytrop).length, '| en ambas:', rec.filter(x => x.nuestra && x.polytrop).length, '| en ninguna:', rec.filter(x => !x.nuestra && !x.polytrop).length);
  console.log('primer y último envío', new Date(sal[0].t).toISOString().slice(0, 16), new Date(sal[sal.length - 1].t).toISOString().slice(0, 16));
})();

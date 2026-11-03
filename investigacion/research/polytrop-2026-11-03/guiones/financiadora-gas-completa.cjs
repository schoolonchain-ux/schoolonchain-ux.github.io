'use strict';
// Relee TODO lo que tocó la cuenta de gas desde el 28-oct (entradas y salidas, todos los tipos de contrato) y guarda lo esencial, con el mensaje (campo data) de cada transacción.
// Solo lectura, TronGrid sin clave. Uso: node financiadora-gas-completa.cjs <dirección> → datos/financiadora-gas-completa.json
const fs = require('fs'); const path = require('path'); const sl = ms => new Promise(r => setTimeout(r, ms));
const D = path.join(__dirname, '..', 'datos') + '/';
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const b58 = hex => { const b = Buffer.from(hex, 'hex'); const c = require('crypto'); const h = c.createHash('sha256').update(c.createHash('sha256').update(b).digest()).digest().slice(0, 4); let n = BigInt('0x' + Buffer.concat([b, h]).toString('hex')), s = ''; while (n > 0n) { s = AL[Number(n % 58n)] + s; n /= 58n; } return s; };
async function g(u) { for (let i = 0; i < 6; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (r.status === 429) { await sl(2500 * (i + 1)); continue; } return { http: r.status, cuerpo: await r.json() }; } catch { await sl(1500); } } return { http: 0, cuerpo: null }; }
(async () => {
  const A = process.argv[2]; const desde = Date.UTC(2026, 9, 28);
  let url = 'https://api.trongrid.io/v1/accounts/' + A + '/transactions?limit=200&order_by=block_timestamp,asc&min_timestamp=' + desde; const filas = []; let pag = 0, http = 0;
  while (url && pag < 60) { const r = await g(url); http = r.http; pag++; await sl(1100); const d = r.cuerpo && r.cuerpo.data || [];
    for (const t of d) { const c = t.raw_data.contract[0]; const v = c.parameter.value; filas.push({ tx: t.txID, t: t.block_timestamp, tipo: c.type, de: v.owner_address ? b58(v.owner_address) : null, a: v.to_address ? b58(v.to_address) : (v.receiver_address ? b58(v.receiver_address) : (v.contract_address ? b58(v.contract_address) : null)), recurso: v.resource || null, trx: v.amount != null ? v.amount / 1e6 : (v.balance != null ? v.balance / 1e6 : null), mensaje: t.raw_data.data || null, datos: c.type === 'TriggerSmartContract' ? (v.data || '').slice(0, 8) : null }); }
    url = r.cuerpo && r.cuerpo.meta && r.cuerpo.meta.links && r.cuerpo.meta.links.next || null; if (d.length < 200) break; }
  fs.writeFileSync(D + 'financiadora-gas-completa.json', JSON.stringify({ leidoEn: new Date().toISOString(), direccion: A, http, paginas: pag, n: filas.length, filas }, null, 0));
  const sal = filas.filter(f => f.de === A), ent = filas.filter(f => f.a === A);
  const tipos = {}; for (const f of filas) tipos[f.tipo + (f.de === A ? ' sale' : ' entra')] = (tipos[f.tipo + (f.de === A ? ' sale' : ' entra')] || 0) + 1;
  console.log('páginas', pag, '| tx', filas.length, '| http', http); console.log('tipos', JSON.stringify(tipos));
  console.log('salidas con mensaje:', sal.filter(f => f.mensaje).length, '/', sal.length);
  const grandes = ent.filter(f => f.trx >= 1000).sort((x, y) => y.trx - x.trx); console.log('entradas ≥1000 TRX:', grandes.length); for (const f of grandes.slice(0, 15)) console.log(' ', new Date(f.t).toISOString().slice(0, 16), f.trx, 'TRX de', f.de, f.tx.slice(0, 10));
  const peq = ent.filter(f => f.trx != null && f.trx < 1).length; console.log('entradas <1 TRX (polvo):', peq, 'de', ent.length);
})();

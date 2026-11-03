'use strict';
// Comprobación de entradas y salidas de la billetera de reparto TRBdWq… (la «caja» del recorrido): ¿cuánto entró DE VERDAD desde la foto y cuánto salió?
// Lee TODAS las transferencias de TRX y de USDT (sin umbral) entre la foto (30-oct 22:40 UTC) y el corte, y el saldo actual. Solo lectura. Salida: resultados/balance-semilla.json
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const W = 'TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki', USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; const PX = 0.352;
const FOTO = Date.UTC(2026, 9, 30, 22, 40, 0); const CORTE = JSON.parse(fs.readFileSync('C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo5/t4.json', 'utf8')).t3;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getj(url) { for (let i = 0; i < 8; i++) { try { const r = await fetch(url, { headers: { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey }, signal: AbortSignal.timeout(30000) }); if (r.status === 429) { await sleep(3000 * (i + 1)); continue; } if (!r.ok) { await sleep(1500 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1500 * (i + 1)); } } return null; }
async function leerTodo(base, extra) { const out = []; let url = base + extra; let pag = 0; while (url) { const j = await getj(url); if (!j) throw new Error('lectura incompleta: ' + base); out.push(...(j.data || [])); url = j.meta && j.meta.links && j.meta.links.next; pag++; await sleep(300); } return { filas: out, paginas: pag }; }
(async () => {
  const q = `?only_confirmed=true&limit=200&order_by=block_timestamp,asc&min_timestamp=${FOTO}&max_timestamp=${CORTE}`;
  const trx = await leerTodo(`https://api.trongrid.io/v1/accounts/${W}/transactions`, q);
  const usdt = await leerTodo(`https://api.trongrid.io/v1/accounts/${W}/transactions/trc20`, q + '&contract_address=' + USDT);
  const cuenta = await getj('https://api.trongrid.io/v1/accounts/' + W); const d = cuenta && cuenta.data && cuenta.data[0];
  const R = { billetera: W, desde: new Date(FOTO).toISOString(), hasta: new Date(CORTE).toISOString(), trx: { entra: 0, sale: 0, nEntra: 0, nSale: 0, comisionesNo: 'no incluidas' }, usdt: { entra: 0, sale: 0, nEntra: 0, nSale: 0 }, otrosContratos: {}, entradasGrandes: [], porHoraEntra: {} };
  for (const x of trx.filas) { const c = x.raw_data && x.raw_data.contract && x.raw_data.contract[0]; if (!c || !x.ret || x.ret[0].contractRet !== 'SUCCESS') continue; const t = c.type; if (t !== 'TransferContract') { R.otrosContratos[t] = (R.otrosContratos[t] || 0) + 1; continue; } const v = c.parameter.value; const trxv = v.amount / 1e6; const hex = s => s; const mio = v.owner_address && v.owner_address.toLowerCase().startsWith('41'); /* se decide por la dirección base58 de abajo */ x._v = trxv; x._de = v.owner_address; x._a = v.to_address; }
  // TronGrid devuelve direcciones en hexadecimal en raw_data: se convierten con el helper del proyecto
  const { hexABase58 } = (() => { const crypto = require('crypto'); const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; const hexABase58 = hex => { const b = Buffer.from(hex, 'hex'); const c = crypto.createHash('sha256').update(crypto.createHash('sha256').update(b).digest()).digest().subarray(0, 4); let n = BigInt('0x' + Buffer.concat([b, c]).toString('hex')); let s = ''; while (n > 0n) { s = AL[Number(n % 58n)] + s; n /= 58n; } return s; }; return { hexABase58 }; })();
  for (const x of trx.filas) { if (x._v === undefined) continue; const de = hexABase58(x._de), a = hexABase58(x._a); if (a === W) { R.trx.entra += x._v; R.trx.nEntra++; if (x._v * PX >= 100000) R.entradasGrandes.push({ de, trx: x._v, at: x.block_timestamp, tx: x.txID }); const h = new Date(x.block_timestamp).toISOString().slice(0, 13); R.porHoraEntra[h] = (R.porHoraEntra[h] || 0) + x._v; } else if (de === W) { R.trx.sale += x._v; R.trx.nSale++; } }
  for (const t of usdt.filas) { const v = Number(t.value) / 1e6; if (!(v < 1e12)) continue; if (t.to === W) { R.usdt.entra += v; R.usdt.nEntra++; if (v >= 100000) R.entradasGrandes.push({ de: t.from, usdt: v, at: t.block_timestamp, tx: t.transaction_id }); } else if (t.from === W) { R.usdt.sale += v; R.usdt.nSale++; } }
  R.saldoActual = { trx: d ? d.balance / 1e6 : null, usdt: d && d.trc20 ? Number((d.trc20.find(o => o[USDT]) || {})[USDT] || 0) / 1e6 : null };
  R.saldoEnLaFoto = { trx: R.saldoActual.trx - R.trx.entra + R.trx.sale, usdt: R.saldoActual.usdt - R.usdt.entra + R.usdt.sale, _metodo: 'saldo actual − entradas + salidas posteriores a la foto (no incluye comisiones ni consumo de energía pagados en TRX)' };
  R.lecturas = { paginasTRX: trx.paginas, paginasUSDT: usdt.paginas, filasTRX: trx.filas.length, filasUSDT: usdt.filas.length };
  fs.mkdirSync('C:/EquipoIA/research/auditoria-adversarial-2026-10-31/resultados', { recursive: true });
  fs.writeFileSync('C:/EquipoIA/research/auditoria-adversarial-2026-10-31/resultados/balance-semilla.json', JSON.stringify(R, null, 1));
  const f = n => Math.round(n).toLocaleString('en');
  console.log('TRX  entra', f(R.trx.entra), 'en', R.trx.nEntra, '| sale', f(R.trx.sale), 'en', R.trx.nSale, '(', f(R.trx.sale * PX), '$ )');
  console.log('USDT entra', f(R.usdt.entra), 'en', R.usdt.nEntra, '| sale', f(R.usdt.sale), 'en', R.usdt.nSale);
  console.log('saldo actual', R.saldoActual, '| saldo en la foto (reconstruido)', { trx: f(R.saldoEnLaFoto.trx), usdt: f(R.saldoEnLaFoto.usdt) });
  console.log('entradas grandes:', R.entradasGrandes.map(e => (e.trx ? f(e.trx) + ' TRX' : f(e.usdt) + ' USDT') + ' de ' + e.de.slice(0, 8) + ' ' + new Date(e.at).toISOString().slice(5, 16)).join(' | '));
  console.log('otros tipos de llamada:', R.otrosContratos);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });

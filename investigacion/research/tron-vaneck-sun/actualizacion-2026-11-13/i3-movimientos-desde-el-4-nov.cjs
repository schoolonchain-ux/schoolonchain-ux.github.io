'use strict';
// Solo lectura (TronGrid). Guarda en bruto las transacciones y transferencias TRC20 de «Vaneck», la segunda cuenta y la financiadora desde el 4-nov-2026 a las 10:40:07 UTC
// (un segundo después del envío de 150 M TRX de las 10:40:06) y las clasifica por sentido (entra / sale). Respalda la frase del capítulo 6 «sin retiradas ni envíos desde el 4-nov».
// Uso: node i3-movimientos-desde-el-4-nov.cjs <salida.json>
const fs = require('node:fs');
const A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', c = require('node:crypto');
const b58 = (h) => { const b = Buffer.from(h, 'hex'); const ck = c.createHash('sha256').update(c.createHash('sha256').update(b).digest()).digest().subarray(0, 4); let n = BigInt('0x' + Buffer.concat([b, ck]).toString('hex')); let s = ''; while (n > 0n) { s = A[Number(n % 58n)] + s; n /= 58n; } return s; };
const CUENTAS = { vaneck: 'TCGVFGDd62LSrfZEaz3M3fYifWWdSDHRL8', segunda_cuenta: 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', financiadora: 'TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5' };
const DESDE = Date.parse('2026-11-04T10:40:07Z'), pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(u) { for (let i = 0; i < 5; i++) { const r = await fetch(u); if (r.ok) return r.json(); await pausa(1500); } throw new Error('TronGrid: ' + u); }
async function todo(url) { let out = [], fp = ''; for (let i = 0; i < 20; i++) { const j = await get(url + (fp ? '&fingerprint=' + fp : '')); out = out.concat(j.data || []); fp = j.meta && j.meta.fingerprint; await pausa(500); if (!fp) break; } return out; }
(async () => {
  const salida = process.argv[2]; if (!salida) throw new Error('Uso: node i3-movimientos-desde-el-4-nov.cjs <salida.json>');
  const res = { version: 1, leidoEn: new Date().toISOString(), desde: new Date(DESDE).toISOString(), fuente: 'TronGrid /v1/accounts/{a}/transactions y /transactions/trc20 (min_timestamp), paginado', cuentas: {} };
  for (const [k, a] of Object.entries(CUENTAS)) {
    const base = 'https://api.trongrid.io/v1/accounts/' + a;
    const tx = await todo(base + '/transactions?limit=200&order_by=block_timestamp,asc&min_timestamp=' + DESDE);
    const t20 = await todo(base + '/transactions/trc20?limit=200&order_by=block_timestamp,asc&min_timestamp=' + DESDE);
    const filas = tx.map((t) => { const ct = t.raw_data.contract[0], v = ct.parameter.value; const de = v.owner_address ? b58(v.owner_address) : null; return { hora: new Date(t.block_timestamp).toISOString(), tipo: ct.type, de, a: v.to_address ? b58(v.to_address) : (v.contract_address ? b58(v.contract_address) : null), trx: v.amount != null ? v.amount / 1e6 : (v.call_value != null ? v.call_value / 1e6 : null), sale: de === a, tx: t.txID }; });
    const f20 = t20.map((t) => ({ hora: new Date(t.block_timestamp).toISOString(), token: t.token_info && t.token_info.symbol, de: t.from, a: t.to, valor: t.value, sale: t.from === a, tx: t.transaction_id }));
    res.cuentas[k] = { direccion: a, transacciones: filas, trc20: f20, salidas: filas.filter((x) => x.sale).length + f20.filter((x) => x.sale).length };
  }
  fs.writeFileSync(salida, JSON.stringify(res, null, 1));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(res.cuentas).map(([k, v]) => [k, { transacciones: v.transacciones.length, trc20: v.trc20.length, salidas: v.salidas }]))));
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });

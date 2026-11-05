'use strict';
// LÍNEA B · B5c — El contrato al que TEySEZLJ… (la «tesorería de TRON Inc.» según Protos) manda su TRX con `deposit()`: ¿qué es? (name/symbol), cuánto tiene de ese token, y a qué TRX equivale.
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node b5c-tron-inc-strx.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); L.usar('b5c-2026-11-05'); const OUT = path.join(__dirname, 'b-proveedora'); const TG = 'https://api.trongrid.io'; const M = x => Math.round(x * 100) / 100;
const TI = 'TEySEZLJf6rs2mCujGpDEsgoMVWKLAk9mT'; const prev = JSON.parse(fs.readFileSync(path.join(OUT, 'tron-inc-wtrx.json'), 'utf8')); const C = prev.llamadas_a_contratos.find(l => l.selector === 'd0e30db0').contrato;
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; const deB58 = s => { let n = 0n; for (const c of s) n = n * 58n + BigInt(AL.indexOf(c)); let h = n.toString(16); if (h.length % 2) h = '0' + h; return h; };
const q = async (f, a) => { const r = await L.post(TG + '/wallet/triggerconstantcontract', { owner_address: TI, contract_address: C, function_selector: f, parameter: a || '', visible: true }); return (r.constant_result && r.constant_result[0]) || null; };
const txt = h => { if (!h || h.length < 128) return null; try { const n = parseInt(h.slice(64, 128), 16); return Buffer.from(h.slice(128, 128 + n * 2), 'hex').toString('utf8'); } catch { return null; } };
(async () => {
  const k = await L.post(TG + '/wallet/getcontract', { value: C, visible: true }); const dec = await q('decimals()'); const bal = await q('balanceOf(address)', '000000000000000000000000' + deB58(TI).slice(2, 42)); const ts = await q('totalSupply()');
  const d = dec ? parseInt(dec, 16) : 18; const saldo = bal ? Number(BigInt('0x' + bal)) / Math.pow(10, d) : null; const res = { contrato: C, nombre_en_cadena: k.name || null, name: txt(await q('name()')), symbol: txt(await q('symbol()')), decimals: d, saldo_de_TEySEZLJ: saldo, total_supply: ts ? Number(BigInt('0x' + ts)) / Math.pow(10, d) : null, trx_enviados_con_deposit: prev.llamadas_a_contratos.filter(l => l.selector === 'd0e30db0').reduce((s, l) => s + l.trx_adjuntos, 0) };
  const rate = await q('exchangeRate()') || await q('exchangeRateStored()'); res.exchange_rate_hex = rate;
  const h = L.guardar(path.join(OUT, 'tron-inc-strx.json'), res); console.log(JSON.stringify(res)); console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });

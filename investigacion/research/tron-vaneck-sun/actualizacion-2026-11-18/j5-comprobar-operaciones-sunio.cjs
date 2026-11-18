'use strict';
// Solo lectura (TronGrid). Seguimiento del 18-nov-2026: comprueba en la cadena, transacción a transacción, lo que la segunda cuenta sacó y metió en sun.io
// el 14 y el 17-nov (TRX que viaja «por dentro» de la llamada + USDT), y a qué par pertenece cada posición de V3 que hoy tiene o que ha vaciado.
// Guarda las respuestas en bruto. Uso: node j5-comprobar-operaciones-sunio.cjs <salida.json>
const fs = require('node:fs'), c = require('node:crypto');
const A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const b58 = (h) => { const b = Buffer.from(h, 'hex'); const ck = c.createHash('sha256').update(c.createHash('sha256').update(b).digest()).digest().subarray(0, 4); let n = BigInt('0x' + Buffer.concat([b, ck]).toString('hex')); let s = ''; while (n > 0n) { s = A[Number(n % 58n)] + s; n /= 58n; } return s; };
const dec = (s) => { let n = 0n; for (const ch of s) n = n * 58n + BigInt(A.indexOf(ch)); return n.toString(16).padStart(50, '0').slice(0, 42); };
const T = 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', GESTOR = 'TLSWrv7eC1AZCXkRjpqMZUmvgd99cj7pPF', USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TXS = ['c1bf3e6a472132d54eb594a2ad60afc5d4ae96635cf8bf2911c67e4d462c1b0c', 'ccaf7b16b2fc7a2719310152205ccf854b68b1d4f92e042b26c454b4e6f28dbc', '1abd35575b95bda2ad17ec20eb7c12f9b16c51df8b1babcafe53293518c9cb58', '8d18c130b2520d61f4b9a0cac218ffff95ec8447b210945a0b9aeb291ee75182', '2a730d235555b399d0b0b91c78a0040b335ff09ffbfba8ea5d6baa5d1ca7fbcb', 'fc44fa43534b111a519d2b36e07e07baa5f7281774840922d6cf9bd381be32b9', '7d63397454fee11b741a3f5c9bd3ff3adede8500450794a1ff7117fe2c4c6315', 'd401222a71d3f70ca26a44944338e5ccc3672a77363d69b4207224f62a14c2b2', '41ecfb55976d46d3570474a7ea000191ec6d1808453dbe78d665ed7235c7ffeb', 'd9d7fc7dd7'];
const pausa = (ms) => new Promise((r) => setTimeout(r, ms)), crudo = [];
async function post(ruta, body) { for (let i = 0; i < 5; i++) { try { const r = await fetch('https://api.trongrid.io' + ruta, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); if (r.ok) { const j = await r.json(); crudo.push({ ruta, body, respuesta: j }); return j; } } catch (e) {} await pausa(1500); } throw new Error('TronGrid ' + ruta); }
const TRANSFER = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
(async () => {
  const salida = process.argv[2]; if (!salida) throw new Error('Uso: node j5-comprobar-operaciones-sunio.cjs <salida.json>');
  const res = { version: 1, leidoEn: new Date().toISOString(), fuente: 'TronGrid /wallet/gettransactioninfobyid, /wallet/gettransactionbyid y /wallet/triggerconstantcontract (solo lectura)', cuenta: T, operaciones: [], posiciones: [] };
  const t41 = dec(T), usdt41 = dec(USDT).slice(2);
  for (const id of TXS.filter((x) => x.length === 64)) {
    const info = await post('/wallet/gettransactioninfobyid', { value: id }); await pausa(400);
    const tx = await post('/wallet/gettransactionbyid', { value: id }); await pausa(400);
    const v = tx.raw_data.contract[0].parameter.value, tipo = tx.raw_data.contract[0].type;
    let trxEntra = 0n, trxSale = 0n, usdtEntra = 0n, usdtSale = 0n;
    for (const it of info.internal_transactions || []) { if (it.rejected) continue; const val = BigInt((it.callValueInfo || []).filter((x) => !x.tokenId).reduce((s, x) => s + (x.callValue || 0), 0)); if (it.transferTo_address === t41) trxEntra += val; if (it.caller_address === t41) trxSale += val; }
    if (v.call_value) trxSale += BigInt(v.call_value);
    for (const l of info.log || []) { if (l.address !== usdt41 || l.topics[0] !== TRANSFER) continue; const de = '41' + l.topics[1].slice(24), a = '41' + l.topics[2].slice(24), val = BigInt('0x' + l.data); if (a === t41) usdtEntra += val; if (de === t41) usdtSale += val; }
    res.operaciones.push({ tx: id, hora: new Date(info.blockTimeStamp).toISOString(), bloque: info.blockNumber, tipo, resultado: (info.receipt && info.receipt.result) || (tipo === 'TriggerSmartContract' ? '?' : 'OK'), contrato: v.contract_address ? b58(v.contract_address) : null, selector: v.data ? v.data.slice(0, 8) : null, trxQueEntra: Number(trxEntra) / 1e6, trxQueSale: Number(trxSale) / 1e6, usdtQueEntra: Number(usdtEntra) / 1e6, usdtQueSale: Number(usdtSale) / 1e6, retiradaDescongelado: info.withdraw_expire_amount ? info.withdraw_expire_amount / 1e6 : null });
  }
  const pad = (h) => h.padStart(64, '0');
  for (const id of [4, 5, 726, 844, 937, 978, 979, 1118, 1120, 1573, 1992, 1993]) {
    const r = await post('/wallet/triggerconstantcontract', { owner_address: t41, contract_address: dec(GESTOR), function_selector: 'positions(uint256)', parameter: pad(id.toString(16)) }); await pausa(400);
    const p = r.constant_result[0], w = (i) => p.slice(i * 64, (i + 1) * 64), s24 = (h) => { let n = BigInt('0x' + h); if (n >> 255n) n -= 1n << 256n; return Number(n); };
    res.posiciones.push({ id, token0: b58('41' + w(2).slice(24)), token1: b58('41' + w(3).slice(24)), comision: parseInt(w(4), 16), tickInferior: s24(w(5)), tickSuperior: s24(w(6)), liquidez: BigInt('0x' + w(7)).toString() });
  }
  const cta = await post('/wallet/getaccount', { address: T, visible: true });
  res.estado = { saldoLibreTrx: (cta.balance || 0) / 1e6, congeladoV2: (cta.frozenV2 || []).map((f) => ({ tipo: f.type || 'BANDWIDTH', trx: (f.amount || 0) / 1e6 })), delegadoEnergiaTrx: ((cta.account_resource || {}).delegated_frozenV2_balance_for_energy || 0) / 1e6, delegadoAnchoTrx: (cta.delegated_frozenV2_balance_for_bandwidth || 0) / 1e6, descongelando: (cta.unfrozenV2 || []).map((u) => ({ trx: u.unfreeze_amount / 1e6, libreEl: new Date(u.unfreeze_expire_time).toISOString() })) };
  fs.writeFileSync(salida, JSON.stringify(res, null, 1)); fs.writeFileSync(salida.replace(/\.json$/, '.crudo.json'), JSON.stringify(crudo));
  for (const o of res.operaciones) console.log(o.hora.slice(5, 19), o.tx.slice(0, 8), o.tipo.replace('Contract', ''), o.resultado, o.contrato || '', o.selector || '', '| TRX entra', o.trxQueEntra, 'sale', o.trxQueSale, '| USDT entra', o.usdtQueEntra, 'sale', o.usdtQueSale, o.retiradaDescongelado ? '| retira ' + o.retiradaDescongelado : '');
  for (const p of res.posiciones) console.log(p.id, p.token0, p.token1, p.comision, p.tickInferior, p.tickSuperior, p.liquidez);
  console.log(JSON.stringify(res.estado));
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });

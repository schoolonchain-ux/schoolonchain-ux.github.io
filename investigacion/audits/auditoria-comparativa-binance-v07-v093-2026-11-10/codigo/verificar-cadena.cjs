'use strict';
// Verificacion EN CADENA (TronGrid publico, sin clave) de una muestra de las transacciones que la auditoria cita como evidencia.
// Para cada transaccion: lee los eventos Transfer y los datos de la transaccion y los compara con lo que dicen los datos congelados.
const fs = require('fs'); const crypto = require('crypto');
const D = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ALF = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const b58 = hex => { const b = Buffer.from(hex, 'hex'); const chk = crypto.createHash('sha256').update(crypto.createHash('sha256').update(b).digest()).digest().subarray(0, 4); let n = BigInt('0x' + Buffer.concat([b, chk]).toString('hex')); let s = ''; while (n > 0n) { s = ALF[Number(n % 58n)] + s; n /= 58n; } return s; };
const aB58 = h => { if (!h) return null; let x = String(h).toLowerCase().replace(/^0x/, ''); if (x.length === 40) x = '41' + x; if (x.length !== 42) return String(h); return b58(x); };
const espera = ms => new Promise(r => setTimeout(r, ms));
async function pedir(url, opt) { for (let i = 0; i < 4; i++) { try { const r = await fetch(url, opt); if (r.status === 200) return await r.json(); if (r.status === 429 || r.status >= 500) { await espera(4000 * (i + 1)); continue; } return { error: 'HTTP ' + r.status }; } catch (e) { await espera(3000); } } return { error: 'sin respuesta' }; }
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', JUSDT = 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd';
const DEC = { [USDT]: 6, [JUSDT]: 8 };
async function leer(tx) {
  const ev = await pedir('https://api.trongrid.io/v1/transactions/' + tx + '/events?only_confirmed=true&limit=200'); await espera(1300);
  const t = await pedir('https://api.trongrid.io/wallet/gettransactionbyid', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: tx }) }); await espera(1300);
  const info = await pedir('https://api.trongrid.io/wallet/gettransactioninfobyid', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: tx }) }); await espera(1300);
  const transf = ((ev && ev.data) || []).filter(e => e.event_name === 'Transfer').map(e => { const r = e.result || {}; const c = e.contract_address; const dec = DEC[c]; const raw = r.value ?? r.amount ?? r['2']; return { token: c === USDT ? 'USDT' : c === JUSDT ? 'jUSDT' : c, de: aB58(r.from ?? r.src ?? r['0']), a: aB58(r.to ?? r.dst ?? r['1']), cantidad: dec != null ? Number(raw) / 10 ** dec : raw }; });
  const c = t && t.raw_data && t.raw_data.contract && t.raw_data.contract[0]; const v = c && c.parameter && c.parameter.value;
  const internas = ((info && info.internal_transactions) || []).filter(x => !x.rejected).flatMap(x => (x.callValueInfo || []).filter(q => q.callValue && !q.tokenId).map(q => ({ de: aB58(x.caller_address), a: aB58(x.transferTo_address), trx: q.callValue / 1e6 })));
  return { tx, estado: t && t.ret && t.ret[0] ? t.ret[0].contractRet : (t && t.error) || null, hora: info && info.blockTimeStamp ? new Date(info.blockTimeStamp).toISOString() : null, bloque: info && info.blockNumber, tipo: c && c.type, remitente: v && aB58(v.owner_address), contrato: v && aB58(v.contract_address || v.to_address), trxEnviado: v && (v.call_value || v.amount) ? (v.call_value || v.amount) / 1e6 : 0, transferencias: transf, internas, error: (ev && ev.error) || (t && t.error) || null };
}
const cerca = (a, b, tol) => Math.abs(a - b) <= (tol ?? Math.max(0.01, Math.abs(b) * 1e-6));
(async () => {
  const pruebas = [];
  const T5 = D.tramos.tramo5, T6 = D.tramos.tramo6;
  // --- JustLend: deposito -> justificantes -> redencion
  const casoJL = (t, w, etiqueta) => { const d = t.justlend.detalle[w]; const dep = d.depositos[0]; pruebas.push({ grupo: 'JustLend', caso: etiqueta + ' deposito', tx: dep.tx, espera: { token: 'USDT', de: w, a: JUSDT, cantidad: dep.usd } }); const jv = d.justificantes[0]; pruebas.push({ grupo: 'JustLend', caso: etiqueta + ' envio de justificantes', tx: jv.tx, espera: { token: 'jUSDT', de: w, a: jv.a, cantidad: jv.jusdt } }); const rd = (jv.redenciones || []).sort((x, y) => y.usd - x.usd)[0]; if (rd) pruebas.push({ grupo: 'JustLend', caso: etiqueta + ' redencion por la receptora', tx: rd.tx, espera: { token: 'USDT', de: rd.de, a: jv.a, cantidad: rd.usd } }); };
  casoJL(T6, 'TLLpxir8LqZxGt7PXDKP7A189hrc61KcR1', 'tramo 6, mayor caso');
  casoJL(T6, 'TFzUYu5dxGPpGgTiDUtc6JC44iWgZoyQvY', 'tramo 6, segundo caso');
  casoJL(T5, 'TYsfTPrPGUGGUZmw69HjeRupWiA3wPtCQB', 'tramo 5, mayor caso');
  casoJL(T5, 'TUftBTYYXgYx5yEyfeFAfGGyxmeVPqNo6c', 'tramo 5, justificantes a contrato no leido');
  // --- Chainflip: deposito y salida en la misma transaccion
  for (const [t, n] of [[T5, 'tramo 5'], [T6, 'tramo 6']]) { const it = t.chainflip.items.slice().sort((a, b) => b.quitado - a.quitado); for (const x of [it[0], it[1]]) pruebas.push({ grupo: 'Chainflip', caso: n + ' deposito con salida en la misma transaccion', tx: x.tx, espera: { token: 'USDT', de: x.de, a: x.boveda, cantidad: x.cant }, espera2: { token: 'USDT', a: x.salidas[0].a, cantidad: x.salidas[0].cant } }); const par = t.chainflip.items.find(x => x.seConserva > 0); if (par) pruebas.push({ grupo: 'Chainflip', caso: n + ' caso parcial (salida menor que el deposito)', tx: par.tx, espera: { token: par.sim, de: par.de, a: par.boveda, cantidad: par.cant }, espera2: { token: par.salidas[0].sim, a: par.salidas[0].a, cantidad: par.salidas[0].cant } }); }
  // --- Symbiosis: envio revertido y su devolucion
  for (const [t, n] of [[T5, 'tramo 5'], [T6, 'tramo 6']]) { const it = t.symbiosis.items.slice().sort((a, b) => b.atribuido - a.atribuido); for (const x of [it[0], it[1]]) { pruebas.push({ grupo: 'Symbiosis', caso: n + ' envio al MetaRouter', tx: x.tx, esperaTrx: x.sim === 'TRX' ? { de: x.de, cantidad: x.cant } : null, espera: x.sim !== 'TRX' ? { token: x.sim, de: x.de, cantidad: x.cant } : null }); pruebas.push({ grupo: 'Symbiosis', caso: n + ' devolucion a la misma billetera', tx: x.llegada.tx, espera: { token: 'USDT', a: x.llegada.receptor, cantidad: x.llegada.importe }, mismaBilletera: x.llegada.receptor === x.de }); } }
  if (process.env.TODO === '1') {   // todos los casos de Chainflip y Symbiosis (no solo la muestra)
    pruebas.length = 0;
    for (const [t, n] of [[T5, 'tramo 5'], [T6, 'tramo 6']]) {
      for (const x of t.chainflip.items) pruebas.push({ grupo: 'Chainflip', caso: n + ' deposito con salida en la misma transaccion', tx: x.tx, espera: { token: x.sim, de: x.de, a: x.boveda, cantidad: x.cant }, espera2: { token: x.salidas[0].sim, a: x.salidas[0].a, cantidad: x.salidas[0].cant } });
      for (const x of t.symbiosis.items) { pruebas.push({ grupo: 'Symbiosis', caso: n + ' envio al MetaRouter', tx: x.tx, esperaTrx: x.sim === 'TRX' ? { de: x.de, cantidad: x.cant } : null, espera: x.sim !== 'TRX' ? { token: x.sim, de: x.de, cantidad: x.cant } : null }); pruebas.push({ grupo: 'Symbiosis', caso: n + ' devolucion a la misma billetera', tx: x.llegada.tx, espera: { token: 'USDT', a: x.llegada.receptor, cantidad: x.llegada.importe }, mismaBilletera: x.llegada.receptor === x.de }); }
    }
  }
  const res = [];
  for (const p of pruebas) {
    const r = await leer(p.tx); const hall = e => e && r.transferencias.find(q => (!e.token || q.token === e.token) && (!e.de || q.de === e.de) && (!e.a || q.a === e.a) && cerca(Number(q.cantidad), e.cantidad));
    const c1 = p.espera ? !!hall(p.espera) : null, c2 = p.espera2 ? !!hall(p.espera2) : null, c3 = p.esperaTrx ? (r.remitente === p.esperaTrx.de && cerca(r.trxEnviado, p.esperaTrx.cantidad)) : null;
    const todo = [c1, c2, c3].filter(x => x !== null); const okk = r.estado === 'SUCCESS' && todo.length > 0 && todo.every(Boolean);
    res.push({ ...p, leido: r, coincide: okk, comprobaciones: { transferencia: c1, salidaMismaTx: c2, trxEnviado: c3 } });
    console.log((okk ? 'OK   ' : 'FALLA') + ' | ' + p.grupo + ' | ' + p.caso + ' | ' + p.tx.slice(0, 16) + '… | ' + (r.estado || r.error) + ' | ' + (r.hora || '') + ' | transf=' + r.transferencias.length + (okk ? '' : ' | esperado ' + JSON.stringify(p.espera || p.esperaTrx) + ' | visto ' + JSON.stringify(r.transferencias.slice(0, 4)) + ' trx=' + r.trxEnviado + ' rem=' + r.remitente));
  }
  fs.writeFileSync(process.argv[3], JSON.stringify({ leidoEn: new Date().toISOString(), fuente: 'api.trongrid.io (eventos, gettransactionbyid, gettransactioninfobyid), sin clave', pruebas: res }, null, 1));
  console.log('\nTOTAL', res.length, 'coinciden', res.filter(x => x.coincide).length);
})();

'use strict';
// FASE 9d · Mismo análisis para el token «BTC» (TN3W4H6r…): creaciones (dirección cero), quién las firma, y movimientos del mayor depositante de jBTC (TUjx6w55…).
const L = require('./lib.cjs'); L.usar('21-2026-11-13'); const path = require('node:path'); const b58 = require('./b58.cjs');
const BTC = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', JBTC = 'TLeEu311Cbw63BcmMHDgDLu7fnk9fqGcqT', CERO = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb', TOP = 'TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ';
const TS = 'https://apilist.tronscanapi.com/api';
const pag = async (base, tope) => { const todo = []; let s = 0, total = null; for (;;) { const r = await L.get(base + '&start=' + s + '&limit=50'); const lista = r.token_transfers || []; total = r.total ?? r.rangeTotal ?? total; todo.push(...lista); if (lista.length < 50 || (tope && todo.length >= tope)) break; s += 50; } return { todo, total }; };
(async () => {
  const info = await L.get(TS + '/token_trc20?contract=' + BTC); const t = info.trc20_tokens && info.trc20_tokens[0]; console.log('token:', JSON.stringify({ nombre: t.name, simbolo: t.symbol, creador: t.issue_address, creado: t.issue_time, holders: t.holders_count, oferta: Number(t.total_supply_with_decimals) / 1e8 }));
  const c = await pag(TS + '/token_trc20/transfers?contract_address=' + BTC + '&relatedAddress=' + CERO + '&sort=timestamp');
  const filas = c.todo.map(x => ({ tx: x.transaction_id, cuando: new Date(x.block_ts).toISOString(), de: x.from_address, a: x.to_address, btc: Number(x.quant) / 1e8 }));
  const cre = filas.filter(x => x.de === CERO), que = filas.filter(x => x.a === CERO);
  console.log('movimientos con la dirección cero: total (según TronScan)', c.total, '| leídos', filas.length, '| creaciones', cre.length, 'por', cre.reduce((s, x) => s + x.btc, 0).toFixed(2), 'BTC | quemas', que.length, 'por', que.reduce((s, x) => s + x.btc, 0).toFixed(2), 'BTC');
  const dest = {}; for (const x of cre) dest[x.a] = (dest[x.a] || 0) + x.btc; console.log(' destinos de las creaciones:', Object.entries(dest).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ' ' + v.toFixed(2)).join(' | '));
  const a = await pag(TS + '/token_trc20/transfers?contract_address=' + BTC + '&relatedAddress=' + TOP + '&sort=timestamp', 400); const fa = a.todo.map(x => ({ tx: x.transaction_id, cuando: new Date(x.block_ts).toISOString(), de: x.from_address, a: x.to_address, btc: Number(x.quant) / 1e8 }));
  console.log('movimientos de BTC de', TOP, ': total', a.total, 'leídos', fa.length); const aJ = fa.filter(x => x.a === JBTC), dJ = fa.filter(x => x.de === JBTC);
  console.log(' envíos a jBTC:', aJ.length, 'por', aJ.reduce((s, x) => s + x.btc, 0).toFixed(2), 'BTC | retiradas de jBTC:', dJ.length, 'por', dJ.reduce((s, x) => s + x.btc, 0).toFixed(2), 'BTC');
  const mayores = aJ.sort((x, y) => y.btc - x.btc).slice(0, 6); for (const x of mayores) console.log('   ', x.cuando, x.btc.toFixed(2), 'BTC hacia jBTC', x.tx.slice(0, 12));
  const recibos = fa.filter(x => x.a === TOP).sort((x, y) => y.btc - x.btc).slice(0, 8); console.log(' mayores entradas a la cuenta:', recibos.map(x => x.cuando.slice(0, 10) + ' ' + x.btc.toFixed(1) + ' BTC de ' + x.de.slice(0, 8)).join(' | '));
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '21-origen-btc.json'), { leido: new Date().toISOString(), token: { nombre: t.name, creador: t.issue_address, creado: t.issue_time, holders: t.holders_count, oferta: Number(t.total_supply_with_decimals) / 1e8 }, creaciones: cre, quemas: que, totalCeroSegunTronScan: c.total, cuentaGrande: fa }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });

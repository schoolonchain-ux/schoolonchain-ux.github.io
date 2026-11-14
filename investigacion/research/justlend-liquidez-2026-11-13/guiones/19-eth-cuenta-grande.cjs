'use strict';
// FASE 9b · Movimientos del token «ETH» (THb4CqiF…) de la cuenta que tiene el 100 % del mercado jETH, y creaciones del token (dirección cero), por TronScan.
const L = require('./lib.cjs'); L.usar('19-2026-11-13'); const path = require('node:path');
const ETH = 'THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF', JETH = 'TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV', TOP = 'TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb', CERO = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
const TS = 'https://apilist.tronscanapi.com/api';
const pag = async (base, maxPag) => { const todo = []; let s = 0, total = null; for (let i = 0; i < (maxPag || 1000); i++) { const r = await L.get(base + '&start=' + s + '&limit=50'); const lista = r.token_transfers || []; total = r.total ?? r.rangeTotal ?? total; todo.push(...lista); if (lista.length < 50) break; s += 50; if (s >= (total || 1e9)) break; } return { todo, total }; };
(async () => {
  const out = {};
  const a = await pag(TS + '/token_trc20/transfers?contract_address=' + ETH + '&relatedAddress=' + TOP + '&sort=timestamp'); out.cuentaGrande = a.todo.map(t => ({ tx: t.transaction_id, cuando: new Date(t.block_ts).toISOString(), de: t.from_address, a: t.to_address, eth: Number(t.quant) / 1e18, tipo: t.event_type })); console.log('movimientos de ETH de', TOP, ': total', a.total, 'leídos', a.todo.length);
  for (const t of out.cuentaGrande.slice(0, 25)) console.log('  ', t.cuando, t.de.slice(0, 8), '→', t.a.slice(0, 8), t.eth.toLocaleString('en', { maximumFractionDigits: 2 }), 'ETH', t.tx.slice(0, 12));
  const m = await pag(TS + '/token_trc20/transfers?contract_address=' + ETH + '&relatedAddress=' + CERO + '&sort=timestamp'); out.creacionesYQuemas = m.todo.map(t => ({ tx: t.transaction_id, cuando: new Date(t.block_ts).toISOString(), de: t.from_address, a: t.to_address, eth: Number(t.quant) / 1e18 })); console.log('movimientos con la dirección cero (creaciones/quemas): total', m.total, 'leídos', m.todo.length);
  const cre = out.creacionesYQuemas.filter(t => t.de === CERO), que = out.creacionesYQuemas.filter(t => t.a === CERO);
  const mes = {}; for (const t of cre) { const k = t.cuando.slice(0, 7); mes[k] = (mes[k] || 0) + t.eth; } console.log(' CREADO por mes:', JSON.stringify(mes), '| total creado', cre.reduce((s, t) => s + t.eth, 0).toLocaleString('en', { maximumFractionDigits: 0 }), '| quemado', que.reduce((s, t) => s + t.eth, 0).toLocaleString('en', { maximumFractionDigits: 0 }));
  const dest = {}; for (const t of cre) dest[t.a] = (dest[t.a] || 0) + t.eth; console.log(' destinos de lo creado:', Object.entries(dest).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([k, v]) => k + ' ' + Math.round(v)).join(' | '));
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '19-eth-cuenta-grande.json'), { leido: new Date().toISOString(), cuentaGrande: out.cuentaGrande, creacionesYQuemas: out.creacionesYQuemas }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });

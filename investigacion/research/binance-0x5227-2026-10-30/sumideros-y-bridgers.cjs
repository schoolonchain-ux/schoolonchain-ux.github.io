'use strict';
// (1) Perfil de los sumideros a los que reenvían las direcciones TRON de THORChain. (2) Destino de los puentes Bridgers (texto de la llamada).
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const H = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronscanKey }, HG = { accept: 'application/json', 'content-type': 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey };
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms)); const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const get = async u => { for (let i = 0; i < 4; i++) { try { await sleep(300); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(800); } } return {}; };
const fmt = n => Math.round(n).toLocaleString('en'); const iso = ms => new Date(ms).toISOString().slice(5, 16).replace('T', ' ');
const estado = JSON.parse(fs.readFileSync('C:/EquipoIA/tron-salidas-watch/state/estado.json', 'utf8')); const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8'));
(async () => {
  console.log('== sumideros');
  const res = [];
  for (const a of ['TXtEs6t2oUWQsNos7m68gbHdE9Q5n6x2oN', 'TU3ymitEKCWQFtASkEeHaPb8NfZcJtCHLt', 'TANdmAmc5jyNEFB1gXbEBfaG7Ftj1XNUG1']) {
    const c = await get('https://apilist.tronscanapi.com/api/accountv2?address=' + a); const g = (((await (await fetch('https://api.trongrid.io/v1/accounts/' + a, { headers: HG })).json()).data) || [])[0] || {};
    let fl = []; for (let p = 0; p < 4; p++) { const t = await get('https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=50&start=' + (p * 50) + '&sort=-timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + a); const x = t.token_transfers || []; fl.push(...x); if (x.length < 50) break; }
    let ent = 0, sal = 0, ini = Infinity, fin = 0; const o = {}, d = {}; for (const f of fl) { const q = Number(f.quant) / 1e6; ini = Math.min(ini, f.block_ts); fin = Math.max(fin, f.block_ts); if (f.to_address === a) { ent += q; const k = f.from_address; o[k] = (o[k] || 0) + q; } else { sal += q; const k = f.to_address + ((f.to_address_tag && f.to_address_tag.to_address_tag) ? ' (' + f.to_address_tag.to_address_tag + ')' : ''); d[k] = (d[k] || 0) + q; } }
    const r = { a, txs: c.transactions, creada: c.date_created ? new Date(c.date_created).toISOString().slice(0, 10) : null, etiqueta: c.publicTag || c.addressTag || null, trx: Number(g.balance || 0) / 1e6, muestra: fl.length, horas: +((fin - ini) / 3600000).toFixed(1), ent, sal, origenes: Object.keys(o).length, destinos: Object.entries(d).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => k.slice(0, 50) + ' ' + fmt(v)), clase: clases[a] ? clases[a].tipo : null, enArbol: !!estado.destinos[a] }; res.push(r);
    console.log(a, '| operaciones', r.txs, '| creada', r.creada, '| etiqueta', r.etiqueta || '-', '| muestra', r.muestra, 'transf. en', r.horas, 'h: entra', fmt(ent), 'de', r.origenes, 'orígenes | sale', fmt(sal), '→', r.destinos.join(' ; '), '| clase', r.clase, '| en árbol', r.enArbol);
  }
  fs.writeFileSync(OUT + 'sumideros-thorchain.json', JSON.stringify(res, null, 1));
  console.log('\n== Bridgers: destino leído de la llamada');
  const F = JSON.parse(fs.readFileSync(OUT + 'puentes-decodificados.json', 'utf8')).filter(f => /Bridgers/i.test(f.puente)); const filas = [];
  for (const f of F) {
    const j = await (await fetch('https://api.trongrid.io/wallet/gettransactionbyid', { method: 'POST', headers: HG, body: JSON.stringify({ value: f.tx }) })).json(); await sleep(260);
    const d = (j.raw_data && j.raw_data.contract[0].parameter.value.data) || ''; const s = Buffer.from(d, 'hex').toString('latin1');
    const m = /([!#*]?)\s*(USDT\([A-Z0-9]+\)|[A-Z]{3,5})\|[a-z0-9]+\|[0-9.]+\|bridgers\|0/.exec(s); const dirEvm = (s.match(/0x[0-9a-fA-F]{40}/) || [null])[0]; const dirSol = !dirEvm ? ((s.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g) || []).find(x => !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(x)) || null) : null; const dirTron = !dirEvm ? ((s.match(/T[1-9A-HJ-NP-Za-km-z]{33}/) || [null])[0]) : null;
    filas.push({ tx: f.tx, puente: f.puente, hora: f.at, usd: f.v, p: f.p, cadena: m ? m[2] : null, evm: dirEvm, sol: dirSol, tron: dirTron, desde: f.desde });
  }
  fs.writeFileSync(OUT + 'bridgers-destinos.json', JSON.stringify(filas, null, 1));
  const por = {}; for (const f of filas) { const k = (f.cadena || '(no leído)'); const x = por[k] || (por[k] = { n: 0, usd: 0, dir: new Set() }); x.n++; x.usd += f.usd; x.dir.add(f.evm || f.sol || f.tron || '?'); }
  for (const [k, x] of Object.entries(por).sort((a, b) => b[1].usd - a[1].usd)) console.log(' ', k.padEnd(16), String(x.n).padStart(3), 'envíos |', fmt(x.usd).padStart(8), '$ | direcciones', x.dir.size);
  for (const f of filas.slice(0, 40)) console.log('   ', iso(f.hora), (f.cadena || '?').padEnd(14), fmt(f.usd).padStart(7), '$', f.evm || f.sol || f.tron || '(sin dirección)', f.tx.slice(0, 12));
})();

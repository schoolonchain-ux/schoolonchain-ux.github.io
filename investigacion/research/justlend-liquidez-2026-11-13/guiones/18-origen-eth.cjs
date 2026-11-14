'use strict';
// FASE 9 · ¿De dónde sale el «ETH» (THb4CqiF…) que hay en JustLend? Se leen las transferencias del token desde su creación y se separan las «creaciones» (origen = dirección cero).
// Solo lectura. TronGrid /v1/contracts/<token>/events, de la más antigua a la más reciente, paginado por «fingerprint».
const L = require('./lib.cjs'); L.usar('18-2026-11-13'); const path = require('node:path'); const b58 = require('./b58.cjs');
const ETH = 'THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF', JETH = 'TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV', TOP = 'TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb', CERO = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
(async () => {
  const info = await L.get('https://apilist.tronscanapi.com/api/token_trc20?contract=' + ETH); const t = info.trc20_tokens && info.trc20_tokens[0];
  console.log('TronScan token:', t ? JSON.stringify({ nombre: t.name, simbolo: t.symbol, creador: t.issue_address, creado: t.issue_time, holders: t.holders_count, oferta: t.total_supply_with_decimals, marca: t.token_desc, home: t.home_page }) : info);
  let url = 'https://api.trongrid.io/v1/contracts/' + ETH + '/events?event_name=Transfer&only_confirmed=true&order_by=block_timestamp,asc&limit=200'; const ev = []; let paginas = 0;
  while (url && paginas < 400) { const r = await L.get(url); for (const e of (r.data || [])) ev.push({ tx: e.transaction_id, t: e.block_timestamp, from: e.result.from || e.result[0], to: e.result.to || e.result[1], v: e.result.value || e.result[2] }); const f = r.meta && r.meta.links && r.meta.links.next; url = f || null; paginas++; if (paginas % 10 === 0) process.stdout.write('.' + ev.length); }
  console.log('\neventos leídos:', ev.length, 'páginas', paginas);
  const hex = h => h && /^0x/.test(h) ? b58('41' + h.slice(2)) : h; const dv = 1e18;
  const creaciones = ev.filter(e => hex(e.from) === CERO || /^0x0{40}$/.test(e.from || ''));
  const porMes = {}; for (const e of creaciones) { const m = new Date(e.t).toISOString().slice(0, 7); porMes[m] = (porMes[m] || 0) + Number(BigInt(e.v)) / dv; }
  console.log('CREACIONES (origen = dirección cero):', creaciones.length, 'por', creaciones.reduce((s, e) => s + Number(BigInt(e.v)) / dv, 0).toLocaleString('en', { maximumFractionDigits: 0 }), 'ETH'); console.log(' por mes:', JSON.stringify(porMes));
  const dest = {}; for (const e of creaciones) { const a = hex(e.to); dest[a] = (dest[a] || 0) + Number(BigInt(e.v)) / dv; } console.log(' destinos de las creaciones (top):', Object.entries(dest).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([a, v]) => a + ' ' + Math.round(v)).join(' | '));
  const aJ = ev.filter(e => hex(e.to) === JETH); const deTop = ev.filter(e => hex(e.from) === TOP || hex(e.to) === TOP);
  console.log('entradas a jETH (depósitos):', aJ.length, '| movimientos de la cuenta TCQQjfcc…:', deTop.length); for (const e of deTop.slice(0, 12)) console.log('  ', new Date(e.t).toISOString(), hex(e.from).slice(0, 8), '→', hex(e.to).slice(0, 8), (Number(BigInt(e.v)) / dv).toLocaleString('en', { maximumFractionDigits: 2 }), 'ETH', e.tx.slice(0, 12));
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '18-origen-eth.json'), { leido: new Date().toISOString(), token: t || null, eventos: ev.length, creaciones: creaciones.map(e => ({ tx: e.tx, cuando: new Date(e.t).toISOString(), a: hex(e.to), eth: Number(BigInt(e.v)) / dv })), porMes, movimientosDeLaCuentaGrande: deTop.map(e => ({ tx: e.tx, cuando: new Date(e.t).toISOString(), de: hex(e.from), a: hex(e.to), eth: Number(BigInt(e.v)) / dv })) }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });

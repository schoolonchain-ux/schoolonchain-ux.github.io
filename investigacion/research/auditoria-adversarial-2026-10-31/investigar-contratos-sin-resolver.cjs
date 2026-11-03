'use strict';
// Para cada contrato donde entra dinero del robo y el rastreo no ve la salida (tramo5-resultado.json → sinResolver.contratos) lee en TronScan: qué es (nombre, métodos, creador, fecha),
// y adónde manda el USDT que saca (hasta 200 salidas recientes, fromAddress). Solo lectura. Salida: resultados/contratos-sin-resolver.json
const fs = require('node:fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const D = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/'; const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(u) { for (let i = 0; i < 6; i++) { try { const r = await fetch(u, { headers: { 'TRON-PRO-API-KEY': keys.tronscanKey }, signal: AbortSignal.timeout(25000) }); const t = await r.text(); if (r.status === 200 && t.startsWith('{')) return JSON.parse(t); } catch {} await sleep(1500 * (i + 1)); } return null; }
(async () => {
  const R = JSON.parse(fs.readFileSync(D + (process.argv[2] || 'tramo5') + '/' + (process.argv[2] || 'tramo5') + '-resultado.json', 'utf8')); const lista = R.sinResolver.contratos; const N = +process.env.N || lista.length;
  const sal = {}; try { Object.assign(sal, JSON.parse(fs.readFileSync(D + 'resultados/contratos-sin-resolver.json', 'utf8')).contratos); } catch {}
  for (const c of lista.slice(0, N)) {
    if (sal[c.a] && sal[c.a].salidas) continue;
    const info = await get(`https://apilist.tronscanapi.com/api/contract?contract=${c.a}`); const d = info && info.data && info.data[0]; await sleep(250);
    const cuenta = await get(`https://apilist.tronscanapi.com/api/accountv2?address=${c.a}`); await sleep(250);
    const dest = {}; let n = 0, tot = 0, primera = null, ultima = null;
    for (let p = 0; p < 4; p++) {
      const j = await get(`https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=50&start=${p * 50}&sort=-timestamp&contract_address=${USDT}&fromAddress=${c.a}`); await sleep(250);
      const rows = (j && j.token_transfers) || []; if (!rows.length) break;
      for (const t of rows) { const v = +t.quant / 1e6; const k = t.to_address; const o = dest[k] || (dest[k] = { n: 0, v: 0, etiqueta: t.toAddressTag || '' }); o.n++; o.v += v; n++; tot += v; primera = primera === null ? t.block_ts : Math.min(primera, t.block_ts); ultima = ultima === null ? t.block_ts : Math.max(ultima, t.block_ts); }
      if (rows.length < 50) break;
    }
    const top = Object.entries(dest).sort((x, y) => y[1].v - x[1].v).slice(0, 5).map(([a, o]) => ({ a, ...o, v: Math.round(o.v) }));
    sal[c.a] = { nombre: c.nombre, entraDelRobo: Math.round(c.v), envios: c.n, remitentes: c.remitentes,
      nombreTronScan: (d && d.name) || (cuenta && cuenta.name) || '', etiquetas: [d && d.tag1, d && d.publicTag, d && d.blueTag, d && d.greyTag, d && d.redTag, cuenta && cuenta.greyTag, cuenta && cuenta.redTag, cuenta && cuenta.publicTag].filter(Boolean), verificado: d ? d.verify_status : null, creador: d && d.creator && d.creator.address, creado: d && d.date_created, operaciones: d && d.trxCount,
      metodos: d && d.methodMap ? Object.values(d.methodMap).slice(0, 25) : [], saldoUsdt: cuenta && (cuenta.withPriceTokens || []).filter(t => t.tokenId === USDT).map(t => +t.amount)[0] || 0,
      salidas: { muestra: n, usdtMuestra: Math.round(tot), desde: primera, hasta: ultima, destinos: top, nDestinos: Object.keys(dest).length, participacionPrincipal: tot > 0 && top[0] ? +(top[0].v / tot).toFixed(4) : null }, leidoEn: new Date().toISOString() };
    fs.writeFileSync(D + 'resultados/contratos-sin-resolver.json', JSON.stringify({ leidoEn: new Date().toISOString(), contratos: sal }, null, 1));
    console.log(c.a.slice(0, 10), String(c.nombre).padEnd(22), String(Math.round(c.v)).padStart(11), '| TS:', sal[c.a].nombreTronScan || '-', '| salidas', n, '| principal', top[0] ? top[0].a.slice(0, 10) + ' ' + Math.round(100 * sal[c.a].salidas.participacionPrincipal) + '%' : '-', '| métodos', sal[c.a].metodos.slice(0, 3).join(', '));
  }
})();

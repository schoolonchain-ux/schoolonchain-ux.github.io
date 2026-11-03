'use strict';
// Estado actual (2-nov): ¿qué ha enviado TRBdWq… desde las 10:11:59 del 31-oct (fin del corte del tramo 3) hasta ahora, y qué saldo le queda? Solo lectura (TronGrid/TronScan vía el lector de onchain-core).
const fs = require('fs');
const { createChainReader } = require('C:/EquipoIA/onchain-core/src/cadena.cjs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const http = async ({ url, method = 'GET', body = null, timeoutMs = 20000, headers: extra }) => { const headers = Object.assign(body ? { 'content-type': 'application/json', accept: 'application/json' } : { accept: 'application/json' }, extra || {}); if (/api\.trongrid\.io/.test(url) && keys.tronGridKey) headers['TRON-PRO-API-KEY'] = keys.tronGridKey; const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs) }); let json = null; try { json = await r.json(); } catch {} return { status: r.status, json }; };
const lector = createChainReader({ http, tronscanKey: keys.tronscanKey, log: () => {} });
const TRB = 'TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki', PX = 0.352, USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
(async () => {
  const desde = Date.UTC(2026, 9, 31, 10, 11, 59) - 1000, ahora = Date.now();
  const l = await lector.leerVentana('tron', TRB, desde, ahora, { maxPaginas: 80, orden: 'asc' });
  const sal = [], ent = [];
  for (const e of l.edges) { let v, sim, cant; if (e.token === 'native') { cant = Number(e.raw) / 1e6; v = cant * PX; sim = 'TRX'; } else if (e.token === USDT) { cant = Number(e.raw) / 1e6; v = cant; sim = 'USDT'; } else continue; const x = { at: e.at, tx: e.tx, sim, cant, v }; if (e.from === TRB && e.to !== TRB) sal.push({ ...x, a: e.to }); else if (e.to === TRB && e.from !== TRB) ent.push({ ...x, de: e.from }); }
  const mayores = sal.filter(x => x.v >= 3520);
  const por = {}; for (const x of mayores) por[new Date(x.at).toISOString().slice(0, 13)] = (por[new Date(x.at).toISOString().slice(0, 13)] || 0) + x.v;
  const todos = sal.filter(x => x.v >= 350).map(x => ({ at: x.at, a: x.a, sim: x.sim, cant: x.cant, v: x.v, tx: x.tx })); const res = { leidoUTC: new Date(ahora).toISOString(), desdeUTC: new Date(desde).toISOString(), errores: l.errores || [], cobertura: l.cobertura, enviosTotal: sal.length, enviosMayores3520: mayores.length, valorMayores: Math.round(mayores.reduce((a, x) => a + x.v, 0)), primero: mayores.length ? new Date(mayores[0].at).toISOString() : null, ultimo: mayores.length ? new Date(mayores[mayores.length - 1].at).toISOString() : null, entradasMayores: ent.filter(x => x.v >= 3520).map(x => ({ ...x, at: new Date(x.at).toISOString() })), porHora: por };
  // saldo actual (TRX)
  try { const r = await http({ url: 'https://api.trongrid.io/v1/accounts/' + TRB }); res.saldoTRX = r.json && r.json.data && r.json.data[0] ? r.json.data[0].balance / 1e6 : null; res.saldoUSD = res.saldoTRX === null ? null : Math.round(res.saldoTRX * PX); } catch (e) { res.saldoError = String(e.message); }
  fs.writeFileSync(__dirname + '/resultados/estado-actual-' + new Date(ahora).toISOString().slice(0, 10) + '.json', JSON.stringify({ ...res, mayores: mayores.map(x => ({ ...x, at: new Date(x.at).toISOString() })), todos350: todos }, null, 1));
  console.log(JSON.stringify(res, null, 1).slice(0, 2500));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });

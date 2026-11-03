'use strict';
// Diagnóstico de lecturas fallidas del tramo 3: relee unas pocas billeteras fallidas e imprime los errores del lector (el rastreador los esconde).
const fs = require('fs');
const { createChainReader } = require('C:/EquipoIA/onchain-core/src/cadena.cjs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const http = async ({ url, method = 'GET', body = null, timeoutMs = 20000, headers: extra }) => { const headers = Object.assign(body ? { 'content-type': 'application/json', accept: 'application/json' } : { accept: 'application/json' }, extra || {}); if (/api\.trongrid\.io/.test(url) && keys.tronGridKey) headers['TRON-PRO-API-KEY'] = keys.tronGridKey; const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs) }); let json = null; try { json = await r.json(); } catch {} return { status: r.status, json }; };
const lector = createChainReader({ http, tronscanKey: keys.tronscanKey, log: () => {} });
const { rec } = JSON.parse(fs.readFileSync(__dirname + '/tramo3/tramo3-cache.json', 'utf8'));
const malas = Object.entries(rec).filter(([w, r]) => r.ok === false);
console.log('lecturas fallidas', malas.length, 'de', Object.keys(rec).length, '| por nivel', JSON.stringify(malas.reduce((o, [, r]) => (o[r.nivel] = (o[r.nivel] || 0) + 1, o), {})));
(async () => {
  for (const [w, r] of malas.slice(0, 6)) {
    try { const l = await lector.leerVentana('tron', w, r.desde - 120000, Date.now(), { maxPaginas: 40, orden: 'asc' }); console.log(w.slice(0, 10), 'errores:', JSON.stringify(l.errores || []).slice(0, 300), '| aristas', (l.edges || []).length, '| cobertura', JSON.stringify(l.cobertura || {}).slice(0, 160)); }
    catch (e) { console.log(w.slice(0, 10), 'EXCEPCIÓN:', String(e.message).slice(0, 200), String(e.cause && e.cause.message || '').slice(0, 100)); }
  }
})();

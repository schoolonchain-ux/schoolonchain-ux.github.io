'use strict';
// LÍNEA F · F3 — ¿A dónde fue el TRX de las «1.000 direcciones» de la TRON Foundation (TSnjgPDQ… → 1.000 cuentas con 16–56 M cada una)? Se lee, con TronScan, el historial de TRX de cada una de las 1.000
// y se agrega: a quién mandaron (destinos que reciben de MUCHAS de ellas = puntos de reunión), cuándo, cuánto. Reanudable. SOLO LECTURA. Reproducible: REPRODUCIR=1 node f3-destino-de-las-mil.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); L.usar('f3-2026-11-05');
const OUT = path.join(__dirname, 'f-fundacion'); const M = x => Math.round(x * 100) / 100; const iso = ms => new Date(ms).toISOString().replace('.000Z', 'Z'); const ANCLA = 1793870328000; const TS = 'https://apilist.tronscanapi.com/api';
const F = JSON.parse(fs.readFileSync(path.join(OUT, 'nivel1-y-las-mil.json'), 'utf8')).TSnjgPDQ.destinos.map(d => d.cuenta); const EST = path.join(OUT, 'las-mil-estado.json'); const FIL = path.join(OUT, 'las-mil-filas.jsonl');
const estado = fs.existsSync(EST) ? JSON.parse(fs.readFileSync(EST, 'utf8')) : { hechas: {} };
(async () => {
  let n = 0; for (const a of F) { if (estado.hechas[a]) continue; const filas = []; let total = null, leidas = 0;
    for (let start = 0; ; start += 50) { const j = await L.get(TS + '/transfer?sort=timestamp&count=true&limit=50&start=' + start + '&address=' + a + '&start_timestamp=0&end_timestamp=' + ANCLA); if (total === null) total = j.total; if (!j.data || !j.data.length) break; leidas += j.data.length; for (const t of j.data) if (t.tokenName === '_' && t.contractRet === 'SUCCESS') filas.push({ m: a, t: t.timestamp, de: t.transferFromAddress, a: t.transferToAddress, trx: Number(t.amount) / 1e6, tx: t.transactionHash }); if (leidas >= total || start > 5000) break; }
    fs.appendFileSync(FIL, filas.map(f => JSON.stringify(f)).join('\n') + (filas.length ? '\n' : '')); estado.hechas[a] = { total, leidas, trx: filas.length, truncada: leidas < total }; n++; if (n % 25 === 0) { fs.writeFileSync(EST, JSON.stringify(estado)); console.log('hechas', Object.keys(estado.hechas).length, '/', F.length); } }
  fs.writeFileSync(EST, JSON.stringify(estado)); console.log('FIN. cuentas', Object.keys(estado.hechas).length, 'truncadas', Object.values(estado.hechas).filter(x => x.truncada).length);
})().catch(e => { try { fs.writeFileSync(EST, JSON.stringify(estado)); } catch { } console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });

'use strict';
// Lectura REPRODUCIBLE (solo lectura) de las 99 direcciones TRON del CSV de Polytrop que no tenemos. Guarda las respuestas tal cual (estado HTTP, cuenta, saldos de todos los tokens
// y las primeras 30 transferencias/aprobaciones TRC20 con hash, contrato del token, decimales, remitente, destinatario y hora), para que cada cifra del informe se pueda recalcular.
// Sustituye a polytrop-tron.cjs (v1), cuya muestra de movimientos no se conservó y cuya «cuenta inexistente» no distinguía de un fallo de consulta. Uso: node polytrop-tron-v2.cjs <salida.json>
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'datos'); const OUT = process.argv[2] || path.join(dir, 'polytrop-tron-v2.json');
const no = JSON.parse(fs.readFileSync(path.join(dir, 'polytrop-no-tenemos.json'), 'utf8')).filter(x => x.red === 'tron');
let S = {}; try { S = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* primera vez */ }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(u) { for (let i = 0; i < 6; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2500 * (i + 1)); continue; } let cuerpo = null; try { cuerpo = await r.json(); } catch { /* sin JSON */ } return { http: r.status, cuerpo }; } catch (e) { await sleep(1500); } } return { http: 0, cuerpo: null }; }
(async () => {
  let n = 0;
  for (const x of no) {
    if (S[x.a] && S[x.a].eventos && S[x.a].eventos.http === 200) continue;
    const c = await get('https://api.trongrid.io/v1/accounts/' + x.a); await sleep(1100);
    const e = await get('https://api.trongrid.io/v1/accounts/' + x.a + '/transactions/trc20?limit=30&order_by=block_timestamp,asc&only_confirmed=true'); await sleep(1100);
    const d = c.cuerpo && c.cuerpo.data && c.cuerpo.data[0];
    S[x.a] = { rol: x.rol, leidoEn: new Date().toISOString(), cuenta: { http: c.http, existe: c.http === 200 ? !!d : null, create_time: d ? d.create_time || null : null, balance_trx: d ? (d.balance === undefined ? 0 : d.balance / 1e6) : null, trc20: d ? d.trc20 || [] : null },
      eventos: { http: e.http, lista: e.cuerpo && Array.isArray(e.cuerpo.data) ? e.cuerpo.data.map(t => ({ tx: t.transaction_id, tipo: t.type, t: t.block_timestamp, de: t.from, a: t.to, valor: t.value, token: t.token_info && t.token_info.address, simbolo: t.token_info && t.token_info.symbol, decimales: t.token_info && t.token_info.decimals })) : null } };
    if (++n % 10 === 0) { fs.writeFileSync(OUT, JSON.stringify(S)); console.log(Object.keys(S).length, '/', no.length); }
  }
  fs.writeFileSync(OUT, JSON.stringify(S)); console.log('FIN', Object.keys(S).length);
})();

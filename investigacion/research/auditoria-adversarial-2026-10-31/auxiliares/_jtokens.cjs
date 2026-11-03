'use strict';
// ¿Qué pasa con los «justificantes» (jUSDT, jTRX…) de las billeteras que depositaron en JustLend? Para cada billetera depositante lee las transferencias DEL PROPIO jToken
// (mint = entrega el contrato, redeem = la billetera lo devuelve al contrato, transferencia = pasa a OTRA billetera) en la ventana del tramo. Solo lectura; diagnóstico, no producto.
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const D = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/' + (process.argv[2] || 'tramo4') + '/'; const pref = process.argv[2] || 'tramo4';
const { rec, term } = JSON.parse(fs.readFileSync(D + pref + '-cache.json', 'utf8')); const clases = JSON.parse(fs.readFileSync(D + 'traza-clases.json', 'utf8'));
const TS = JSON.parse(fs.readFileSync(D + 't4.json', 'utf8')).t3; const sleep = ms => new Promise(r => setTimeout(r, ms));
const claseDe = a => (term[a] && term[a].clase) || clases[a];
const prest = {}; for (const w of Object.keys(rec)) { if (!rec[w].ok) continue; for (const e of rec[w].sal || []) { const c = claseDe(e.a); if (c && c.tipo === 'prestamo' && e.at <= TS) { const p = prest[e.a] || (prest[e.a] = { nombre: c.nombre, ws: new Map() }); p.ws.set(w, (p.ws.get(w) || 0) + e.v); } } }
async function getj(url) { for (let i = 0; i < 6; i++) { try { const r = await fetch(url, { headers: { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey }, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(3000 * (i + 1)); continue; } if (!r.ok) { await sleep(1500 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1500 * (i + 1)); } } return null; }
(async () => {
  const salida = {};
  for (const [c, p] of Object.entries(prest)) {
    const dep$ = [...p.ws.values()].reduce((a, b) => a + b, 0); console.log('contrato', c, p.nombre, '| billeteras depositantes', p.ws.size, '| depositado', Math.round(dep$).toLocaleString('en'), '$');
    let mint = 0, redeem = 0, peer = 0, nMint = 0, nRed = 0, nPeer = 0, fallos = 0; const peers = []; const peerRecv = {}; let incompletas = 0;
    for (const w of p.ws.keys()) {
      const desde = Math.min(...(rec[w].sal || []).filter(e => e.a === c).map(e => e.at)) - 120000; let url = `https://api.trongrid.io/v1/accounts/${w}/transactions/trc20?contract_address=${c}&limit=200&only_confirmed=true&order_by=block_timestamp,asc&min_timestamp=${desde}&max_timestamp=${TS}`; let pag = 0;
      while (url) { const j = await getj(url); if (!j) { fallos++; incompletas++; break; } for (const t of j.data || []) { const v = Number(t.value) / Math.pow(10, Number(t.token_info && t.token_info.decimals) || 8); if (!(v < 1e15)) continue; if (t.from === c && t.to === w) { mint += v; nMint++; } else if (t.to === c && t.from === w) { redeem += v; nRed++; } else if (t.from === w) { peer += v; nPeer++; peers.push({ de: w, a: t.to, v, tx: t.transaction_id, at: t.block_timestamp }); peerRecv[t.to] = (peerRecv[t.to] || 0) + v; } } url = j.meta && j.meta.links && j.meta.links.next; pag++; await sleep(300); if (pag > 100) { incompletas++; break; } }
    }
    salida[c] = { nombre: p.nombre, billeteras: p.ws.size, depositado$: dep$, mint, redeem, peer, nMint, nRed, nPeer, fallos, incompletas, peers, recibe: Object.entries(peerRecv).sort((a, b) => b[1] - a[1]).slice(0, 20) };
    console.log('  jTokens recibidos (mint)', Math.round(mint).toLocaleString('en'), 'en', nMint, '| devueltos al contrato (redeem)', Math.round(redeem).toLocaleString('en'), 'en', nRed, '| ENVIADOS A OTRA BILLETERA', Math.round(peer).toLocaleString('en'), 'en', nPeer, '| lecturas incompletas', incompletas);
  }
  fs.writeFileSync(D + 'jtokens-diagnostico.json', JSON.stringify(salida, null, 1)); console.log('guardado');
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });

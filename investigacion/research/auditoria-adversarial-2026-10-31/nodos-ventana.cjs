'use strict';
// Segunda pasada sobre los nodos: (1) muestra de USDT en la ventana del incidente (30-oct 00:00 → 31-oct 00:00 UTC), no solo las últimas horas;
// (2) quién fondeó con TRX a cada cartera del grupo del 11-oct y si esos fondeadores están relacionados entre sí. Solo lectura.
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronscanKey };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const S = async u => { for (let i = 0; i < 4; i++) { try { await sleep(330); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000); continue; } return await r.json(); } catch { await sleep(900); } } return null; };
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';
const prev = JSON.parse(fs.readFileSync(__dirname + '/resultados/nodos.json', 'utf8'));
const inc = new Set();
for (const f of ['traza-cache.json', 'traza-post-cache.json']) for (const w of Object.keys(JSON.parse(fs.readFileSync(D + f, 'utf8')).rec)) inc.add(w);
const W0 = Date.UTC(2026, 9, 30, 0, 0), W1 = Date.UTC(2026, 9, 31, 0, 0);
const med = l => { const x = l.slice().sort((p, q) => p - q); return x.length ? x[Math.floor(x.length / 2)] : 0; };
(async () => {
  const out = {};
  for (const a of Object.keys(prev)) {
    const mu = [];
    for (let p = 0; p < 4; p++) {
      const j = await S('/api/token_trc20/transfers?limit=50&start=' + (p * 50) + '&sort=-timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + a + '&start_timestamp=' + W0 + '&end_timestamp=' + W1);
      const l = (j && j.token_transfers) || []; mu.push(...l); if (l.length < 50) break;
    }
    const ent = mu.filter(t => t.to_address === a), sal = mu.filter(t => t.from_address === a);
    const cps = new Set(mu.map(t => (t.to_address === a ? t.from_address : t.to_address)));
    const totEnt = ent.reduce((s, t) => s + Number(t.quant) / 1e6, 0), delRec = ent.filter(t => inc.has(t.from_address)).reduce((s, t) => s + Number(t.quant) / 1e6, 0);
    const evs = mu.map(t => ({ at: t.block_ts, e: t.to_address === a })).sort((p, q) => p.at - q.at);
    const lat = []; let ult = null; for (const e of evs) { if (e.e) ult = e.at; else if (ult !== null) lat.push((e.at - ult) / 1000); }
    out[a] = {
      rol: prev[a].rol, n: mu.length, desde: mu.length ? mu[mu.length - 1].block_ts : null, hasta: mu.length ? mu[0].block_ts : null, entradas: ent.length, salidas: sal.length, contrapartes: cps.size,
      pctEntradaDelRecorrido: totEnt ? delRec / totEnt : null, medianaEntrada: med(ent.map(t => Number(t.quant) / 1e6)), medianaSalida: med(sal.map(t => Number(t.quant) / 1e6)), latenciaMedianaSeg: med(lat), cps: [...cps]
    };
    const r = out[a];
    console.log(a.slice(0, 10), r.rol.padEnd(20), 'n', r.n, r.n ? '(' + new Date(r.hasta).toISOString().slice(5, 16) + ' → ' + new Date(r.desde).toISOString().slice(5, 16) + ')' : '', '| ent/sal', r.entradas, '/', r.salidas, '| contrapartes', r.contrapartes,
      '| entrada del recorrido', r.pctEntradaDelRecorrido === null ? '-' : Math.round(r.pctEntradaDelRecorrido * 100) + '%', '| mediana ent/sal', Math.round(r.medianaEntrada), '/', Math.round(r.medianaSalida), '| latencia', Math.round(r.latenciaMedianaSeg) + ' s');
  }
  // fondeadores TRX del grupo de 5 (primera entrada de TRX) y sus propios primeros fondeadores
  const g5 = Object.keys(prev).slice(0, 5), fond = {};
  for (const a of g5) {
    const f = prev[a].primerTRX && prev[a].primerTRX.de; if (!f) continue;
    const c = (await S('/api/accountv2?address=' + f)) || {};
    const pr = await S('/api/transfer?address=' + f + '&limit=1&start=0&sort=timestamp&count=true'); const p1 = ((pr && pr.data) || [])[0];
    const sal = await S('/api/transfer?address=' + f + '&limit=5&start=0&sort=-timestamp&count=true');
    fond[a] = { fondeador: f, creada: c.date_created ? new Date(c.date_created).toISOString().slice(0, 16) : null, ops: c.transactions, etiqueta: c.addressTag || c.publicTag || null, primerFondeoDe: p1 ? p1.transferFromAddress : null, primerFondeoAt: p1 ? new Date(p1.timestamp).toISOString().slice(0, 16) : null, ultimasRecibidas: ((sal && sal.data) || []).map(t => t.transferFromAddress + '→' + t.transferToAddress) };
    console.log('\nfondeador de', a.slice(0, 8), '=', f, '| creada', fond[a].creada, '| ops', c.transactions, '| etiqueta', fond[a].etiqueta, '| su primer fondeo vino de', fond[a].primerFondeoDe, fond[a].primerFondeoAt);
  }
  const pf = Object.values(fond).map(x => x.primerFondeoDe).filter(Boolean);
  console.log('\n¿Los fondeadores comparten su propio primer fondeador?', new Set(pf).size < pf.length ? 'SÍ: ' + pf.join(' | ') : 'No (' + new Set(pf).size + ' distintos de ' + pf.length + ')');
  fs.writeFileSync(__dirname + '/resultados/nodos-ventana.json', JSON.stringify({ ventana: [W0, W1], nodos: out, fondeadores: fond }, null, 1));
})().catch(e => { console.error('ERROR', String(e.message)); process.exit(1); });

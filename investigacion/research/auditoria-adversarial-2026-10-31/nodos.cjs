'use strict';
// Investigación de los «nodos de servicio»: ¿hay indicios de infraestructura coordinada, o se explican por otras cosas?
// Para cada nodo: antigüedad, actividad antes/durante/después del robo (conteos exactos de TronScan por franja), diversidad de contrapartes,
// parte del tráfico que viene del recorrido, primer fondeo, permisos de la cuenta (claves de control en TronGrid) y relaciones entre ellos.
// Solo lectura. No imprime claves.
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronscanKey };
const HG = { accept: 'application/json', 'content-type': 'application/json', 'TRON-PRO-API-KEY': k.tronGridKey };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const S = async u => { for (let i = 0; i < 4; i++) { try { await sleep(330); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000); continue; } return await r.json(); } catch { await sleep(900); } } return null; };
const G = async (p, b) => { for (let i = 0; i < 4; i++) { try { await sleep(260); const r = await fetch('https://api.trongrid.io' + p, { method: 'POST', headers: HG, body: JSON.stringify(b), signal: AbortSignal.timeout(25000) }); return await r.json(); } catch { await sleep(800); } } return null; };
const T = { ROBO: Date.UTC(2026, 9, 29, 20, 0), HOY: Date.now() };
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';
const NODOS = {
  'THPaGKe6aZkUcNht24hcscZPLwtcJAbpun': 'grupo 11-oct', 'TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL': 'grupo 11-oct', 'TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM': 'grupo 11-oct',
  'TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW': 'grupo 11-oct', 'TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B': 'grupo 11-oct',
  'TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc': 'receptor de cambios', 'TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF': 'mayor destino final',
  'TLQh52eDXwkHyWLQLmQzSoW4shogGKwjow': 'nodo tramo 2', 'TQ5SdemHpBawdb31DiwcwSVMQB7iduXgSu': 'nodo tramo 2'
};
const inc = new Set();
for (const f of ['traza-cache.json', 'traza-post-cache.json']) for (const w of Object.keys(JSON.parse(fs.readFileSync(D + f, 'utf8')).rec)) inc.add(w);
const cont = async (a, t0, t1, tipo) => {
  const u = tipo === 'usdt'
    ? '/api/token_trc20/transfers?limit=1&start=0&sort=-timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + a + '&start_timestamp=' + t0 + '&end_timestamp=' + t1
    : '/api/transfer?address=' + a + '&limit=1&start=0&sort=-timestamp&count=true&start_timestamp=' + t0 + '&end_timestamp=' + t1;
  const j = await S(u); return j ? (j.rangeTotal ?? j.total ?? null) : null;
};
const med = l => { const x = l.slice().sort((p, q) => p - q); return x.length ? x[Math.floor(x.length / 2)] : 0; };
(async () => {
  const res = {};
  for (const [a, rol] of Object.entries(NODOS)) {
    const c = (await S('/api/accountv2?address=' + a)) || {};
    const creada = c.date_created || null;
    const g = (await G('/wallet/getaccount', { address: a, visible: true })) || {};
    const perm = {
      owner: ((g.owner_permission || {}).keys || []).map(x => x.address + ':' + x.weight), umbralOwner: (g.owner_permission || {}).threshold,
      activas: (g.active_permission || []).map(p => ({ nombre: p.permission_name, umbral: p.threshold, claves: (p.keys || []).map(x => x.address + ':' + x.weight) })),
      witness: (g.witness_permission || {}).keys || null
    };
    const franjas = { antes: [creada || 0, T.ROBO], durante: [T.ROBO, T.ROBO + 86400000], despues: [T.ROBO + 86400000, T.HOY] };
    const act = {};
    for (const [n, [t0, t1]] of Object.entries(franjas)) act[n] = { usdt: await cont(a, t0, t1, 'usdt'), trx: await cont(a, t0, t1, 'trx'), horas: Math.round((t1 - t0) / 3600000) };
    const mu = [];
    for (let p = 0; p < 4; p++) {
      const j = await S('/api/token_trc20/transfers?limit=50&start=' + (p * 50) + '&sort=-timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + a);
      const l = (j && j.token_transfers) || []; mu.push(...l); if (l.length < 50) break;
    }
    const ent = mu.filter(t => t.to_address === a), sal = mu.filter(t => t.from_address === a);
    const cps = new Set(mu.map(t => (t.to_address === a ? t.from_address : t.to_address)));
    const delRecorrido = ent.filter(t => inc.has(t.from_address)).reduce((s, t) => s + Number(t.quant) / 1e6, 0);
    const totEnt = ent.reduce((s, t) => s + Number(t.quant) / 1e6, 0);
    const evs = mu.map(t => ({ at: t.block_ts, e: t.to_address === a })).sort((p, q) => p.at - q.at);
    const lat = []; let ult = null;
    for (const e of evs) { if (e.e) ult = e.at; else if (ult !== null) lat.push((e.at - ult) / 1000); }
    const pr = await S('/api/transfer?address=' + a + '&limit=1&start=0&sort=timestamp&count=true');
    const primero = ((pr && pr.data) || [])[0];
    const pu = await S('/api/token_trc20/transfers?limit=1&start=0&sort=timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + a);
    const primeroU = ((pu && pu.token_transfers) || [])[0];
    res[a] = {
      rol, creada, ops: c.transactions, etiqueta: c.addressTag || c.publicTag || null, trxHoy: (c.balance || 0) / 1e6, permisos: perm, actividad: act,
      muestra: {
        n: mu.length, desde: mu.length ? mu[mu.length - 1].block_ts : null, hasta: mu.length ? mu[0].block_ts : null, contrapartes: cps.size, entradas: ent.length, salidas: sal.length,
        medianaEntrada: med(ent.map(t => Number(t.quant) / 1e6)), medianaSalida: med(sal.map(t => Number(t.quant) / 1e6)), delRecorridoUSDT: delRecorrido, totalEntradaUSDT: totEnt, latenciaMedianaSeg: med(lat)
      },
      primerTRX: primero ? { de: primero.transferFromAddress, at: primero.timestamp, v: primero.amount / 1e6, tx: primero.transactionHash } : null,
      primerUSDT: primeroU ? { de: primeroU.from_address, at: primeroU.block_ts, v: Number(primeroU.quant) / 1e6 } : null,
      cps: [...cps]
    };
    const r = res[a];
    console.log(a.slice(0, 10), rol.padEnd(20), 'creada', creada ? new Date(creada).toISOString().slice(0, 10) : '?', '| ops', r.ops,
      '| USDT antes/durante/después:', act.antes.usdt, '/', act.durante.usdt, '/', act.despues.usdt,
      '| contrapartes(muestra)', cps.size, '| del recorrido', totEnt ? Math.round(delRecorrido / totEnt * 100) + '%' : '-',
      '| latencia mediana', Math.round(r.muestra.latenciaMedianaSeg) + ' s', '| owner', perm.owner.length ? perm.owner.map(x => x.slice(0, 8)).join(',') : '-');
  }
  fs.writeFileSync(__dirname + '/resultados/nodos.json', JSON.stringify(res, null, 1));
  const ks = Object.keys(res);
  console.log('\nCONTRAPARTES COMPARTIDAS (sobre las 200 últimas transferencias USDT de cada nodo)');
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    const A = new Set(res[ks[i]].cps), B = new Set(res[ks[j]].cps);
    const inter = [...A].filter(x => B.has(x) && x !== ks[i] && x !== ks[j]).length, uni = new Set([...A, ...B]).size;
    const g5 = i < 5 && j < 5;
    if (g5 || inter / uni > 0.15) console.log('  ', ks[i].slice(0, 8), '~', ks[j].slice(0, 8), 'comunes', inter, 'de', uni, (inter / uni * 100).toFixed(1) + '%');
  }
  const clv = {};
  for (const [a, r] of Object.entries(res)) for (const x of [...r.permisos.owner, ...r.permisos.activas.flatMap(p => p.claves)]) { const addr = x.split(':')[0]; (clv[addr] = clv[addr] || new Set()).add(a); }
  console.log('\nCLAVES DE CONTROL (owner/active) y cuántos nodos las comparten:');
  for (const [addr, s] of Object.entries(clv)) console.log('  ', addr, s.size > 1 ? '→ COMPARTIDA por ' + [...s].map(x => x.slice(0, 8)).join(', ') : '→ solo ' + [...s][0].slice(0, 8));
})().catch(e => { console.error('ERROR', String(e.message)); process.exit(1); });

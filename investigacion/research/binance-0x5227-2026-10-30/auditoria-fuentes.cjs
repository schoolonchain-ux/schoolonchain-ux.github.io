'use strict';
// Auditoría: ¿coinciden las cifras de los informes con lo que dicen hoy TronGrid y TronScan?
// Cada comprobación vuelve a pedir el dato en bruto a las dos fuentes y lo compara con (a) lo que dice el informe y (b) la otra fuente.
// Uso: node auditoria-fuentes.cjs [A B C D E F G H ...]   (sin argumentos: todas) → tron/auditoria-fuentes.json
const fs = require('fs');
const { loadTronKeys, loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const CFG = 'C:/EquipoIA/tether-blacklist/config.secret.json';
const keys = loadTronKeys({ file: CFG }); const EK = loadEtherscanKey({ file: CFG }).key;
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronscanKey }, HG = { accept: 'application/json', 'content-type': 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey };
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', PX = 0.352, TFOTO = Date.UTC(2026, 9, 30, 22, 40);
const fmt = n => Math.round(n).toLocaleString('en'); const iso = ms => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
const quiero = process.argv.slice(2).map(s => s.toUpperCase()); const toca = p => !quiero.length || quiero.includes(p);
const RES = {}; let nPet = 0;
// ---------- red ----------
async function getj(url, h, post) { for (let i = 0; i < 5; i++) { try { await sleep(post ? 230 : 330); nPet++; const r = await fetch(url, post ? { method: 'POST', headers: h, body: JSON.stringify(post), signal: AbortSignal.timeout(25000) } : { headers: h, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1000 * (i + 1)); } } return null; }
const S = u => getj('https://apilist.tronscanapi.com' + u, HS), G = (p, b) => getj('https://api.trongrid.io' + p, HG, b), GG = p => getj('https://api.trongrid.io' + p, HG);
// ---------- direcciones ----------
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function h20(a) { if (!a) return null; if (/^[0-9a-f]{64}$/i.test(a)) return a.slice(24).toLowerCase(); if (/^(41)?[0-9a-f]{40}$/i.test(a)) return a.slice(-40).toLowerCase(); if (/^0x[0-9a-f]{40}$/i.test(a)) return a.slice(2).toLowerCase(); let n = 0n; for (const c of a) { const i = AL.indexOf(c); if (i < 0) return null; n = n * 58n + BigInt(i); } const hex = n.toString(16).padStart(50, '0'); return hex.slice(2, 42); }
const pad32 = a => h20(a).padStart(64, '0');
// ---------- una transacción vista por cada fuente ----------
async function porTronGrid(tx) {
  const [t, i] = await Promise.all([G('/wallet/gettransactionbyid', { value: tx, visible: true }), G('/wallet/gettransactioninfobyid', { value: tx })]);
  if (!t || !t.raw_data || !i || i.blockTimeStamp === undefined) return { ok: false };
  const tr = []; const c = t.raw_data.contract[0], v = c.parameter.value;
  if (c.type === 'TransferContract') tr.push({ sim: 'TRX', from: h20(v.owner_address), to: h20(v.to_address), amt: v.amount / 1e6 });
  for (const l of i.log || []) if (l.topics && l.topics.length === 3 && l.topics[0].startsWith('ddf252ad') && l.address === 'a614f803b6fd780986a42c78ec9c7f77e6ded13c') tr.push({ sim: 'USDT', from: h20(l.topics[1]), to: h20(l.topics[2]), amt: Number(BigInt('0x' + l.data)) / 1e6 });
  for (const x of i.internal_transactions || []) { const cv = x.callValueInfo && x.callValueInfo[0] && x.callValueInfo[0].callValue; if (cv && !x.rejected) tr.push({ sim: 'TRX', from: h20(x.caller_address), to: h20(x.transferTo_address), amt: cv / 1e6, interna: true }); }
  return { ok: true, ts: i.blockTimeStamp, ret: ((t.ret || [])[0] || {}).contractRet, tr, owner: h20(v.owner_address) };
}
async function porTronScan(tx) {
  const j = await S('/api/transaction-info?hash=' + tx); if (!j || !j.hash) return { ok: false };
  const tr = []; if (j.contractType === 1 && j.contractData) tr.push({ sim: 'TRX', from: h20(j.ownerAddress), to: h20(j.toAddress), amt: j.contractData.amount / 1e6 });
  for (const t of j.trc20TransferInfo || []) if (t.symbol === 'USDT' && t.contract_address === USDT) tr.push({ sim: 'USDT', from: h20(t.from_address), to: h20(t.to_address), amt: Number(t.amount_str ?? t.amount) / Math.pow(10, t.decimals ?? 6) });
  for (const x of j.internal_transactions ? Object.values(j.internal_transactions).flat() : []) { const v = x.callValueInfo && x.callValueInfo[0] && x.callValueInfo[0].callValue; if (v && !x.rejected) tr.push({ sim: 'TRX', from: h20(x.caller_address || x.from), to: h20(x.transferTo_address || x.to), amt: v / 1e6, interna: true }); }
  return { ok: true, ts: j.timestamp, ret: j.contractRet, tr, owner: h20(j.ownerAddress) };
}
const casa = (lista, e, tol) => lista.find(t => t.sim === e.sim && t.from === e.from && t.to === e.to && Math.abs(t.amt - e.amt) <= tol);
async function verificarTx(e) {   // e = {tx, from, to, sim, amt, at(ms), tol}
  let [g, s] = await Promise.all([porTronGrid(e.tx), porTronScan(e.tx)]); if (!g.ok || !s.ok) { await sleep(2500); if (!g.ok) g = await porTronGrid(e.tx); if (!s.ok) s = await porTronScan(e.tx); } const o = { tx: e.tx, esperado: e, grid: null, scan: null };
  for (const [n, f] of [['grid', g], ['scan', s]]) {
    if (!f.ok) { o[n] = { ok: false, motivo: 'sin respuesta' }; continue; }
    let hit = casa(f.tr, { ...e, from: h20(e.from), to: h20(e.to) }, e.tol ?? 1), virtual = false; if (!hit && e.virtual) { hit = f.tr.find(t => t.sim === e.sim && t.to === h20(e.to) && Math.abs(t.amt - e.amt) <= (e.tol ?? 1)); virtual = !!hit && (f.owner === h20(e.from) || f.tr.some(t => t.from === h20(e.from))); if (!virtual) hit = null; } const dt = e.at ? Math.abs(f.ts - e.at) : null;
    o[n] = { virtual, ok: !!hit && f.ret === 'SUCCESS' && (dt === null || dt <= (e.tolT ?? 3000)), transferencia: !!hit, exito: f.ret === 'SUCCESS', dtSeg: dt === null ? null : dt / 1000, importe: hit ? hit.amt : null, ts: f.ts, vistas: hit ? undefined : f.tr.slice(0, 3) };
  }
  o.coinciden = o.grid.ok && o.scan.ok; o.virtual = !!(o.grid.virtual || o.scan.virtual); return o;
}
function resumen(titulo, lista) { const t = lista.length, ok = lista.filter(x => x.coinciden).length, vi = lista.filter(x => x.coinciden && x.virtual).length, g = lista.filter(x => x.grid.ok).length, s = lista.filter(x => x.scan.ok).length; console.log(`  ${titulo}: ${t} comprobadas | coinciden con el informe en ambas fuentes ${ok} (de ellas ${vi} son cambios en que el USDT llega desde el contrato de intercambio, no desde quien paga) | solo TronGrid ${g} | solo TronScan ${s}`); for (const x of lista.filter(x => !x.coinciden).slice(0, 12)) console.log('    ✗', x.tx.slice(0, 12), 'esperado', x.esperado.sim, fmt(x.esperado.amt), '| grid', JSON.stringify(x.grid).slice(0, 160), '| scan', JSON.stringify(x.scan).slice(0, 160)); return { titulo, total: t, ambas: ok, cambiosVirtuales: vi, grid: g, scan: s, fallos: lista.filter(x => !x.coinciden).map(x => ({ tx: x.tx, esperado: x.esperado, grid: x.grid, scan: x.scan })) }; }
const T = (d, h) => Date.parse(d + 'T' + h + 'Z');
const A = {
  HOT7: 'TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf', TG5: 'TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi', TPB: 'TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4', TCZ: 'TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62', TSP: 'TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A', TAK: 'TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5', TL2: 'TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj', TCB: 'TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk', TJA: 'TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT', TKK: 'TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K', TRB: 'TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki', TM8: 'TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc' };

(async () => {
  const t0 = Date.now();
  // ===== A. Las 16 transacciones de la cadena de custodia (informe de trazabilidad, apartados 2, 3, 4 y 9) =====
  if (toca('A')) {
    console.log('\n== A. cadena de custodia: 16 hashes del informe, cada uno en TronGrid y en TronScan');
    const E = [
      ['6f983ab745fbea298ec6376054fb16155f3142ec0d9f3fec4c053220cafc9644', A.HOT7, A.TG5, 'TRX', 10000, '2026-10-29', '20:20:00'], ['72f5fbedbc4d6f70113e139312eef09fb28a5fefd49d321bc1e28b6cea5bab9c', A.HOT7, A.TG5, 'TRX', 46384098, '2026-10-29', '20:21:12'],
      ['4203af9ca1833d09c05666eafbd70d703a3811c0bdcf125106685ab75958253e', A.HOT7, A.TG5, 'USDT', 612729468, '2026-10-29', '20:22:45'], ['fd8061aaa787ce89d707184dbfdd436a578c7840d674505067725de727c06222', A.TG5, A.TPB, 'USDT', 100000000, '2026-10-29', '20:45:51'],
      ['d40f96e23e95b7ace0ebacd3892f0a1f37555a64da69feedba73443dee4920ee', A.TG5, A.TPB, 'USDT', 200000000, '2026-10-29', '20:56:09'], ['4b329d4495bcdd8df40117cd478f13c5027988147c7deb9add5e4aee3b8107c4', A.TPB, A.TSP, 'TRX', 288330000, '2026-10-29', '20:56:12'],
      ['fb5089f5ce2ae9be6f8e5e3f78470a5a8d694879ac68f6c8cfe3d81450fa6149', A.TPB, A.TSP, 'TRX', 349860942, '2026-10-29', '21:42:42'], ['f4d4e4c665c301159ba35210db65377908f764789480b5b2a2b371494b42245a', A.TCZ, A.TSP, 'TRX', 9987, '2026-10-29', '21:43:27'],
      ['9d0904db84e640d37e9fee8badef0883043db77f5bf9c87ca76e220e0c35c487', A.TSP, A.TAK, 'TRX', 120000000, '2026-10-30', '10:15:21'], ['16585e9664a0e7e74d67caeba2ecdc9869ec9a84a287dc078a12d34ca078c0d1', A.TSP, A.TL2, 'TRX', 120000000, '2026-10-30', '10:18:09'],
      ['037428516b343a326157ae75495ad3227b43e4a4cb0c8c3837e849d7a18d556e', A.TSP, A.TCB, 'TRX', 120000000, '2026-10-30', '10:18:42'], ['3db47d891cc211c300f9ba1aec264bfca8f9e32fbe220c411f30789a31ac8370', A.TSP, A.TJA, 'TRX', 120000000, '2026-10-30', '10:19:24'],
      ['aff887c4be7cd52eb8905899fc9596eaaf9c49dea59129519ce25d7c69762334', A.TSP, A.TKK, 'TRX', 158200900, '2026-10-30', '10:20:18'], ['0ae2b5a4e1c8849d09e16db5a4dd9d90f7224c3b996a80ccad113bd5b81acd39', A.TAK, A.TRB, 'TRX', 120000000, '2026-10-30', '10:20:48'],
      ['6adfc066520a5880df18eebc61bf048d03e8d7a0fca23b04a6b36c9723892736', A.TG5, A.TRB, 'TRX', 46383069, '2026-10-30', '00:06:09'], ['bb05d43bfde6cb869448ad03bf06969e32cc7cd77252a78d41dd7f7c26dbf0b3', A.TL2, A.TRB, 'TRX', 120000000, '2026-10-31', '00:01:15']];
    const out = []; for (const [tx, from, to, sim, amt, d, h] of E) out.push(await verificarTx({ tx, from, to, sim, amt, at: T(d, h), tol: 1 }));
    RES.A = resumen('custodia', out);
    for (const o of out) console.log('   ', o.tx.slice(0, 10), o.esperado.sim.padEnd(4), fmt(o.esperado.amt).padStart(12), '| TronGrid', o.grid.ok ? 'OK ' : 'NO ', 'dt', o.grid.dtSeg, 's', '| TronScan', o.scan.ok ? 'OK ' : 'NO ', 'dt', o.scan.dtSeg, 's');
  }
  // ===== B. Aristas finales: 60 al azar de cada tramo, contra las dos fuentes =====
  if (toca('B')) {
    console.log('\n== B. aristas finales de los dos tramos (muestra al azar con semilla fija)');
    let sem = 20261031; const rnd = () => (sem = (sem * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const muestra = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
    RES.B = [];
    for (const [nom, f] of [['tramo 1', 'traza-aristas-terminales.csv'], ['tramo 2', 'traza-post-aristas-terminales.csv']]) {
      const filas = fs.readFileSync(D + f, 'utf8').split('\n').slice(1).filter(Boolean).map(l => l.split(';')).filter(c => c.length >= 11 && /^[0-9a-f]{64}$/.test(c[10]));
      const ms = muestra(filas, 60); const out = [];
      for (const c of ms) out.push(await verificarTx({ tx: c[10], from: c[1], to: c[2], sim: c[6], amt: Number(c[5]), at: Date.parse(c[0].replace(' ', 'T') + ':00Z'), tol: 1.01, tolT: 61000, virtual: true }));
      RES.B.push({ ...resumen(nom + ' (de ' + filas.length + ' aristas)', out), muestra: ms.length });
    }
  }
  // ===== C. Saldos: dos fuentes entre sí y contra el informe =====
  if (toca('C')) {
    console.log('\n== C. saldos de hoy (TronGrid frente a TronScan; el informe fija los de las 04:15 de Madrid)');
    const ws = [['TKkH2vH6…', A.TKK, 158200902], ['TCBAz7it…', A.TCB, 120000000], ['TJajtPqD…', A.TJA, 120000000], ['TL2F4Ghn…', A.TL2, 0], ['TRBdWq…', A.TRB, 93014675], ['TSpe5HC3…', A.TSP, 37], ['TG5iBMQ…', A.TG5, null], ['TCzBTk…', A.TCZ, null]];
    RES.C = [];
    for (const [n, a, inf] of ws) {
      const g = await GG('/v1/accounts/' + a); const gd = (g && g.data && g.data[0]) || {}; const s = await S('/api/accountv2?address=' + a);
      const gUsdt = ((gd.trc20 || []).find(x => x[USDT]) || {})[USDT]; const sUsdt = ((s && s.withPriceTokens) || []).find(x => x.tokenId === USDT);
      const o = { n, a, informe04h15: inf, trxGrid: (gd.balance || 0) / 1e6, trxScan: s && s.balance !== undefined ? s.balance / 1e6 : null, usdtGrid: gUsdt ? Number(gUsdt) / 1e6 : 0, usdtScan: sUsdt ? Number(sUsdt.balance) / Math.pow(10, sUsdt.tokenDecimal ?? 6) : 0 };
      RES.C.push(o); console.log('  ', n.padEnd(11), 'TRX grid', fmt(o.trxGrid).padStart(12), '| scan', o.trxScan === null ? '?' : fmt(o.trxScan).padStart(12), '| informe 04:15', inf === null ? '-' : fmt(inf).padStart(12), '| USDT grid', fmt(o.usdtGrid).padStart(12), '| scan', fmt(o.usdtScan).padStart(12));
    }
  }
  // ===== D. Tether: bloqueos =====
  if (toca('D')) {
    console.log('\n== D. bloqueos de Tether (isBlackListed en cadena + eventos AddedBlackList)');
    const llama = async (fn, a) => { const r = await G('/wallet/triggerconstantcontract', { owner_address: A.HOT7, contract_address: USDT, function_selector: fn, parameter: pad32(a), visible: true }); return r && r.constant_result ? BigInt('0x' + r.constant_result[0]) : null; };
    const control = { 'Binance Hot 7 (no debe estar bloqueada)': await llama('isBlackListed(address)', A.HOT7), 'TG5iBMQ… (debe estar bloqueada)': await llama('isBlackListed(address)', A.TG5), 'TCzBTk… (debe estar bloqueada)': await llama('isBlackListed(address)', A.TCZ), 'TSpe5HC3… (cuenta de TRX)': await llama('isBlackListed(address)', A.TSP) };
    for (const [k, v] of Object.entries(control)) console.log('  ', k.padEnd(44), v === null ? 'sin respuesta' : (v === 1n ? 'BLOQUEADA' : 'libre'));
    const bal = { TG5: await llama('balanceOf(address)', A.TG5), TCZ: await llama('balanceOf(address)', A.TCZ) }; console.log('   USDT dentro de TG5iBMQ…:', bal.TG5 === null ? '?' : fmt(Number(bal.TG5) / 1e6), '| de TCzBTk…:', bal.TCZ === null ? '?' : fmt(Number(bal.TCZ) / 1e6));
    // eventos frescos desde el 29-oct 20:00 UTC
    let ev = [], fp = null; const url0 = '/v1/contracts/' + USDT + '/events?event_name=AddedBlackList&only_confirmed=true&limit=200&order_by=block_timestamp,asc&min_block_timestamp=' + T('2026-10-29', '20:00:00'); let u = url0;
    for (let p = 0; p < 20; p++) { const j = await GG(u); if (!j || !j.data) break; ev.push(...j.data); fp = j.meta && j.meta.fingerprint; if (!fp) break; u = url0 + '&fingerprint=' + fp; }
    const antes = JSON.parse(fs.readFileSync(D + 'tether-AddedBlackList-21h.json', 'utf8')); const ant = new Set(antes.map(e => e.transaction_id)); const nuevos = ev.filter(e => !ant.has(e.transaction_id)); const faltan = antes.filter(e => !new Set(ev.map(x => x.transaction_id)).has(e.transaction_id));
    const hasta = ev.filter(e => e.block_timestamp <= TFOTO + 3600000);
    console.log('   eventos hoy:', ev.length, '| guardados a las 21h:', antes.length, '| nuevos desde entonces:', nuevos.length, '| guardados que ya no salen:', faltan.length, '| distintos:', new Set(ev.map(e => e.result._user)).size);
    const q = x => '0x' + x.result._user.replace(/^0x/, ''); const hex = ['0x' + h20(A.TG5), '0x' + h20(A.TCZ)]; const delArbol = ev.filter(e => hex.includes(q(e)));
    for (const e of delArbol) console.log('   evento', iso(e.block_timestamp), q(e).slice(0, 12), e.transaction_id.slice(0, 12));
    // comprobar TODAS las direcciones del informe (51 de la segunda oleada) con la llamada en cadena
    const rel = JSON.parse(fs.readFileSync(D + 'tether-bloqueos-relacion-21h.json', 'utf8')); let bloq = 0, libre = 0, ns = 0, usdtActual = 0, usdtInf = 0; const raros = [];
    for (const r of rel) { const v = await llama('isBlackListed(address)', r.a); if (v === null) ns++; else if (v === 1n) bloq++; else { libre++; raros.push(r.a); } const b = await llama('balanceOf(address)', r.a); if (b !== null) usdtActual += Number(b) / 1e6; usdtInf += r.usdt || 0; }
    console.log('   segunda oleada (' + rel.length + ' direcciones del informe): bloqueadas hoy', bloq, '| libres', libre, '| sin respuesta', ns, '| USDT que suman en el informe', fmt(usdtInf), '| USDT que tienen hoy', fmt(usdtActual));
    RES.D = { control: Object.fromEntries(Object.entries(control).map(([k, v]) => [k, v === null ? null : String(v)])), saldoTG5: bal.TG5 === null ? null : Number(bal.TG5) / 1e6, saldoTCZ: bal.TCZ === null ? null : Number(bal.TCZ) / 1e6, eventosHoy: ev.length, eventosGuardados: antes.length, nuevos: nuevos.length, yaNoSalen: faltan.length, distintas: new Set(ev.map(e => e.result._user)).size, oleada: { n: rel.length, bloq, libre, ns, usdtInforme: usdtInf, usdtHoy: usdtActual, libres: raros }, nuevosLista: nuevos.map(e => ({ a: q(e), at: e.block_timestamp, tx: e.transaction_id })) };
  }
  // ===== G. Conservación en TSpe5HC3 y "depósitos sin transacciones propias" =====
  if (toca('G')) {
    console.log('\n== G. cuentas de las billeteras clave (entradas, salidas y operaciones propias)');
    RES.G = {};
    for (const [n, a] of [['TSpe5HC3', A.TSP], ['TKkH2vH6', A.TKK], ['TCBAz7it', A.TCB], ['TJajtPqD', A.TJA], ['TL2F4Ghn', A.TL2]]) {
      let ent = 0, sal = 0, ne = 0, ns = 0, usdtE = 0, usdtS = 0; const sc = []; for (let p = 0; p < 20; p++) { const j = await S('/api/transfer?address=' + a + '&limit=50&start=' + (p * 50) + '&sort=timestamp&count=true'); const d = (j && j.data) || []; sc.push(...d); if (d.length < 50) break; }
      for (const t of sc) { if (t.tokenName !== '_' || t.contractRet !== 'SUCCESS') continue; if (t.transferToAddress === a) { ent += t.amount / 1e6; ne++; } else if (t.transferFromAddress === a) { sal += t.amount / 1e6; ns++; } }
      // TronGrid, otra vía: transacciones normales y de contrato de la cuenta
      let gE = 0, gS = 0, gne = 0, gns = 0, fpr = null, uu = '/v1/accounts/' + a + '/transactions?only_confirmed=true&limit=200'; for (let p = 0; p < 20; p++) { const j = await GG(uu + (fpr ? '&fingerprint=' + fpr : '')); const d = (j && j.data) || []; for (const t of d) { const c = t.raw_data.contract[0]; if (c.type !== 'TransferContract' || (t.ret || [])[0].contractRet !== 'SUCCESS') continue; const v = c.parameter.value; if (h20(v.to_address) === h20(a)) { gE += v.amount / 1e6; gne++; } else if (h20(v.owner_address) === h20(a)) { gS += v.amount / 1e6; gns++; } } fpr = j && j.meta && j.meta.fingerprint; if (!fpr) break; }
      const acc = await S('/api/accountv2?address=' + a);
      RES.G[n] = { scan: { entra: ent, sale: sal, nEntra: ne, nSale: ns }, grid: { entra: gE, sale: gS, nEntra: gne, nSale: gns }, opsTotalesScan: acc && acc.transactions, opsSalientesScan: acc && acc.transactions_out };
      console.log('  ', n.padEnd(9), 'TronScan: entra', fmt(ent), 'TRX en', ne, '| sale', fmt(sal), 'en', ns, '|| TronGrid: entra', fmt(gE), 'en', gne, '| sale', fmt(gS), 'en', gns, '|| operaciones en TronScan', acc && acc.transactions, '(salientes', acc && acc.transactions_out, ')');
    }
  }
  // ===== H. Nombres de las casas de cambio =====
  if (toca('H')) {
    console.log('\n== H. billeteras de casas de cambio: etiqueta pública en TronScan');
    const casas = JSON.parse(fs.readFileSync(D + 'traza-post-casas-top.json', 'utf8')); RES.H = [];
    for (const [n, c] of Object.entries(casas)) { const s = await S('/api/accountv2?address=' + c.hot); const et = s && (s.addressTag || s.publicTag || (s.tag1 ? s.tag1 : null)); RES.H.push({ casa: n, hot: c.hot, etiquetaScan: et || null, operaciones: s && s.transactions }); console.log('  ', n.padEnd(8), c.hot, '| TronScan dice:', et || '(sin etiqueta)', '| operaciones', s && s.transactions); }
  }
  fs.writeFileSync(D + 'auditoria-fuentes-' + (quiero.join('') || 'todo') + '.json', JSON.stringify({ generado: new Date().toISOString(), peticiones: nPet, minutos: +((Date.now() - t0) / 60000).toFixed(1), ...RES }, null, 1));
  console.log('\nlisto en', Math.round((Date.now() - t0) / 1000), 's |', nPet, 'peticiones');
})().catch(e => { console.error('ERROR', e.stack); process.exit(1); });

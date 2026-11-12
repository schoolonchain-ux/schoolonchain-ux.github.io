'use strict';
// VALIDACIÓN CONTRA LOS CONTRATOS: para cada mercado con mucho capital, compara lo que calcula el motor con el estado leído ahora frente a lo que cotiza el contrato oficial (solo lectura, sin transacciones):
//   V1: getTrxToTokenInputPrice / getTokenToTrxInputPrice · V2: getAmountsOut del Router · V3: Quoter (quoteExactInputSingle) · V4: CLQuoter (quoteExactInputSingle).
// Lee el estado y las cotizaciones en la misma tanda y vuelve a leer el estado después: solo cuenta si el estado no cambió. Uso: node validar.cjs [--minimo 200000]
const fs = require('fs'); const AQUI = __dirname.split(String.fromCharCode(92)).join('/') + '/';
const C = require('./curvas.cjs'); const { lote, llamada, hex20, wa, wu, S, AL, bi, sg } = require('./lector.cjs');
const { selector } = require('C:/EquipoIA/chainscope/src/core/keccak.cjs');   // solo para calcular selectores
const SEL = { v2Out: selector('getAmountsOut(uint256,address[])'), v3Q: selector('quoteExactInputSingle(address,address,uint24,uint256,uint160)'), v4Q: selector('quoteExactInputSingle(((address,address,address,uint24,bytes32),bool,uint128,bytes))'), v1TT: selector('getTrxToTokenInputPrice(uint256)'), v1TK: selector('getTokenToTrxInputPrice(uint256)') };
const Q = { v2Router: 'TNJVzGqKBWkJxJB5XYSqGAwUTV15U24pPq', v3Quoter: 'TLhZ48yfHygMLM2uZr87zJJusHjGen97gh', v4Quoter: 'TSupQTJWWoVpUqA7KGVYb8dB97n3civwiJ' };
const w = h => String(h).replace(/^0x/, '').padStart(64, '0');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const MIN = Number(arg('--minimo') || 200000);
const M = JSON.parse(fs.readFileSync(AQUI + 'mercados.json', 'utf8')).mercados.filter(m => m.capital11nov >= MIN);
(async () => {
  const { leerEstado } = require('./lector.cjs');
  // 1) estado (el mismo que usa el monitor) y construcción de los mercados simulables
  const est = await leerEstado(M, {}); const os = M.map(m => ({ m, o: C.construir(m, est) })).filter(x => x.o);
  // 2) tamaños de prueba (en unidades del token vendido): 1.000 $, 100 mil $ y 1 M$ en cada sentido, medidos con el precio al contado del propio mercado
  const items = []; for (const { m, o } of os) { const sp = C.spot(o); for (const z of [true, false]) for (const usd of [1e3, 1e5, 1e6]) { const tokIn = z ? m.token0 : m.token1, dec = z ? m.dec0 : m.dec1; const px = z ? sp : (sp > 0 ? 1 / sp : 0); if (!(px > 0)) continue; const ent = BigInt(Math.floor(usd / px * Math.pow(10, Math.min(dec, 8)))) * 10n ** BigInt(Math.max(dec - 8, 0)); if (ent > 0n) items.push({ m, o, z, usd, tokIn, ent }); } }
  const cot = it => { const m = it.m, z = it.z; if (m.version === 'V1') return llamada(m.direccion, z ? SEL.v1TT : SEL.v1TK, wu(it.ent));
    if (m.version === 'V2') return llamada(Q.v2Router, SEL.v2Out, wu(it.ent), wu(0x40), wu(2), wa(it.tokIn), wa(z ? m.token1 : m.token0));
    if (m.version === 'V3') return llamada(Q.v3Quoter, SEL.v3Q, wa(it.tokIn), wa(z ? m.token1 : m.token0), wu(m.feePpm), wu(it.ent), wu(0));
    return llamada(Q.v4Quoter, SEL.v4Q, wu(32), wa(m.token0), wa(m.token1), wa(m.hooks || 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'), wu(m.feePpm), w(m.parametros), wu(z ? 1 : 0), wu(it.ent), wu(8 * 32), wu(0)); };
  const antes = await Promise.all([]); const rs = await lote(items.map(cot));
  // estado después: si cambió algún pool CL o reservas, esa cotización no cuenta
  const est2 = await leerEstado(M, { rondasMax: 1 });
  const cambio = m => { if (m.version === 'V1') return !est2.v1[m.id] || est2.v1[m.id].trx !== est.v1[m.id].trx || est2.v1[m.id].token !== est.v1[m.id].token; if (m.version === 'V2') return !est2.v2[m.id] || est2.v2[m.id].r0 !== est.v2[m.id].r0 || est2.v2[m.id].r1 !== est.v2[m.id].r1; const a = est.cl[m.id], b = est2.cl[m.id]; return !b || a.sqrtP !== b.sqrtP || a.L !== b.L; };
  const filas = []; let iguales = 0, cercanas = 0, distintas = 0, inestables = 0, sinRespuesta = 0;
  items.forEach((it, i) => { const q = rs[i]; if (cambio(it.m)) { inestables++; return; } let s; try { s = it.o.tipo === 'CP' || true ? C.salida(it.o, it.tokIn, it.ent) : null; } catch (e) { s = null; }
    let c = null; if (q.ok) { const h = q.hex; c = it.m.version === 'V2' ? BigInt('0x' + h.slice(h.length - 64)) : BigInt('0x' + h.slice(0, 64)); if (it.m.version === 'V4') { /* el CLQuoter devuelve deltas con signo: la salida es el valor positivo */ const d = h.slice(0, 64); } }
    if (!q.ok || c == null) { sinRespuesta++; filas.push({ id: it.m.id.slice(0, 16), v: it.m.version, par: it.m.simbolo0 + '/' + it.m.simbolo1, z: it.z, usd: it.usd, motor: s == null ? 'no cabe' : String(s), contrato: 'sin cotización (' + String(q.error || '').slice(0, 40) + ')' }); return; }
    if (s == null) { distintas++; filas.push({ id: it.m.id.slice(0, 16), v: it.m.version, par: it.m.simbolo0 + '/' + it.m.simbolo1, z: it.z, usd: it.usd, motor: 'no cabe (ventana)', contrato: String(c) }); return; }
    const dif = s > c ? s - c : c - s; if (dif === 0n) iguales++; else if (Number(dif) / Number(c || 1n) < 1e-9 || dif <= 2n) cercanas++; else { distintas++; filas.push({ id: it.m.id.slice(0, 16), v: it.m.version, par: it.m.simbolo0 + '/' + it.m.simbolo1, z: it.z, usd: it.usd, motor: String(s), contrato: String(c), difPpm: Math.round(Number(dif) / Number(c || 1n) * 1e6) }); } });
  console.log('mercados:', os.length, '| cotizaciones:', items.length, '| estado cambió durante la prueba (no cuentan):', inestables, '| idénticas:', iguales, '| a ≤ 2 unidades mínimas:', cercanas, '| distintas o sin comparar:', distintas, '| sin respuesta del contrato:', sinRespuesta);
  for (const f of filas.slice(0, 30)) console.log('  ', JSON.stringify(f));
  fs.writeFileSync(AQUI + 'validacion-ultima.json', JSON.stringify({ generado: new Date().toISOString(), mercados: os.length, cotizaciones: items.length, inestables, iguales, cercanas, distintas, sinRespuesta, detalle: filas }, null, 1));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });

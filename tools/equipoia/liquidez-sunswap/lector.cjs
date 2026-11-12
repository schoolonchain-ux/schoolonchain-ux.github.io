'use strict';
// LECTOR DEL ESTADO DE SUNSWAP (SOLO LECTURA, sin claves): lee de TronGrid, por JSON-RPC `eth_call` en lotes, el estado ACTUAL de los mercados que le pidas.
//   V1: saldo de TRX y del token del exchange · V2: getReserves · V3/V4: estado del pool (raíz de precio, tick, liquidez activa, comisiones) y MAPA DE TICKS leído con los lectores oficiales
//   (TickLens de V3 y de V4) en una ventana de ±VENTANA ticks (≈ ×0,55 … ×1,82 el precio). Cada pool se comprueba antes y después de leer sus ticks (como en la investigación).
// Nunca envía transacciones. Un tope de ~3 peticiones/s y reintento tras un aviso 429 (TronGrid sin clave).
const NL = String.fromCharCode(10);
const TG = 'https://api.trongrid.io'; const RPC = TG + '/jsonrpc';
const AL = { v3Lens: 'TBBjWiPHouzEx2QRjBzTw9EA8YjG43XiAi', v4Lens: 'TTuDCMoRaAKGL4V1gmJpmRKpDQz2ZCRQZL', v4PM: 'TVjuTE3V5bMVdpfNhid8kD2v35T2k1u1Br' };
// selectores (keccak256 de la firma, calculados con el módulo keccak de ChainScope)
const S = { getReserves: '0902f1ac', balanceOf: '70a08231', slot0: '3850c7bd', liquidity: '1a686502', fee: 'ddca3f43', v4Slot0: 'c815641c', v4Liq: 'fa6793d5', v3Ticks: '351fb478', v4Ticks: 'b4cf4996' };
const A58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function hex20(a) { if (/^[0-9a-fA-F]{40}$/.test(a)) return a.toLowerCase(); let n = 0n; for (const c of a) { const i = A58.indexOf(c); if (i < 0) throw new Error('dirección no válida ' + a); n = n * 58n + BigInt(i); } const h = n.toString(16).padStart(50, '0'); return h.slice(2, 42); }
const w = h => String(h).replace(/^0x/, '').padStart(64, '0');
const wu = v => { v = BigInt(v); return (v < 0n ? (1n << 256n) + v : v).toString(16).padStart(64, '0'); };
const wa = a => w(hex20(a));
const sg = x => x == null ? null : (x >= (1n << 255n) ? x - (1n << 256n) : x);
const dormir = ms => new Promise(r => setTimeout(r, ms));
let ultima = 0;
async function post(url, cuerpo, intentos = 5) {
  for (let i = 0; i < intentos; i++) {
    const esp = 340 - (Date.now() - ultima); if (esp > 0) await dormir(esp); ultima = Date.now();
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(30000) });
      const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { /* no es JSON */ }
      if (r.status === 429 || (j && /frequency limit|rate limit/i.test(String(j.Error || (j.error && j.error.message) || '')))) { await dormir(31000); continue; }
      if (!r.ok || j == null) { await dormir(2000 * (i + 1)); continue; }
      return j;
    } catch (e) { await dormir(2000 * (i + 1)); }
  }
  throw new Error('TronGrid no responde (' + url + ')');
}
// sub = { a, data } (eth_call con los datos ya codificados) | { metodo: 'eth_getBalance', a }
async function lote(subs, tam = 100) {
  const out = new Array(subs.length);
  for (let i = 0; i < subs.length; i += tam) {
    const trozo = subs.slice(i, i + tam);
    const cuerpo = trozo.map((s, k) => s.metodo === 'eth_getBalance' ? { jsonrpc: '2.0', id: k + 1, method: 'eth_getBalance', params: ['0x' + hex20(s.a), 'latest'] } : { jsonrpc: '2.0', id: k + 1, method: 'eth_call', params: [{ to: '0x' + hex20(s.a), data: '0x' + s.data }, 'latest'] });
    const r = await post(RPC, cuerpo); if (!Array.isArray(r) || r.length !== trozo.length) throw new Error('lote inválido: ' + JSON.stringify(r).slice(0, 160));
    const porId = new Map(r.map(x => [x.id, x]));
    trozo.forEach((s, k) => { const x = porId.get(k + 1); out[i + k] = !x ? { ok: false, error: 'sin respuesta' } : x.error ? { ok: false, error: x.error.message || JSON.stringify(x.error) } : { ok: true, hex: String(x.result).replace(/^0x/, '') }; });
  }
  return out;
}
const hx = (r, i = 0) => (r && r.ok && r.hex && r.hex.length >= (i + 1) * 64) ? r.hex.slice(i * 64, (i + 1) * 64) : null;
const bi = (r, i = 0) => { const h = hx(r, i); return h == null ? null : BigInt('0x' + h); };
const llamada = (a, sel, ...args) => ({ a, data: sel + args.join('') });
function decodificarTicks(hex) {
  const off = Number(BigInt('0x' + hex.slice(0, 64))) * 2; const n = Number(BigInt('0x' + hex.slice(off, off + 64))); const filas = [];
  for (let i = 0; i < n; i++) { const b = off + 64 + i * 192; const t = BigInt('0x' + hex.slice(b, b + 64)), ln = BigInt('0x' + hex.slice(b + 64, b + 128)), lg = BigInt('0x' + hex.slice(b + 128, b + 192)); filas.push({ tick: Number(sg(t)), liquidityNet: sg(ln), liquidityGross: lg }); }
  return filas;
}
const limPal = ts => ({ min: Math.floor(Math.floor(-887272 / ts) / 256), max: Math.floor(Math.floor(887272 / ts) / 256) });
async function estadoCL(mercados) {
  const v3 = mercados.filter(m => m.version === 'V3'), v4 = mercados.filter(m => m.version === 'V4'); const res = new Map();
  const s3 = await lote(v3.map(m => llamada(m.direccion, S.slot0))), l3 = await lote(v3.map(m => llamada(m.direccion, S.liquidity)));
  v3.forEach((m, i) => res.set(m.id, { sqrtP: bi(s3[i], 0), tick: sg(bi(s3[i], 1)), L: bi(l3[i]) }));
  const s4 = await lote(v4.map(m => llamada(AL.v4PM, S.v4Slot0, m.direccion.replace(/^0x/, '')))), l4 = await lote(v4.map(m => llamada(AL.v4PM, S.v4Liq, m.direccion.replace(/^0x/, ''))));
  v4.forEach((m, i) => res.set(m.id, { sqrtP: bi(s4[i], 0), tick: sg(bi(s4[i], 1)), protocolFee: bi(s4[i], 2), lpFee: bi(s4[i], 3), L: bi(l4[i]) }));
  return res;
}
const igualCL = (a, b) => a && b && a.sqrtP === b.sqrtP && a.tick === b.tick && a.L === b.L && a.lpFee === b.lpFee && a.protocolFee === b.protocolFee;
async function bloque() { const b = await post(TG + '/wallet/getnowblock', {}); return { n: b.block_header.raw_data.number, ts: new Date(b.block_header.raw_data.timestamp).toISOString() }; }
// mercados: lista de mercados.json. Devuelve el estado de todos. El mapa de ticks se lee en una ventana de ±palabrasPorLado palabras del bitmap alrededor del tick actual (60 palabras = ±15.360 ticks con espaciado 1; ±153.600 con espaciado 10).
async function leerEstado(mercados, { palabrasPorLado = 60, rondasMax = 4, log = () => {} } = {}) {
  const out = { v1: {}, v2: {}, cl: {}, errores: [], aviso: [] };
  out.bloqueInicio = await bloque();
  const V1 = mercados.filter(m => m.version === 'V1'), V2 = mercados.filter(m => m.version === 'V2'), CL = mercados.filter(m => m.version === 'V3' || m.version === 'V4');
  { const t = await lote(V1.map(m => ({ metodo: 'eth_getBalance', a: m.direccion }))), k = await lote(V1.map(m => llamada(m.token1, S.balanceOf, wa(m.direccion))));
    V1.forEach((m, i) => { const trx = t[i].ok ? BigInt('0x' + (t[i].hex || '0')) : null, tok = bi(k[i]); if (trx == null || tok == null) out.errores.push({ id: m.id, error: 'saldo no legible' }); else out.v1[m.id] = { trx: String(trx), token: String(tok) }; }); log('V1 ' + V1.length); }
  { const rs = await lote(V2.map(m => llamada(m.direccion, S.getReserves)));
    V2.forEach((m, i) => { const r0 = bi(rs[i], 0), r1 = bi(rs[i], 1); if (r0 == null || r1 == null) out.errores.push({ id: m.id, error: 'reservas no legibles' }); else out.v2[m.id] = { r0: String(r0), r1: String(r1) }; }); log('V2 ' + V2.length); }
  let pendientes = CL.slice(); const ultimo = new Map();
  for (let ronda = 1; ronda <= rondasMax && pendientes.length; ronda++) {
    const e1 = await estadoCL(pendientes); const pedidos = [];
    for (const m of pendientes) { const e = e1.get(m.id); if (e.sqrtP == null || e.sqrtP === 0n || e.tick == null) { out.errores.push({ id: m.id, error: 'estado no legible' }); continue; } const ts = m.tickSpacing, l = limPal(ts); const wc = Math.floor(Math.floor(Number(e.tick) / ts) / 256), w0 = Math.max(l.min, wc - palabrasPorLado), w1 = Math.min(l.max, wc + palabrasPorLado); for (let p = w0; p <= w1; p++) pedidos.push({ m, w: p }); }
    const cs = pedidos.map(p => p.m.version === 'V3' ? llamada(AL.v3Lens, S.v3Ticks, wa(p.m.direccion), wu(p.w)) : llamada(AL.v4Lens, S.v4Ticks, p.m.direccion.replace(/^0x/, ''), wu(p.w)));
    const lr = await lote(cs); const e2 = await estadoCL(pendientes); const nuevos = []; const porM = new Map();
    pedidos.forEach((p, i) => { const g = porM.get(p.m.id) || porM.set(p.m.id, { ticks: [], palabras: [], fallos: 0 }).get(p.m.id); if (lr[i].ok) { g.palabras.push(p.w); g.ticks.push(...decodificarTicks(lr[i].hex)); } else g.fallos++; });
    for (const m of pendientes) { const a = e1.get(m.id), b = e2.get(m.id), g = porM.get(m.id); if (!g) continue;
      const foto = { sqrtP: String(b.sqrtP), tick: Number(b.tick), L: String(b.L), protocolFee: b.protocolFee == null ? null : String(b.protocolFee), lpFee: b.lpFee == null ? null : String(b.lpFee), palabras: g.palabras.sort((x, y) => x - y), fallos: g.fallos, ticks: g.ticks.map(t => ({ tick: t.tick, net: String(t.liquidityNet), gross: String(t.liquidityGross) })), rondas: ronda, estable: igualCL(a, b) };
      ultimo.set(m.id, foto); if (foto.estable) out.cl[m.id] = foto; else nuevos.push(m); }
    log('  ronda ' + ronda + ': ' + pendientes.length + ' pools, ' + pedidos.length + ' palabras, a repetir ' + nuevos.length); pendientes = nuevos;
  }
  for (const m of pendientes) { const f = ultimo.get(m.id); if (f) { f.inestable = true; out.cl[m.id] = f; out.aviso.push({ id: m.id, aviso: 'el estado cambió durante la lectura en todas las rondas; se usa la última lectura (puede estar a un bloque de distancia)' }); } else out.errores.push({ id: m.id, error: 'sin foto' }); }
  const v3 = CL.filter(m => m.version === 'V3' && out.cl[m.id]); const f = await lote(v3.map(m => llamada(m.direccion, S.fee))); v3.forEach((m, i) => { out.cl[m.id].feeLeido = bi(f[i]) == null ? null : Number(bi(f[i])); });
  out.bloqueFin = await bloque(); out.generado = new Date().toISOString(); out.palabrasPorLado = palabrasPorLado;
  return out;
}
module.exports = { leerEstado, lote, llamada, post, hex20, wa, wu, S, AL, bloque, bi, sg, decodificarTicks };

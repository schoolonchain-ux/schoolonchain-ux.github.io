'use strict';
// MOTOR DE SIMULACIÓN DE INTERCAMBIOS (Fase 4) · enteros BigInt EXACTOS, sin red. Reproduce paso a paso el código oficial de SUN (github.com/sun-protocol):
//   · V1 (JustSwap) y V2 (Uniswap V2): producto constante con comisión 0,3 % (997/1000), sobre reservas reales.
//   · V3 (Uniswap V3) y V4 (CL de SunSwap V4, derivado de PancakeSwap Infinity): bucle de intercambio por ticks (SwapMath.computeSwapStep, SqrtPriceMath, TickBitmap.nextInitializedTickWithinOneWord, TickMath).
// V3 y V4 NO redondean igual en el último tramo (V4 no recalcula la entrada con el precio final y toma el resto como comisión): hay dos versiones de `computeSwapStep`.
// Todo se valida contra los cotizadores de los propios contratos (f4-5) y contra intercambios reales (f4-6); este fichero por sí solo no demuestra nada.
const Q96 = 1n << 96n, M256 = (1n << 256n) - 1n, M160 = (1n << 160n) - 1n, MIL = 1000000n;
const MIN_TICK = -887272, MAX_TICK = 887272, MIN_SQRT = 4295128739n, MAX_SQRT = 1461446703485210103287273052203988822378723970342n;
const mulDiv = (a, b, d) => (a * b) / d;
const mulDivUp = (a, b, d) => { const p = a * b, q = p / d; return p % d === 0n ? q : q + 1n; };
const divUp = (a, b) => { const q = a / b; return a % b === 0n ? q : q + 1n; };
const isqrt = n => { if (n < 2n) return n; let x = 1n << BigInt((n.toString(2).length + 1) >> 1); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } };

// TickMath.getSqrtRatioAtTick (constantes oficiales de Uniswap V3 / Pancake Infinity / SunSwap)
const TM = [[0x2n, 0xfff97272373d413259a46990580e213an], [0x4n, 0xfff2e50f5f656932ef12357cf3c7fdccn], [0x8n, 0xffe5caca7e10e4e61c3624eaa0941cd0n], [0x10n, 0xffcb9843d60f6159c9db58835c926644n], [0x20n, 0xff973b41fa98c081472e6896dfb254c0n], [0x40n, 0xff2ea16466c96a3843ec78b326b52861n], [0x80n, 0xfe5dee046a99a2a811c461f1969c3053n], [0x100n, 0xfcbe86c7900a88aedcffc83b479aa3a4n], [0x200n, 0xf987a7253ac413176f2b074cf7815e54n], [0x400n, 0xf3392b0822b70005940c7a398e4b70f3n], [0x800n, 0xe7159475a2c29b7443b29c7fa6e889d9n], [0x1000n, 0xd097f3bdfd2022b8845ad8f792aa5825n], [0x2000n, 0xa9f746462d870fdf8a65dc1f90e061e5n], [0x4000n, 0x70d869a156d2a1b890bb3df62baf32f7n], [0x8000n, 0x31be135f97d08fd981231505542fcfa6n], [0x10000n, 0x9aa508b5b7a84e1c677de54f3e99bc9n], [0x20000n, 0x5d6af8dedb81196699c329225ee604n], [0x40000n, 0x2216e584f5fa1ea926041bedfe98n], [0x80000n, 0x48a170391f7dc42444e8fa2n]];
const cacheTick = new Map();
function tickSqrt(tick) {
  if (cacheTick.has(tick)) return cacheTick.get(tick);
  if (tick < MIN_TICK || tick > MAX_TICK) throw new Error('tick fuera de rango ' + tick);
  const abs = BigInt(Math.abs(tick)); let r = (abs & 1n) ? 0xfffcb933bd6fad37aa2d162d1a594001n : (1n << 128n);
  for (const [b, c] of TM) if (abs & b) r = (r * c) >> 128n;
  if (tick > 0) r = M256 / r;
  const v = (r >> 32n) + ((r % (1n << 32n)) === 0n ? 0n : 1n); cacheTick.set(tick, v); return v;
}
// SqrtPriceMath
function amount0Delta(a, b, L, up) { if (a > b) [a, b] = [b, a]; const n1 = L << 96n, n2 = b - a; return up ? divUp(mulDivUp(n1, n2, b), a) : mulDiv(n1, n2, b) / a; }
function amount1Delta(a, b, L, up) { if (a > b) [a, b] = [b, a]; return up ? mulDivUp(L, b - a, Q96) : mulDiv(L, b - a, Q96); }
function nextDeAmount0Up(sp, L, amt, add) {
  if (amt === 0n) return sp; const n1 = L << 96n, prod = amt * sp;
  if (add) { if (prod <= M256) { const den = n1 + prod; if (den >= n1 && den <= M256) return mulDivUp(n1, sp, den); } return divUp(n1, n1 / sp + amt); }
  if (!(prod <= M256 && n1 > prod)) throw new Error('SqrtPriceMath: salida mayor que la liquidez'); return mulDivUp(n1, sp, n1 - prod);
}
function nextDeAmount1Down(sp, L, amt, add) {
  if (add) return sp + (amt <= M160 ? (amt << 96n) / L : mulDiv(amt, Q96, L));
  const q = amt <= M160 ? divUp(amt << 96n, L) : mulDivUp(amt, Q96, L); if (sp <= q) throw new Error('SqrtPriceMath: salida mayor que la liquidez'); return sp - q;
}
const nextDeEntrada = (sp, L, amt, z) => z ? nextDeAmount0Up(sp, L, amt, true) : nextDeAmount1Down(sp, L, amt, true);
// SwapMath.computeSwapStep SOLO entrada exacta. `restante` > 0 es la entrada que queda (con comisión). Devuelve { siguiente, entrada (sin comisión), salida, comision }
function pasoV3(cur, objetivo, L, restante, fee) {
  const z = cur >= objetivo; const sinCom = mulDiv(restante, MIL - fee, MIL);
  let ent = z ? amount0Delta(objetivo, cur, L, true) : amount1Delta(cur, objetivo, L, true), sig;
  if (sinCom >= ent) sig = objetivo; else sig = nextDeEntrada(cur, L, sinCom, z);
  const max = objetivo === sig;
  if (z) { ent = max ? ent : amount0Delta(sig, cur, L, true); var sal = amount1Delta(sig, cur, L, false); }
  else { ent = max ? ent : amount1Delta(cur, sig, L, true); var sal = amount0Delta(cur, sig, L, false); }
  const com = sig !== objetivo ? restante - ent : mulDivUp(ent, fee, MIL - fee);
  return { siguiente: sig, entrada: ent, salida: sal, comision: com };
}
function pasoV4(cur, objetivo, L, restante, fee) {
  const z = cur >= objetivo; const sinCom = mulDiv(restante, MIL - fee, MIL);
  let ent = z ? amount0Delta(objetivo, cur, L, true) : amount1Delta(cur, objetivo, L, true), sig, com;
  if (sinCom >= ent) { sig = objetivo; com = fee === MIL ? ent : mulDivUp(ent, fee, MIL - fee); }
  else { ent = sinCom; sig = nextDeEntrada(cur, L, sinCom, z); com = restante - ent; }
  const sal = z ? amount1Delta(sig, cur, L, false) : amount0Delta(cur, sig, L, false);
  return { siguiente: sig, entrada: ent, salida: sal, comision: com };
}
const msb = x => x.toString(2).length - 1; const lsb = x => { let i = 0; while (!((x >> BigInt(i)) & 1n)) i++; return i; };

// Mercado de liquidez concentrada (V3/V4) con el mapa de ticks leído de la cadena (TickLens). `palabras` = índices de palabra del bitmap realmente leídos.
class PoolCL {
  constructor(o) {
    this.version = o.version; this.fee = BigInt(o.feePips); this.ts = o.tickSpacing; this.sqrtP = BigInt(o.sqrtP); this.tick = o.tick; this.L = BigInt(o.L);
    this.net = new Map(); this.bitmap = new Map(); this.palabras = new Set(o.palabras || []);
    for (const t of o.ticks) { const c = t.tick / this.ts; if (!Number.isInteger(c)) throw new Error('tick ' + t.tick + ' no es múltiplo de ' + this.ts); this.net.set(t.tick, BigInt(t.net)); const w = c >> 8, b = c & 255; this.bitmap.set(w, (this.bitmap.get(w) || 0n) | (1n << BigInt(b))); }
    this.paso = this.version === 'V4' ? pasoV4 : pasoV3; this.mapaCompleto = !!o.mapaCompleto;   // true: se leyó el mapa de ticks COMPLETO (todas las palabras del bitmap); si el recorrido se agota, no hay más liquidez (no es «ventana corta»)
  }
  _siguiente(tick, lte) {
    let c = Math.floor(tick / this.ts);
    if (!lte) c += 1;
    const w = c >> 8, b = c & 255; if (!this.palabras.has(w)) { const e = new Error('VENTANA'); e.palabra = w; throw e; }
    const bm = this.bitmap.get(w) || 0n;
    if (lte) { const m = bm & ((1n << BigInt(b + 1)) - 1n); const ini = m !== 0n; return { tick: (ini ? c - (b - msb(m)) : c - b) * this.ts, ini }; }
    const m = bm & (M256 ^ ((1n << BigInt(b)) - 1n)); const ini = m !== 0n; return { tick: (ini ? c + (lsb(m) - b) : c + (255 - b)) * this.ts, ini };
  }
  // intercambio de entrada exacta `cantidad` (con comisión) hasta agotarla o llegar a `limite` (raíz de precio Q96). z = true: se vende token0.
  swap(z, cantidad, limite, feeOpc) {
    const fee = feeOpc == null ? this.fee : BigInt(feeOpc);
    cantidad = BigInt(cantidad); let sp = this.sqrtP, tick = this.tick, L = this.L, rest = cantidad, sal = 0n, com = 0n, ent = 0n, cruz = 0, pasos = 0, tocoLimite = false, agotadoPorMapa = false;
    const lim = limite == null ? (z ? MIN_SQRT + 1n : MAX_SQRT - 1n) : BigInt(limite);
    if (z ? (lim >= sp || lim <= MIN_SQRT) : (lim <= sp || lim >= MAX_SQRT)) throw new Error('límite de precio no válido');
    while (rest !== 0n && sp !== lim) {
      let nx; try { nx = this._siguiente(tick, z); } catch (e) { if (e.message === 'VENTANA' && this.mapaCompleto) { agotadoPorMapa = true; break; } throw e; } let tn = nx.tick; if (tn < MIN_TICK) tn = MIN_TICK; else if (tn > MAX_TICK) tn = MAX_TICK;
      const spN = tickSqrt(tn); const objetivo = z ? (spN < lim ? lim : spN) : (spN > lim ? lim : spN);
      const st = this.paso(sp, objetivo, L, rest, fee); pasos++;
      sp = st.siguiente; rest -= st.entrada + st.comision; sal += st.salida; com += st.comision; ent += st.entrada;
      if (sp === spN) { if (nx.ini) { let n = this.net.get(tn); if (n === undefined) throw new Error('tick inicializado sin datos ' + tn); if (z) n = -n; L += n; cruz++; } tick = z ? tn - 1 : tn; }
      if (pasos > 20000) throw new Error('demasiados pasos');
    }
    tocoLimite = sp === lim;
    return { entradaBruta: cantidad - rest, entradaNeta: ent, salida: sal, comision: com, sqrtFinal: sp, liquidezFinal: L, ticksCruzados: cruz, pasos, noGastado: rest, tocoLimite, agotadoPorMapa };
  }
}
// Producto constante (V1/V2). r0 = reserva de token0, r1 = de token1. z = true: se vende token0 para recibir token1.
class ProductoConstante {
  constructor(o) { this.version = o.version; this.r0 = BigInt(o.r0); this.r1 = BigInt(o.r1); this.num = BigInt(o.feeNum ?? 997); this.den = BigInt(o.feeDen ?? 1000); }
  get fee() { return (this.den - this.num) * MIL / this.den; }
  _par(z) { return z ? [this.r0, this.r1] : [this.r1, this.r0]; }
  swap(z, cantidad) {
    cantidad = BigInt(cantidad); const [rin, rout] = this._par(z); const conCom = cantidad * this.num; const sal = conCom * rout / (rin * this.den + conCom);
    const com = cantidad - (cantidad * this.num) / this.den;   // comisión nominal = lo que no entra en la fórmula (redondeo hacia abajo de la parte neta)
    return { entradaBruta: cantidad, salida: sal, comision: cantidad * (this.den - this.num) / this.den, rin, rout, rinDespues: rin + cantidad, routDespues: rout - sal, noGastado: 0n };
  }
  // entrada bruta mínima que deja el precio al contado de la operación (reserva de salida / reserva de entrada, después de operar) en la fracción n/d del inicial
  hastaPrecio(z, n, d) {
    const [rin, rout] = this._par(z); const E = 1n << 128n; const objetivo = (rout * E / rin) * BigInt(n) / BigInt(d);
    let lo = 0n, hi = rin * 1000000n;   // la entrada que lo lograría es mucho menor que 10^6 veces la reserva
    for (let i = 0; i < 400 && hi - lo > 1n; i++) { const mid = (lo + hi) / 2n; const r = this.swap(z, mid); const spot = r.routDespues * E / r.rinDespues; if (spot > objetivo) lo = mid; else hi = mid; }
    return this.swap(z, hi);
  }
}
module.exports = { Q96, MIN_TICK, MAX_TICK, MIN_SQRT, MAX_SQRT, tickSqrt, isqrt, amount0Delta, amount1Delta, pasoV3, pasoV4, PoolCL, ProductoConstante, mulDiv, mulDivUp, divUp };

'use strict';
// DECODIFICADOR DE SWAPS (eventos de los recibos): qué se cambió, por qué pool y en qué orden. Solo lo que el recibo dice; lo que no se reconoce se declara como «sin decodificar», no se adivina.
// Eventos reconocidos (el identificador del evento se CALCULA de su firma, no se copia de memoria):
//   Uniswap V2 / forks · Uniswap V3 / forks · Uniswap V4 (PoolManager) · Balancer V2 (Vault) · Curve (TokenExchange).
// Límites (se repiten en cada resultado):
//   · Un swap decodificado dice lo que ocurrió DENTRO de la transacción. No demuestra que el activo recibido «venga de» una transferencia concreta anterior cuando la operación mezcla fondos de varios orígenes.
//   · V4 no dice qué monedas son en el propio evento (las define el identificador del pool): se dan las cantidades con signo y se cruzan con las transferencias del recibo.
//   · Agregadores y multicall: se ven los swaps que emiten; si un enrutador usa un protocolo sin evento reconocido aquí, esa parte queda en «sin decodificar».
const { keccak256 } = require('../../onchain-core/src/keccak.cjs');
const { palabras, uint, int, dir } = require('./abi.cjs');

const FIRMAS = Object.freeze({
  uniswap_v2: 'Swap(address,uint256,uint256,uint256,uint256,address)',
  uniswap_v3: 'Swap(address,address,int256,int256,uint160,uint128,int24)',
  uniswap_v4: 'Swap(bytes32,address,int128,int128,uint160,uint128,int24,uint24)',
  balancer_v2: 'Swap(bytes32,address,address,uint256,uint256)',
  curve: 'TokenExchange(address,int128,uint256,int128,uint256)'
});
const TOPIC = Object.freeze(Object.fromEntries(Object.entries(FIRMAS).map(([k, f]) => [k, '0x' + keccak256(f).toString('hex')])));
const DEX_DE_TOPIC = Object.freeze(Object.fromEntries(Object.entries(TOPIC).map(([k, t]) => [t, k])));
const SEL = Object.freeze({ token0: '0x0dfe1681', token1: '0xd21220a7', coins: '0xc6610657' });

// Decodifica UN log. Devuelve null si no es un swap reconocido o está mal formado.
function decodificarLog(l) {
  if (!l || !Array.isArray(l.topics) || !l.topics[0]) return null;
  const dex = DEX_DE_TOPIC[l.topics[0].toLowerCase()]; if (!dex) return null;
  const w = palabras(l.data), pool = String(l.address).toLowerCase(), base = { dex, pool, log_index: l.logIndex != null ? parseInt(l.logIndex, 16) : null };
  try {
    if (dex === 'uniswap_v2' && l.topics.length === 3 && w.length === 4) return { ...base, sender: dir(l.topics[1]), recipient: dir(l.topics[2]), amount0_in: uint(w[0]).toString(), amount1_in: uint(w[1]).toString(), amount0_out: uint(w[2]).toString(), amount1_out: uint(w[3]).toString() };
    if (dex === 'uniswap_v3' && l.topics.length === 3 && w.length === 5) return { ...base, sender: dir(l.topics[1]), recipient: dir(l.topics[2]), amount0: int(w[0]).toString(), amount1: int(w[1]).toString() };
    if (dex === 'uniswap_v4' && l.topics.length === 3 && w.length === 6) return { ...base, pool_id: l.topics[1].toLowerCase(), sender: dir(l.topics[2]), amount0: int(w[0]).toString(), amount1: int(w[1]).toString() };
    if (dex === 'balancer_v2' && l.topics.length === 4 && w.length === 2) return { ...base, pool_id: l.topics[1].toLowerCase(), token_in: dir(l.topics[2]), token_out: dir(l.topics[3]), amount_in: uint(w[0]).toString(), amount_out: uint(w[1]).toString() };
    if (dex === 'curve' && l.topics.length === 2 && w.length === 4) return { ...base, buyer: dir(l.topics[1]), sold_id: int(w[0]).toString(), tokens_sold: uint(w[1]).toString(), bought_id: int(w[2]).toString(), tokens_bought: uint(w[3]).toString() };
  } catch { /* mal formado */ }
  return null;
}

// Monedas de un pool (token0/token1; coins(i) en Curve). Con caché por red+pool.
function crearResolvedor(rpc) {
  const cache = new Map();
  const dirDe = r => (r && r.ok && typeof r.resultado === 'string' && /^0x[0-9a-fA-F]{64}$/.test(r.resultado) ? dir(r.resultado) : null);
  return {
    async par(red, pool) { const k = red + '|' + pool; if (!cache.has(k)) { const [a, b] = await Promise.all([rpc.call(red, pool, SEL.token0), rpc.call(red, pool, SEL.token1)]); cache.set(k, { token0: dirDe(a), token1: dirDe(b) }); } return cache.get(k); },
    async coin(red, pool, i) { const k = red + '|' + pool + '|c' + i; if (!cache.has(k)) { const r = await rpc.call(red, pool, SEL.coins + BigInt(i).toString(16).padStart(64, '0')); cache.set(k, dirDe(r)); } return cache.get(k); }
  };
}

// Convierte los swaps decodificados en saltos «entra X por pool P, sale Y», en el orden de los logs.
async function saltosDeSwaps(swaps, { rpc, red }) {
  const res = crearResolvedor(rpc), out = [];
  for (const s of [...swaps].sort((a, b) => (a.log_index ?? 0) - (b.log_index ?? 0))) {
    const h = { dex: s.dex, pool: s.pool, pool_id: s.pool_id || null, log_index: s.log_index, entra: [], sale: [], monedas_resueltas: true, notas: [] };
    if (s.dex === 'uniswap_v2' || s.dex === 'uniswap_v3') {
      const p = await res.par(red, s.pool);
      if (!p.token0 || !p.token1) { h.monedas_resueltas = false; h.notas.push('no se pudieron leer token0/token1 del pool'); }
      const a0 = s.dex === 'uniswap_v2' ? BigInt(s.amount0_in) - BigInt(s.amount0_out) : BigInt(s.amount0), a1 = s.dex === 'uniswap_v2' ? BigInt(s.amount1_in) - BigInt(s.amount1_out) : BigInt(s.amount1);
      // a0 > 0: el pool RECIBE token0 (entra al pool, lo paga quien hace el swap); a0 < 0: el pool PAGA token0.
      const lado = (a, tok) => (a > 0n ? h.entra.push({ token: tok, raw: a.toString() }) : a < 0n ? h.sale.push({ token: tok, raw: (-a).toString() }) : 0);
      lado(a0, p.token0); lado(a1, p.token1);
      h.sender = s.sender; h.recipient = s.recipient;
    } else if (s.dex === 'balancer_v2') {
      h.entra.push({ token: s.token_in, raw: s.amount_in }); h.sale.push({ token: s.token_out, raw: s.amount_out });
    } else if (s.dex === 'curve') {
      const [ti, to] = await Promise.all([res.coin(red, s.pool, s.sold_id), res.coin(red, s.pool, s.bought_id)]);
      if (!ti || !to) { h.monedas_resueltas = false; h.notas.push('no se pudo leer coins(i) del pool Curve'); }
      h.entra.push({ token: ti, raw: s.tokens_sold }); h.sale.push({ token: to, raw: s.tokens_bought }); h.sender = s.buyer;
    } else if (s.dex === 'uniswap_v4') {
      h.monedas_resueltas = false; h.sender = s.sender; h.notas.push('Uniswap V4: las monedas dependen del identificador del pool; solo se dan las cantidades con signo (amount0/amount1, desde el punto de vista del pool)');
      h.cantidades_pool = { amount0: s.amount0, amount1: s.amount1 };
    }
    out.push(h);
  }
  return out;
}

// ¿Los saltos encadenan (lo que sale de uno es lo que entra al siguiente)? Es una comprobación de continuidad de la ruta, no una prueba de procedencia.
function continuidad(saltos) {
  const filas = [];
  for (let i = 0; i + 1 < saltos.length; i++) {
    const a = saltos[i], b = saltos[i + 1], salidas = new Set(a.sale.map(x => x.token).filter(Boolean)), entradas = b.entra.map(x => x.token).filter(Boolean);
    const comun = entradas.filter(t => salidas.has(t));
    filas.push({ de: i, a: i + 1, encadenan: comun.length > 0, moneda_comun: comun[0] || null, comprobable: a.monedas_resueltas && b.monedas_resueltas });
  }
  return filas;
}

module.exports = { FIRMAS, TOPIC, DEX_DE_TOPIC, decodificarLog, saltosDeSwaps, continuidad, crearResolvedor };

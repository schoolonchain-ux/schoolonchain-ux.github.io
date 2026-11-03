'use strict';
// LECTOR DE TRANSACCIONES EVM: transacción + recibo + bloque → datos estructurados, con las lecturas crudas para guardarlas como evidencia original.
// Qué NO da (se declara): las transferencias INTERNAS de ETH (llamadas entre contratos) no están en el recibo; se piden aparte a un explorador (Etherscan) cuando hay clave.
const { palabras, dir } = require('./abi.cjs');
const { TOPIC, decodificarLog, saltosDeSwaps, continuidad } = require('./swaps.cjs');
const { keccak256 } = require('../../onchain-core/src/keccak.cjs');

const T = id => '0x' + keccak256(id).toString('hex');
const TOPIC_TRANSFER = T('Transfer(address,address,uint256)'), TOPIC_DEP = T('Deposit(address,uint256)'), TOPIC_RET = T('Withdrawal(address,uint256)');
const iso = s => new Date(Number(s) * 1000).toISOString().replace('.000Z', 'Z');
const hexNum = h => (typeof h === 'string' && /^0x[0-9a-fA-F]+$/.test(h) ? BigInt(h) : null);
// Funciones de entrada que delatan un multicall / agregador (solo el selector; el contrato exacto se confirma con su código).
const MULTICALL = Object.freeze({ '0xac9650d8': 'multicall(bytes[])', '0x5ae401dc': 'multicall(uint256,bytes[])', '0x1f0464d1': 'multicall(bytes32,bytes[])', '0x252dba42': 'aggregate((address,bytes)[])', '0x3593564c': 'execute(bytes,bytes[],uint256) [Universal Router]', '0x24856bc3': 'execute(bytes,bytes[]) [Universal Router]' });

async function leerTransaccion(rpc, red, hash, { tokens = null } = {}) {
  const h = String(hash || '').toLowerCase(); if (!/^0x[0-9a-f]{64}$/.test(h)) throw Object.assign(new Error('TX_INVALIDA'), { codigo: 'TX_INVALIDA' });
  const [tx, rc] = await Promise.all([rpc.transaccion(red, h), rpc.recibo(red, h)]);
  const crudos = [tx, rc].filter(x => x && x.crudo).map((x, i) => ({ tipo: i === 0 ? 'eth_getTransactionByHash' : 'eth_getTransactionReceipt', crudo: x.crudo }));
  const fallo = (error, extra = {}) => ({ ok: false, hash: h, red, error, crudos, consultado_utc: new Date().toISOString(), ...extra });
  if (!tx.ok || !rc.ok) return fallo(`no se pudo leer ${!tx.ok ? 'la transacción' : 'el recibo'}: ${(!tx.ok ? tx : rc).error}`, { no_disponible: true });
  if (tx.resultado == null || rc.resultado == null) return fallo('ningún proveedor conoce esa transacción (no existe en esa red o aún no está confirmada)', { no_encontrada: true });
  const t = tx.resultado, r = rc.resultado, numero = hexNum(r.blockNumber), blk = numero != null ? await rpc.bloque(red, Number(numero)) : null;
  if (blk && blk.crudo) crudos.push({ tipo: 'eth_getBlockByNumber', crudo: blk.crudo });
  const ts = blk && blk.ok && blk.resultado && blk.resultado.timestamp ? iso(BigInt(blk.resultado.timestamp)) : null;
  const logs = Array.isArray(r.logs) ? r.logs : [];
  const transferencias = [], weth = { depositos: [], retiradas: [] }, swapsLog = [], sinDecodificar = new Map(), nfts = [];
  for (const l of logs) {
    if (!l || !Array.isArray(l.topics) || !l.topics.length) continue;
    const t0 = l.topics[0].toLowerCase(), li = l.logIndex != null ? parseInt(l.logIndex, 16) : null, tok = String(l.address).toLowerCase();
    try {
      if (t0 === TOPIC_TRANSFER && l.topics.length === 3 && palabras(l.data).length === 1) transferencias.push({ token: tok, from: dir(l.topics[1]), to: dir(l.topics[2]), raw: BigInt(l.data).toString(), log_index: li });
      else if (t0 === TOPIC_TRANSFER && l.topics.length === 4) nfts.push({ contrato: tok, from: dir(l.topics[1]), to: dir(l.topics[2]), token_id: BigInt(l.topics[3]).toString(), log_index: li });
      else if (t0 === TOPIC_DEP && l.topics.length === 2) weth.depositos.push({ token: tok, to: dir(l.topics[1]), raw: BigInt(l.data).toString(), log_index: li });
      else if (t0 === TOPIC_RET && l.topics.length === 2) weth.retiradas.push({ token: tok, from: dir(l.topics[1]), raw: BigInt(l.data).toString(), log_index: li });
      else { const s = decodificarLog(l); if (s) swapsLog.push(s); else { const k = tok + '|' + t0; sinDecodificar.set(k, (sinDecodificar.get(k) || 0) + 1); } }
    } catch { const k = tok + '|' + t0; sinDecodificar.set(k, (sinDecodificar.get(k) || 0) + 1); }
  }
  const saltos = await saltosDeSwaps(swapsLog, { rpc, red });
  const sel = typeof t.input === 'string' && t.input.length >= 10 ? t.input.slice(0, 10).toLowerCase() : null;
  const info = tokens ? [...new Set([...transferencias.map(x => x.token), ...saltos.flatMap(s => [...s.entra, ...s.sale].map(x => x.token).filter(Boolean))])] : [];
  const monedas = {}; if (tokens) for (const a of info) monedas[a] = await tokens.info(red, a);
  const limites = ['Las transferencias internas de ETH (llamadas entre contratos) no están en el recibo.', 'El recibo dice lo ocurrido dentro de esta transacción; no demuestra de dónde venía cada unidad cuando se mezclan varios orígenes.'];
  if (!blk || !blk.ok || !ts) limites.push('No se pudo leer la fecha del bloque: la hora (UTC) no está confirmada.');
  return {
    ok: true, hash: h, red, consultado_utc: rc.consultado_utc, proveedor: rc.proveedor,
    estado: r.status === '0x1' ? 'exitosa' : r.status === '0x0' ? 'fallida' : 'desconocido',
    from: String(t.from).toLowerCase(), to: t.to ? String(t.to).toLowerCase() : null, crea_contrato: !t.to, contrato_creado: r.contractAddress ? String(r.contractAddress).toLowerCase() : null,
    valor_wei: (hexNum(t.value) || 0n).toString(), bloque: numero != null ? Number(numero) : null, ocurrido_utc: ts, gas_usado: (hexNum(r.gasUsed) || 0n).toString(), indice_en_bloque: hexNum(t.transactionIndex) != null ? Number(hexNum(t.transactionIndex)) : null,
    entrada: { selector: sel, bytes: typeof t.input === 'string' ? Math.max(0, (t.input.length - 2) / 2) : 0, multicall: sel && MULTICALL[sel] ? MULTICALL[sel] : null },
    logs_total: logs.length, transferencias, nft: nfts, weth, swaps: saltos, continuidad_swaps: continuidad(saltos),
    sin_decodificar: [...sinDecodificar].map(([k, n]) => { const [c, e] = k.split('|'); return { contrato: c, evento: e, veces: n }; }),
    monedas, crudos, limites
  };
}

// Balance neto por dirección y moneda de lo que dice el recibo (+ ETH enviado en la transacción y transferencias internas si se pasan). Positivo = recibe, negativo = entrega.
function balanceNeto(r, { internos = [] } = {}) {
  const m = new Map(), ZERO = '0x0000000000000000000000000000000000000000';
  const mover = (tok, from, to, raw) => { const v = BigInt(raw); if (v <= 0n) return; for (const [a, s] of [[from, -1n], [to, 1n]]) { if (a === ZERO) continue; const k = a + '|' + tok; m.set(k, (m.get(k) || 0n) + s * v); } };
  for (const x of r.transferencias) mover(x.token, x.from, x.to, x.raw);
  for (const x of r.weth.depositos) mover('eth(weth)', x.token, x.to, x.raw);
  for (const x of r.weth.retiradas) mover('eth(weth)', x.from, x.token, x.raw);
  if (BigInt(r.valor_wei) > 0n && r.to) mover('eth', r.from, r.to, r.valor_wei);
  for (const x of internos) mover('eth', x.from, x.to, x.raw);
  return [...m].filter(([, v]) => v !== 0n).map(([k, v]) => { const i = k.indexOf('|'); return { direccion: k.slice(0, i), moneda: k.slice(i + 1), neto: v.toString() }; });
}

module.exports = { leerTransaccion, balanceNeto, MULTICALL, TOPIC_TRANSFER };

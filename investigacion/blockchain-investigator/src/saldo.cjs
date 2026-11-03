'use strict';
// SALDO ACTUAL de una dirección (solo lectura): moneda nativa (eth_getBalance) y, si se piden, saldos de tokens (balanceOf del propio contrato).
// Carencia detectada en la prueba de aceptación del caso 0x5227 (fase 7): el agente no podía saber si unos fondos SIGUEN en una dirección; «sin salidas en el periodo leído» no es un saldo.
//  · Todo con la hora del bloque leído: un saldo es verdad a esa hora, no «hoy» para siempre.
//  · El token se identifica por CONTRATO; el símbolo es el que reporta el propio contrato salvo que esté en la lista de verificados.
//  · Devuelve las respuestas crudas con su procedencia para guardarlas como lectura original del expediente.
const { REDES } = require('../../onchain-core/src/redes.cjs');

const SEL_BALANCE_OF = '0x70a08231';
const hexN = h => (typeof h === 'string' && /^0x[0-9a-fA-F]*$/.test(h) && h.length > 2 ? BigInt(h) : null);
const iso = s => new Date(s * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

async function leerSaldos(rpc, tokens, red, direccion, { tokens: lista = [] } = {}) {
  const a = String(direccion).toLowerCase(), consultado = new Date().toISOString(), crudos = [], limites = [];
  const guarda = (tipo, r) => { if (r && r.crudo) crudos.push({ tipo, crudo: r.crudo }); return r; };
  const bn = guarda('eth_blockNumber', await rpc.ultimoBloque(red));
  if (!bn.ok) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: 'no se pudo leer el último bloque: ' + bn.error, crudos };
  const numero = Number(BigInt(bn.resultado)), blk = guarda('eth_getBlockByNumber', await rpc.bloque(red, numero));
  const ts = blk.ok && blk.resultado && blk.resultado.timestamp ? Number(BigInt(blk.resultado.timestamp)) : null;
  if (ts == null) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: 'no se pudo leer la hora del bloque ' + numero, crudos };
  const bloqueTag = '0x' + numero.toString(16), nat = guarda('eth_getBalance', await rpc.saldo(red, a, bloqueTag));
  if (!nat.ok || hexN(nat.resultado) == null) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: 'no se pudo leer el saldo nativo: ' + (nat.error || 'respuesta no válida'), crudos };
  const toks = [];
  for (const t of [...new Set(lista.map(x => String(x).toLowerCase()))].slice(0, 6)) {
    const b = guarda('balanceOf(' + t + ')', await rpc.call(red, t, SEL_BALANCE_OF + '0'.repeat(24) + a.slice(2), bloqueTag)), inf = await tokens.info(red, t);
    if (!b.ok || hexN(b.resultado) == null) { toks.push({ token: t, ok: false, error: b.error || 'el contrato no devolvió un saldo válido' }); continue; }
    toks.push({ token: t, ok: true, raw: hexN(b.resultado).toString(), decimales: inf.decimales, simbolo: inf.identificado_por_contrato || inf.simbolo_reportado, verificado: !!inf.verificado_por_contrato });
  }
  limites.push('Es el saldo en el bloque ' + numero + ' (' + iso(ts) + '): puede cambiar en cualquier momento.', 'El saldo no dice de dónde vino cada unidad ni si pertenece a una persona o entidad concreta.');
  return { ok: true, red, direccion: a, consultado_utc: consultado, bloque: numero, ocurrido_utc: iso(ts), nativo: { simbolo: (REDES[red] || {}).nativo || 'nativo', raw: hexN(nat.resultado).toString(), decimales: 18 }, tokens: toks, crudos, limites };
}
module.exports = { leerSaldos, SEL_BALANCE_OF };

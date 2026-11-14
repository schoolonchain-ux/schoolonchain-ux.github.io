'use strict';
// Llamadas de SOLO LECTURA a contratos de TRON (triggerconstantcontract) con respuesta en bruto guardada por lib.cjs.
const L = require('./lib.cjs'); const { selector } = require('C:/EquipoIA/chainscope/src/core/keccak.cjs');
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const aHex = a => { let n = 0n; for (const ch of a) n = n * 58n + BigInt(AL.indexOf(ch)); return n.toString(16).padStart(50, '0').slice(2, 42); }; // 20 bytes sin el 0x41
const b58 = require('./b58.cjs');
const TG = 'https://api.trongrid.io';
const pad = h => h.padStart(64, '0');
const argAddr = a => pad(aHex(a)); const argU = n => pad(BigInt(n).toString(16));
async function llamar(contrato, firma, args, opc) {
  const body = { owner_address: contrato, contract_address: contrato, function_selector: firma, parameter: (args || []).join(''), visible: true };
  const r = await L.post(TG + '/wallet/triggerconstantcontract', body, opc);
  if (!r || !r.constant_result || !r.constant_result.length) return { ok: false, error: (r && (r.result && r.result.message || r.Error)) || JSON.stringify(r).slice(0, 200) };
  // Respuesta VACÍA = la función no existe o el contrato revierte: es un FALLO declarado, nunca un cero ni una dirección (corregido el 13-nov-2026: antes se decodificaba como dato).
  if (!r.constant_result[0]) return { ok: false, vacia: true, error: 'respuesta vacía (la función no existe o revierte)' };
  return { ok: true, hex: r.constant_result[0] };
}
const u = (hex, i = 0) => BigInt('0x' + (hex.slice(i * 64, i * 64 + 64) || '0'));
const dirDe = (hex, i = 0) => b58('41' + hex.slice(i * 64 + 24, i * 64 + 64));
const texto = hex => { if (!hex || hex.length < 128) { try { return Buffer.from(hex.replace(/(00)+$/, ''), 'hex').toString('utf8'); } catch { return ''; } } const len = Number(u(hex, 1)); return Buffer.from(hex.slice(128, 128 + len * 2), 'hex').toString('utf8'); };
module.exports = { llamar, u, dirDe, texto, argAddr, argU, selector, aHex, b58 };

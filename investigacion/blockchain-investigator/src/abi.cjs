'use strict';
// Decodificación mínima de ABI (sin dependencias): palabras de 32 bytes, enteros con signo, direcciones y textos.
const palabras = data => { const h = String(data || '').replace(/^0x/, ''); const out = []; for (let i = 0; i + 64 <= h.length; i += 64) out.push(h.slice(i, i + 64)); return out; };
const uint = w => BigInt('0x' + w);
const int = (w, bits = 256) => { const v = BigInt('0x' + w), lim = 1n << BigInt(bits - 1), mod = 1n << BigInt(bits); const x = v & (mod - 1n); return x >= lim ? x - mod : x; };
const dir = t => '0x' + String(t).replace(/^0x/, '').slice(-40).toLowerCase();
const hexN = (n, bytes = 32) => BigInt(n).toString(16).padStart(bytes * 2, '0');
const aTexto = hex => { const b = Buffer.from(String(hex).replace(/^0x/, ''), 'hex'); let i = b.indexOf(0); return (i < 0 ? b : b.subarray(0, i)).toString('utf8').replace(/[^\x20-\x7e]/g, ''); };
// Respuesta de una función que devuelve «string» (offset, longitud, bytes) o «bytes32» (símbolos antiguos como MKR).
function textoAbi(data) {
  const h = String(data || '').replace(/^0x/, ''); if (!h) return null;
  if (h.length === 64) return aTexto(h) || null;
  try { const off = Number(BigInt('0x' + h.slice(0, 64))) * 2, len = Number(BigInt('0x' + h.slice(off, off + 64))); if (len > 0 && len < 512) return Buffer.from(h.slice(off + 64, off + 64 + len * 2), 'hex').toString('utf8').replace(/[^\x20-\x7e]/g, ''); } catch { /* formato distinto */ }
  return null;
}
module.exports = { palabras, uint, int, dir, hexN, aTexto, textoAbi };

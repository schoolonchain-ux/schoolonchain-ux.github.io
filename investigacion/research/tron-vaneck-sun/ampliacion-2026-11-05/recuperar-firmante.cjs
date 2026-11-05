'use strict';
// Recupera la dirección TRON que firmó una transacción a partir de su firma ECDSA (secp256k1) y su hash (txID = SHA-256 de raw_data).
// JavaScript puro con BigInt (sin dependencias). Se comprueba SIEMPRE contra firmas de control (cuentas de una sola clave propia) antes de usarlo como prueba: ver g2.
const { keccak256 } = require('./keccak.cjs'); const b58 = require('./b58.cjs');
const P = 2n ** 256n - 2n ** 32n - 977n, N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const G = [0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n, 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n];
const mod = (a, m = P) => ((a % m) + m) % m;
function pot(b, e, m) { let r = 1n; b = mod(b, m); while (e > 0n) { if (e & 1n) r = (r * b) % m; b = (b * b) % m; e >>= 1n; } return r; }
const inv = (a, m = P) => pot(a, m - 2n, m);
function suma(p, q) { if (!p) return q; if (!q) return p; if (p[0] === q[0]) { if (mod(p[1] + q[1]) === 0n) return null; const l = mod(3n * p[0] * p[0] * inv(2n * p[1])); const x = mod(l * l - 2n * p[0]); return [x, mod(l * (p[0] - x) - p[1])]; } const l = mod((q[1] - p[1]) * inv(q[0] - p[0])); const x = mod(l * l - p[0] - q[0]); return [x, mod(l * (p[0] - x) - p[1])]; }
function mult(k, p) { let r = null, a = p; while (k > 0n) { if (k & 1n) r = suma(r, a); a = suma(a, a); k >>= 1n; } return r; }
// hashHex: 64 caracteres hex (txID); firmaHex: 130 caracteres hex (r 32 B + s 32 B + v 1 B). Devuelve la dirección base58 (T…).
function recuperar(hashHex, firmaHex) {
  const r = BigInt('0x' + firmaHex.slice(0, 64)), s = BigInt('0x' + firmaHex.slice(64, 128)); let v = parseInt(firmaHex.slice(128, 130), 16); if (v >= 27) v -= 27; if (v > 1) throw new Error('v no soportado');
  let y = pot(mod(r ** 3n + 7n), (P + 1n) / 4n, P); if (mod(y * y) !== mod(r ** 3n + 7n)) throw new Error('r no está en la curva'); if ((y & 1n) !== BigInt(v)) y = P - y;
  const z = BigInt('0x' + hashHex), ri = inv(r, N); const Q = suma(mult(mod(s * ri, N), [r, y]), mult(mod(-z * ri, N), G)); if (!Q) throw new Error('clave pública en el infinito');
  const pub = Buffer.from(Q[0].toString(16).padStart(64, '0') + Q[1].toString(16).padStart(64, '0'), 'hex'); return b58('41' + keccak256(pub).subarray(12).toString('hex'));
}
module.exports = { recuperar };

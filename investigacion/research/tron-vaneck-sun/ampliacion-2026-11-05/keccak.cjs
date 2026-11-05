'use strict';
// Keccak-256 (el hash de Ethereum; NO es el SHA3-256 estándar de Node) en JavaScript puro. Se usa para calcular los identificadores de función de 4 bytes («selectores») a partir de su firma,
// sin depender de tablas copiadas de memoria. Comprobado en los tests con vectores públicos (hash vacío y selectores conocidos como transfer(address,uint256) = a9059cbb).
const M64 = (1n << 64n) - 1n;
const RC = [0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an, 0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an, 0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n];
const ROTC = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44];
const PILN = [10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1];
const rotl = (x, n) => ((x << BigInt(n)) | (x >> BigInt(64 - n))) & M64;

function keccakf(st) {
  const bc = new Array(5);
  for (let r = 0; r < 24; r++) {
    for (let i = 0; i < 5; i++) bc[i] = st[i] ^ st[i + 5] ^ st[i + 10] ^ st[i + 15] ^ st[i + 20];
    for (let i = 0; i < 5; i++) { const t = bc[(i + 4) % 5] ^ rotl(bc[(i + 1) % 5], 1); for (let j = 0; j < 25; j += 5) st[j + i] ^= t; }
    let t = st[1];
    for (let i = 0; i < 24; i++) { const j = PILN[i], b0 = st[j]; st[j] = rotl(t, ROTC[i]); t = b0; }
    for (let j = 0; j < 25; j += 5) { for (let i = 0; i < 5; i++) bc[i] = st[j + i]; for (let i = 0; i < 5; i++) st[j + i] ^= (~bc[(i + 1) % 5] & M64) & bc[(i + 2) % 5]; }
    st[0] ^= RC[r];
  }
}

// keccak256(Buffer | string) -> Buffer de 32 bytes
// pad = 0x01 es Keccak (Ethereum); 0x06 es SHA3-256 estándar: solo se usa en los tests para contrastar con el SHA3 de Node en entradas largas.
function keccak256(input, pad = 0x01) {
  const data = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8'), rate = 136, st = new Array(25).fill(0n);
  const padded = Buffer.alloc(Math.ceil((data.length + 1) / rate) * rate); data.copy(padded); padded[data.length] ^= pad; padded[padded.length - 1] ^= 0x80;
  for (let off = 0; off < padded.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) st[i] ^= padded.readBigUInt64LE(off + i * 8);
    keccakf(st);
  }
  const out = Buffer.alloc(32); for (let i = 0; i < 4; i++) out.writeBigUInt64LE(st[i], i * 8);
  return out;
}
const selector = firma => keccak256(firma).subarray(0, 4).toString('hex');   // «transfer(address,uint256)» -> 'a9059cbb'

module.exports = { keccak256, selector };

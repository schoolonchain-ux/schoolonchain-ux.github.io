'use strict';
// Precios hora a hora (TRX, ETH en USDT; USDT/USDC nominales 1 $) para valorar cada movimiento a la hora en que ocurre. Serie: datos/precios-1h.json (scripts/actualizar-precios.cjs).
const fs = require('node:fs'); const path = require('node:path');
let S = null; try { S = JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'precios-1h.json'), 'utf8')); } catch { S = null; }
const buscar = (serie, t) => { if (!serie || !serie.length || t < serie[0][0] || t > serie[serie.length - 1][0] + 3600000) return null; let lo = 0, hi = serie.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (serie[m][0] <= t) lo = m; else hi = m - 1; } return serie[lo]; };
function precio(activo, t) { if (activo === 'USDT' || activo === 'USDC') return 1; if (!S || !S[activo]) return null; const k = buscar(S[activo], t); return k ? k[1] : null; }
const ultimo = activo => (S && S[activo] && S[activo].length ? { t: S[activo][S[activo].length - 1][0], p: S[activo][S[activo].length - 1][1] } : null);
module.exports = { precio, ultimo, disponible: () => !!S, metodo: () => (S ? S.fuente : null), leidoEn: () => (S ? S.leidoEn : null) };

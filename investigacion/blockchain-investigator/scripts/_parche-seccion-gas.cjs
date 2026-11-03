'use strict';
// Parche (3-nov): añade la sección 16 «Cuenta de gas TBEbSQuJwp…» al informe de trazabilidad: constructor de datos (perdida-rastro.cjs), llamada en el generador, sección HTML e índice.
const fs = require('fs'); const base = 'C:/EquipoIA/blockchain-investigator/';
function parchear(f, pares) { let s = fs.readFileSync(base + f, 'utf8'); for (const [a, b] of pares) { if (!s.includes(a)) throw new Error(f + ': no encontrado: ' + a.slice(0, 70)); if (s.split(a).length !== 2) throw new Error(f + ': aparece más de una vez: ' + a.slice(0, 70)); s = s.replace(a, b); } fs.writeFileSync(base + f, s); }

// 1) constructor de datos
parchear('src/libro-mayor/perdida-rastro.cjs', [[
  'module.exports = { construirPerdida, construirPolytrop, construirArkham };',
  `// Cuenta de gas TBEbSQuJwp… (3-nov): qué hace, a quién envía TRX, de dónde sale su TRX y qué vínculo de pago se ve. Todo sale de ficheros ya guardados en research/polytrop-2026-11-03/datos (lecturas de TronGrid guardadas tal cual).
function construirGas(dirDatos, cachesTramos) {
  const fC = path.join(dirDatos, 'financiadora-gas-completa.json'), fA = path.join(dirDatos, 'financiadora-gas-analisis.json'), fT = path.join(dirDatos, 'cuenta-TAT51WDh.json'), fV = path.join(dirDatos, 'gas-vinculo-pago.json');
  if (![fC, fA, fT, fV].every(existe)) return null; const C = j(fC), A = j(fA), T = j(fT), V = j(fV);
  const K = new Set(); for (const f of cachesTramos) { if (!existe(f)) continue; const c = j(f); for (const s of ['rec', 'term']) for (const a of Object.keys(c[s] || {})) K.add(a); }
  const tipos = {}; for (const f of C.filas) { const k = f.tipo + (f.de === C.direccion ? ' sale' : ' entra'); tipos[k] = (tipos[k] || 0) + 1; }
  const del = A.DelegateResourceContract, env = A.TransferContract; const horas = env.map(x => [x.primero, x.ultimo]).flat();
  const filasEnv = env.map(x => ({ a: x.a, n: x.n, trx: x.trx, primero: new Date(x.primero).toISOString(), ultimo: new Date(x.ultimo).toISOString(), rastreada: K.has(x.a), nuestra: x.nuestra, polytrop: x.polytrop })).sort((p, q) => (q.rastreada - p.rastreada) || p.primero.localeCompare(q.primero));
  const rast = filasEnv.filter(x => x.rastreada); const ids = rast.map(x => x.primero).sort();
  const imp = {}; for (const x of rast) { const k = Math.round(x.trx / x.n); imp[k] = (imp[k] || 0) + 1; }
  const payers = new Set(); for (const x of T.trx) if (x.a === T.direccion && x.v >= 1) payers.add(x.de); for (const x of T.u20) if (x.a === T.direccion && x.v >= 1) payers.add(x.de);
  const aGas = T.trxSale.find(x => x.a === C.direccion) || null; const usdtSale = T.usdtSale[0] || null;
  const emp = V.filter(x => x.pagado && x.trx); const sinEntrada = V.filter(x => x.soloPago);
  return { cuenta: C.direccion, desde: C.filas.length ? new Date(Math.min(...C.filas.map(x => x.t))).toISOString() : null, hasta: new Date(Math.max(...C.filas.map(x => x.t))).toISOString(), operaciones: C.n, tipos,
    delegaciones: { receptoras: del.length, nuestras: del.filter(x => x.nuestra).length, polytrop: del.filter(x => x.polytrop).length, rastreadas: del.filter(x => K.has(x.a)).length },
    envios: { n: env.reduce((s, x) => s + x.n, 0), receptoras: env.length, rastreadas: rast.length, rastreadasPolytrop: rast.filter(x => x.polytrop).length, nuestras: env.filter(x => x.nuestra).length, polytrop: env.filter(x => x.polytrop).length, noRastreadas: env.length - rast.length, primeroRastreadas: ids[0], ultimoRastreadas: ids[ids.length - 1], importesFrecuentes: Object.entries(imp).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, c]) => ({ trx: +v, receptoras: c })), mensajes: C.filas.filter(f => f.de === C.direccion && f.mensaje).length, lista: filasEnv },
    negocio: { cuenta: T.direccion, creada: T.creada, clientes: payers.size, clientesNuestros: V && 0, enviadoAGas: aGas ? { trx: aGas.v, n: aGas.n, primero: new Date(aGas.primero).toISOString(), ultimo: new Date(aGas.ultimo).toISOString() } : null, usdtDestino: usdtSale ? { a: usdtSale.a, usdt: usdtSale.v, n: usdtSale.n, primero: new Date(usdtSale.primero).toISOString(), ultimo: new Date(usdtSale.ultimo).toISOString() } : null },
    vinculo: { pagos: V, emparejados: emp.length, trxEmparejados: emp.reduce((s, x) => s + x.pagado, 0), pagosSinEntrada: sinEntrada.length, trxSinEntrada: sinEntrada.reduce((s, x) => s + x.pagado, 0) } };
}
module.exports = { construirPerdida, construirPolytrop, construirArkham, construirGas };`]]);

// 2) generador: construir y pasar a DATOS
parchear('scripts/informe-trazabilidad.cjs', [
  ['const { construirPerdida, construirPolytrop, construirArkham } = require(', 'const { construirPerdida, construirPolytrop, construirArkham, construirGas } = require('],
  ['polytrop, arkham, parcial:', 'polytrop, arkham, gas: construirGas(\'C:/EquipoIA/research/polytrop-2026-11-03/datos\', [A + \'tramo3/tramo3-cache.json\', A + \'tramo4/tramo4-cache.json\', T5 + \'/tramo5-cache.json\', T6 + \'/tramo6-cache.json\']), parcial:']]);

// 3) índice
parchear('src/libro-mayor/informe-html.cjs', [["['s15', '15 Arkham (NUEVO)'],", "['s15', '15 Arkham (NUEVO)'], ['s16', '16 Cuenta de gas (NUEVO v0.3)'],"]]);

console.log('base aplicada');

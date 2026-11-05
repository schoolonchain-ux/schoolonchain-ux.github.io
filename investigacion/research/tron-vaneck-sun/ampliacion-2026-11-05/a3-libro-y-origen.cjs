'use strict';
// LÍNEA A · A3 — Libro de la cuenta de energía TEF9ZV: (1) origen de cada entrada de TRX (cadena verificada en 0.3 / A6 / A6c), (2) saldos por fechas
// (libre / congelado / delegado / congelado sin delegar) con control de cierre, (3) de qué origen es el TRX que sostiene lo delegado a cada familia,
// dado como RANGO con tres métodos (primero en entrar-primero en usarse, último en entrar-primero en usarse, y reparto proporcional).
// Los métodos son MODELOS: el TRX es intercambiable y la cadena no etiqueta unidades. Se guardan los tres con su método. SOLO LECTURA, sin red.
// Reproducible: node a3-libro-y-origen.cjs (lee solo ficheros ya congelados).
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const OUT = path.join(__dirname, 'a3-libro');
const rd = (...p) => JSON.parse(fs.readFileSync(path.join(__dirname, ...p), 'utf8')); const M = x => Math.round(x * 100) / 100;
const ev = rd('a1-tef9zv', 'eventos.json'), rec = rd('a2-a4-a5', 'receptores-81.json'), ent = rd('f0-3-pistas', 'entradas-tef9zv.json'), anclas = rd('linea-base', 'anclas.json'), cuentas = rd('linea-base', 'cuentas.json');
// Origen de cada entrada ≥ 1 M (prefijo del hash → origen y por qué se sabe). La cadena de cada una está en f0-3-pistas/ y a6-origen/.
const ORIGEN = {
  '55d91dcf21': ['TT2T17', '30-10-2025: TT2T17→TGStnGYq→HTX 4→TEF9ZV (100 M, +4 min)'], 'cbdc04b288': ['TT2T17', 'ídem'],
  'd86d5dff9f': ['TT2T17', '12-11-2025: TT2T17→TB1LbnUG→HTX 4→TEF9ZV (64 M, +2 min)'],
  '0a4600714c': ['Desconocido (TKpiitwG…)', '02-02-2026: TKpiitwG…→TRziP5Ls (billetera de un día)→HTX 4→TEF9ZV (100 M, +5 min); origen de TKpiitwG… sin seguir'],
  '99950554ad': ['TPyjyZ (directo)', '02-03-2026: TPyjyZ→TVgFeBur (billetera de un día)→HTX 4→TEF9ZV (100 M, +3 min)'],
  'c185f866bb': ['TT2T17', '21-03-2026: TT2T17→TM5h24Au→HTX 4→TEF9ZV (200 M, +2 min)'], '15a4608d89': ['TT2T17', 'ídem'],
  '45b31684d4': ['TT2T17', '07-05-2026 12:15: TT2T17→TBRoa9xa→HTX 4 (180 M) → 12:20 y 12:24 a TEF9ZV'], '0d33217c4d': ['TT2T17', 'ídem'],
  '442ae337b9': ['HTX-Cold 6', '07-05-2026 12:48: HTX-Cold 6→TPznYuGC (200 M)→HTX 4 → 12:53 y 12:54 a TEF9ZV (180 M)'], '8d84c9f89e': ['HTX-Cold 6', 'ídem'],
  'ec9520b9f4': ['TT2T17', '20-10-2026: TT2T17→TFaboiG8→proveedora→TEF9ZV (100 M, +4 min)'],
  'b02dee0924': ['TYL7z7VS (2022)', '02-11-2026: TYL7z7VS→TJHKNV4J→proveedora→TEF9ZV (500 M, +5 min). TYL7z7VS recibió 971 M de TPyjyZ (2022) y 950 M de TQwh1Z (2024)'],
  'db113f1bec': ['TT2T17', '04-11-2026: TT2T17→TQRBxpS5→proveedora→TEF9ZV (150 M, +14 min)']
};
const recompensas = rd('a3-libro', 'recompensas.json');   // cobros de recompensa de votos (a3-0-recompensas.cjs); entran en el libro como una entrada más
const tIni = Date.parse(anclas.bloque_hora_utc); const significativas = ent.filter(e => e.trx >= 1e6); const sinOrigen = significativas.filter(e => !ORIGEN[e.tx.slice(0, 10)]);
if (sinOrigen.length) { console.error('Hay entradas ≥1 M sin origen asignado:', sinOrigen.map(e => e.tx.slice(0, 10))); process.exit(2); }
const entradasOrigen = significativas.map(e => ({ ...e, origen: ORIGEN[e.tx.slice(0, 10)][0], por_que: ORIGEN[e.tx.slice(0, 10)][1] }));
for (const r of recompensas) entradasOrigen.push({ t: r.t, tx: r.tx, de: '(recompensa de votos de la propia red)', trx: r.trx, origen: 'Recompensa de votos', por_que: 'WithdrawBalance: recompensa por los votos de la cuenta, importe leído del recibo de la transacción' });
entradasOrigen.sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
const totalEntrada = entradasOrigen.reduce((s, e) => s + e.trx, 0); const porOrigen = {}; for (const e of entradasOrigen) porOrigen[e.origen] = (porOrigen[e.origen] || 0) + e.trx;
// ---- (2) Libro por fechas
const evs = ev.filter(f => f.ok); const salidas = evs.filter(f => f.tipo === 'Transfer' && f.de === 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B');
const cortes = [['2026-10-28T23:59:59Z', 'víspera del robo'], ['2026-10-31T23:59:59Z', '31-oct'], ['2026-11-01T12:00:00Z', '1-nov mediodía'], ['2026-11-02T23:59:59Z', 'fin del 2-nov'], ['2026-11-03T23:59:59Z', 'fin del 3-nov'], [anclas.bloque_hora_utc, 'línea base (5-nov)']];
const libro = cortes.map(([t, etq]) => { const ms = Date.parse(t); let entra = 0, sale = 0, frz = 0, unf = 0, del = 0; for (const f of evs) { if (f.t > ms) continue; if (f.tipo === 'Transfer') { if (f.a === 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B') entra += f.trx; else sale += f.trx; } else if (f.tipo === 'FreezeBalanceV2') frz += f.trx; else if (f.tipo === 'UnfreezeBalanceV2') unf += f.trx; else if (f.tipo === 'DelegateResource') del += f.trx; else if (f.tipo === 'UnDelegateResource') del -= f.trx; }
  for (const r of recompensas) if (Date.parse(r.t) <= ms) entra += r.trx; const congelado = frz - unf; return { corte: t, etiqueta: etq, entradas_acumuladas: M(entra), salidas_acumuladas: M(sale), congelado_total: M(congelado), delegado_total: M(del), congelado_sin_delegar: M(congelado - del), libre_calculado: M(entra - sale - frz + unf) }; });
const lb = cuentas.find(c => c.direccion_consultada === 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B'); const cadena = { libre: lb.trx_libre, congelado_propio: Object.values(lb.bloqueado_v2).reduce((s, v) => s + v, 0), delegado: lb.delegado_a_otros.energia + lb.delegado_a_otros.ancho_banda };
const ult = libro[libro.length - 1]; const cierre = { libre: { calculado: ult.libre_calculado, cadena: M(cadena.libre), dif: M(ult.libre_calculado - cadena.libre) }, congelado_sin_delegar: { calculado: ult.congelado_sin_delegar, cadena: M(cadena.congelado_propio), dif: M(ult.congelado_sin_delegar - cadena.congelado_propio) }, delegado: { calculado: ult.delegado_total, cadena: M(cadena.delegado), dif: M(ult.delegado_total - cadena.delegado) } };
// ---- (3) Modelos de origen
const fam = Object.fromEntries(rec.map(r => [r.receptor, r.familia])); const orden = [];
for (const e of entradasOrigen) orden.push({ t: Date.parse(e.t), tipo: 'in', origen: e.origen, trx: e.trx });
for (const f of evs) if (f.tipo === 'DelegateResource' || f.tipo === 'UnDelegateResource') orden.push({ t: f.t, tipo: f.tipo === 'DelegateResource' ? 'del' : 'und', receptor: f.a, trx: f.trx });
orden.sort((a, b) => a.t - b.t || (a.tipo === 'in' ? -1 : 1));
function simula(metodo) {
  let rango = 0; const libres = []; const asignado = new Map(); let faltante = 0; const tomar = (n) => { const out = []; let falta = n; while (falta > 1e-6 && libres.length) { libres.sort((a, b) => metodo === 'FIFO' ? a.rango - b.rango : b.rango - a.rango); const s = libres[0]; const x = Math.min(s.amt, falta); out.push({ origen: s.origen, rango: s.rango, amt: x }); s.amt -= x; falta -= x; if (s.amt <= 1e-9) libres.shift(); } if (falta > 1e-6) { out.push({ origen: 'sin origen en el modelo', rango: 1e9, amt: falta }); faltante += falta; } return out; };
  for (const o of orden) { if (o.tipo === 'in') libres.push({ origen: o.origen, rango: rango++, amt: o.trx }); else if (o.tipo === 'del') { const seg = tomar(o.trx); const l = asignado.get(o.receptor) || []; l.push(...seg); asignado.set(o.receptor, l); } else { const l = asignado.get(o.receptor) || []; let falta = o.trx; while (falta > 1e-6 && l.length) { const s = l[l.length - 1]; const x = Math.min(s.amt, falta); if (s.origen !== 'sin origen en el modelo') libres.push({ origen: s.origen, rango: s.rango, amt: x }); s.amt -= x; falta -= x; if (s.amt <= 1e-9) l.pop(); } } }
  const porFam = {}; for (const [r, l] of asignado) for (const s of l) { const f = fam[r] || 'receptor fuera de la lista actual'; porFam[f] = porFam[f] || {}; porFam[f][s.origen] = (porFam[f][s.origen] || 0) + s.amt; }
  return { porFam, faltante };
}
const FIFO = simula('FIFO'), LIFO = simula('LIFO'); const finalPorFam = {}; for (const r of rec) finalPorFam[r.familia] = (finalPorFam[r.familia] || 0) + r.total;
const mezcla = Object.fromEntries(Object.entries(porOrigen).map(([k, v]) => [k, v / totalEntrada])); const PROP = {}; for (const [f, t] of Object.entries(finalPorFam)) { PROP[f] = {}; for (const [k, p] of Object.entries(mezcla)) PROP[f][k] = t * p; }
const nuevas = 'Binance — billeteras nuevas (creadas tras el robo)'; const origenes = Object.keys(porOrigen).concat(['sin origen en el modelo']); const rangoNuevas = {};
for (const k of origenes) { const v = [FIFO.porFam[nuevas] && FIFO.porFam[nuevas][k] || 0, LIFO.porFam[nuevas] && LIFO.porFam[nuevas][k] || 0, PROP[nuevas][k] || 0]; rangoNuevas[k] = { FIFO: M(v[0]), LIFO: M(v[1]), proporcional: M(v[2]), minimo: M(Math.min(...v)), maximo: M(Math.max(...v)) }; }
// Aumento posterior al 2-nov hacia las billeteras nuevas de Binance (dato, no modelo)
const t2 = Date.parse('2026-11-02T23:59:59Z'); const sube = evs.filter(f => f.t > t2 && (f.tipo === 'DelegateResource' || f.tipo === 'UnDelegateResource') && fam[f.a] === nuevas).reduce((s, f) => s + (f.tipo === 'DelegateResource' ? f.trx : -f.trx), 0);
const subeTodas = evs.filter(f => f.t > t2 && (f.tipo === 'DelegateResource' || f.tipo === 'UnDelegateResource')).reduce((s, f) => s + (f.tipo === 'DelegateResource' ? f.trx : -f.trx), 0);
const h = {}; h['entradas-con-origen.json'] = L.guardar(path.join(OUT, 'entradas-con-origen.json'), { total_entradas_significativas: M(totalEntrada), por_origen: Object.fromEntries(Object.entries(porOrigen).map(([k, v]) => [k, { trx: M(v), porcentaje: M(100 * v / totalEntrada) }])), entradas: entradasOrigen });
h['libro-por-fechas.json'] = L.guardar(path.join(OUT, 'libro-por-fechas.json'), { libro, cierre_con_la_cadena: cierre }); h['origen-de-lo-delegado.json'] = L.guardar(path.join(OUT, 'origen-de-lo-delegado.json'), { metodos: 'FIFO = el TRX que llegó antes es el primero en usarse; LIFO = el último en llegar es el primero en usarse; proporcional = cada familia tiene la misma mezcla de orígenes que todo el TRX recibido. Son modelos.', faltante_FIFO: M(FIFO.faltante), faltante_LIFO: M(LIFO.faltante), rango_para_billeteras_nuevas_de_Binance: rangoNuevas, FIFO: FIFO.porFam, LIFO: LIFO.porFam, proporcional: PROP, aumento_posterior_al_2nov: { hacia_billeteras_nuevas_de_Binance: M(sube), todas_las_familias: M(subeTodas) } });
console.log('Entradas ≥1 M:', significativas.length, 'total', M(totalEntrada / 1e6) + ' M'); for (const [k, v] of Object.entries(porOrigen).sort((a, b) => b[1] - a[1])) console.log('  ', k.padEnd(28), M(v / 1e6).toString().padStart(8), 'M', M(100 * v / totalEntrada) + ' %');
console.log('\nLibro (M TRX):'); for (const l of libro) console.log('  ', l.corte.slice(0, 16), l.etiqueta.padEnd(18), 'entradas', M(l.entradas_acumuladas / 1e6), '| congelado', M(l.congelado_total / 1e6), '| delegado', M(l.delegado_total / 1e6), '| congelado SIN delegar', M(l.congelado_sin_delegar / 1e6), '| libre', M(l.libre_calculado / 1e6));
console.log('\nCIERRE con la cadena (línea base):', JSON.stringify(cierre));
console.log('\nRango del origen de los', M(finalPorFam[nuevas] / 1e6), 'M delegados a las billeteras NUEVAS de Binance (M TRX):'); for (const [k, v] of Object.entries(rangoNuevas)) if (v.maximo > 0) console.log('  ', k.padEnd(28), 'FIFO', M(v.FIFO / 1e6), '| LIFO', M(v.LIFO / 1e6), '| prop.', M(v.proporcional / 1e6), '→ rango', M(v.minimo / 1e6), '–', M(v.maximo / 1e6));
console.log('\nAumento tras el 2-nov hacia billeteras nuevas de Binance:', M(sube / 1e6), 'M | todas las familias:', M(subeTodas / 1e6), 'M | faltante modelo FIFO/LIFO:', M(FIFO.faltante / 1e6), M(LIFO.faltante / 1e6)); console.log(JSON.stringify(h, null, 1));

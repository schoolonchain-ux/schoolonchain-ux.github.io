'use strict';
// Aplica el CORTE DE LA FOTO (30-oct 22:40 UTC) a los ficheros de cruces de cadena del tramo 6 (reparto ANTERIOR a la foto): se conservan solo los cruces cuyo envío en TRON ocurrió hasta la foto.
// Lee SIEMPRE del original congelado tramo6-v02/ y escribe en tramo6-v03/. Antes de filtrar, comprueba que sabe reproducir los totales originales de relevos-informe.json; si no coinciden, se detiene.
// Uso: node filtrar-corte-tramo6.cjs   → escribe tramo6-v03/*.json filtrados + tramo6-v03/CORTE-FOTO.json (qué se quitó de cada fichero)
const fs = require('fs'); const path = require('path');
const ORI = path.join(__dirname, 'tramo6-v02'), DES = path.join(__dirname, 'tramo6-v03'); const F = Date.UTC(2026, 9, 30, 22, 40, 0);
const j = f => JSON.parse(fs.readFileSync(path.join(ORI, f), 'utf8')); const w = (f, o) => fs.writeFileSync(path.join(DES, f), JSON.stringify(o));
const informe = {}; const cuenta = (f, antes, despues, nota) => { informe[f] = { antes, despues, quitados: antes - despues, nota: nota || null }; };

// 1) Symbiosis: todo va por el hash del envío en TRON (metarouter-resumen.filas[].tx, con su hora en `at`)
const R = j('metarouter-resumen.json'); const filasOk = R.filas.filter(f => f.at <= F); const txOk = new Set(filasOk.map(f => f.tx));
const SL = j('symbiosis-llegadas.json'); const SLo = Object.fromEntries(Object.entries(SL).filter(([k, v]) => txOk.has(k)));
// comprobación: el corte por la hora de entrada de la API coincide con el corte por la hora del envío
const SLpor = Object.entries(SL).filter(([k, v]) => Date.parse(v.entrada.hora) <= F).map(([k]) => k).sort().join(); if (SLpor !== Object.keys(SLo).sort().join()) throw new Error('Symbiosis: el corte por hora de entrada no coincide con el corte por hora de envío');
w('symbiosis-llegadas.json', SLo); cuenta('symbiosis-llegadas.json', Object.keys(SL).length, Object.keys(SLo).length);
const porCadena = {}; for (const f of filasOk) { const k = f.cadena; const x = porCadena[k] || (porCadena[k] = { n: 0, enviadoUsd: 0, importe: 0, _r: new Set() }); x.n++; x.enviadoUsd += f.v; x.importe += f.importe; x._r.add(f.receptor); }
for (const x of Object.values(porCadena)) { x.receptores = x._r.size; delete x._r; }
w('metarouter-resumen.json', { ...R, envios: filasOk.length, conPeticion: filasOk.filter(f => SLo[f.tx]).length, sinPeticion: filasOk.filter(f => !SLo[f.tx]).length, porCadena, filas: filasOk }); cuenta('metarouter-resumen.json', R.filas.length, filasOk.length);
for (const f of ['metarouter-destino.json', 'metarouter-decodificado.json']) { const o = j(f); const n = Object.fromEntries(Object.entries(o).filter(([k]) => txOk.has(k))); w(f, n); cuenta(f, Object.keys(o).length, Object.keys(n).length); }

// 2) Chainflip: llegadas por hora del depósito en TRON; destinos por hora del pedido del cambio
const CL = j('chainflip-llegadas.json'); const CLo = Object.fromEntries(Object.entries(CL).filter(([k, v]) => v.deposito && v.deposito.hora <= F)); w('chainflip-llegadas.json', CLo); cuenta('chainflip-llegadas.json', Object.keys(CL).length, Object.keys(CLo).length);
const CD = j('chainflip-destinos.json'); let cA = 0, cD = 0; const CDo = {}; for (const [k, v] of Object.entries(CD)) { CDo[k] = { ...v, canales: (v.canales || []).map(c => ({ ...c, cambios: c.cambios.filter(s => { cA++; const ok = Date.parse(s.pedido) <= F; if (ok) cD++; return ok; }) })) }; } w('chainflip-destinos.json', CDo); cuenta('chainflip-destinos.json', cA, cD, 'cuenta cambios, no canales');

// 3) Across por hora del envío
const AL = j('across-llegadas.json'); const ALo = Object.fromEntries(Object.entries(AL).filter(([k, v]) => v.error || v.at <= F)); w('across-llegadas.json', ALo); cuenta('across-llegadas.json', Object.keys(AL).length, Object.keys(ALo).length);

// 4) Relevos de Chainflip: se comprueba primero que las fórmulas reproducen el original completo
const RV = j('relevos-informe.json'); const suma = (l, k) => l.reduce((t, x) => t + x[k], 0); const calc = (P, S) => ({ parejas: P.length, sinPareja: S.length, depositosSinCambio: P.length + S.length, total: suma(P, 'pagado') + suma(P, 'comision'), brutoDepositos: suma(P, 'importe') + suma(S, 'importe') });
const c0 = calc(RV.parejasLista, RV.sinParejaLista); const ok0 = c0.parejas === RV.parejas && c0.sinPareja === RV.sinPareja && c0.depositosSinCambio === RV.depositosSinCambio && Math.abs(c0.total - RV.total) < 1 && Math.abs(c0.brutoDepositos - RV.brutoDepositos) < 1;
if (!ok0) throw new Error('relevos-informe: las fórmulas no reproducen el original ' + JSON.stringify({ calculado: c0, original: { parejas: RV.parejas, sinPareja: RV.sinPareja, depositosSinCambio: RV.depositosSinCambio, total: RV.total, bruto: RV.brutoDepositos } }));
const P = RV.parejasLista.filter(x => x.hora <= F), S = RV.sinParejaLista.filter(x => x.hora <= F); const c1 = calc(P, S);
// Reembolsos enteros: el original tiene 1 (84.596,78 USDT) = el cambio 1990221, cuyo depósito es del 31-oct 02:26 UTC, POSTERIOR a la foto (y el tramo 5 ya lo cuenta). Se comprueba y se pone a 0; antes se dejaba el valor del original por un campo que no existe (revisión del 3-nov: sumaba el reembolso dos veces).
const c1990221 = CL['1990221']; if (!(RV.reembolsosEnteros === 1 && Math.abs(RV.reembolsosEnterosUsdt - 84596.78317) < 0.01 && c1990221 && c1990221.deposito && c1990221.deposito.hora > F)) throw new Error('reembolsos: el original ya no es el caso conocido (1 reembolso, el cambio 1990221 posterior a la foto); revisar a mano');
w('relevos-informe.json', { ...RV, ...c1, reembolsosEnteros: 0, reembolsosEnterosUsdt: 0, parejasLista: P, sinParejaLista: S, estadisticas: undefined });
cuenta('relevos-informe.json', RV.parejasLista.length + RV.sinParejaLista.length, P.length + S.length, 'parejas ' + RV.parejas + '→' + c1.parejas + ', sin pareja ' + RV.sinPareja + '→' + c1.sinPareja);

// 5) Verificación de llegadas: se conservan solo las claves que corresponden a llegadas de los cruces conservados
const llegadaTx = new Set(); for (const v of Object.values(SLo)) if (v.llegada && v.llegada.tx) llegadaTx.add(String(v.llegada.tx).toLowerCase());
for (const v of Object.values(CLo)) if (v.salida && v.salida.tx) llegadaTx.add(String(v.salida.tx).toLowerCase()); for (const v of Object.values(ALo)) if (v.llegadaTx) llegadaTx.add(String(v.llegadaTx).toLowerCase());
const VF = j('llegadas-verificadas.json'); const claves = Object.keys(VF); const VFo = Object.fromEntries(claves.filter(k => llegadaTx.has(k.toLowerCase())).map(k => [k, VF[k]]));
const sinClasificar = claves.filter(k => !llegadaTx.has(k.toLowerCase())); w('llegadas-verificadas.json', VFo); cuenta('llegadas-verificadas.json', claves.length, Object.keys(VFo).length, 'quitadas las que no son llegada de ningún cruce conservado');

// 6) Ficheros que se REGENERAN con los scripts (dependen de los anteriores): se retiran de la copia
for (const f of ['llegadas-eth.json', 'eth-adelante-v2.json', 'metarouter-destino-resumen.json', 'symbiosis-llegadas-resumen.json']) { try { fs.unlinkSync(path.join(DES, f)); informe[f] = { retirado: true, nota: 'se regenera con su script a partir de los ficheros ya filtrados' }; } catch { } }
fs.writeFileSync(path.join(DES, 'CORTE-FOTO.json'), JSON.stringify({ corte: new Date(F).toISOString(), generado: new Date().toISOString(), origen: 'tramo6-v02', ficheros: informe }, null, 1));
for (const [f, x] of Object.entries(informe)) console.log(f.padEnd(34), x.retirado ? 'RETIRADO (' + x.nota + ')' : x.antes + ' → ' + x.despues + ' (quitados ' + x.quitados + ')' + (x.nota ? ' · ' + x.nota : ''));

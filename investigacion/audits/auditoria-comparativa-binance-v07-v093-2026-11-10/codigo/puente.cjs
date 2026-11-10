'use strict';
// Puente de cifras v0.7 -> v0.9.3 y matriz de comparacion hoja a hoja. Uso: node puente.cjs v07.json v093.json auditoria-datos.json carpetaSalida
const fs = require('fs'); const j = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const [f7, f9, fa, dst] = process.argv.slice(2); const a = j(f7), b = j(f9), au = j(fa);
const T5 = au.tramos.tramo5, T6 = au.tramos.tramo6;
const r2 = x => Math.round(x * 100) / 100;
const pasos = []; let v = a.conciliacion.diferencia;
const paso = (nombre, delta, origen) => { v += delta; pasos.push({ paso: nombre, efectoEnLaDiferencia: r2(delta), diferenciaTras: r2(v), origen }); };
const jl = T5.justlend.dobleConteoQuitado + T6.justlend.dobleConteoQuitado, cf = T5.chainflip.quitado_v093 + T6.chainflip.quitado_v093, sy = T5.symbiosis.revertidosConDevolucion + T6.symbiosis.revertidosConDevolucion;
const deriva = b.conciliacion.partidas.find(p => /Deriva de precio del TRX/.test(p.nombre)).importe;
paso('La deriva de precio del TRX pasa a ser una partida propia (antes estaba dentro de la diferencia)', -deriva, 'informe v0.9.3, partida 7; aritmetica comprobada: 226.348.470,87 - 218.439.029,87');
paso('JustLend: se quita lo que de verdad se contaba dos veces (deposito + justificantes seguidos hasta su redencion)', jl, 'recalculo propio: tramo 5 ' + r2(T5.justlend.dobleConteoQuitado) + ' + tramo 6 ' + r2(T6.justlend.dobleConteoQuitado));
paso('Chainflip: se quita la parte del deposito que la salida de la misma transaccion ya sigue', cf, 'recalculo propio: tramo 5 ' + r2(T5.chainflip.quitado_v093) + ' + tramo 6 ' + r2(T6.chainflip.quitado_v093) + ' (33 transacciones)');
paso('Symbiosis: 27 cruces revertidos cuyo dinero volvio a la misma billetera dejan de contar como puente', sy, 'recalculo propio: tramo 5 ' + r2(T5.symbiosis.revertidosConDevolucion) + ' + tramo 6 ' + r2(T6.symbiosis.revertidosConDevolucion));
const residuoTron = b.conciliacion.diferencia - v;
// partidas
const partidas = []; const n9 = new Map(b.conciliacion.partidas.map(p => [p.nombre, p]));
for (const p of a.conciliacion.partidas) { const q = n9.get(p.nombre); partidas.push({ partida: p.nombre, v07: r2(p.importe), v093: q ? r2(q.importe) : null, cambio: q ? r2(q.importe - p.importe) : null }); n9.delete(p.nombre); }
for (const q of n9.values()) partidas.push({ partida: q.nombre, v07: null, v093: r2(q.importe), cambio: r2(q.importe), nueva: true });
const sumaCambios = partidas.reduce((s, x) => s + (x.cambio || 0), 0);
// recalculo propio de las partidas que cambian
const comprob = [
  ['Prestamo tramo 5 (v0.7)', a.faseB.terminales.prestamo.importe, T5.justlend.prestamo_v07], ['Prestamo tramo 5 (v0.9.3)', b.faseB.terminales.prestamo.importe, T5.justlend.prestamo_v093],
  ['Prestamo tramo 6 (v0.7)', a.faseA.terminales.prestamo.importe, T6.justlend.prestamo_v07], ['Prestamo tramo 6 (v0.9.3)', b.faseA.terminales.prestamo.importe, T6.justlend.prestamo_v093],
  ['Sin localizar tramo 5: aumento', b.faseB.sinResolver - a.faseB.sinResolver, T5.justlend.pasaASinLocalizar],
  ['Puentes tramo 5 (v0.7)', a.faseB.terminales.puente.importe, T5.puenteAristasSinAjuste + T5.symbiosis.todos], ['Puentes tramo 5 (v0.9.3)', b.faseB.terminales.puente.importe, T5.puenteAristasSinAjuste + T5.symbiosis.todos - T5.chainflip.quitado_v093 - T5.symbiosis.revertidosConDevolucion],
  ['Puentes tramo 6 (v0.7)', a.faseA.terminales.puente.importe, T6.puenteAristasSinAjuste + T6.symbiosis.todos], ['Puentes tramo 6 (v0.9.3)', b.faseA.terminales.puente.importe, T6.puenteAristasSinAjuste + T6.symbiosis.todos - T6.chainflip.quitado_v093 - T6.symbiosis.revertidosConDevolucion],
].map(([que, informe, propio]) => ({ que, segunElInforme: r2(informe), recalculoPropio: r2(propio), diferencia: r2(informe - propio) }));
// Ethereum y global
const eArb = b.conciliacionEth.partidas.find(p => /^ARB/.test(p.nombre)).importe, eOro = b.conciliacionEth.partidas.find(p => /oro \(valor/.test(p.nombre)).importe;
const eth = { v07: r2(a.conciliacionEth.diferencia), ARB_declarado: r2(-eArb), efectoPrecioOro: r2(-eOro), esperado: r2(a.conciliacionEth.diferencia - eArb - eOro), v093: r2(b.conciliacionEth.diferencia), residuo: r2(b.conciliacionEth.diferencia - (a.conciliacionEth.diferencia - eArb - eOro)) };
const glob = { v07: r2(a.global.diferencia), cambioTron: r2(b.conciliacion.diferencia - a.conciliacion.diferencia), cambioEthereum: r2(b.conciliacionEth.diferencia - a.conciliacionEth.diferencia), esperado: r2(a.global.diferencia + (b.conciliacion.diferencia - a.conciliacion.diferencia) + (b.conciliacionEth.diferencia - a.conciliacionEth.diferencia)), v093: r2(b.global.diferencia) }; glob.residuo = r2(glob.v093 - glob.esperado);
// rango por via (v0.9.3)
const vias = {}; for (const t of b.pureza2.tramos) for (const [k, x] of Object.entries(t.vias)) vias[k] = (vias[k] || 0) + (t.entrada - x.suma);
const capital = { capitalTron: r2(b.conciliacion.capital), igualEnLasDos: a.conciliacion.capital === b.conciliacion.capital, congelado: b.conciliacion.partidas[0].importe, igualCongelado: a.conciliacion.partidas[0].importe === b.conciliacion.partidas[0].importe, capitalEth: r2(b.conciliacionEth.capital), igualEth: a.conciliacionEth.capital === b.conciliacionEth.capital };
const out = { tron: { diferencia_v07: r2(a.conciliacion.diferencia), pasos, diferencia_v093: r2(b.conciliacion.diferencia), residuo: r2(residuoTron), suma_v07: r2(a.conciliacion.suma), suma_v093: r2(b.conciliacion.suma), cambioDeLaSuma: r2(b.conciliacion.suma - a.conciliacion.suma), sumaDeLosCambiosDePartida: r2(sumaCambios), partidas }, justlend: { quitadoEnLaV09: r2(T5.justlend.reduccionDelAnalisis_v09 + T6.justlend.reduccionDelAnalisis_v09), dobleConteoReal: r2(jl), restituidoTrasLaPrimeraRevision: r2(T5.justlend.reduccionDelAnalisis_v09 + T6.justlend.reduccionDelAnalisis_v09 - jl), delRestituido_aSinLocalizar: r2(T5.justlend.pasaASinLocalizar + T6.justlend.pasaASinLocalizar) }, recalculoPropio: comprob, ethereum: eth, global: glob, rangoPorVia_v093: Object.fromEntries(Object.entries(vias).map(([k, x]) => [k, r2(x)])), sinCambios: capital };
fs.writeFileSync(dst + '/02-puente-de-cifras.json', JSON.stringify(out, null, 1));
// matriz hoja a hoja
const flat = (o, p = '', acc = {}) => { if (Array.isArray(o)) o.forEach((x, i) => flat(x, p + '[' + i + ']', acc)); else if (o && typeof o === 'object') for (const k in o) flat(o[k], p ? p + '.' + k : k, acc); else acc[p] = o; return acc; };
const A7 = flat(a), B9 = flat(b); const esc = s => '"' + String(s ?? '').replace(/"/g, '""').replace(/\s+/g, ' ').slice(0, 300) + '"'; const filas = [['hoja', 'v0.7', 'v0.9.3', 'estado', 'cambio'].join(',')]; const cuenta = { igual: 0, distinto: 0, soloV07: 0, soloV093: 0 };
for (const k of new Set([...Object.keys(A7), ...Object.keys(B9)])) { const x = A7[k], y = B9[k]; let est; if (!(k in B9)) est = 'soloV07'; else if (!(k in A7)) est = 'soloV093'; else if (x === y || (typeof x === 'number' && typeof y === 'number' && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x)))) est = 'igual'; else est = 'distinto'; cuenta[est]++; filas.push([esc(k), esc(x), esc(y), est, typeof x === 'number' && typeof y === 'number' ? r2(y - x) : ''].join(',')); }
fs.writeFileSync(dst + '/03-matriz-hoja-a-hoja.csv', '﻿' + filas.join('\n') + '\n');
console.log(JSON.stringify({ pasos, residuoTron: r2(residuoTron), cambioSuma: out.tron.cambioDeLaSuma, sumaCambiosPartida: out.tron.sumaDeLosCambiosDePartida, justlend: out.justlend, recalculoPropio: comprob, eth, glob, vias: out.rangoPorVia_v093, capital, matriz: cuenta }, null, 1));

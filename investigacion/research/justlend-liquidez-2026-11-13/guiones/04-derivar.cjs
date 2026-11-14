'use strict';
// FASE 3 · Cálculo de la liquidez por mercado a partir de la foto de la cadena (sin red: lee resultados/01 y 03).
// Definiciones (todas comprobables con los datos en bruto):
//   reclamo de los depositantes = jTokens emitidos × tipo de cambio  (lo que el mercado debe a quienes depositaron)
//   caja            = lo que el contrato tiene ahora mismo en su poder (getCash)  → es TODO lo que se puede retirar de golpe
//   cuadre          = caja + prestado − reservas debe dar el reclamo (diferencia = intereses aún sin anotar)
//   cobertura       = caja / reclamo  → qué parte del dinero de los depositantes podría salir si todos fueran a la vez
//   precio USD      = precio del oráculo de JustLend (en TRX, escala 10^(33−decimales)) × TRX/USD de Binance
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs');
const m = require('./resultados/01-mercados.json'), ext = require('./resultados/03-timelock-y-precios.json');
const TRXUSD = ext.binance.TRXUSDT; const B = x => BigInt(x);
const dir = require('./resultados/02-gobierno.json');
const filas = m.mercados.map((x, i) => {
  const trx = x.simbolo === 'jTRX'; const dec = trx ? 6 : x.decimalesSubyacente; const dv = 10 ** dec;
  const reclamoRaw = B(x.totalSupplyJToken) * B(x.tipoCambioRaw) / (10n ** 18n);
  const cajaRaw = B(x.cajaRaw), prestRaw = B(x.prestadoRaw), resRaw = B(x.reservasRaw);
  const cuadreRaw = cajaRaw + prestRaw - resRaw; const difCuadre = Number(cuadreRaw - reclamoRaw) / Number(reclamoRaw || 1n);
  const num = r => Number(r) / dv; const reclamo = num(reclamoRaw), caja = num(cajaRaw), prest = num(prestRaw), res = num(resRaw);
  const precioTRX = Number(x.precioOraculoRaw) / 10 ** (33 - dec); const precioUSD = precioTRX * TRXUSD;
  const nombre = dir.mercados[i];
  const bloqueado = x.pausas.mint && x.pausas.borrow && B(x.factorGarantiaRaw) === 0n;
  return {
    jToken: x.jToken, simbolo: x.simbolo, subyacente: trx ? 'TRX' : x.subyacente, simboloSubyacente: trx ? 'TRX' : x.simboloSubyacente, decimales: dec,
    estado: x.pausas.mint && x.pausas.borrow ? 'cerrado a nuevos depósitos y préstamos (solo salida)' : 'abierto',
    reclamoDepositantes: reclamo, caja, prestado: prest, reservas: res,
    utilizacion: reclamo > 0 ? prest / reclamo : null, coberturaCaja: reclamo > 0 ? Math.min(1, caja / reclamo) : null,
    cuadreRelativo: difCuadre, precioTRX, precioUSD,
    reclamoUSD: reclamo * precioUSD, cajaUSD: caja * precioUSD, prestadoUSD: prest * precioUSD,
    factorGarantia: Number(x.factorGarantiaRaw) / 1e18, topePrestamo: x.topePrestamoRaw && x.topePrestamoRaw !== '0' ? Number(x.topePrestamoRaw) / dv : null,
    tasaDepositoAnual: Number(x.tasaDepositoPorBloque) * 10512000 / 1e18, tasaPrestamoAnual: Number(x.tasaPrestamoPorBloque) * 10512000 / 1e18,
    implementacion: dir.mercados[i].implementacion,
  };
});
filas.sort((a, b) => b.reclamoUSD - a.reclamoUSD);
const tot = { reclamoUSD: 0, cajaUSD: 0, prestadoUSD: 0 }; for (const f of filas) { tot.reclamoUSD += f.reclamoUSD; tot.cajaUSD += f.cajaUSD; tot.prestadoUSD += f.prestadoUSD; }
const out = { leido: m.leido, bloque: m.bloque, trxUsd: TRXUSD, fuentePrecioTRX: 'Binance spot TRXUSDT (resultados/03)', totales: tot, mercados: filas };
console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '04-liquidez-por-mercado.json'), out));
const f$ = n => n >= 1e6 ? (n / 1e6).toFixed(2) + ' M$' : n >= 1e3 ? (n / 1e3).toFixed(1) + ' k$' : n.toFixed(0) + ' $';
console.log('TOTAL reclamos', f$(tot.reclamoUSD), '| caja', f$(tot.cajaUSD), '| prestado', f$(tot.prestadoUSD), '| TRX/USD', TRXUSD);
for (const f of filas) console.log(f.simbolo.padEnd(9), f.jToken.slice(0, 6), 'reclamo', f$(f.reclamoUSD).padStart(10), '| caja', f$(f.cajaUSD).padStart(10), '| cobertura', (f.coberturaCaja * 100).toFixed(1).padStart(5) + '%', '| uso', (f.utilizacion * 100).toFixed(1).padStart(6) + '%', '| cuadre', (f.cuadreRelativo * 100).toExponential(1) + '%', '|', f.estado === 'abierto' ? 'abierto' : 'CERRADO', '| precio $', f.precioUSD.toPrecision(5));

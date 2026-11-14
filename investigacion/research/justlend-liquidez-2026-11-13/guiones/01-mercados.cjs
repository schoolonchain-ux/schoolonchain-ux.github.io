'use strict';
// FASE 1 · Foto de TODOS los mercados de JustLend leída de la cadena (solo lectura).
// Qué hace: pregunta al Comptroller por la lista de mercados (getAllMarkets) y, por cada jToken, lee depósitos, préstamos, caja real (getCash),
// reservas, tipo de cambio, tasas, parones (pausas), topes de préstamo, factor de garantía y precio del oráculo.
const L = require('./lib.cjs'); L.usar('01-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const COMPTROLLER = 'TGjYzgCyPobsNS9n6WcbdLVR9dH7mWqFx7';
const rd = async (c, f, args) => { const r = await A.llamar(c, f, args); return r; };
(async () => {
  const t0 = new Date().toISOString();
  const nb = await L.post('https://api.trongrid.io/wallet/getnowblock', {});
  const bloque = { numero: nb.block_header.raw_data.number, tiempo: new Date(nb.block_header.raw_data.timestamp).toISOString() };
  const lista = await rd(COMPTROLLER, 'getAllMarkets()');
  if (!lista.ok) throw new Error('getAllMarkets falló: ' + JSON.stringify(lista));
  const n = Number(A.u(lista.hex, 1)); const mercados = []; for (let i = 0; i < n; i++) mercados.push(A.dirDe(lista.hex, 2 + i));
  const oraculo = A.dirDe((await rd(COMPTROLLER, 'oracle()')).hex);
  console.log('bloque', bloque.numero, bloque.tiempo, '| mercados:', n, '| oráculo:', oraculo);
  const filas = [];
  for (const j of mercados) {
    const g = async (f, args) => { const r = await rd(j, f, args); return r.ok ? r.hex : null; };
    const simbolo = A.texto(await g('symbol()')); const dec = Number(A.u(await g('decimals()')));
    const und = await rd(j, 'underlying()'); const undDir = und.ok ? A.dirDe(und.hex) : null;   // jTRX no tiene «underlying»: es TRX nativo
    let undSim = 'TRX', undDec = 6;
    if (undDir) { undSim = A.texto((await rd(undDir, 'symbol()')).hex || ''); const d = await rd(undDir, 'decimals()'); undDec = d.ok ? Number(A.u(d.hex)) : null; }
    const hex = {}; for (const f of ['totalSupply()', 'getCash()', 'totalBorrows()', 'totalReserves()', 'exchangeRateStored()', 'supplyRatePerBlock()', 'borrowRatePerBlock()', 'reserveFactorMantissa()']) hex[f] = await g(f);
    const m = await rd(COMPTROLLER, 'markets(address)', [A.argAddr(j)]);
    const flag = async f => { const r = await rd(COMPTROLLER, f, [A.argAddr(j)]); return r.ok ? A.u(r.hex) !== 0n : null; };
    const cap = await rd(COMPTROLLER, 'borrowCaps(address)', [A.argAddr(j)]); const scap = await rd(COMPTROLLER, 'supplyCaps(address)', [A.argAddr(j)]);
    const pr = await rd(oraculo, 'getUnderlyingPrice(address)', [A.argAddr(j)]);
    const p = k => hex[k] ? A.u(hex[k]) : null;
    filas.push({
      jToken: j, simbolo, decimalesJToken: dec, subyacente: undDir || 'TRX (nativo)', simboloSubyacente: undSim, decimalesSubyacente: undDec,
      totalSupplyJToken: String(p('totalSupply()')), cajaRaw: String(p('getCash()')), prestadoRaw: String(p('totalBorrows()')), reservasRaw: String(p('totalReserves()')),
      tipoCambioRaw: String(p('exchangeRateStored()')), tasaDepositoPorBloque: String(p('supplyRatePerBlock()')), tasaPrestamoPorBloque: String(p('borrowRatePerBlock()')), factorReservasRaw: String(p('reserveFactorMantissa()')),
      listado: m.ok ? A.u(m.hex, 0) !== 0n : null, factorGarantiaRaw: m.ok ? String(A.u(m.hex, 1)) : null,
      pausas: { mint: await flag('mintGuardianPaused(address)'), borrow: await flag('borrowGuardianPaused(address)'), transfer: null, seize: null },
      topePrestamoRaw: cap.ok ? String(A.u(cap.hex)) : null, topeDepositoRaw: scap.ok ? String(A.u(scap.hex)) : null, precioOraculoRaw: pr.ok ? String(A.u(pr.hex)) : null,
    });
    process.stdout.write('.');
  }
  console.log();
  const salida = { fuente: 'TronGrid triggerconstantcontract (solo lectura)', leido: t0, bloque, comptroller: COMPTROLLER, oraculo, mercados: filas };
  const huella = L.guardar(path.join(__dirname, 'resultados', '01-mercados.json'), salida);
  console.log('guardado resultados/01-mercados.json  sha256', huella, '| métricas', JSON.stringify(L.metricas));
  // vista rápida
  for (const f of filas) {
    const dv = 10 ** (f.decimalesSubyacente ?? 0); const caja = Number(f.cajaRaw) / dv, prest = Number(f.prestadoRaw) / dv, res = Number(f.reservasRaw) / dv;
    // (el precio en dólares NO se calcula aquí: el oráculo de JustLend da precios en TRX con escala 10^(33-decimales); se convierte en 04-derivar.cjs)
    const dep = caja + prest - res; const uso = dep > 0 ? prest / (caja + prest - res) : 0;
    console.log(f.simbolo.padEnd(9), f.simboloSubyacente.padEnd(8), 'caja', caja.toLocaleString('en', { maximumFractionDigits: 0 }).padStart(16), '| prestado', prest.toLocaleString('en', { maximumFractionDigits: 0 }).padStart(16), '| uso', (uso * 100).toFixed(1).padStart(6) + '%', '| mint', f.pausas.mint, 'borrow', f.pausas.borrow, 'listado', f.listado);
  }
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });

'use strict';
// FASE 5b · Quién debe dinero a JustLend y con qué garantía (sobre las 807 cuentas de resultados/09).
// 1) cobertura: qué parte de lo prestado en cada mercado explican estas cuentas (si es baja, la foto de deudas está incompleta y se dice);
// 2) mayores deudores y de qué está hecha su garantía; 3) cuánto de la garantía es de tokens que casi no se pueden vender (según resultados/12).
const path = require('node:path'); const L = require('./lib.cjs');
const c9 = require('./resultados/09-cuentas.json').cuentas, d4 = require('./resultados/04-liquidez-por-mercado.json'), v12 = require('./resultados/12-venta-cota.json').mercados, ext = require('./resultados/03-timelock-y-precios.json');
const TRXUSD = ext.binance.TRXUSDT;
const mk = new Map(d4.mercados.map(m => [m.jToken, m]));
// 1) cobertura de la deuda por mercado
const deudaPorMercado = {}; for (const c of c9) for (const p of c.posiciones) { if (p.deuda > 0) deudaPorMercado[p.jToken] = (deudaPorMercado[p.jToken] || 0) + p.deuda; }
const cob = d4.mercados.map(m => ({ jToken: m.jToken, simbolo: m.simbolo, subyacente: m.simboloSubyacente, prestado: m.prestado, prestadoUSD: m.prestadoUSD, explicadoPorLasCuentas: deudaPorMercado[m.jToken] || 0, parte: m.prestado > 0 ? (deudaPorMercado[m.jToken] || 0) / m.prestado : null })).sort((a, b) => b.prestadoUSD - a.prestadoUSD);
const totPrest = cob.reduce((s, x) => s + x.prestadoUSD, 0), totExp = cob.reduce((s, x) => s + (x.explicadoPorLasCuentas * mk.get(x.jToken).precioUSD), 0);
console.log('LO PRESTADO: total', (totPrest / 1e6).toFixed(2), 'M$ | explicado por las', c9.length, 'cuentas:', (totExp / 1e6).toFixed(2), 'M$ =', (totExp / totPrest * 100).toFixed(1) + '%');
for (const x of cob.filter(x => x.prestadoUSD > 5e4)) console.log(' ', x.simbolo.padEnd(9), 'prestado', (x.prestadoUSD / 1e6).toFixed(2).padStart(8), 'M$ | explicado', x.parte == null ? '-' : (x.parte * 100).toFixed(1) + '%');
// 2) mayores deudores
const deudores = c9.filter(c => c.deudaUSD > 1000).sort((a, b) => b.deudaUSD - a.deudaUSD);
const ver = deudores.slice(0, 15).map(c => ({ cuenta: c.cuenta, deudaUSD: c.deudaUSD, depositosUSD: c.depositosUSD, poderDePrestamoUSD: c.poderDePrestamoUSD, deficitRaw: c.deficitComptrollerRaw, liquidezRaw: c.liquidezComptrollerRaw, debe: c.posiciones.filter(p => p.deuda > 0).map(p => ({ mercado: p.simbolo, sub: p.subyacente, usd: p.deudaUSD })), garantia: c.posiciones.filter(p => p.entradoComoGarantia && p.depositoUSD > 0).map(p => ({ mercado: p.simbolo, sub: p.subyacente, usd: p.depositoUSD, factor: p.factorGarantia })) }));
for (const c of ver) console.log(c.cuenta, 'deuda', (c.deudaUSD / 1e6).toFixed(2), 'M$ | depósitos', (c.depositosUSD / 1e6).toFixed(1), 'M$ | debe', c.debe.map(x => x.mercado + ' ' + (x.usd / 1e6).toFixed(2) + 'M').join(', '), '| garantía', c.garantia.map(x => x.mercado + ' ' + (x.usd / 1e6).toFixed(1) + 'M').join(', '), '| déficit', c.deficitRaw);
// 2b) composición de la garantía de quienes deben y ejercicio de estrés «ETH y BTC del emisor valen 0»
const EMISOR = new Set(['TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV', 'TLeEu311Cbw63BcmMHDgDLu7fnk9fqGcqT']);   // jETH (ETH viejo THb4CqiF…) y jBTC (BTC TN3W4H6r…)
const deud = c9.filter(c => c.deudaUSD > 1000); const comp = {}; let potTot = 0, potEmi = 0, debTot = 0, sinResp = 0, debSinResp = 0, cuentasAfectadas = 0;
const detalle = [];
for (const c of deud) {
  let pot = 0, potSin = 0; for (const p of c.posiciones.filter(p => p.entradoComoGarantia)) { const v = p.depositoUSD * p.factorGarantia; pot += v; if (!EMISOR.has(p.jToken)) potSin += v; comp[p.simbolo + ' ' + p.subyacente] = (comp[p.simbolo + ' ' + p.subyacente] || 0) + v; }
  potTot += pot; potEmi += pot - potSin; debTot += c.deudaUSD; const falta = Math.max(0, c.deudaUSD - potSin); if (falta > 0 && pot - potSin > 0) { sinResp += falta; cuentasAfectadas++; detalle.push({ cuenta: c.cuenta, deudaUSD: c.deudaUSD, poderTotalUSD: pot, poderSinEmisorUSD: potSin, deudaSinRespaldoUSD: falta }); }
}
detalle.sort((a, b) => b.deudaSinRespaldoUSD - a.deudaSinRespaldoUSD);
const compOrd = Object.entries(comp).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ garantia: k, poderUSD: v, parte: potTot ? v / potTot : null }));
console.log('GARANTÍA (poder de préstamo = depósito × factor) de las', deud.length, 'cuentas con deuda >1.000 $: total', (potTot / 1e6).toFixed(1), 'M$ | deuda', (debTot / 1e6).toFixed(1), 'M$ | de la garantía, tokens del emisor (ETH/BTC):', (potEmi / 1e6).toFixed(1), 'M$ =', (potEmi / potTot * 100).toFixed(1) + '%');
for (const x of compOrd.slice(0, 8)) console.log('   ', x.garantia.padEnd(14), (x.poderUSD / 1e6).toFixed(1).padStart(8) + ' M$', (x.parte * 100).toFixed(1) + '%');
console.log('ESTRÉS «ETH y BTC del emisor valen 0»: cuentas con deuda sin respaldo', cuentasAfectadas, '| deuda sin respaldo', (sinResp / 1e6).toFixed(2), 'M$ de', (debTot / 1e6).toFixed(1), 'M$ de deuda (', (sinResp / debTot * 100).toFixed(1) + '%)');
for (const d of detalle.slice(0, 8)) console.log('   ', d.cuenta, 'deuda', (d.deudaUSD / 1e6).toFixed(2), 'M$ | sin ETH/BTC del emisor su garantía es', (d.poderSinEmisorUSD / 1e6).toFixed(2), 'M$ → sin respaldo', (d.deudaSinRespaldoUSD / 1e6).toFixed(2), 'M$');
// 2c) deuda cerca de liquidación (deuda / poder de préstamo) y deuda en USDT respaldada sobre todo por USDD
const cubos = [['en déficit (≥ 100 %)', 1, 9], ['95–100 %', .95, 1], ['90–95 %', .90, .95], ['80–90 %', .80, .90], ['< 80 %', 0, .80]]; const cuboRes = cubos.map(([n, a, b]) => ({ tramo: n, cuentas: 0, deudaUSD: 0 }));
const usdtDeuda = { total: 0, conGarantiaUSDDmas90: 0, cuentas: 0 };
for (const c of deud) {
  const pod = c.posiciones.filter(p => p.entradoComoGarantia).reduce((s, p) => s + p.depositoUSD * p.factorGarantia, 0); const r = pod > 0 ? c.deudaUSD / pod : 9;
  const i = cubos.findIndex(([, a, b]) => r >= a && r < b); const k = cuboRes[i >= 0 ? i : 0]; k.cuentas++; k.deudaUSD += c.deudaUSD;
  const dUSDT = c.posiciones.filter(p => p.simbolo === 'jUSDT').reduce((s, p) => s + p.deudaUSD, 0); usdtDeuda.total += dUSDT;
  const pUSDD = c.posiciones.filter(p => p.entradoComoGarantia && p.subyacente === 'USDD').reduce((s, p) => s + p.depositoUSD * p.factorGarantia, 0); if (dUSDT > 0 && pod > 0 && pUSDD / pod >= 0.9) { usdtDeuda.conGarantiaUSDDmas90 += dUSDT; usdtDeuda.cuentas++; }
}
console.log('CERCA DE LIQUIDACIÓN (deuda / poder de préstamo):'); for (const k of cuboRes) console.log('   ', k.tramo.padEnd(22), String(k.cuentas).padStart(4), 'cuentas', (k.deudaUSD / 1e6).toFixed(2).padStart(8), 'M$', (k.deudaUSD / debTot * 100).toFixed(1) + '%');
console.log('DEUDA EN USDT de las cuentas leídas:', (usdtDeuda.total / 1e6).toFixed(1), 'M$ | de ella, con garantía ≥ 90 % USDD:', (usdtDeuda.conGarantiaUSDDmas90 / 1e6).toFixed(1), 'M$ en', usdtDeuda.cuentas, 'cuentas');
const grandes = ['TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb', 'TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ', 'TRzQrtxrEJbSbQNwAsgAHkBMxTX47yNmjo', 'TMbTTiY5vZ6fXRWRMdHfB3ay1DcpSGQ9cG', 'TCiRCBNFrL6bFKWL94yWQi5hNMGNp1Nu27', 'TYL7z7VSVRShLoJ6YRQMA4t9pSECt9ZLmz', 'TKVnVyJiTzyCDgTkZRYc5LM4q8B7xXEbh5', 'TWPpxPd5PpU5FQk6F6F3HMN5VdufxnVA8K', 'TYRmcmmKvjL1SFQbvPQtJU1YcaXEnH8dvT', 'TDToUxX8sH4z6moQpK3ZLAN24eupu2ivA4'];
const grandesDeuda = grandes.map(a => { const c = c9.find(x => x.cuenta === a); return c ? { cuenta: a, depositosUSD: c.depositosUSD, deudaUSD: c.deudaUSD } : { cuenta: a, depositosUSD: null, deudaUSD: null }; }); for (const g of grandesDeuda) console.log('  ', g.cuenta, 'depósitos', g.depositosUSD && (g.depositosUSD / 1e6).toFixed(1), 'M$ | deuda', g.deudaUSD && (g.deudaUSD / 1e6).toFixed(3), 'M$');
// 3) comprobación de mi valoración contra el propio Comptroller: liquidez (el Comptroller la da en TRX con escala 10^15, comprobado en 26-escala-margen.cjs) × TRX/USD  vs  poder − deuda
const chk = c9.filter(c => c.liquidezComptrollerRaw !== null && (c.deudaUSD > 1e4 || c.poderDePrestamoUSD > 1e6)).slice(0, 400).map(c => { const liq = Number(c.liquidezComptrollerRaw) / 1e15 * TRXUSD; const def = Number(c.deficitComptrollerRaw) / 1e15 * TRXUSD; const mio = c.poderDePrestamoUSD - c.deudaUSD; return { cuenta: c.cuenta, miMargenUSD: mio, margenComptrollerUSD: liq - def, ratio: (liq - def) / (mio || NaN) }; }).filter(x => isFinite(x.ratio));
const rs = chk.map(x => x.ratio).sort((a, b) => a - b); const med = rs[Math.floor(rs.length / 2)]; console.log('control de valoración: cuentas comparadas', chk.length, '| mediana del cociente (Comptroller / mi cálculo)', med && med.toFixed(4), '| p10', rs[Math.floor(rs.length * .1)] && rs[Math.floor(rs.length * .1)].toFixed(3), 'p90', rs[Math.floor(rs.length * .9)] && rs[Math.floor(rs.length * .9)].toFixed(3));
console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '24-deudas.json'), { generado: new Date().toISOString(), cuentasLeidas: c9.length, deudaTotalUSD: totPrest, deudaExplicadaUSD: totExp, cobertura: cob, mayoresDeudores: ver, garantia: { cuentasConDeuda: deud.length, deudaUSD: debTot, poderUSD: potTot, poderDeTokensDelEmisorUSD: potEmi, composicion: compOrd }, cercaDeLiquidacion: cuboRes, deudaUSDT: usdtDeuda, depositantesMayoresYSuDeuda: grandesDeuda, estres: { supuesto: 'jETH (ETH viejo) y jBTC valen 0 como garantía', cuentasAfectadas, deudaSinRespaldoUSD: sinResp, mayores: detalle.slice(0, 20) }, controlValoracion: { comparadas: chk.length, medianaCociente: med } }));

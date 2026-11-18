'use strict';
// No lee Internet. Junta las lecturas de esta carpeta (j1, j3, j5, j5b, j6) y la del 13-nov en un único fichero que pinta la página del caso
// (reports/caso-vaneck-sun/actualizacion-18-nov.json): así ninguna cifra de la actualización del 18-nov se escribe a mano en la página.
// Uso: node j7-datos-para-la-web.cjs <salida.json>
const fs = require('node:fs'), path = require('node:path');
const lee = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const MOV = lee('movimientos-desde-13-nov.json'), OPS = lee('operaciones-sunio-14-y-17-nov.json'), POS = lee('posiciones-v3-2026-11-18.json'), SIM = lee('simbolos-tokens.json'), EST = lee('estado-cuentas-2026-11-18.json');
const POS13 = lee('../actualizacion-2026-11-13/posiciones-v3-2026-11-13.json');
const T = 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const V3 = 'TLSWrv7eC1AZCXkRjpqMZUmvgd99cj7pPF', V4 = 'TC8xQzPHfn5KceZV6s6GmZkBCFWWUoPXs1', JUSDT = 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd';
const seg = MOV.cuentas.segunda_cuenta, r6 = (x) => Math.round(x * 1e6) / 1e6;
if (MOV.cuentas.vaneck.transacciones.length || MOV.cuentas.vaneck.trc20.length) throw new Error('«Vaneck» tiene movimientos: hay que revisarlos a mano antes de publicar');

// 1 · Lo que sacó y metió en sun.io (comprobado transacción a transacción por j5: TRX que viaja dentro de la llamada + USDT)
const sunio = OPS.operaciones.filter((o) => (o.contrato === V3 || o.contrato === V4) && (o.trxQueEntra >= 1e6 || o.trxQueSale >= 1e6 || o.usdtQueEntra >= 1e6 || o.usdtQueSale >= 1e6)).map((o) => {
  if (o.resultado !== 'SUCCESS') throw new Error('operación no terminada: ' + o.tx);
  const pone = o.trxQueSale + o.usdtQueSale > o.trxQueEntra + o.usdtQueEntra;
  return { hora: o.hora, tx: o.tx, version: o.contrato === V3 ? 'V3' : 'V4', contrato: o.contrato, que: pone ? 'pone' : 'retira', trx: r6(pone ? o.trxQueSale - o.trxQueEntra : o.trxQueEntra - o.trxQueSale), usdt: r6(pone ? o.usdtQueSale - o.usdtQueEntra : o.usdtQueEntra - o.usdtQueSale) };
});
const suma = (que, k) => r6(sunio.filter((o) => o.que === que).reduce((s, o) => s + o[k], 0));
const totales = { retiradoTrx: suma('retira', 'trx'), retiradoUsdt: suma('retira', 'usdt'), puestoTrx: suma('pone', 'trx'), puestoUsdt: suma('pone', 'usdt') };
totales.netoTrx = r6(totales.puestoTrx - totales.retiradoTrx); totales.netoUsdt = r6(totales.puestoUsdt - totales.retiradoUsdt);

// 2 · La retirada de los 519 M TRX descongelados
const ret = OPS.operaciones.find((o) => o.retiradaDescongelado);
const retirada = { hora: ret.hora, tx: ret.tx, trx: ret.retiradaDescongelado, podiaDesde: '2026-11-15T07:37:39.000Z' };

// 3 · USDT que entra o sale por transferencia directa (>= 1 M) fuera de sun.io, y JustLend (jUSDT)
const usdt = seg.trc20.filter((t) => t.token === 'USDT' && Number(t.valor) / 1e6 >= 1e6);
const enSunio = new Set(OPS.operaciones.filter((o) => o.contrato === V3 || o.contrato === V4).map((o) => o.tx));
const justlend = usdt.filter((t) => t.de === JUSDT || t.a === JUSDT).map((t) => ({ hora: t.hora, tx: t.tx, que: t.sale ? 'deposita' : 'retira', usdt: Number(t.valor) / 1e6 }));
const usdtRecibido = usdt.filter((t) => !t.sale && t.de !== JUSDT && !enSunio.has(t.tx)).map((t) => ({ hora: t.hora, tx: t.tx, de: t.de, usdt: Number(t.valor) / 1e6 }));
const usdtEnviadoFuera = usdt.filter((t) => t.sale && t.a !== JUSDT && !enSunio.has(t.tx));
// 4 · Envíos de TRX a otra dirección (TransferContract con la cuenta como origen)
const enviosTrx = seg.transacciones.filter((t) => t.tipo === 'TransferContract' && t.sale);

// 5 · Posiciones de V3: 12-nov frente a 18-nov
const par = (id) => { const p = OPS.posiciones.find((x) => x.id === id); return p ? { token0: p.token0, token1: p.token1, nombre: SIM.tokens[p.token0].simbolo + ' / ' + SIM.tokens[p.token1].simbolo, comisionPct: p.comision / 10000 } : null; };
const antes = POS13.cuentas.segunda_cuenta, ahora = POS.cuentas.segunda_cuenta;
const posicionesV3 = {
  gestor: POS.gestorV3,
  antes: { leidoEn: POS13.leidoEn, conLiquidez: antes.posicionesConLiquidez, nft: antes.nftEnPropiedad, ids: antes.idsConLiquidez },
  despues: { leidoEn: POS.leidoEn, conLiquidez: ahora.posicionesConLiquidez, nft: ahora.nftEnPropiedad, ids: ahora.idsConLiquidez },
  vaciadas: antes.idsConLiquidez.filter((i) => !ahora.idsConLiquidez.includes(i)).map((id) => ({ id, par: par(id) })),
  nuevas: ahora.idsConLiquidez.filter((i) => !antes.idsConLiquidez.includes(i)).map((id) => ({ id, par: par(id) })),
  financiadora: { antes: { conLiquidez: POS13.cuentas.financiadora_de_vaneck.posicionesConLiquidez, ids: POS13.cuentas.financiadora_de_vaneck.idsConLiquidez }, despues: { conLiquidez: POS.cuentas.financiadora_de_vaneck.posicionesConLiquidez, ids: POS.cuentas.financiadora_de_vaneck.idsConLiquidez } },
};

// 6 · Pistas del entorno (k1 y k2): de dónde venía el USDT que TKpiitwG… pasó a la segunda cuenta, la energía a la cuenta etiquetada «Bybit»,
//     la retirada del par stUSDT/USDT del 13-nov y el permiso nuevo de la pareja de la proveedora
const PIS = lee('pistas-2026-11-18.json'), BYB = lee('energia-a-bybit-2026-11-18.json');
const K = PIS.p1.cuenta, HOT12 = 'TJTKCzQpsG19CSMYF9TPtxz6wSHPSyeKfa', u6 = (t) => Number(BigInt(t.valor)) / 1e6;
if (!PIS.p1.completo) throw new Error('la lectura de TKpiitwG no está completa');
const kUsdt = PIS.p1.trc20.filter((t) => t.token === 'USDT'), kEntra = kUsdt.filter((t) => t.a === K && u6(t) >= 1e6), kSale = kUsdt.filter((t) => t.de === K && u6(t) >= 1e6);
const kTrxHot = PIS.p1.transacciones.filter((t) => t.tipo === 'TransferContract' && t.de === HOT12 && t.a === K && t.resultado === 'SUCCESS');
if (kSale.length !== 1 || kSale[0].a !== T) throw new Error('TKpiitwG: se esperaba una única salida de USDT, a la segunda cuenta');
const p4 = PIS.p4, STUSDT = 'TThzxNRLrW2Brp9DcTQU8i4Wd9udCWEdZ3', tr4 = (tok) => p4.traspasos.find((x) => x.token === tok && x.a === T);
if (p4.firmante !== T || p4.resultado !== 'SUCCESS' || !tr4(USDT) || !tr4(STUSDT)) throw new Error('la operación del par stUSDT/USDT no es como se esperaba');
const pv = PIS.p3.find((x) => x.cuenta === 'TSzSgxRisS5VBXXDcAezTDvnPGi9CbsXvJ'), vip = pv.nuevo.activos.find((a) => a.nombre !== 'active');
const entorno = {
  usdtDesdeBinance: { cuenta: K, creada: PIS.p1.creada, hot12: HOT12,
    entradas: kEntra.map((t) => ({ hora: t.hora, tx: t.tx, de: t.de, usdt: u6(t) })), deHot12Usdt: r6(kEntra.filter((t) => t.de === HOT12).reduce((s, t) => s + u6(t), 0)), totalEntradoUsdt: r6(kEntra.reduce((s, t) => s + u6(t), 0)),
    salida: { hora: kSale[0].hora, tx: kSale[0].tx, a: kSale[0].a, usdt: u6(kSale[0]) },
    trxDesdeHot12: { envios: kTrxHot.length, trx: r6(kTrxHot.reduce((s, t) => s + t.trx, 0)), primero: kTrxHot[0].hora, ultimo: kTrxHot[kTrxHot.length - 1].hora, txs: kTrxHot.map((t) => t.tx) }, libreTrx: PIS.p1.libreTrx, leidoEn: PIS.leidoEn },
  energiaBybit: { de: BYB.de, a: BYB.a, antesTrx: BYB.el5Nov.energiaTrx, despuesTrx: BYB.energiaTrx, leidoEn: BYB.leidoEn, delegacion: PIS.p2.delegacion },
  stusdt: { tx: p4.tx, hora: p4.hora, usdt: Number(tr4(USDT).valor) / 1e6, stusdt: Number(BigInt(tr4(STUSDT).valor) / 10n ** 12n) / 1e6 },
  permisoPareja: { cuenta: pv.cuenta, tx: pv.tx, hora: pv.hora, firmas: pv.firmas, propietario: { umbral: pv.nuevo.owner.umbral, claves: pv.nuevo.owner.claves.length }, nuevo: vip ? { nombre: vip.nombre, umbral: vip.umbral, clave: vip.claves[0].direccion, operaciones: vip.operaciones } : null },
};
const e = EST.cuentas;
const out = {
  version: 1, generadoEn: new Date().toISOString(),
  nota: 'Actualización del 18-nov-2026 del caso Vaneck. Generado por j7-datos-para-la-web.cjs a partir de las lecturas de investigacion/research/tron-vaneck-sun/actualizacion-2026-11-18/ (TronGrid, solo lectura).',
  tramo: { desde: MOV.desde, hasta: MOV.leidoEn },
  cuenta: T,
  vaneck: { transacciones: MOV.cuentas.vaneck.transacciones.length, trc20: MOV.cuentas.vaneck.trc20.length, libreTrx: e.vaneck.libreTrx, retirableSinRetirarTrx: e.vaneck.descongelando.reduce((s, d) => s + d.trx, 0) },
  financiadora: { transacciones: MOV.cuentas.financiadora.transacciones.length, trc20: MOV.cuentas.financiadora.trc20.length },
  retirada, sunio: { operaciones: sunio, totales, contratos: { V3, V4 } }, justlend, usdtRecibido,
  enviosTrxAOtraDireccion: enviosTrx.length, usdtEnviadoAOtraDireccion: usdtEnviadoFuera.length,
  posicionesV3, entorno,
  estado: { leidoEn: EST.leidoEn, segundaCuenta: { libreTrx: e.segunda_cuenta.libreTrx, congeladoTrx: r6(e.segunda_cuenta.congeladoEnergia + e.segunda_cuenta.congeladoAncho), delegadoTrx: r6(e.segunda_cuenta.delegadoEnergia + e.segunda_cuenta.delegadoAncho), descongelando: e.segunda_cuenta.descongelando.length } },
  origen: { movimientos: 'movimientos-desde-13-nov.json', operaciones: 'operaciones-sunio-14-y-17-nov.json', posiciones: 'posiciones-v3-2026-11-18.json', posicionesAntes: '../actualizacion-2026-11-13/posiciones-v3-2026-11-13.json', estado: 'estado-cuentas-2026-11-18.json', simbolos: 'simbolos-tokens.json', pistas: 'pistas-2026-11-18.json', energiaBybit: 'energia-a-bybit-2026-11-18.json' },
};
const salida = process.argv[2]; if (!salida) throw new Error('Uso: node j7-datos-para-la-web.cjs <salida.json>');
fs.writeFileSync(salida, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ sunio: sunio.map((o) => [o.hora.slice(5, 16), o.version, o.que, o.trx, o.usdt]), totales, retirada, justlend, usdtRecibido, enviosTrx: enviosTrx.length, usdtFuera: usdtEnviadoFuera.length, v3: [posicionesV3.antes.conLiquidez, posicionesV3.despues.conLiquidez, posicionesV3.vaciadas, posicionesV3.nuevas], estado: out.estado, entorno }, null, 1));

'use strict';
// Capital global del caso en TRON, reconstruido desde los DATOS EXTRAÍDOS (no desde los informes):
//  · robo en Binance Hot 7 (cadena de custodia: 16 transacciones, 15 contrastadas con TronGrid y TronScan; la 16.ª falló solo por la HORA que traía el informe),
//  · congelado por Tether (lectura de saldos del 30-oct 21 h), convertido a TRX y repartido (antes y después de la foto del 30-oct 22:40 UTC).
// Cada partida lleva estado, fuente y las transacciones que la respaldan. El modelo de valoración (TRX a 0,352 $) se declara aparte: la diferencia de precio de conversión NO es una pérdida.
const fs = require('node:fs'); const path = require('node:path');
const { PRECIOS } = require('./modelo.cjs'); const precios = require('./precios.cjs'); const pxT = t => { const p = precios.precio('TRX', t); return p == null ? PRECIOS.TRX.usd : p; };
const j = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const FOTO = Date.UTC(2026, 9, 30, 22, 40, 0);
const B = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const A = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const NOMBRES = { TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf: 'Binance Hot 7', TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi: 'TG5iBMQP… (recibe el robo)', TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4: 'TPBkSjkC… (cambios en SunSwap)', TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62: 'TCzBTkqn… (bloqueada)', TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A: 'TSpe5HC3… (reparte TRX a los depósitos)' };

function cadenaCustodia(custodia) {
  const filas = custodia.map(([tx, de, a, activo, importe, dia, hora]) => ({ tx, de, a, activo, importe, t: Date.parse(dia + 'T' + hora + 'Z'), horaFuente: 'hora UTC del informe (comprobada con TronGrid/TronScan salvo la fila marcada)' }));
  return filas;
}

function construirCapital({ balanceSemilla, repartoPostUsd }) {
  const custodia = cadenaCustodia(j(path.join(__dirname, 'datos', 'custodia-16.json')));
  const fuentes = j(B + 'auditoria-fuentes.json'); const falloHora = (fuentes.A.fallos || []).map(f => f.tx);
  const bloq = j(B + 'tether-bloqueos-en-arbol-21h.json'); const traza = j(B + 'traza-cache.json'); const cierre = j(B + 'traza-cierre.json');
  const s = traza.rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki']; const previos = s.sal.filter(e => e.at <= FOTO); const entradasPrevias = s.ent.filter(e => e.at <= FOTO);
  const suma = (xs, f) => xs.reduce((a, x) => a + f(x), 0);
  const robadoUSDT = custodia.find(x => x.activo === 'USDT' && x.de.startsWith('TDqSquXB')).importe;
  const trxDirecto = suma(custodia.filter(x => x.activo === 'TRX' && x.de.startsWith('TDqSquXB')), x => x.importe);
  const congelado = bloq.enArbol.filter(x => x.usdt > 1);
  const congeladoUSDT = suma(congelado, x => x.usdt);
  const convertidoUSDT = robadoUSDT - congeladoUSDT;
  const trxTrasCambio = suma(custodia.filter(x => x.activo === 'TRX' && /^(TPBkSjkC|TCzBTkqn)/.test(x.de) && x.a.startsWith('TSpe5HC3')), x => x.importe);
  const trxRepartoPrevio = suma(previos, e => e.cant), usdPrevio = suma(previos, e => e.cant * pxT(e.at));
  const trxEntradaPost = balanceSemilla.trx.entra, trxSalidaPost = balanceSemilla.trx.sale;
  const px = PRECIOS.TRX.usd; const trxDirectoUsd = suma(custodia.filter(x => x.activo === 'TRX' && x.de.startsWith('TDqSquXB')), x => x.importe * pxT(x.t)); const trxTrasCambioUsd = suma(custodia.filter(x => x.activo === 'TRX' && /^(TPBkSjkC|TCzBTkqn)/.test(x.de) && x.a.startsWith('TSpe5HC3')), x => x.importe * pxT(x.t)); const entradasPrevUsd = suma(entradasPrevias, e => e.cant * pxT(e.at)); const grandes = balanceSemilla.entradasGrandes; const entraPostUsd = suma(grandes, e => e.trx * pxT(e.at)) + (trxEntradaPost - suma(grandes, e => e.trx)) * pxT(grandes[grandes.length - 1].at);
  const items = [
    { id: 'robo-usdt', nombre: 'USDT sacado de Binance Hot 7 hacia TG5iBMQP…', cantidad: robadoUSDT, unidad: 'USDT', usd: robadoUSDT, estado: 'VERIFICADO', fuente: 'trongrid-trc20-BinanceHot7-29oct.json; auditoria-fuentes.json (A)', tx: ['4203af9ca1833d09c05666eafbd70d703a3811c0bdcf125106685ab75958253e'], nota: 'Valor en dólares nominal (1 USDT = 1 $): ESTIMADO.' },
    { id: 'robo-trx', nombre: 'TRX sacado de Binance Hot 7 hacia TG5iBMQP…', cantidad: trxDirecto, unidad: 'TRX', usd: trxDirectoUsd, estado: 'VERIFICADO', fuente: 'auditoria-fuentes.json (A)', tx: custodia.filter(x => x.activo === 'TRX' && x.de.startsWith('TDqSquXB')).map(x => x.tx), nota: 'Cantidad en TRX verificada; su valor en dólares usa el precio horario de Binance en la hora de cada transferencia (ESTIMADO).' },
    { id: 'congelado-usdt', nombre: 'USDT congelado por Tether (TG5iBMQP… y TCzBTkqn…)', cantidad: congeladoUSDT, unidad: 'USDT', usd: congeladoUSDT, estado: 'VERIFICADO', fuente: 'tether-bloqueos-en-arbol-21h.json (saldo leído el 30-oct hacia las 21 h) + eventos AddedBlackList', tx: congelado.map(x => x.tx), nota: 'Congelación comprobada y saldos leídos ese día. Que SIGA congelado hoy no se ha vuelto a leer: PENDIENTE. Congelados de otros tokens (Circle, XAUt…) y de otras cadenas: ver sección de congelados.', detalle: congelado.map(x => ({ direccion: x.a, usdt: x.usdt, bloqueadaEn: x.at, tx: x.tx })) },
    { id: 'convertido-usdt', nombre: 'USDT no congelado, convertido a TRX en SunSwap', cantidad: convertidoUSDT, unidad: 'USDT', usd: convertidoUSDT, estado: 'ESTIMADO', fuente: 'diferencia robado − congelado (la conversión concreta está en las transacciones de TPBkSjkC…)', tx: custodia.filter(x => (x.de.startsWith('TG5iBMQP') && x.a.startsWith('TPBkSjkC')) || (x.de.startsWith('TPBkSjkC') && x.a.startsWith('TSpe5HC3'))).map(x => x.tx), nota: 'Es una resta: se confirma al contrastar las 16 conversiones de TPBkSjkC… (pendiente de volcar al libro con su precio de ejecución).' },
    { id: 'trx-tras-cambio', nombre: 'TRX que sale del cambio hacia TSpe5HC3… (más 9.987 TRX de TCzBTkqn…)', cantidad: trxTrasCambio, unidad: 'TRX', usd: trxTrasCambioUsd, estado: 'VERIFICADO', fuente: 'auditoria-fuentes.json (A)', tx: custodia.filter(x => x.activo === 'TRX' && /^(TPBkSjkC|TCzBTkqn)/.test(x.de) && x.a.startsWith('TSpe5HC3')).map(x => x.tx) },
    { id: 'entra-grupo-previo', nombre: 'TRX que había entrado en la billetera de reparto hasta la foto', cantidad: suma(entradasPrevias, e => e.cant), unidad: 'TRX', usd: entradasPrevUsd, estado: 'VERIFICADO', fuente: 'traza-cache.json (entradas de TRBdWq… ≤ foto)', tx: entradasPrevias.map(e => e.tx) },
    { id: 'reparto-previo', nombre: 'Repartido por TRBdWq… ANTES de la foto (379 envíos)', cantidad: trxRepartoPrevio, unidad: 'TRX', usd: usdPrevio, estado: 'VERIFICADO', fuente: 'traza-cache.json (salidas de TRBdWq… ≤ foto)', tx: previos.map(e => e.tx), nota: 'Los envíos son verificados; adónde llegó cada parte es ESTIMADO (modelo de atribución, tramo 1).' },
    { id: 'entra-post', nombre: 'TRX que entró en TRBdWq… DESPUÉS de la foto (los 4 depósitos)', cantidad: trxEntradaPost, unidad: 'TRX', usd: entraPostUsd, estado: 'VERIFICADO', fuente: 'balance-semilla.json (TronGrid, todas las transferencias desde la foto)', tx: balanceSemilla.entradasGrandes.map(e => e.tx) },
    { id: 'reparto-post', nombre: 'Repartido por TRBdWq… DESPUÉS de la foto (733 envíos ≥ 3.520 $ + el resto)', cantidad: trxSalidaPost, unidad: 'TRX', usd: repartoPostUsd ?? trxSalidaPost * px, estado: 'VERIFICADO', fuente: 'balance-semilla.json', tx: [], nota: 'Incluye el saldo que tenía en la foto (22,14 M TRX).' },
  ];
  const get = id => items.find(x => x.id === id);
  // Ecuación global (TRON). Capital = USDT robado + TRX robado directamente.
  const capital = get('robo-usdt').usd + get('robo-trx').usd;   // USDT nominal + TRX a precio horario
  const escapadoTRX = trxTrasCambio + trxDirecto - 10000;   // 638.200.929 del cambio + 46.384.098 directos (los 10.000 TRX iniciales de gas son parte de lo directo)
  const trxEnElGrupo = get('entra-grupo-previo').cantidad + trxEntradaPost;
  const valoracion = convertidoUSDT - trxTrasCambioUsd;   // lo que cuesta la conversión respecto al precio de mercado de ese momento (deslizamiento + comisiones del cambio): efecto del precio, no pérdida de fondos
  return { custodia, falloHora, items, resumen: { capital, robadoUSDT, trxDirecto, congeladoUSDT, convertidoUSDT, trxTrasCambio, precioConversion: convertidoUSDT / trxTrasCambio, precioFijo: px, valoracion, trxEnElGrupo, trxRepartoPrevio, trxSalidaPost, usdPrevio, escapadoTRX }, cierreFaseA: cierre };
}
module.exports = { construirCapital, NOMBRES, FOTO };

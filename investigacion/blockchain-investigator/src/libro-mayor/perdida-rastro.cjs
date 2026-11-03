'use strict';
// Listado «dónde perdemos el rastro» y cruce con Polytrop, para el informe de trazabilidad. Todo sale de los datos ya extraídos; nada se escribe a mano salvo las etiquetas de causa.
// Tres grupos: DESCONOCIDO (no hay dato público que lo aclare), PARADA (el rastro termina a propósito en un servicio/contrato reconocido o por un límite declarado) y PENDIENTE (en curso).
const fs = require('node:fs'); const path = require('node:path');
const existe = f => fs.existsSync(f); const j = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const SEG = 3520;

function construirPerdida({ L, particionesPorTramo, partes, cruces, ethRes, pendientes, defiHoy, pxETH, meson }) {
  const filas = []; const fila = o => filas.push(Object.assign({ grupo: '', clase: '', red: 'tron', direccion: '', nombre: '', atribuido: null, bruto: null, envios: null, tramo: '', tx: '', remitente: '', hora: null, estado: '', causa: '', nota: '' }, o));
  const nombreDe = a => { const c = L.cuentas.get('tron:' + a); return (c && c.nombre) || ''; };
  // 1) Contratos y enrutadores cuyo resultado no se decodifica
  for (const [P_, tramo] of particionesPorTramo) { if (!P_) continue;
    for (const c of P_.sinResolver.porContrato) fila({ grupo: 'DESCONOCIDO', clase: 'Contrato o enrutador sin salida decodificada', direccion: c.contrato, nombre: c.nombre || nombreDe(c.contrato) || 'sin nombre', atribuido: c.importe, bruto: c.bruto, envios: c.n, tramo, estado: 'DESCONOCIDO', causa: 'Entra dinero del recorrido y no se pudo leer qué salió de la llamada (enrutador o contrato sin ABI verificado). Lo habitual es que vuelva al remitente en otro token, pero no está demostrado.' });
    // Puentes sin consulta pública (Bridgers) y cualquier otro puente que no sea de los resueltos
    const pu = (P_.terminales.puente && P_.terminales.puente.items) || []; const por = new Map();
    for (const e of pu) { const nom = e.nombre || nombreDe(e.a) || ''; if (/Chainflip|UsdtOFT|Symbiosis|Across|Prefunded|Tron_Executor/i.test(nom)) continue; const x = por.get(e.a) || { a: e.a, nombre: nom || 'puente sin nombre', atr: 0, bruto: 0, n: 0 }; x.atr += e.atribuido; x.bruto += e.bruto; x.n++; por.set(e.a, x); }
    for (const x of por.values()) fila({ grupo: 'DESCONOCIDO', clase: 'Puente sin consulta pública de destino', direccion: x.a, nombre: x.nombre, atribuido: x.atr, bruto: x.bruto, envios: x.n, tramo, estado: 'DESCONOCIDO', causa: 'No hay consulta pública por transacción que diga a dónde fue el dinero.' });
    // Polvo no seguido (límite declarado)
    if (P_.polvo && P_.polvo.importe > 0) fila({ grupo: 'PARADA', clase: 'Transferencias menores de ' + SEG.toLocaleString('es-ES') + ' $ no seguidas', nombre: 'Polvo del recorrido (muchas direcciones)', atribuido: P_.polvo.importe, envios: P_.polvo.items.length, tramo, estado: 'ESTIMADO', causa: 'Límite técnico declarado: el rastreador no sigue envíos individuales por debajo de ' + SEG.toLocaleString('es-ES') + ' $. Se contabilizan en bloque.' });
    // Paradas por diseño: nodos, USDD, préstamos, casas de cambio
    for (const k of ['nodo', 'usdd', 'prestamo', 'casa']) { const t = P_.terminales[k]; if (!t) continue; const por2 = new Map();
      for (const e of t.items) { const x = por2.get(e.a) || { a: e.a, atr: 0, bruto: 0, n: 0, nombre: e.nombre || nombreDe(e.a) || '' }; x.atr += e.atribuido; x.bruto += e.bruto; x.n++; por2.set(e.a, x); }
      const lista = [...por2.values()].sort((a, b) => b.atr - a.atr); const grandes = lista.filter(x => x.atr >= SEG), chicos = lista.filter(x => x.atr < SEG);
      const clases = { nodo: 'Nodo de servicio (más de 5.000 operaciones): el rastro se detiene', usdd: 'Conversión a USDD (GemJoin/PSM): el rastro se detiene', prestamo: 'Préstamo (JustLend): el dinero queda depositado', casa: 'Casa de cambio con nombre: llegada detectada' };
      const causas = { nodo: 'Dirección de uso muy alto (servicio, casa de cambio o bóveda); seguir cada salida mezclaría el dinero con el de otros clientes.', usdd: 'Por diseño el rastreador solo sigue TRX y USDT y declara terminal la conversión a USDD. Polytrop lista direcciones que no están en nuestro grafo y que podrían continuar ese flujo (hipótesis NO demostrada; ver sección 14): es una rama que NO seguimos.', prestamo: 'El dinero queda depositado en el protocolo; lo que se retira vuelve por otras direcciones del libro.', casa: 'Es un depósito detectado, no una prueba de venta (el resto está en la sección de exchanges).' };
      for (const x of grandes) fila({ grupo: 'PARADA', clase: clases[k], direccion: x.a, nombre: x.nombre || 'sin nombre', atribuido: x.atr, bruto: x.bruto, envios: x.n, tramo, estado: k === 'casa' ? 'ESTIMADO' : 'ESTIMADO', causa: causas[k] });
      if (chicos.length) fila({ grupo: 'PARADA', clase: clases[k], nombre: 'Otras ' + chicos.length + ' direcciones (cada una < ' + SEG.toLocaleString('es-ES') + ' $ atribuidos)', atribuido: chicos.reduce((s, x) => s + x.atr, 0), bruto: chicos.reduce((s, x) => s + x.bruto, 0), envios: chicos.reduce((s, x) => s + x.n, 0), tramo, estado: 'ESTIMADO', causa: causas[k] }); }
  }
  // 2) Chainflip: depósitos sin cambio ni pago que cuadre
  let cfLista = false; for (const p of partes) { const l = p.relInf && p.relInf.sinParejaLista; if (!l) continue; cfLista = true; for (const d of l) fila({ grupo: 'DESCONOCIDO', clase: 'Chainflip: depósito sin cambio registrado ni pago que cuadre', direccion: d.canal, nombre: 'Canal de depósito de Chainflip', bruto: d.importe, envios: 1, tramo: p.pref, tx: d.deposito, remitente: d.remitente, hora: d.hora, estado: 'DESCONOCIDO', causa: 'El explorador de Chainflip no registra cambio ni fallo para este depósito y la bóveda no publicó un pago de importe parecido en las horas siguientes.' }); }
  if (!cfLista && cruces.chainflip && cruces.chainflip.relevos) fila({ grupo: 'DESCONOCIDO', clase: 'Chainflip: depósito sin cambio registrado ni pago que cuadre', nombre: 'Varios depósitos (lista no disponible en estos datos)', envios: cruces.chainflip.relevos.sinPareja, tramo: 'varios', estado: 'DESCONOCIDO', causa: 'Ver pendiente P2.' });
  // 3) Across
  if (cruces.across) { for (const r of cruces.across.receptores) fila({ grupo: 'DESCONOCIDO', clase: 'Across: contrato que ejecuta el siguiente paso con instrucciones cifradas', red: String(r.cadena || 'ethereum').toLowerCase() === 'ethereum' ? 'ethereum' : String(r.cadena).toLowerCase(), direccion: r.receptor, nombre: 'Receptor de Across (' + r.cadena + ')' + (cruces.across.receptorInfo && cruces.across.receptorInfo.nombre ? ' · ' + cruces.across.receptorInfo.nombre : ''), atribuido: r.atribuido, bruto: r.usdt, envios: r.n, estado: 'DESCONOCIDO', causa: 'Contrato verificado («Executor») que ejecuta instrucciones cifradas; el mensaje del depósito solo contiene huellas. Sin esas instrucciones no se sabe quién cobra.' });
    if (cruces.prefunded && cruces.prefunded.n) fila({ grupo: 'DESCONOCIDO', clase: 'Across: depósitos prefinanciados', direccion: 'TANdmAmc5jyNEFB1gXbEBfaG7Ftj1XNUG1', nombre: 'Across (Tron_Executor) · prefinanciados', atribuido: cruces.prefunded.atribuido, bruto: cruces.prefunded.bruto, envios: cruces.prefunded.n, estado: 'DESCONOCIDO', causa: 'Se ejecutan en transacciones aparte sin referencia al depósito.' }); }
  // 4) Ethereum
  if (ethRes) { for (const c of ethRes.aContratos) fila({ grupo: 'PARADA', clase: 'Ethereum: contrato o servicio donde termina el rastro', red: 'ethereum', direccion: c.direccion, nombre: c.nombre, atribuido: pxETH ? c.eth * pxETH : null, bruto: null, envios: c.n, estado: 'ESTIMADO', causa: 'Contrato (' + c.tipo + '): lo que entra se mezcla con el de otros usuarios. Cantidad: ' + c.eth.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' ETH atribuidos.' });
    if (ethRes.noLeido > 0.01) fila({ grupo: 'DESCONOCIDO', clase: 'Ethereum: envíos a billeteras no leídas', red: 'ethereum', nombre: 'Billeteras a las que se envió ETH y no se han leído', atribuido: pxETH ? ethRes.noLeido * pxETH : null, estado: 'DESCONOCIDO', causa: 'Billeteras sin lectura de historial (' + ethRes.noLeido.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' ETH).' });
    if (Math.abs(ethRes.diferencia) > 0.01) fila({ grupo: 'DESCONOCIDO', clase: 'Ethereum: diferencia no explicada del seguimiento', red: 'ethereum', nombre: 'Diferencia entre lo llegado y lo localizado', atribuido: pxETH ? ethRes.diferencia * pxETH : null, estado: 'DESCONOCIDO', causa: ethRes.diferencia.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' ETH de ' + ethRes.llegadas.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' ETH llegados; no se fuerza a cero.' }); }
  // 5) DeFi: justificantes jUSDT y liquidez en contratos propios sin verificar
  if (defiHoy && defiHoy.jusdtBilleteras) fila({ grupo: 'DESCONOCIDO', clase: 'DeFi: posición en JustLend (jUSDT)', direccion: 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd', nombre: 'jUSDT en ' + defiHoy.jusdtBilleteras + ' billeteras del recorrido', atribuido: defiHoy.jusdtUsdt, estado: 'ESTIMADO', causa: 'Se ve que conservan justificantes, no cuándo ni quién los retirará; valor con el tipo de cambio de hoy.' });
  for (const pre of ['TXYZCGuw2', 'TTFwhTEP84']) { const a = [...L.cuentas.keys()].map(k => k.replace(/^tron:/, '')).find(x => x.startsWith(pre)); fila({ grupo: 'DESCONOCIDO', clase: 'DeFi: contrato propio sin verificar (liquidez SunSwap)', direccion: a || pre + '…', nombre: 'Ficha de liquidez de contrato propio creado el 31-oct', estado: 'DESCONOCIDO', causa: 'Contrato sin código verificado: no se puede leer qué posición representa.' }); }
  // 6) Meson (etiqueta aportada por Polytrop)
  if (meson) fila({ grupo: 'DESCONOCIDO', clase: 'Contrato sin nombre (Polytrop lo etiqueta como Meson)', direccion: meson.direccion, nombre: 'Posible Meson (cruce de destinos entre cadenas)', bruto: meson.bruto, envios: meson.envios, tramo: 'vigilante', estado: 'HIPOTESIS', causa: 'Nuestro vigilante lo vio recibir ' + meson.envios + ' envíos de 10.000 USDT desde ' + meson.desde + ' y lo anotó como contrato sin nombre; Polytrop lo etiqueta Meson. No hay consulta pública del destino.' });
  // 7) Pendientes en curso
  for (const p of pendientes.filter(x => x.est === 'PENDIENTE')) fila({ grupo: 'PENDIENTE', clase: 'En curso', nombre: p.t, estado: 'PENDIENTE', causa: p.causa });
  return filas;
}

// Cruce con las listas de Polytrop (polytrop.io). Lee los resultados ya calculados en research/polytrop-2026-11-03/datos/.
function construirPolytrop(dirDatos, dirEvm) {
  const f = n => path.join(dirDatos, n); if (!existe(f('polytrop-cruce.json'))) return null;
  const cr = j(f('polytrop-cruce.json')); const filas = cr.filas; const cuenta = { source: { rastreadas: 0, mencionadas: 0, no: 0 }, flagged: { rastreadas: 0, mencionadas: 0, no: 0 } };
  for (const x of filas) { const k = x.rastreada ? 'rastreadas' : x.mencionada ? 'mencionadas' : 'no'; cuenta[x.rol][k]++; }
  const noT = existe(f('polytrop-no-tenemos.json')) ? j(f('polytrop-no-tenemos.json')) : []; const porRed = {}; for (const x of noT) { const k = x.rol + ' · ' + x.red; porRed[k] = (porRed[k] || 0) + 1; }
  // TRON: lectura reproducible v2 (respuestas guardadas tal cual: estado HTTP, cuenta, saldos de tokens y las primeras 30 transferencias/aprobaciones TRC20 de cada dirección)
  let tronInfo = null; const fv2 = f('polytrop-tron-v2.json');
  if (existe(fv2)) { const V = j(fv2); const ent = Object.entries(V); const creadas = {}; let sinRespuesta = 0, sinCuenta = 0, conSaldo = 0, conEventos = 0, conUsdd = 0, usddDesdeTQ27 = 0, usddASymbiosis = 0, conAprobacion = 0, aprueban = 0; const MR = 'TPuaJ6gnYfE9gLUDFrbWbPx3tMnjG8max1', TQ27 = 'TQ27LngyGNB8emD6mt5FqjpCvZxo91EHhn'; let contratoUsdd = null;
    for (const [a, x] of ent) { const c = x.cuenta || {}; if (c.http !== 200) { sinRespuesta++; continue; } if (!c.existe) sinCuenta++;
      const k = !c.create_time ? 'sin fecha' : new Date(c.create_time).toISOString().slice(0, 10) >= '2026-10-30' ? new Date(c.create_time).toISOString().slice(0, 10) : 'antes del robo'; creadas[k] = (creadas[k] || 0) + 1;
      const saldoToken = (c.trc20 || []).some(o => Object.values(o).some(v => Number(v) > 0)); if ((c.balance_trx || 0) > 1 || saldoToken) conSaldo++;
      const ev = (x.eventos && x.eventos.lista) || []; if (ev.length) conEventos++; const usdd = ev.filter(t => t.simbolo === 'USDD' && t.tipo === 'Transfer'); if (usdd.length) { conUsdd++; contratoUsdd = contratoUsdd || usdd[0].token; }
      if (usdd.some(t => t.de === TQ27 && t.a === a)) usddDesdeTQ27++; if (usdd.some(t => t.de === a && t.a === MR)) usddASymbiosis++; if (ev.some(t => t.tipo === 'Approval')) conAprobacion++; if (ev.some(t => t.tipo === 'Approval' && t.simbolo === 'USDD' && t.a === MR)) aprueban++; }
    tronInfo = { total: ent.length, creadas, sinRespuesta, sinCuenta, conSaldo, conEventos, conUsdd, usddDesdeTQ27, usddASymbiosis, conAprobacion, aprueban, contratoUsdd, tope: 30, leidoEn: ent.map(([, x]) => x.leidoEn).filter(Boolean).sort().slice(-1)[0] || null, version: 'v2' }; }
  else { const tron = existe(f('polytrop-tron-tabla.json')) ? j(f('polytrop-tron-tabla.json')) : []; const creadas = {}; for (const x of tron) { const k = !x.creada ? 'sin fecha' : x.creada >= '2026-10-30' ? x.creada : 'antes del robo'; creadas[k] = (creadas[k] || 0) + 1; }
    tronInfo = { total: tron.length, creadas, conSaldo: tron.filter(x => (x.trx || 0) > 1 || x.usdt > 1).length, sinCuenta: tron.filter(x => !x.existe).length, version: 'v1' }; }
  // EVM: lectura parcial o completa de las que no tenemos
  let evm = null; const evmFiles = ['polytrop-evm-completo.json', 'polytrop-evm-completo-b.json'].map(n => path.join(dirEvm || dirDatos, n)).filter(existe);
  if (evmFiles.length) { const S = {}; for (const ff of evmFiles) { try { Object.assign(S, j(ff)); } catch { /* fichero a medio escribir */ } } const v = Object.values(S); const totalEvm = noT.filter(x => x.red === 'evm').length;
    const funders = {}; let redondas = 0, conEntrada = 0, conActividad = 0, conSaldo = 0, eth = 0, usdt = 0, usdc = 0;
    for (const [dir, x] of Object.entries(S)) { eth += x.eth || 0; usdt += x.usdt || 0; usdc += x.usdc || 0; if (x.eth > 0.01) conSaldo++; if (x.nTx > 0) conActividad++;
      const p = x.primeras && x.primeras[0]; if (p && p.a && p.a.toLowerCase() === dir.toLowerCase() && p.eth > 0) { conEntrada++; const k2 = p.de.toLowerCase(); funders[k2] = (funders[k2] || 0) + 1; if (p.eth > 1 && Math.abs(p.eth - Math.round(p.eth)) < 0.001) redondas++; } }
    const top = Object.entries(funders).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([a, n]) => ({ direccion: a, n }));
    const noEvm = new Set(noT.filter(x => x.red === 'evm').map(x => String(x.a).toLowerCase())); const ahoraNuestras = Object.keys(S).filter(a => !noEvm.has(a.toLowerCase())).length;   // leídas que, tras repetir el cruce con los datos finales, ya no cuentan como «no las teníamos»
    evm = { leidas: v.length, total: v.length, ahoraNuestras, conActividad, sinActividad: v.length - conActividad, ethHoy: eth, usdtHoy: usdt, usdcHoy: usdc, conSaldoEth: conSaldo, primerasEntradasConEth: conEntrada, primerasEntradasRedondas: redondas, financiadoras: top, completo: v.length >= totalEvm }; }
  return { fecha: '2026-11-03', csvDirecciones: filas.length, cuenta, noTenemosPorRed: porRed, tron: tronInfo, evm };
}
// Cruce con el CSV de transacciones de Arkham (etiqueta «Binance Hacker»): lee los resultados de research/polytrop-2026-11-03/datos/arkham-*.json
function construirArkham(dirDatos) {
  const f1 = path.join(dirDatos, 'arkham-cruce.json'), f2 = path.join(dirDatos, 'arkham-menciones.json'); if (!existe(f1) || !existe(f2)) return null;
  const A = j(f1), M = j(f2); const men = new Map(M.direcciones.map(d => [d.a.startsWith('0x') ? d.a.toLowerCase() : d.a, d.ficheros.length])); const hs = new Map(M.hashes.map(h => [h.h, h.ficheros.length]));
  const norm = a => a.startsWith('0x') ? a.toLowerCase() : a; const por = {};
  const filas = A.filas.map(x => { const r = { red: x.red, t: x.t, tx: x.tx, de: x.de, deEtiqueta: x.deEtiqueta, a: x.a, aEtiqueta: x.aEtiqueta, token: x.token, usd: x.usd, hashNuestro: hs.get(x.tx) > 0, deNuestra: (men.get(norm(x.de)) || 0) > 0 || !!x.deNuestra, aNuestra: (men.get(norm(x.a)) || 0) > 0 || !!x.aNuestra, dePolytrop: x.dePolytrop, aPolytrop: x.aPolytrop }; const k = por[x.red] || (por[x.red] = { n: 0, usd: 0, hashNuestro: 0 }); k.n++; k.usd += x.usd || 0; if (r.hashNuestro) k.hashNuestro++; return r; });
  const sinNada = filas.filter(r => !r.deNuestra && !r.aNuestra && !r.dePolytrop && !r.aPolytrop).length;
  const desde = filas.map(r => r.t).sort()[0], hasta = filas.map(r => r.t).sort().slice(-1)[0];
  return { total: filas.length, usd: filas.reduce((s, r) => s + (r.usd || 0), 0), porRed: por, hashNuestro: filas.filter(r => r.hashNuestro).length, sinNada, desde, hasta, filas };
}
// Cuenta de gas TBEbSQuJwp… (3-nov): qué hace, a quién envía TRX, de dónde sale su TRX y qué vínculo de pago se ve. Todo sale de ficheros ya guardados en research/polytrop-2026-11-03/datos (lecturas de TronGrid guardadas tal cual).
function construirGas(dirDatos, cachesTramos) {
  const fC = path.join(dirDatos, 'financiadora-gas-completa.json'), fA = path.join(dirDatos, 'financiadora-gas-analisis.json'), fT = path.join(dirDatos, 'cuenta-TAT51WDh.json'), fV = path.join(dirDatos, 'gas-vinculo-pago.json'), fP = path.join(dirDatos, 'pagadores-tat51.json');
  if (![fC, fA, fT, fV, fP].every(existe)) return null; const C = j(fC), A = j(fA), T = j(fT), V = j(fV), P = j(fP);
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
    envios: { n: env.reduce((s, x) => s + x.n, 0), receptoras: env.length, rastreadas: rast.length, rastreadasPolytrop: rast.filter(x => x.polytrop).length, nuestras: env.filter(x => x.nuestra).length, polytrop: env.filter(x => x.polytrop).length, noRastreadas: env.length - rast.length, noRastreadasQuePagaron: P.receptorasQuePagaron.filter(a => !K.has(a)).length, primeroRastreadas: ids[0], ultimoRastreadas: ids[ids.length - 1], importesFrecuentes: Object.entries(imp).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, c]) => ({ trx: +v, receptoras: c })), mensajes: C.filas.filter(f => f.de === C.direccion && f.mensaje).length, lista: filasEnv },
    negocio: { cuenta: T.direccion, creada: T.creada, clientes: payers.size, clientesNuestros: P.clientesMarcados.length, enviadoAGas: aGas ? { trx: aGas.v, n: aGas.n, primero: new Date(aGas.primero).toISOString(), ultimo: new Date(aGas.ultimo).toISOString() } : null, usdtDestino: usdtSale ? { a: usdtSale.a, usdt: usdtSale.v, n: usdtSale.n, primero: new Date(usdtSale.primero).toISOString(), ultimo: new Date(usdtSale.ultimo).toISOString() } : null },
    vinculo: { pagos: V, emparejados: emp.length, trxEmparejados: emp.reduce((s, x) => s + x.pagado, 0), pagosSinEntrada: sinEntrada.length, trxSinEntrada: sinEntrada.reduce((s, x) => s + x.pagado, 0) } };
}
// Dos (tres) vías de pureza en paralelo (3-nov): la actual (publicada), «ciclo» (la entrada de un contrato neutro en exceso de lo que la billetera le mandó, y sin enlace, diluye la pureza) y «diluida» (cota baja: todo lo que entra de contratos sin enlace diluye).
// Lee los resultados de análisis de cada tramo congelado (tramoN-resultado[.ciclo|.diluida].json y la caché para las salidas por billetera).
function construirPureza2(tramos) {
  const out = []; for (const { nombre, dir, pref } of tramos) {
    const f = s => path.join(dir, pref + '-resultado' + s + '.json'); if (!existe(f('')) || !existe(f('.ciclo'))) continue;
    const V = { actual: j(f('')), ciclo: j(f('.ciclo')), diluida: existe(f('.diluida')) ? j(f('.diluida')) : null }; const ent = V.actual.repartoSalida.v;
    const resumen = R => { const t = R.totales || {}; const dest = Object.values(t).reduce((a, b) => a + b, 0); const suma = dest + R.retenidoTainted + R.polvo + R.sinResolver.total; return { nodo: t.nodo || 0, puente: t.puente || 0, usdd: t.usdd || 0, prestamo: t.prestamo || 0, casa: t.casa || 0, destinos: dest, retenido: R.retenidoTainted, polvo: R.polvo, sinResolver: R.sinResolver.total, suma, relacion: suma / ent }; };
    const vias = { actual: resumen(V.actual), ciclo: resumen(V.ciclo), ...(V.diluida ? { diluida: resumen(V.diluida) } : {}) };
    const cache = j(path.join(dir, pref + '-cache.json')).rec; const pa = V.actual.pureza, pc = V.ciclo.pureza, se = V.ciclo.sinEnlace || {};
    const filas = Object.keys(pa).filter(w => cache[w] && cache[w].ok).map(w => { const sal = (cache[w].sal || []).reduce((s, e) => s + e.v, 0); return { a: w, nivel: cache[w].nivel, puraActual: pa[w], puraCiclo: pc[w], salidas: sal, sinEnlace: se[w] || 0, efecto: (pa[w] - pc[w]) * sal }; }).sort((x, y) => y.efecto - x.efecto);
    out.push({ nombre, pref, entrada: ent, vias, billeterasCambian: filas.filter(x => x.puraActual - x.puraCiclo > 0.05).length, billeterasTotal: filas.length, efectoTotal: filas.reduce((s, x) => s + Math.max(0, x.efecto), 0), top: filas.slice(0, 12) });
  } return out.length ? { tramos: out, fecha: '2026-11-03' } : null;
}
module.exports = { construirPerdida, construirPolytrop, construirArkham, construirGas, construirPureza2 };

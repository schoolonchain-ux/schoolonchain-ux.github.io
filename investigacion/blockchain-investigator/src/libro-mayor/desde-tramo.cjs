'use strict';
// Carga un rastreo de la auditoría (carpeta tramoN/) en un LIBRO MAYOR y calcula los tres balances y la conciliación.
// Todo sale de los DATOS EXTRAÍDOS (caché de saltos, clasificación, resultado del análisis); ninguna cifra se copia de un informe.
// Reglas: un salto observado en cadena es VERIFICADO; los saltos «virtuales» que se infieren (recolector) son HIPOTESIS; lo calculado por el modelo de atribución es ESTIMADO.
const fs = require('node:fs'); const path = require('node:path');
const { Libro, conciliar, valorUsd, idDe } = require('./modelo.cjs'); const precios = require('./precios.cjs');
const SEG = 3520, SEMILLA = 'TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki';
const j = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const CLASE = { swap: 'contrato', billetera: 'billetera', nodo: 'nodo', casa: 'casa', prestamo: 'prestamo', puente: 'puente', usdd: 'usdd', no_verificada: 'desconocida' };

function cargarTramo(dir, { balanceSemilla } = {}) {
  const pref = path.basename(dir.replace(/[\\/]+$/, '')).replace(/-v\d+$/, '');   // «tramo5-v01» = copia congelada de tramo5 para una versión del informe
  const { rec, term } = j(path.join(dir, pref + '-cache.json')); const clases = j(path.join(dir, 'traza-clases.json')); const R = j(path.join(dir, pref + '-resultado.json'));
  const corte = j(path.join(dir, 't4.json')).t3; const swaps = fs.existsSync(path.join(dir, pref + '-swaps.json')) ? j(path.join(dir, pref + '-swaps.json')) : {};
  const aristasT = j(path.join(dir, pref + '-aristas-terminales.json'));
  const ret = fs.existsSync(path.join(dir, 'retiradas-informe.json')) ? j(path.join(dir, 'retiradas-informe.json')) : { contratos: [] };
  // contratos clasificados con evidencia (puente / servicio / atrapado): misma lectura que usa el análisis
  const manual = {}; const fMan = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/resultados/contratos-clasificados.json'; if (fs.existsSync(fMan)) for (const [a, c] of Object.entries(j(fMan).contratos)) { if (c.regla === 'puente') manual[a] = { tipo: 'puente', nombre: c.nombre }; else if (c.regla === 'atrapado' || c.regla === 'servicio') manual[a] = { tipo: 'nodo', nombre: c.nombre }; }
  const claseDe = a => manual[a] || (term[a] && term[a].clase) || clases[a] || null;
  return { pref, rec, term, clases, R, corte, swaps, aristasT, ret, claseDe, balanceSemilla };
}

function construir(dir, opciones = {}) {
  const T = cargarTramo(dir, opciones); const { rec, R, corte, swaps, claseDe } = T; const L = opciones.L || new Libro({ nombre: 'Trazabilidad del robo a Binance (TRON y Ethereum)', corte: new Date(corte).toISOString() }); const alta = m => (L.porId.has(idDe(m)) ? null : L.mov(m));   // el mismo movimiento puede estar en varios rastreos: se anota una vez
  const claseCuenta = a => { if (a === SEMILLA) return 'origen'; const c = claseDe(a); return c ? (CLASE[c.tipo] || 'desconocida') : 'desconocida'; };
  const pureza = R.pureza || {};
  // ---- cuentas (billeteras y contratos)
  const cuentaDe = a => { const c = claseDe(a); const k = L.cuenta('tron', a, { clase: claseCuenta(a) }); if (c) { if (c.nombre && c.tipo !== 'billetera') k.nombre = c.nombre; else if (c.nombre) k.etiqueta = c.nombre; if (c.txs) k.operaciones = c.txs; if (c.creada) k.creada = c.creada; k.fuenteClase = 'clasificación del rastreo (TronGrid/TronScan: contrato, operaciones, etiqueta pública)'; } return k; };
  for (const a of Object.keys(rec)) cuentaDe(a); for (const a of Object.keys(T.term)) cuentaDe(a);
  for (const [a, r] of Object.entries(rec)) { const k = cuentaDe(a); k.leida = !!r.ok; k.nivel = r.nivel; if (pureza[a] !== undefined) k.pureza = pureza[a]; if (R.saldo && R.saldo[a]) k.netoFlujos = R.saldo[a].neto; }
  // ---- movimientos
  const contador = new Map(); const nextIdx = (tx, w, tipo) => { const k = tx + '|' + w + '|' + tipo; const n = (contador.get(k) || 0) + 1; contador.set(k, n); return n; };
  const tipoDeposito = a => { const c = claseDe(a); if (!c) return 'transferencia'; if (c.tipo === 'puente') return 'puente_envio'; if (['swap', 'prestamo', 'usdd'].includes(c.tipo)) return 'deposito_contrato'; return 'transferencia'; };
  const idPorTx = new Map(); let omitidos = 0;
  for (const [w, r] of Object.entries(rec)) {
    if (!r.ok) continue;
    for (const e of r.sal || []) {
      if (e.at > corte) { omitidos++; continue; } if (!e.tx || !(e.cant >= 0)) { omitidos++; continue; }
      const tipo = tipoDeposito(e.a); const m = alta({ cadena: 'tron', tx: e.tx, indice: nextIdx(e.tx, w, tipo), activo: e.sim, importe: e.cant, de: w, a: e.a, t: e.at, tipo, estado: 'VERIFICADO', fuente: 'tramo cache sal' });
      if (m && (tipo === 'deposito_contrato' || tipo === 'puente_envio')) { const k = e.tx + '|' + w; (idPorTx.get(k) || idPorTx.set(k, []).get(k)).push(m.id); }
    }
    for (const e of r.via || []) {
      if (e.via === 'relevo') continue;   // el pago real de la bóveda se anota aparte (desde-chainflip.cjs · añadirRelevos)
      if (e.at > corte) { omitidos++; continue; } if (!e.tx || !(e.cant >= 0)) { omitidos++; continue; }
      const tipo = e.via === 'retirada' ? 'retirada_contrato' : e.via === 'recolector' ? 'deposito_contrato' : e.via === 'jtoken' ? 'transferencia_justificante' : 'swap_salida';
      const estado = e.via === 'recolector' ? 'HIPOTESIS' : 'VERIFICADO';
      alta({ cadena: 'tron', tx: e.tx, indice: 'v' + nextIdx(e.tx, w, 'v' + tipo), activo: e.sim, importe: e.cant, ...(e.via === 'jtoken' ? { usd: e.v, usdEstado: 'ESTIMADO' } : {}), de: e.via === 'recolector' ? (e.contrato || w) : w, a: e.a, t: e.at, tipo, estado, via: e.via, fuente: 'tramo cache via', nota: e.via === 'jtoken' ? 'Transferencia de justificantes jUSDT (verificada en cadena); su valor usa el tipo de cambio de JustLend de hoy (ESTIMADO)' : e.via === 'recolector' ? 'Salto INFERIDO: el contrato barre lo depositado a esta dirección (observado en USDT, no demostrado por depósito)' : e.via === 'retirada' ? 'Retirada decodificada de la transacción (el contrato paga al receptor indicado)' : 'Salida decodificada de un cambio' });
    }
  }
  // ---- grupos de cambio: el depósito en el contrato y sus salidas decodificadas son UNA conversión
  for (const m of L.movs) {
    if (m.tipo !== 'swap_salida') continue; const k = m.tx; let g = L.grupos.get('swap:' + k);
    if (!g) { const dep = L.movs.find(x => x.tx === m.tx && (x.tipo === 'deposito_contrato' || x.tipo === 'puente_envio') && x.via === undefined); g = { id: 'swap:' + k, tipo: 'swap', tx: k, entrada: dep ? dep.id : null, salidas: [] }; L.grupos.set(g.id, g); }
    g.salidas.push(m.id);
  }
  return { L, T, omitidos };
}

// Partición del capital repartido por categorías, recomputada desde los saltos (independiente del análisis) y contrastada con él.
// Valoración: cada salto se valora al precio HORARIO de su hora (TRX; USDT nominal). Se guarda también el importe a precio fijo (el del análisis) para poder comprobar que el libro reproduce el análisis.
function particiones(L, T) {
  const { rec, R, corte, swaps, claseDe, aristasT } = T; const p = R.pureza || {}; const leidas = new Set(Object.keys(rec).filter(a => rec[a].ok)); const RET = new Set(T.ret.contratos || []);
  const hay = precios.disponible(); const usdE = (sim, cant, at, vFijo) => { if (sim === 'USDT' || sim === 'USDC') return cant; if (sim === 'TRX' && hay) { const px = precios.precio('TRX', at); if (px != null) return cant * px; } return vFijo; };
  const terminales = {}; const partida = k => terminales[k] || (terminales[k] = { importe: 0, importeFijo: 0, bruto: 0, n: 0, items: [] });
  for (const e of aristasT) { const x = partida(e.tipo); const bruto = usdE(e.sim, e.cant, e.at, e.v); const atr = bruto * e.pureza; x.importe += atr; x.importeFijo += e.tainted; x.bruto += bruto; x.n++; x.items.push({ de: e.de, a: e.a, tx: e.tx, bruto, atribuido: atr, atribuidoFijo: e.tainted, pureza: e.pureza, at: e.at, simbolo: e.sim, cantidad: e.cant, nombre: e.nombre }); }
  let polvoNoSeguido = 0, polvoNoSeguidoFijo = 0, polvoSolapado = 0; const polvoItems = []; const sinRes = {}; let sinResTot = 0, sinResFijo = 0; const sinResItems = [];
  for (const [w, r] of Object.entries(rec)) {
    if (!r.ok) continue; const pw = w === SEMILLA ? 1 : (p[w] || 0); if (!(pw > 0) && w !== SEMILLA) continue; const viaTx = new Set((r.via || []).map(v => v.tx)); const tieneRetirada = (r.via || []).some(v => v.via === 'retirada');
    for (const e of r.sal || []) {
      if (e.at > corte) continue; if (e.a === SEMILLA) continue; const usd = usdE(e.sim, e.cant, e.at, e.v);
      if (e.v < SEG) { if (leidas.has(e.a)) polvoSolapado += e.v * pw; else { polvoNoSeguido += usd * pw; polvoNoSeguidoFijo += e.v * pw; if (polvoItems.length < 5000) polvoItems.push({ de: w, a: e.a, tx: e.tx, bruto: usd, atribuido: usd * pw, at: e.at, simbolo: e.sim }); } continue; }
      const c = claseDe(e.a); if (!c || c.tipo !== 'swap') continue; if (viaTx.has(e.tx)) continue; if (RET.has(e.a) && tieneRetirada) continue; const outs = swaps[e.tx]; if (outs && outs.some(o => o.a === w)) continue;
      const x = sinRes[e.a] || (sinRes[e.a] = { contrato: e.a, nombre: c.nombre, importe: 0, bruto: 0, n: 0 }); x.importe += usd * pw; x.bruto += usd; x.n++; sinResTot += usd * pw; sinResFijo += e.v * pw; sinResItems.push({ de: w, a: e.a, tx: e.tx, bruto: usd, atribuido: usd * pw, at: e.at, simbolo: e.sim, nombre: c.nombre });
    }
  }
  // Retenido: UNIDADES que se quedaron en cada billetera (entró − salió, por activo) × su parte atribuida, valoradas al precio ACTUAL (lo que valen hoy); el valor a precio fijo del análisis se guarda aparte.
  const ahora = precios.ultimo('TRX'); const pActual = ahora ? ahora.p : null; let retenido = 0, retenidoFijo = 0; const retItems = [];
  for (const [w, r] of Object.entries(rec)) {
    if (!r.ok || w === SEMILLA) continue; const pw = p[w] || 0; if (!(pw > 0)) continue; let trx = 0, usdt = 0; const cant = e => (e.cant >= 0 ? e.cant : 0);
    for (const e of r.ent || []) { if (e.virtual || e.at > corte) continue; if (e.sim === 'TRX') trx += cant(e); else if (e.sim === 'USDT') usdt += cant(e); }
    for (const e of r.sal || []) { if (e.at > corte) continue; if (e.sim === 'TRX') trx -= cant(e); else if (e.sim === 'USDT') usdt -= cant(e); }
    const v = Math.max(0, trx) * (pActual ?? 0.352) + Math.max(0, usdt); const fijo = ((R.saldo && R.saldo[w] && R.saldo[w].neto) || 0); if (v > 0) { retenido += v * pw; retItems.push({ w, trx: Math.max(0, trx), usdt: Math.max(0, usdt), pureza: pw, atribuido: v * pw }); }
    if (fijo > 0) retenidoFijo += fijo * pw;
  }
  return { terminales, polvo: { importe: polvoNoSeguido, importeFijo: polvoNoSeguidoFijo, solapado: polvoSolapado, items: polvoItems }, sinResolver: { importe: sinResTot, importeFijo: sinResFijo, porContrato: Object.values(sinRes).sort((a, b) => b.importe - a.importe), items: sinResItems }, retenido: { importe: retenido, importeFijo: retenidoFijo, items: retItems.sort((a, b) => b.atribuido - a.atribuido), precioActual: pActual, precioActualT: ahora ? ahora.t : null } };
}
module.exports = { construir, particiones, cargarTramo, SEMILLA, SEG };

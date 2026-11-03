'use strict';
// Vigilante de salidas de TRX (29-oct-2026). Nace de la investigación «Vaneck» / Justin Sun (docs/INVESTIGACION-VANECK-SUN-TRX-2026-10-29.md):
// dos cuentas sacan 438 M TRX del stake (libres el 31-10 y el 03-11) y el propietario quiere saber A DÓNDE VAN sin mirar TronScan cada hora.
//
// Qué hace en cada ciclo (solo lectura, TronGrid por el lector de onchain-core):
//   1. Lee lo nuevo de cada cuenta vigilada desde la última vez (con solape de 2 min): transferencias TRX y de tokens, y operaciones de stake.
//   2. Avisa por Telegram al propietario de: retirada del TRX desbloqueado al saldo, nuevas descongelaciones, salidas y entradas ≥ umbral.
//      Cada cuenta puede fijar su propio «umbralTrx» y, con «seguirDestinos: false», pedir que no se sigan sus billeteras destino
//      (útil cuando el dinero se reparte en cientos de billeteras nuevas, como en el robo a Binance: seguirlas todas sería inabarcable).
//      Cada destino lleva su nombre si lo conocemos (directorio propio, etiquetas del bot de la blacklist, lista de las 10.000 mayores, etiqueta pública de TronScan) y el enlace a TronScan.
//   3. Sigue a cada billetera nueva que reciba TRX de las vigiladas (hasta N días y dos saltos): si lo pasa a una casa de cambio, avisa «el TRX de X ha acabado en HTX 4».
//   4. El día esperado de cada desbloqueo, un recordatorio por la mañana con lo que sigue pendiente de retirar.
//   5. Si TronGrid falla seguido, lo dice una vez (y no cada 10 minutos).
// Nunca inventa: un importe que la cadena no da (retirada de lo descongelado) se declara como no disponible y se acompaña del saldo leído.
// Todo lo que avisa queda en state/eventos.jsonl (clave única por hecho) para no repetir; lo enviado, en state/avisos.jsonl.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EQUIPOIA = path.join(ROOT, '..');
const MIN = 60000, HORA = 3600000, DIA = 86400000;
const B58 = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const TRONSCAN = 'https://tronscan.org/#/address/', TRONSCAN_TX = 'https://tronscan.org/#/transaction/';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const corto = a => (B58.test(a) ? a.slice(0, 8) + '…' + a.slice(-4) : String(a));
const enlace = a => '<a href="' + TRONSCAN + a + '">' + corto(a) + '</a>';
const enlaceTx = h => '<a href="' + TRONSCAN_TX + h + '">tx ' + String(h).slice(0, 8) + '…</a>';
const readJson = (f, fallback = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '')); } catch { return fallback; } };

// «132,7 M TRX», «2.345.678 TRX», «950.000 TRX». Formato español.
function fmtTrx(n, simbolo = 'TRX') {
  if (!Number.isFinite(n)) return 'importe no disponible';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2).replace('.', ',') + ' mil M ' + simbolo;
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' M ' + simbolo;
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ' + simbolo;
}
function fmtUsd(n) { if (!Number.isFinite(n)) return null; return n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M$' : Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' $'; }
const fmtHora = ms => new Date(ms).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const diaLocal = ms => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });   // AAAA-MM-DD en hora de Madrid
const horaLocal = ms => Number(new Date(ms).toLocaleString('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hour12: false }).slice(0, 2));

// Último cierre diario de TRX en dólares que tenga la bóveda (serie de Binance). Devuelve { usd, fecha } o null; nunca inventa un precio.
function precioTrx(file = 'C:/EquipoIA-vault/views/trx-price-1d-binance-usd.json') {
  const j = readJson(file); const f = j && j.fields; if (!f || !Array.isArray(f.values) || !f.values.length) return null;
  const i = f.values.length - 1, usd = Number(f.values[i]); if (!Number.isFinite(usd) || usd <= 0) return null;
  return { usd, fecha: new Date(f.timestamps[i]).toISOString().slice(0, 10) };
}
const enDolares = (trx, precio) => (precio && Number.isFinite(trx) ? ' (≈ ' + fmtUsd(trx * precio.usd) + ' a ' + precio.usd.toFixed(3).replace('.', ',') + ' $, cierre del ' + precio.fecha.slice(8, 10) + '-' + precio.fecha.slice(5, 7) + ')' : '');

// ---- Nombres de direcciones ----
// Orden: directorio propio (conocidas.json) → etiquetas del bot de la blacklist (etiquetas.sqlite, solo lectura) → lista de las 10.000 mayores (addressTag de TronScan) → etiqueta pública de TronScan en vivo (con clave, cacheada 7 días).
function crearNombres({ conocidas, etiquetasDb = null, lista = null, tronscan = null, cache = {}, now = () => Date.now(), log = () => {} }) {
  const porLista = new Map();
  for (const f of (lista && Array.isArray(lista.filas)) ? lista.filas : []) if (f && f.addressTag && B58.test(f.address)) porLista.set(f.address, f.addressTag);
  let stmt = null;
  if (etiquetasDb) { try { const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync(etiquetasDb, { readOnly: true }); stmt = db.prepare("SELECT tipo, nombre, fuente FROM etiquetas WHERE red='tron' AND direccion=? AND (caduca IS NULL OR caduca > ?) ORDER BY CASE confianza WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END LIMIT 1"); } catch (e) { log('etiquetas_db_no_disponible', { error: String(e.message).slice(0, 80) }); } }
  const esExchange = tag => /binance|htx|huobi|okx|okex|bybit|kraken|coinbase|bitfinex|poloniex|kucoin|gate|mexc|bitget|crypto\.com|upbit|bithumb|exchange/i.test(String(tag || ''));
  async function nombreDe(addr) {
    if (!B58.test(addr)) return null;
    const c = conocidas && conocidas.direcciones && conocidas.direcciones[addr]; if (c) return { nombre: c.nombre, tipo: c.tipo, fuente: c.fuente };
    if (stmt) { try { const r = stmt.get(addr, now()); if (r) return { nombre: r.nombre, tipo: r.tipo, fuente: r.fuente }; } catch { /* la base del bot puede estar ocupada: se sigue con las otras fuentes */ } }
    if (porLista.has(addr)) { const tag = porLista.get(addr); return { nombre: tag, tipo: esExchange(tag) ? 'exchange' : 'otro', fuente: 'TronScan (lista de las 10.000 mayores cuentas)' }; }
    const h = cache[addr]; if (h && now() - h.leida < 7 * DIA) return h.tag ? { nombre: h.tag, tipo: esExchange(h.tag) ? 'exchange' : 'otro', fuente: 'TronScan (etiqueta pública, en vivo)' } : null;
    if (tronscan) { const r = await tronscan(addr); if (r.ok) { cache[addr] = { tag: r.tag || null, leida: now() }; if (r.tag) return { nombre: r.tag, tipo: esExchange(r.tag) ? 'exchange' : 'otro', fuente: 'TronScan (etiqueta pública, en vivo)' }; } }
    return null;
  }
  return { nombreDe, cache };
}
const textoNombre = n => (n ? '<i>' + esc(n.nombre) + '</i>' + (n.tipo === 'exchange' ? ' (casa de cambio)' : '') : 'sin nombre conocido');

// ---- Detección (función pura) ----
// lectura = { edges, stake } del lector de onchain-core (leerVentana 'tron'). Devuelve hechos con clave única; el umbral vale para TRX y para unidades de token.
function detectar({ cuenta, lectura, umbral }) {
  const out = [], d = cuenta.direccion;
  for (const s of lectura.stake || []) {
    if (s.owner !== d) continue;
    if (s.tipo === 'retirar_descongelado') out.push({ clave: 'retirada|' + s.tx, clase: 'retirada', cuenta: d, at: s.at, tx: s.tx });
    else if (s.tipo === 'descongelar') { const trx = s.raw != null ? Number(s.raw) / 1e6 : null; if (trx == null || trx >= umbral) out.push({ clave: 'descongelar|' + s.tx, clase: 'descongelar', cuenta: d, at: s.at, tx: s.tx, trx }); }
    else if (s.tipo === 'cancelar_descongelacion') out.push({ clave: 'cancelar|' + s.tx, clase: 'cancelar', cuenta: d, at: s.at, tx: s.tx });
  }
  for (const e of lectura.edges || []) {
    const dec = e.token === 'native' ? 6 : (Number.isInteger(e.decimals) ? e.decimals : null); if (dec == null) continue;
    const cantidad = Number(e.raw) / Math.pow(10, dec); if (!Number.isFinite(cantidad) || cantidad < umbral) continue;
    const simbolo = e.token === 'native' ? 'TRX' : (e.symbol || 'tokens');
    const base = { at: e.at, tx: e.tx, cantidad, simbolo, token: e.token, cuenta: d };
    if (e.from === d && e.to !== d) out.push({ ...base, clave: ['salida', e.tx, e.idx, e.to, e.token].join('|'), clase: 'salida', destino: e.to });
    else if (e.to === d && e.from !== d) out.push({ ...base, clave: ['entrada', e.tx, e.idx, e.from, e.token].join('|'), clase: 'entrada', origen: e.from });
  }
  return unirIntercambios(out).sort((a, b) => a.at - b.at);
}
// Una salida y una entrada de TOKENS en la misma transacción son un intercambio (un cambio de USDD por USDT, por ejemplo): un solo aviso, con las dos claves para no repetir.
function unirIntercambios(hechos) {
  const porTx = new Map(); for (const h of hechos) { if (!porTx.has(h.tx)) porTx.set(h.tx, []); porTx.get(h.tx).push(h); }
  const out = [];
  for (const grupo of porTx.values()) {
    const sal = grupo.filter(h => h.clase === 'salida' && h.token !== 'native'), ent = grupo.filter(h => h.clase === 'entrada' && h.token !== 'native');
    if (sal.length === 1 && ent.length === 1) { out.push({ clave: 'intercambio|' + sal[0].tx, claves: [sal[0].clave, ent[0].clave], clase: 'intercambio', cuenta: sal[0].cuenta, at: sal[0].at, tx: sal[0].tx, entrega: sal[0], recibe: ent[0] }); out.push(...grupo.filter(h => h !== sal[0] && h !== ent[0])); }
    else out.push(...grupo);
  }
  return out;
}
// Saltos de una billetera seguida: salidas de TRX ≥ umbral.
function detectarSaltos({ destino, lectura, umbral }) {
  const out = [];
  for (const e of lectura.edges || []) {
    if (e.token !== 'native' || e.from !== destino.direccion || e.to === destino.direccion) continue;
    const trx = Number(e.raw) / 1e6; if (!Number.isFinite(trx) || trx < umbral) continue;
    out.push({ clave: ['salto', e.tx, e.idx, e.to].join('|'), clase: 'salto', desde: destino.direccion, destino: e.to, at: e.at, tx: e.tx, cantidad: trx, simbolo: 'TRX', raiz: destino.raiz, nivel: destino.nivel });
  }
  return out.sort((a, b) => a.at - b.at);
}

// ---- Mensajes (HTML de Telegram) ----
function mensaje(h, { nombreCuenta, nombreDestino, nombreOrigen, nombreRaiz, precio, estado, seguir }) {
  const quien = '<b>' + esc(nombreCuenta) + '</b> ' + enlace(h.cuenta || h.raiz);
  const cuando = '\n' + fmtHora(h.at) + ' · ' + enlaceTx(h.tx);
  if (h.clase === 'retirada') {
    const saldo = estado && estado.ok ? '\nSaldo libre ahora: ' + fmtTrx(estado.saldoLibreTrx) + enDolares(estado.saldoLibreTrx, precio) + (estado.pendienteTotalTrx > 0 ? '. Sigue pendiente de retirar: ' + fmtTrx(estado.pendienteTotalTrx) : '.') : '\nNo he podido leer el saldo en este momento.';
    return '🔓 ' + quien + ' ha <b>retirado al saldo el TRX desbloqueado</b> del stake (la cadena no dice cuánto en esta operación).' + saldo + '\nA partir de aquí vigilo las salidas: avisaré de cada envío de 1 M TRX o más y de a dónde va.' + cuando;
  }
  if (h.clase === 'descongelar') return '🧊 ' + quien + ' ha empezado a <b>sacar del stake ' + fmtTrx(h.trx) + '</b>' + enDolares(h.trx, precio) + '. Quedará libre dentro de 14 días.' + cuando;
  if (h.clase === 'cancelar') return '↩️ ' + quien + ' ha <b>cancelado</b> sus descongelaciones pendientes: el TRX vuelve al stake.' + cuando;
  if (h.clase === 'salida') {
    const n = nombreDestino;
    let t = '📤 ' + quien + ' ha enviado <b>' + fmtTrx(h.cantidad, h.simbolo) + '</b>' + (h.simbolo === 'TRX' ? enDolares(h.cantidad, precio) : '') + ' a ' + enlace(h.destino) + ' — ' + textoNombre(n) + '.';
    if (n && n.tipo === 'exchange') t += '\nEs una billetera de casa de cambio: lo que pase dentro ya no se ve en la cadena.';
    else if (seguir) t += '\nSigo esa billetera ' + seguir + ' días: avisaré si mueve el TRX y hacia dónde.';
    return t + cuando;
  }
  if (h.clase === 'intercambio') return '🔄 ' + quien + ' ha cambiado <b>' + fmtTrx(h.entrega.cantidad, h.entrega.simbolo) + '</b> por <b>' + fmtTrx(h.recibe.cantidad, h.recibe.simbolo) + '</b> en la misma operación (a través de ' + enlace(h.entrega.destino) + ' — ' + textoNombre(nombreDestino) + ').' + cuando;
  if (h.clase === 'entrada') return '📥 ' + quien + ' ha recibido <b>' + fmtTrx(h.cantidad, h.simbolo) + '</b>' + (h.simbolo === 'TRX' ? enDolares(h.cantidad, precio) : '') + ' de ' + enlace(h.origen) + ' — ' + textoNombre(nombreOrigen) + '.' + cuando;
  if (h.clase === 'salto') {
    const n = nombreDestino;
    let t = '↪️ El TRX que salió de <b>' + esc(nombreRaiz) + '</b> hacia ' + enlace(h.desde) + ' ha seguido camino: <b>' + fmtTrx(h.cantidad) + '</b>' + enDolares(h.cantidad, precio) + ' → ' + enlace(h.destino) + ' — ' + textoNombre(n) + '.';
    if (n && n.tipo === 'exchange') t += '\nHa llegado a una casa de cambio: aquí termina lo que se puede seguir en la cadena.';
    else if (seguir) t += '\nSigo también esta billetera ' + seguir + ' días.';
    else t += '\nNo sigo más allá (límite de dos saltos).';
    return t + cuando;
  }
  return null;
}
function mensajeRecordatorio({ cuenta, esperado, estado, precio, ahora }) {
  const pend = estado && estado.ok ? estado.pendienteDeRetirar || [] : null;
  let detalle;
  if (!pend) detalle = 'No he podido leer el estado de la cuenta ahora mismo.';
  else if (!pend.length) detalle = 'En la cuenta ya no queda nada pendiente de retirar del stake: o lo ha retirado ya (lo habré avisado) o lo canceló.';
  else detalle = 'Pendiente de retirar ahora: ' + pend.map(p => fmtTrx(p.trx) + (p.expira ? (p.expira <= ahora ? ' (ya libre)' : ' (libre el ' + fmtHora(p.expira) + ')') : '')).join(', ') + '. Saldo libre: ' + fmtTrx(estado.saldoLibreTrx) + '.';
  return '📅 Hoy ' + esperado.fecha.slice(8, 10) + '-' + esperado.fecha.slice(5, 7) + ' quedan libres <b>' + fmtTrx(esperado.trx) + '</b>' + enDolares(esperado.trx, precio) + ' de <b>' + esc(cuenta.nombre) + '</b> ' + enlace(cuenta.direccion) + '.\n' + detalle + '\nAvisaré en cuanto se muevan y de a dónde van.';
}

// ---- Estado en disco ----
function crearEstado(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const fEstado = path.join(dir, 'estado.json'), fEventos = path.join(dir, 'eventos.jsonl'), fAvisos = path.join(dir, 'avisos.jsonl');
  const estado = Object.assign({ cursores: {}, destinos: {}, etiquetasVivas: {}, recordatorios: {}, fallosSeguidos: 0, ultimoFalloAvisado: null, arrancado: null }, readJson(fEstado, {}));
  const vistos = new Set();
  try { for (const l of fs.readFileSync(fEventos, 'utf8').split('\n')) if (l.trim()) { try { vistos.add(JSON.parse(l).clave); } catch { /* línea rota: se ignora */ } } } catch { /* sin eventos todavía */ }
  const guardar = () => { const tmp = fEstado + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(estado, null, 2)); fs.renameSync(tmp, fEstado); };
  const anotarEvento = h => { vistos.add(h.clave); for (const k of h.claves || []) vistos.add(k); fs.appendFileSync(fEventos, JSON.stringify({ ...h, anotado: new Date().toISOString() }) + '\n'); };
  const anotarAviso = a => fs.appendFileSync(fAvisos, JSON.stringify({ at: new Date().toISOString(), ...a }) + '\n');
  return { estado, vistos, guardar, anotarEvento, anotarAviso, ficheros: { estado: fEstado, eventos: fEventos, avisos: fAvisos } };
}

// El cliente de Telegram del gateway devuelve el mensaje enviado (con message_id) y lanza si Telegram dice que no; un envío simulado devuelve { ok: true }.
const idMensaje = r => (r && Number.isInteger(r.message_id) ? r.message_id : (r && r.result && Number.isInteger(r.result.message_id) ? r.result.message_id : undefined));
const entregado = r => !!(r && (r.ok === true || idMensaje(r) !== undefined));

// ---- Un ciclo ----
// deps: reader (onchain-core createChainReader), nombres (crearNombres), enviar(text) → { ok, message_id? }, estado (crearEstado), config, now, log, precio
async function ejecutarCiclo({ reader, nombres, enviar, estado: E, config, now = () => Date.now(), log = () => {}, precio = null }) {
  const t = now(), umbral = config.umbralTrx, hasta = t - MIN, resumen = { cuentas: 0, destinos: 0, hechos: 0, avisos: 0, errores: [] };
  const S = E.estado; let huboFallo = false;
  if (!S.arrancado) S.arrancado = new Date(t).toISOString();
  const avisar = async (texto, meta) => {
    try { const r = await enviar(texto), ok = entregado(r); E.anotarAviso({ ...meta, ok, message_id: idMensaje(r) }); if (ok) resumen.avisos++; else resumen.errores.push('telegram: ' + JSON.stringify(r).slice(0, 80)); return ok; }
    catch (e) { resumen.errores.push('telegram: ' + String(e.message).slice(0, 80)); E.anotarAviso({ ...meta, ok: false, error: String(e.message).slice(0, 120) }); return false; }
  };
  // Nombre de una dirección; si no tiene ninguno y es un contrato (TronGrid getcontract), se dice: un contrato (un intercambio, un préstamo…) no es una billetera que se pueda seguir.
  const nombrar = async addr => { const n = await nombres.nombreDe(addr); if (n) return n; if (reader.contratoTron) { try { const c = await reader.contratoTron(addr); if (c.ok && c.contrato) return { nombre: 'contrato inteligente' + (c.nombre ? ' «' + c.nombre + '»' : ' sin nombre'), tipo: 'contrato', fuente: 'TronGrid getcontract' }; } catch { /* sin respuesta: queda sin nombre */ } } return null; };
  const seguir = (direccion, raiz, nombreRaiz, desde, nivel, trx) => {
    if (nivel > config.profundidadMaxima) return false;
    if (config.cuentas.some(c => c.direccion === direccion) || S.destinos[direccion]) return false;
    S.destinos[direccion] = { direccion, raiz, nombreRaiz, nivel, desde, cursor: null, hasta: desde + config.diasSeguimientoDestinos * DIA, trx, creado: new Date(t).toISOString() };
    return true;
  };

  // 1) Cuentas vigiladas.
  for (const cuenta of config.cuentas) {
    resumen.cuentas++;
    const cursor = S.cursores[cuenta.direccion], desde = cursor ? cursor - 2 * MIN : t - 6 * HORA;
    if (desde >= hasta) continue;
    let lectura;
    try { lectura = await reader.leerVentana('tron', cuenta.direccion, desde, hasta, { maxPaginas: 5, orden: 'asc' }); } catch (e) { resumen.errores.push(cuenta.direccion + ': ' + String(e.message).slice(0, 80)); huboFallo = true; continue; }
    if (lectura.errores && lectura.errores.length) { huboFallo = true; resumen.errores.push(cuenta.direccion + ': ' + lectura.errores.map(x => x.flujo + ' ' + x.error).join('; ')); }
    const umbralCuenta = Number.isFinite(cuenta.umbralTrx) ? cuenta.umbralTrx : umbral;   // una cuenta puede tener su propio umbral
    const hechos = detectar({ cuenta, lectura, umbral: umbralCuenta }).filter(h => !E.vistos.has(h.clave) && !(h.claves || []).some(k => E.vistos.has(k)));
    let estadoCuenta = null;
    for (const h of hechos) {
      resumen.hechos++;
      if ((h.clase === 'retirada') && !estadoCuenta) { try { estadoCuenta = await reader.estadoCuenta('tron', cuenta.direccion, { recompensa: false }); } catch { estadoCuenta = null; } }
      const dest = h.destino || (h.entrega && h.entrega.destino) || null;
      const nombreDestino = dest ? await nombrar(dest) : null, nombreOrigen = h.origen ? await nombrar(h.origen) : null;
      let sigo = null;
      if (h.clase === 'salida' && h.simbolo === 'TRX' && cuenta.seguirDestinos !== false && !(nombreDestino && ['exchange', 'vigilada', 'contrato'].includes(nombreDestino.tipo))) sigo = seguir(h.destino, cuenta.direccion, cuenta.nombre, h.at, 1, h.cantidad) ? config.diasSeguimientoDestinos : null;
      const texto = mensaje(h, { nombreCuenta: cuenta.nombre, nombreDestino, nombreOrigen, precio, estado: estadoCuenta, seguir: sigo });
      if (!texto) continue;
      E.anotarEvento({ ...h, nombreDestino: nombreDestino && nombreDestino.nombre, nombreOrigen: nombreOrigen && nombreOrigen.nombre });
      await avisar(texto, { clave: h.clave, clase: h.clase, cuenta: cuenta.direccion });
    }
    // El cursor avanza solo hasta donde la lectura fue completa: una página de más o un fallo no dejan hueco.
    if (!lectura.errores || !lectura.errores.length) {
      const cob = lectura.cobertura || {}; let fin = hasta;
      for (const f of Object.values(cob)) if (f && f.completa === false && Number.isSafeInteger(f.hasta)) fin = Math.min(fin, f.hasta);
      S.cursores[cuenta.direccion] = fin;
    }
  }

  // 2) Billeteras seguidas (destinos nuevos de las vigiladas).
  for (const d of Object.values(S.destinos)) {
    if (d.cerrado) continue;
    if (t > d.hasta) { d.cerrado = 'plazo cumplido'; continue; }
    resumen.destinos++;
    const desde = d.cursor ? d.cursor - 2 * MIN : d.desde - MIN; if (desde >= hasta) continue;
    let lectura;
    try { lectura = await reader.leerVentana('tron', d.direccion, desde, hasta, { maxPaginas: 3, orden: 'asc' }); } catch (e) { resumen.errores.push(d.direccion + ': ' + String(e.message).slice(0, 80)); huboFallo = true; continue; }
    if (lectura.errores && lectura.errores.length) { huboFallo = true; resumen.errores.push(d.direccion + ': ' + lectura.errores.map(x => x.flujo + ' ' + x.error).join('; ')); }
    const saltos = detectarSaltos({ destino: d, lectura, umbral }).filter(h => !E.vistos.has(h.clave));
    for (const h of saltos) {
      resumen.hechos++;
      const nombreDestino = await nombrar(h.destino);
      let sigo = null;
      if (nombreDestino && nombreDestino.tipo === 'exchange') d.cerrado = 'llegó a ' + nombreDestino.nombre;
      else if (!(nombreDestino && ['vigilada', 'contrato'].includes(nombreDestino.tipo))) sigo = seguir(h.destino, d.raiz, d.nombreRaiz, h.at, d.nivel + 1, h.cantidad) ? config.diasSeguimientoDestinos : null;
      const texto = mensaje({ ...h, cuenta: null }, { nombreCuenta: d.nombreRaiz, nombreRaiz: d.nombreRaiz, nombreDestino, precio, seguir: sigo });
      E.anotarEvento({ ...h, nombreDestino: nombreDestino && nombreDestino.nombre });
      await avisar(texto, { clave: h.clave, clase: 'salto', cuenta: d.raiz, desde: d.direccion });
    }
    if (!lectura.errores || !lectura.errores.length) d.cursor = hasta;
  }

  // 3) Recordatorio del día esperado (una vez, a partir de la hora configurada, hora de Madrid).
  const hoy = diaLocal(t);
  for (const cuenta of config.cuentas) for (const esp of cuenta.esperado || []) {
    if (esp.fecha !== hoy || horaLocal(t) < config.horaRecordatorioLocal) continue;
    const clave = 'recordatorio|' + cuenta.direccion + '|' + esp.fecha; if (S.recordatorios[clave]) continue;
    let st = null; try { st = await reader.estadoCuenta('tron', cuenta.direccion, { recompensa: false }); } catch { st = null; }
    if (await avisar(mensajeRecordatorio({ cuenta, esperado: esp, estado: st, precio, ahora: t }), { clave, clase: 'recordatorio', cuenta: cuenta.direccion })) S.recordatorios[clave] = new Date(t).toISOString();
  }

  // 4) Fallos seguidos: un aviso cada 6 h como mucho, a partir del tercer ciclo fallido (~30 min).
  if (huboFallo) {
    S.fallosSeguidos = (S.fallosSeguidos || 0) + 1;
    if (S.fallosSeguidos >= 3 && (!S.ultimoFalloAvisado || t - S.ultimoFalloAvisado > 6 * HORA)) {
      if (await avisar('⚠️ El vigilante de salidas de TRX lleva ' + S.fallosSeguidos + ' ciclos sin poder leer bien TronGrid (' + esc(resumen.errores.slice(0, 2).join(' · ').slice(0, 200)) + '). Sigo intentándolo cada 10 minutos; cuando vuelva, retomo donde lo dejé sin perder nada.', { clase: 'fallo' })) S.ultimoFalloAvisado = t;
    }
  } else S.fallosSeguidos = 0;

  S.ultimoCiclo = new Date(t).toISOString(); S.ultimoResumen = resumen;
  E.guardar();
  log('ciclo', resumen);
  return resumen;
}

module.exports = { entregado, idMensaje, detectar, unirIntercambios, detectarSaltos, mensaje, mensajeRecordatorio, crearNombres, crearEstado, ejecutarCiclo, precioTrx, fmtTrx, fmtUsd, enlace, corto, diaLocal, horaLocal, ROOT, EQUIPOIA };

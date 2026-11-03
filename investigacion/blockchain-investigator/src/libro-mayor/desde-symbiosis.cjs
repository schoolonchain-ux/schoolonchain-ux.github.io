'use strict';
// Pata de SYMBIOSIS del libro mayor: cada envío al enrutador MetaRouterGateway (TRON) se enlaza con su llegada a la cadena de destino (API pública de Symbiosis + datos de la propia llamada)
// y, en Ethereum, con el seguimiento hacia adelante del ETH recibido. Un cruce de cadenas es UN grupo «puente»: lo enviado y lo recibido se concilian en dólares (el activo cambia, USDT/TRX → ETH),
// con la diferencia a la vista (comisión + deslizamiento, ESTIMADO); si el cruce se revirtió, el recibo es la devolución en la cadena de origen.
const fs = require('node:fs'); const path = require('node:path'); const precios = require('./precios.cjs');
const METAROUTER = 'TPuaJ6gnYfE9gLUDFrbWbPx3tMnjG8max1'; const CADENA = { 728126428: 'tron', 1: 'ethereum', 42161: 'arbitrum', 56: 'bnb', 13863860: 'symbiosis' };
const j = f => JSON.parse(fs.readFileSync(f, 'utf8')); const existe = f => fs.existsSync(f);
const NOMBRE_CADENA = { tron: 'TRON', ethereum: 'Ethereum', arbitrum: 'Arbitrum', bnb: 'BNB Chain', symbiosis: 'cadena propia de Symbiosis' };

// Devuelve el resumen de lo añadido. `verificadas` (opcional) = mapa hash de llegada → true si Etherscan confirmó la entrada de ETH en el receptor.
function añadirAlLibro(L, T5, { verificadas = null } = {}) {
  const fL = path.join(T5, 'symbiosis-llegadas.json'), fD = path.join(T5, 'metarouter-destino.json'), fR = path.join(T5, 'metarouter-resumen.json');
  if (![fL, fD, fR].every(existe)) return null;
  const LL = j(fL), D = j(fD), R = j(fR); const envios = new Map(R.filas.map(f => [f.tx, f]));
  const salida = { envios: 0, conLlegada: 0, ok: 0, revertidos: 0, porActivoDestino: {}, devuelto: { n: 0, usd: 0 }, atascado: { n: 0, usd: 0 }, enviadoUsd: 0, recibidoUsd: 0, discrepancias: [], receptores: new Map(), verificadasEtherscan: 0, noVerificadas: 0, elegibles: 0 };
  for (const [tx, f] of envios) {
    const s = LL[tx]; if (!s || !s.llegada) continue; const dec = D[tx]; salida.envios++;
    const envs = L.movs.filter(m => m.tx === tx && m.a === METAROUTER && (m.tipo === 'puente_envio' || m.tipo === 'deposito_contrato')); if (!envs.length) continue;
    const env = envs[0]; const enviadoUsd = envs.reduce((a, m) => a + (m.usd || 0), 0);
    const l = s.llegada; const cadena = CADENA[l.cadena] || ('cadena ' + l.cadena); const t = Date.parse(l.hora);
    const px = l.activo === 'ETH' ? precios.precio('ETH', t) : (['USDT', 'USDC', 'sUSDC'].includes(l.activo) ? 1 : null); const usd = px == null ? null : l.importe * px;
    const revertido = s.estado === 'Reverted'; const contraste = dec && !dec.error ? (String(dec.cadenaFinalId) === String(l.cadena) && dec.contratoDestino.toLowerCase() === String(l.receptor).toLowerCase()) : null;
    const verif = verificadas ? !!verificadas[l.tx] : null; const estado = verif === true ? 'VERIFICADO' : 'ESTIMADO';
    const rec = L.mov({ cadena, tx: l.tx, indice: 'sym', activo: l.activo === 'sUSDC' ? 'USDC' : l.activo, importe: l.importe, de: 'puente:symbiosis', a: l.receptor, t, tipo: 'puente_recibo', estado, usd: usd == null ? undefined : usd, usdEstado: 'ESTIMADO', grupo: 'puente:' + tx, fuente: 'API de Symbiosis' + (verif === true ? ' + entrada confirmada en Etherscan' : ''), nota: (revertido ? 'DEVUELTO: el cruce se revirtió y el dinero volvió a ' + NOMBRE_CADENA[cadena] + ' · ' : 'llegada a ' + NOMBRE_CADENA[cadena] + ' · ') + 'enviado desde TRON en ' + tx });
    const dif = usd == null ? null : enviadoUsd - usd; const g = { id: 'puente:' + tx, tipo: 'puente', envio: env.id, recibo: rec.id, comision: null, diferencia: dif, diferenciaUsd: dif, enviadoUsd, recibidoUsd: usd, revertido, estado: dif == null ? 'DESCONOCIDO' : (Math.abs(dif) / Math.max(1, enviadoUsd) <= (revertido ? 0.15 : 0.05) ? 'ESTIMADO' : 'DESCONOCIDO'), nota: (contraste === false && !revertido) ? 'la cadena/receptor de la llegada no coincide con la llamada' : '' };
    L.grupos.set(g.id, g); env.nota = 'Symbiosis → ' + NOMBRE_CADENA[cadena] + (revertido ? ' (REVERTIDO: devuelto)' : '') + ' · ' + l.importe.toLocaleString('es-ES', { maximumFractionDigits: 4 }) + ' ' + l.activo + ' al receptor ' + l.receptor;
    salida.conLlegada++; if (revertido) { salida.revertidos++; if (cadena === 'tron') { salida.devuelto.n++; salida.devuelto.usd += usd || 0; } else { salida.atascado.n++; salida.atascado.usd += usd || 0; } } else { salida.ok++; const k = cadena + ' ' + l.activo; const x = salida.porActivoDestino[k] || (salida.porActivoDestino[k] = { cadena: NOMBRE_CADENA[cadena], activo: l.activo, n: 0, importe: 0, usd: 0 }); x.n++; x.importe += l.importe; x.usd += usd || 0; x.verificadas = (x.verificadas || 0) + (verif === true ? 1 : 0); const r = salida.receptores.get(cadena + ':' + String(l.receptor).toLowerCase()) || { cadena, receptor: String(l.receptor).toLowerCase(), n: 0, importe: 0, usd: 0, primera: t, ultima: t, activo: l.activo }; r.n++; r.importe += l.importe; r.usd += usd || 0; r.verificadas = (r.verificadas || 0) + (verif === true ? 1 : 0); r.primera = Math.min(r.primera, t); r.ultima = Math.max(r.ultima, t); salida.receptores.set(cadena + ':' + String(l.receptor).toLowerCase(), r); }
    salida.enviadoUsd += enviadoUsd; salida.recibidoUsd += usd || 0; if ((l.cadena === 1 || l.cadena === 42161) && !revertido && ['ETH', 'USDT', 'USDC'].includes(l.activo)) { salida.elegibles++; if (verif === true) salida.verificadasEtherscan++; else salida.noVerificadas++; }
    if (g.estado === 'DESCONOCIDO') salida.discrepancias.push({ tx, enviadoUsd, recibidoUsd: usd, dif });
  }
  salida.receptores = [...salida.receptores.values()].sort((a, b) => b.usd - a.usd); return salida;
}

// Primera entrada trazada a cada billetera (hora, s): parte de las semillas y baja al descubrir un camino más temprano. Una salida solo se sigue si ocurre después de ella (menos 1 h).
const HOLGURA = 3600;
function primeraEntrada(nodos, semillas) {
  const ein = { ...semillas }; const pila = Object.keys(ein);
  while (pila.length) { const a = pila.pop(); const nd = nodos[a]; if (!nd || nd.terminal || nd.error) continue; for (const e of (nd.salidas || []).concat(nd.tokens || [])) { if (e.t < ein[a] - HOLGURA) continue; if (ein[e.a] === undefined || e.t < ein[e.a]) { ein[e.a] = e.t; pila.push(e.a); } } }
  return ein;
}
// Seguimiento hacia adelante en Ethereum (eth-adelante-v2.json): cada envío de ETH/USDT/USDC seguido entre billeteras es un movimiento VERIFICADO (Etherscan).
function añadirSeguimientoEth(L, T5) {
  const f = path.join(T5, 'eth-adelante-v2.json'); if (!existe(f)) return null; const S = j(f); const ein = primeraEntrada(S.nodos, S.semillas); let n = 0, otros = 0; const base = { cadena: 'ethereum', estado: 'VERIFICADO', fuente: 'Etherscan v2 (seguimiento hacia adelante)', tipo: 'transferencia' };
  const add = m => { if (L.porId.has(require('./modelo.cjs').idDe(m))) return; L.mov(m); n++; };
  for (const [a, nodo] of Object.entries(S.nodos)) { if (nodo.terminal || nodo.error || ein[a] === undefined) continue; const t0 = ein[a] - HOLGURA;
    for (const s of nodo.salidas || []) if (s.t >= t0) add({ ...base, tx: s.tx, indice: 'f', activo: 'ETH', importe: s.eth, de: a, a: s.a, t: s.t * 1000 });
    for (const s of nodo.tokens || []) { if (s.t < t0) continue; if (s.token !== 'USDT' && s.token !== 'USDC') { otros++; continue; } add({ ...base, tx: s.tx, indice: 'ft:' + s.token, activo: s.token, importe: s.v, de: a, a: s.a, t: s.t * 1000 }); } }
  return { n, tokensNoAnotados: otros, nodos: Object.keys(S.nodos).length, ficha: S.ficha };
}
module.exports = { añadirAlLibro, añadirSeguimientoEth, primeraEntrada, METAROUTER };

// ---------- Resumen del seguimiento en Ethereum con reparto PROPORCIONAL (como la «pureza» de TRON)
// Una billetera que recibe ETH del rastro pero además mueve ETH propio no puede dar por «del robo» todo lo que saca. Pureza de cada billetera = entrada trazada / (lo que saca desde su primera entrada + su saldo de hoy), con tope 1;
// lo trazado que entra en la siguiente billetera es lo que salió × pureza. Se itera hasta que converge. Es un MODELO (ESTIMADO) y conserva el total: nada de lo trazado supera lo que llegó por los cruces.
function resumenEth(T5, otras = []) {
  const fE = path.join(T5, 'eth-adelante-v2.json'), fS = path.join(T5, 'llegadas-eth.json'); if (!existe(fE) || !existe(fS)) return null;
  const E = j(fE); const nodos = E.nodos; const ein = primeraEntrada(nodos, E.semillas); const semilla = new Map(); let llegaSym = 0; const add = (a, v) => semilla.set(a, (semilla.get(a) || 0) + v);
  let llegaCf = 0, llegaCfStable = 0;
  for (const dd of [T5, ...otras]) {
  const fSS = path.join(dd, 'llegadas-eth.json'); if (existe(fSS)) for (const x of Object.values(j(fSS))) if (x.cadena === 1) { add(x.direccion, x.eth); llegaSym += x.eth; }
  const fCF = path.join(dd, 'chainflip-destinos.json'), fLL = path.join(dd, 'chainflip-llegadas.json');
  if (existe(fCF) && existe(fLL)) { const CF = j(fCF), LL = j(fLL); for (const v of Object.values(CF)) for (const c of v.canales || []) for (const s of c.cambios) { const l = LL[String(s.nativeId)]; if (!l || !l.nuestro) continue; const act = s.activoDestino || c.activoDestino; if (!['Eth', 'Usdt', 'Usdc'].includes(act)) continue; const a = String(s.destino || c.destino).toLowerCase(); if (act === 'Eth' && s.salida) { const e = Number(s.salida.importe) / 1e18; add(a, e); llegaCf += e; } else { if (!semilla.has(a)) semilla.set(a, 0); llegaCfStable += s.salida ? s.salida.usd : 0; } } }
  }
  const alc = new Set(Object.keys(ein)); const leidas = [...alc].filter(a => nodos[a] && !nodos[a].terminal && !nodos[a].error);
  const sal = a => (nodos[a].salidas || []).filter(e => e.t >= ein[a] - HOLGURA), pol = a => (nodos[a].polvos || []).filter(e => e.t >= ein[a] - HOLGURA);
  const sale = {}, bal = {}; for (const a of leidas) { sale[a] = sal(a).reduce((s, x) => s + x.eth, 0) + pol(a).reduce((s, x) => s + x.eth, 0); bal[a] = nodos[a].saldoEth || 0; }
  let entra = {}; const p = {}; for (const a of leidas) p[a] = 1; let iteraciones = 0;
  for (let it = 0; it < 200; it++) { iteraciones = it + 1; const nuevo = {}; for (const [a, v] of semilla) nuevo[a] = (nuevo[a] || 0) + v; for (const a of leidas) for (const s of sal(a)) nuevo[s.a] = (nuevo[s.a] || 0) + s.eth * p[a]; let cambio = 0; for (const a of leidas) { const den = sale[a] + bal[a]; const np = den > 0 ? Math.min(1, (nuevo[a] || 0) / den) : 1; cambio = Math.max(cambio, Math.abs(np - p[a])); p[a] = np; } entra = nuevo; if (cambio < 1e-9) break; }
  let quieto = 0, quietoSaldo = 0, nQuietas = 0, polvo = 0, aContratosTotal = 0, noLeido = 0; const aContratos = {}, quietas = [];
  for (const a of leidas) { const nd = nodos[a]; polvo += pol(a).reduce((s, x) => s + x.eth, 0) * p[a]; const sinSalida = !sal(a).length && !(nd.tokens || []).filter(e => e.t >= ein[a] - HOLGURA).length;
    if (sinSalida) { const att = Math.min(bal[a], entra[a] || 0); if (att > 0.01) { quieto += att; quietoSaldo += bal[a]; nQuietas++; quietas.push({ direccion: a, saldo: bal[a], atribuible: att, entra: entra[a] || 0, txTotal: nd.txTotal, desde: ein[a] }); } }
    for (const s of sal(a)) { const t = nodos[s.a] && nodos[s.a].terminal; if (t) { const k = (t.nombre || t.tipo); const x = aContratos[k] || (aContratos[k] = { nombre: k, tipo: t.tipo, direccion: s.a, eth: 0, n: 0 }); x.eth += s.eth * p[a]; x.n++; aContratosTotal += s.eth * p[a]; } else if (!nodos[s.a]) noLeido += s.eth * p[a]; } }
  quietas.sort((x, y) => y.atribuible - x.atribuible);
  let tokensUsd = 0; for (const a of leidas) for (const t of (nodos[a].tokens || []).filter(e => e.t >= ein[a] - HOLGURA)) tokensUsd += t.v * p[a];
  const llegadas = llegaSym + llegaCf; const diferencia = llegadas - quieto - aContratosTotal - polvo;
  return { llegaSym, llegaCf, llegaCfStableUsd: llegaCfStable, llegadas, semillas: semilla.size, alcanzadas: alc.size, leidas: leidas.length, quietoAtribuible: quieto, quietoSaldoTotal: quietoSaldo, nQuietas, aContratos: Object.values(aContratos).sort((x, y) => y.eth - x.eth), aContratosTotal, polvo, tokensUsd, noLeido, diferencia, iteraciones, quietas: quietas.slice(0, 60), conPurezaBaja: leidas.filter(a => p[a] < 0.5).length };
}
module.exports.resumenEth = resumenEth;

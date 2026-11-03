'use strict';
// REPARTO POR SALDOS REALES (paso 3 de la prueba de aceptación): en vez de repartir lo recibido «por orden de llegada» (FIFO, que es una suposición), se lee el LIBRO COMPLETO de una dirección
// (todo lo que entró y salió de cada activo, con el origen y el destino de cada movimiento) y se CONCILIA con su saldo real:
//     entradas − salidas (− gas, en la moneda nativa) = saldo leído en el mismo bloque.
//  · Si CUADRA al entero (al wei), las cifras de entradas y salidas son completas y exactas para esa dirección y ese activo: no hay suposiciones.
//  · Si NO cuadra, se dice cuánto falta; no se da por bueno. Si se alcanzó el tope de páginas, la lectura es incompleta y NO se afirma nada de cierre.
//  · «Origen único»: si todo lo que recibió de un activo vino de una sola dirección, lo que salió procede EXACTAMENTE de ahí; con varios orígenes se declara la MEZCLA (no se reparte por suposición).
//  · Los cambios de activo (swaps) se detectan por el balance NETO de cada transacción (entrega un activo y recibe otro), sin decir en qué plataforma.
//  · Fuente: Etherscan v2 (txlist, txlistinternal, tokentx) y saldos por JSON-RPC en el MISMO bloque. Cada respuesta cruda se guarda como lectura original para que el segundo revisor la compruebe.
const { REDES } = require('../../onchain-core/src/redes.cjs');
const { SEL_BALANCE_OF } = require('./saldo.cjs');

const MAX_PAGINAS = 10, FILAS = 1000;
const lc = s => String(s || '').toLowerCase();
const pausa = ms => new Promise(r => setTimeout(r, ms));
const hexN = h => (typeof h === 'string' && /^0x[0-9a-fA-F]+$/.test(h) ? BigInt(h) : null);
const iso = s => new Date(s * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const isNum = v => /^\d+$/.test(String(v));

async function pagina(http, clave, chainId, params, crudos, tipo) {
  const qs = new URLSearchParams({ chainid: String(chainId), module: 'account', ...params, apikey: clave }).toString(), url = 'https://api.etherscan.io/v2/api?' + qs;
  await pausa(380);
  let r = await http({ url, method: 'GET', timeoutMs: 30000 });
  if (r.json && /rate limit|max calls per sec/i.test(String(r.json.result || r.json.message))) { await pausa(1500); r = await http({ url, method: 'GET', timeoutMs: 30000 }); }
  crudos.push({ tipo, crudo: JSON.stringify({ consultado_utc: new Date().toISOString(), red_chainid: chainId, accion: params.action, pagina: params.page, status: r.status, respuesta: r.json }) });
  const j = r.json || {};
  if (Array.isArray(j.result)) return { ok: true, filas: j.result };
  if (/no transactions found|no records/i.test(String(j.message) + ' ' + String(j.result))) return { ok: true, filas: [] };
  return { ok: false, error: String(j.result || j.message || 'sin respuesta (HTTP ' + r.status + ')').slice(0, 120) };
}

// Lee todas las páginas de una acción hasta el bloque tope. → { ok, filas, completa, error? }
async function leerTodo(http, clave, chainId, accion, direccion, tope, crudos, desde = 0) {
  const filas = []; let completa = true;
  for (let p = 1; p <= MAX_PAGINAS; p++) {
    const r = await pagina(http, clave, chainId, { action: accion, address: direccion, startblock: desde, endblock: tope, page: p, offset: FILAS, sort: 'asc' }, crudos, 'etherscan:' + accion + ':p' + p);
    if (!r.ok) return { ok: false, error: `${accion}: ${r.error}`, filas, completa: false };
    filas.push(...r.filas); if (r.filas.length < FILAS) return { ok: true, filas, completa };
    if (p === MAX_PAGINAS) completa = false;
  }
  return { ok: true, filas, completa };
}

// desdeBloque: lee solo la VENTANA [desdeBloque, último bloque]; el cierre usa el saldo inicial (en el bloque anterior) y el final. Sirve para direcciones de muchísimo tráfico, cuyo historial completo no cabe en el tope de filas.
async function leerLibro(http, rpc, tokens, claves, { red = 'ethereum', direccion, activos = null, desdeBloque = 0 }) {
  const a = lc(direccion), consultado = new Date().toISOString(), crudos = [], r0 = REDES[red];
  if (!r0) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: 'red no soportada: ' + red, crudos };
  if (!claves.etherscanKey) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: 'falta la clave gratuita de Etherscan', crudos };
  const bn = await rpc.ultimoBloque(red); if (bn.crudo) crudos.push({ tipo: 'eth_blockNumber', crudo: bn.crudo });
  if (!bn.ok) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: 'no se pudo leer el último bloque: ' + bn.error, crudos };
  const tope = Number(BigInt(bn.resultado)) - 2, blk = await rpc.bloque(red, tope); if (blk.crudo) crudos.push({ tipo: 'eth_getBlockByNumber', crudo: blk.crudo });
  const ts = blk.ok && blk.resultado && blk.resultado.timestamp ? Number(BigInt(blk.resultado.timestamp)) : null;
  if (ts == null) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: 'no se pudo leer la hora del bloque ' + tope, crudos };
  const desde = Number.isSafeInteger(Number(desdeBloque)) && Number(desdeBloque) > 0 ? Number(desdeBloque) : 0, lecturas = {}, errores = [];
  if (desde >= tope) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: `el bloque de inicio (${desde}) no es anterior al último leído (${tope})`, crudos };
  for (const acc of ['txlist', 'txlistinternal', 'tokentx']) {
    try { const l = await leerTodo(http, claves.etherscanKey, r0.id, acc, a, tope, crudos, desde); lecturas[acc] = l; if (!l.ok) errores.push(l.error); } catch (e) { lecturas[acc] = { ok: false, filas: [], completa: false }; errores.push(`${acc}: ${String(e.message).slice(0, 80)}`); }
  }
  if (errores.length) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: 'lectura de historial incompleta: ' + errores.join('; '), crudos };
  const completa = ['txlist', 'txlistinternal', 'tokentx'].every(k => lecturas[k].completa);
  // ---- libro por activo: clave 'ETH' o contrato del token
  const L = new Map(), porTx = new Map();
  const nodo = k => { if (!L.has(k)) L.set(k, { activo: k, simbolo: null, decimales: null, entra: 0n, sale: 0n, nEntra: 0, nSale: 0, origenes: new Map(), destinos: new Map(), gas: 0n, filas: 0, ev: [] }); return L.get(k); };
  const mover = (k, de, a2, raw, tx, ts2, meta = {}) => {
    const v = BigInt(raw); if (v <= 0n) return; const n = nodo(k); n.filas++; if (meta.simbolo && !n.simbolo) n.simbolo = meta.simbolo; if (meta.decimales != null && n.decimales == null) n.decimales = meta.decimales;
    if (a2 === a && de !== a) { n.ev.push({ ts: ts2, entra: true, otro: de, v }); n.entra += v; n.nEntra++; const o = n.origenes.get(de) || { raw: 0n, n: 0 }; o.raw += v; o.n++; n.origenes.set(de, o); }
    else if (de === a && a2 !== a) { n.ev.push({ ts: ts2, entra: false, otro: a2, v }); n.sale += v; n.nSale++; const d = n.destinos.get(a2) || { raw: 0n, n: 0 }; d.raw += v; d.n++; n.destinos.set(a2, d); }
    else return;   // autotransferencia: no cambia el saldo
    const t = porTx.get(tx) || { tx, ts: ts2, neto: new Map() }; t.neto.set(k, (t.neto.get(k) || 0n) + (a2 === a ? v : -v)); porTx.set(tx, t);
  };
  for (const f of lecturas.txlist.filas) {
    if (lc(f.from) === a) { const n = nodo('ETH'); n.gas += BigInt(f.gasUsed || 0) * BigInt(f.gasPrice || 0); }
    if (f.isError === '1' || !isNum(f.value) || f.value === '0' || !f.to) continue;
    mover('ETH', lc(f.from), lc(f.to), f.value, lc(f.hash), Number(f.timeStamp), { simbolo: 'ETH', decimales: 18 });
  }
  for (const f of lecturas.txlistinternal.filas) { if (f.isError === '1' || !isNum(f.value) || f.value === '0' || !f.to || !f.from) continue; mover('ETH', lc(f.from), lc(f.to), f.value, lc(f.hash), Number(f.timeStamp), { simbolo: 'ETH', decimales: 18 }); }
  for (const f of lecturas.tokentx.filas) { if (!isNum(f.value) || f.value === '0' || !f.contractAddress) continue; mover(lc(f.contractAddress), lc(f.from), lc(f.to), f.value, lc(f.hash), Number(f.timeStamp), { simbolo: (/^[A-Za-z0-9._$-]{1,24}$/.test(String(f.tokenSymbol || '')) ? String(f.tokenSymbol) : null), decimales: Number.isInteger(Number(f.tokenDecimal)) ? Number(f.tokenDecimal) : null }); }
  const nat = nodo('ETH'); nat.simbolo = nat.simbolo || 'ETH'; nat.decimales = 18;
  // ---- activos a conciliar: los pedidos (ETH y/o contratos) o, por defecto, ETH y los 4 tokens de más movimiento
  const pedidos = Array.isArray(activos) && activos.length ? [...new Set(activos.map(x => (String(x).toUpperCase() === 'ETH' ? 'ETH' : lc(x))))].slice(0, 8) : ['ETH', ...[...L.values()].filter(x => x.activo !== 'ETH' && tokens.conocidos.has(red + '|' + x.activo)).sort((x, y) => (y.nEntra + y.nSale) - (x.nEntra + x.nSale)).slice(0, 4).map(x => x.activo)]   // por defecto solo ETH y los tokens VERIFICADOS por contrato (hay tokens falsos con símbolos copiados y cifras enormes); los demás se piden por contrato;
  const bloqueTag = '0x' + tope.toString(16), conciliados = [];
  for (const k of pedidos) {
    const n = L.get(k) || nodo(k); let saldoRaw = null, errSaldo = null;
    if (k === 'ETH') { const s = await rpc.saldo(red, a, bloqueTag); if (s.crudo) crudos.push({ tipo: 'eth_getBalance', crudo: s.crudo }); if (s.ok && hexN(s.resultado) != null) saldoRaw = hexN(s.resultado); else errSaldo = s.error || 'saldo no válido'; }
    else { const s = await rpc.call(red, k, SEL_BALANCE_OF + '0'.repeat(24) + a.slice(2), bloqueTag); if (s.crudo) crudos.push({ tipo: 'balanceOf(' + k + ')', crudo: s.crudo }); if (s.ok && hexN(s.resultado) != null) saldoRaw = hexN(s.resultado); else errSaldo = s.error || 'saldo no válido'; const inf = await tokens.info(red, k); if (n.decimales == null) n.decimales = inf.decimales; n.simbolo = inf.identificado_por_contrato || n.simbolo || inf.simbolo_reportado; n.verificado = !!inf.verificado_por_contrato; }
    // atribución en el tiempo: una entrada posterior a una salida no puede ser el origen de esa salida
    const sal = n.ev.filter(x => !x.entra), primeraSalida = sal.length ? Math.min(...sal.map(x => x.ts)) : null, antes = primeraSalida == null ? [] : n.ev.filter(x => x.entra && x.ts <= primeraSalida), despues = primeraSalida == null ? [] : n.ev.filter(x => x.entra && x.ts > primeraSalida), orAntes = new Set(antes.map(x => x.otro));
    // saldo INICIAL (ventana): el saldo en el bloque anterior al inicio; sin ventana, el historial entero parte de cero
    let inicialRaw = 0n, errInicial = null;
    if (desde > 0) { const tag0 = '0x' + (desde - 1).toString(16), s0 = k === 'ETH' ? await rpc.saldo(red, a, tag0) : await rpc.call(red, k, SEL_BALANCE_OF + '0'.repeat(24) + a.slice(2), tag0); if (s0.crudo) crudos.push({ tipo: 'saldo_inicial(' + k + ')', crudo: s0.crudo }); if (s0.ok && hexN(s0.resultado) != null) inicialRaw = hexN(s0.resultado); else errInicial = s0.error || 'saldo inicial no válido (el proveedor no sirve saldos históricos)'; }
    const esperado = inicialRaw + n.entra - n.sale - n.gas, dif = saldoRaw == null ? null : saldoRaw - esperado;
    const top = (m, c) => [...m].sort((x, y) => (y[1].raw > x[1].raw ? 1 : -1)).slice(0, c).map(([d, v]) => ({ direccion: d, raw: v.raw.toString(), n: v.n }));
    conciliados.push({ activo: k, simbolo: n.simbolo, decimales: n.decimales, verificado: n.verificado || k === 'ETH', entra_raw: n.entra.toString(), sale_raw: n.sale.toString(), gas_raw: k === 'ETH' ? n.gas.toString() : '0', n_entradas: n.nEntra, n_salidas: n.nSale,
      origenes_distintos: n.origenes.size, destinos_distintos: n.destinos.size, origenes: top(n.origenes, 8), destinos: top(n.destinos, 8), saldo_raw: saldoRaw == null ? null : saldoRaw.toString(), esperado_raw: esperado.toString(), diferencia_raw: dif == null ? null : dif.toString(),
      cuadra: dif === 0n && completa && !errInicial, saldo_inicial_raw: desde > 0 ? inicialRaw.toString() : null, error_saldo_inicial: errInicial, atribucion: n.origenes.size === 1 ? 'origen_unico' : n.origenes.size === 0 ? 'sin_entradas' : 'mezcla', error_saldo: errSaldo,
      primera_salida_utc: primeraSalida == null ? null : iso(primeraSalida), origenes_antes_de_la_primera_salida: orAntes.size, entradas_antes_de_la_primera_salida_raw: antes.reduce((s, x) => s + x.v, 0n).toString(), n_entradas_despues: despues.length, entradas_despues_raw: despues.reduce((s, x) => s + x.v, 0n).toString(), origenes_despues: new Set(despues.map(x => x.otro)).size,
      atribucion_a_la_primera_salida: primeraSalida == null ? 'sin_salidas' : orAntes.size === 1 ? 'origen_unico_hasta_la_primera_salida' : orAntes.size === 0 ? 'sin_entradas_previas' : 'mezcla_antes_de_la_primera_salida' });
  }
  // ---- cambios de activo (swaps) por balance neto de la transacción
  const cambios = [...porTx.values()].filter(t => [...t.neto.values()].some(v => v < 0n) && [...t.neto.values()].some(v => v > 0n)).sort((x, y) => x.ts - y.ts)
    .map(t => ({ tx: t.tx, utc: iso(t.ts), entrega: [...t.neto].filter(([, v]) => v < 0n).map(([k, v]) => ({ activo: k, raw: (-v).toString() })), recibe: [...t.neto].filter(([, v]) => v > 0n).map(([k, v]) => ({ activo: k, raw: v.toString() })) }));
  const sinConciliar = [...L.values()].filter(x => x.activo !== 'ETH' && !pedidos.includes(x.activo)).length;
  const limites = [`Es el libro ${desde ? `entre los bloques ${desde} y ${tope}` : `hasta el bloque ${tope}`} (${iso(ts)}): puede cambiar en cualquier momento.`, ...(desde ? ['Ventana: solo cuenta lo ocurrido desde el bloque de inicio; el cierre usa el saldo inicial (bloque anterior) y el final, leídos por JSON-RPC.'] : []), ...(sinConciliar ? [`Hay ${sinConciliar} token(s) más con movimientos que NO se han conciliado (sin verificar por contrato o no pedidos): pídelos por contrato en «activos».`] : []), 'Las sumas las calcula el sistema sobre las filas leídas de Etherscan (lectura original guardada); no son una observación directa de un único dato.',
    'Un movimiento no dice de qué plataforma ni persona viene: los cambios de activo se detectan por el balance neto de la transacción.', ...(completa ? [] : [`Se alcanzó el tope de ${MAX_PAGINAS * FILAS} filas por lista: el libro es INCOMPLETO y no se afirma ningún cierre.`])];
  return { ok: true, red, direccion: a, consultado_utc: consultado, bloque: tope, desde_bloque: desde || null, ocurrido_utc: iso(ts), completa, filas: { txlist: lecturas.txlist.filas.length, txlistinternal: lecturas.txlistinternal.filas.length, tokentx: lecturas.tokentx.filas.length },
    activos: conciliados, activos_con_movimientos: L.size, cambios: cambios.slice(0, 40), n_cambios: cambios.length, crudos, limites };
}
module.exports = { leerLibro, MAX_PAGINAS };

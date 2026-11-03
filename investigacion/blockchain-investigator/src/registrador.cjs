'use strict';
// REGISTRADOR: traduce lo que leen los adaptadores (transacciones, rutas, contratos, eventos) a evidencias, relaciones y consultas del expediente, SIN modelo de lenguaje en medio:
// los textos se generan con plantillas a partir de los datos y cada cifra lleva la evidencia de la que sale. Antes de citar una lectura se guarda su versión CRUDA (por su huella) para que cualquiera
// —incluido el segundo revisor— pueda comprobarla sobre el original.
//  · Toda consulta se anota, también las fallidas (con su motivo): nada se oculta.
//  · Un dato que no se pudo leer nunca se convierte en «no hay nada»: se anota como NO_COMPROBADO con lo que se intentó.
const { sha256 } = require('./canon.cjs');

const ahoraIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const ISO = s => (s ? String(s).replace(/\.\d{3}Z$/, 'Z') : s);
// Cantidad con decimales exactos desde el entero crudo (BigInt): nunca pasa por coma flotante.
function cantidad(raw, dec) {
  const d = Number.isInteger(dec) ? dec : 0, s = String(BigInt(raw)).padStart(d + 1, '0'), ent = s.slice(0, s.length - d).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), fr = d ? s.slice(-d).replace(/0+$/, '') : '';
  return ent + (fr ? ',' + fr : '');
}
const cort = a => (a && a.length > 14 ? a.slice(0, 8) + '…' + a.slice(-4) : a);

function crearRegistrador({ cliente, expId, herramienta = 'investigador' }) {
  const subidas = new Map(), vistas = new Map();   // vistas: clave de transferencia → ids de evidencia ya registrados (evita duplicar al repetir o reanudar un rastreo)
  const claveSalto = (red, s) => [red, s.tx, s.de, s.a, s.token].join('|');
  // Recupera lo ya registrado en el expediente (para reanudar sin duplicar).
  async function inicializar() {
    const v = await cliente.ver(expId);
    for (const a of v.aristas) if (a.tx_hash) vistas.set([a.red, a.tx_hash, a.desde, a.hasta, a.activo || 'native'].join('|'), a.evidencias);
    return { aristas: v.aristas.length, evidencias: v.evidencias.length };
  }
  async function subir(crudos) {
    const out = {};
    for (const c of crudos || []) { const sha = sha256(Buffer.from(c.crudo, 'utf8')); if (!subidas.has(sha)) { const r = await cliente.blob(expId, c.crudo); subidas.set(sha, r.sha256); } out[c.tipo] = subidas.get(sha); }
    return out;
  }
  const consultaBase = (c, extra = {}) => cliente.consulta(expId, { herramienta: c.herramienta || herramienta, parametros: c.parametros, proposito: c.proposito || 'apoyo', hipotesis: c.hipotesis, estado: c.estado, ts_utc: c.ts_utc || ahoraIso(), ms: c.ms, resumen: c.resumen, evidencias: c.evidencias || [], error: c.error, raw_sha256: c.raw_sha256, ...extra });

  // ---- una transacción EVM ----
  async function transaccion(r, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'transaccion', ...c });
    const params = { red: r.red, hash: r.hash };
    if (!r.ok) {
      const ev = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudo leer la transacción ${r.hash} en ${r.red}`, fuente: 'JSON-RPC público', metodo: 'eth_getTransactionByHash + eth_getTransactionReceipt', consultado_utc: ISO(r.consultado_utc), limites: [r.error] });
      await consulta({ parametros: params, proposito, hipotesis, estado: r.no_disponible ? 'no_disponible' : 'sin_datos', error: r.error, resumen: r.error, evidencias: [ev.id] }); return { ok: false, evidencias: [ev.id], error: r.error };
    }
    const crudos = await subir(r.crudos), rawRecibo = crudos.eth_getTransactionReceipt;
    const mon = a => r.monedas[a] || {}, nom = a => (mon(a).simbolo_reportado || cort(a)) + (mon(a).verificado_por_contrato ? ' (contrato verificado)' : ' (símbolo no verificado)');
    const partes = [];
    for (const t of r.transferencias.slice(0, 6)) partes.push(`${cort(t.from)} → ${cort(t.to)}: ${cantidad(t.raw, mon(t.token).decimales)} ${nom(t.token)}`);
    if (BigInt(r.valor_wei) > 0n && r.to) partes.push(`${cort(r.from)} → ${cort(r.to)}: ${cantidad(r.valor_wei, 18)} ETH (valor de la transacción)`);
    const texto = `Transacción ${r.hash} en ${r.red}: ${r.estado}, bloque ${r.bloque}, ${r.ocurrido_utc || 'hora no confirmada'}. ${partes.join('; ') || 'sin transferencias de tokens ni valor'}${r.transferencias.length > 6 ? ` (y ${r.transferencias.length - 6} más)` : ''}.`;
    const ev = await cliente.evidencia(expId, { clase: 'hecho_cadena', texto, fuente: `JSON-RPC público (${r.proveedor}): recibo y transacción`, metodo: 'lectura directa de eth_getTransactionByHash, eth_getTransactionReceipt y eth_getBlockByNumber; importes en unidad mínima exacta (BigInt)',
      consultado_utc: ISO(r.consultado_utc), ocurrido_utc: ISO(r.ocurrido_utc || r.consultado_utc), red: r.red, direccion: r.from, contrato: r.to || undefined, tx_hash: r.hash, bloque: r.bloque, confianza: r.ocurrido_utc ? 'alta' : 'media', limites: r.limites, raw_sha256: rawRecibo });
    const evs = [ev.id];
    if (r.swaps && r.swaps.length) {   // swaps: lo que dicen los eventos del recibo (observado); NO prueba de qué transferencia previa viene lo recibido si se mezclan fondos
      const par = (xs, k) => xs.map(x => `${cantidad(x.raw, mon(x.token).decimales)} ${nom(x.token)}`).join(' + ') || (k ? 'monedas sin resolver' : '—');
      const lineas = r.swaps.slice(0, 8).map((s, i) => `#${i + 1} ${s.dex.replace('_', ' ')} pool ${cort(s.pool)}: entra ${s.monedas_resueltas ? par(s.entra, true) : 'monedas sin resolver'} → sale ${s.monedas_resueltas ? par(s.sale, true) : 'monedas sin resolver'}`);
      const sinRes = r.swaps.filter(s => !s.monedas_resueltas).length, enc = (r.continuidad_swaps || []).filter(c => c.comprobable);
      const evS = await cliente.evidencia(expId, { clase: 'hecho_cadena', texto: `La transacción ${r.hash} emitió ${r.swaps.length} eventos de swap (${[...new Set(r.swaps.map(s => s.dex.replace('_', ' ')))].join(', ')})${r.entrada && r.entrada.multicall ? ', entrando por ' + r.entrada.multicall : ''}: ${lineas.join('; ')}${r.swaps.length > 8 ? ' (y ' + (r.swaps.length - 8) + ' más)' : ''}.`, fuente: `JSON-RPC público (${r.proveedor}): eventos del recibo`, metodo: 'decodificación de los eventos Swap del recibo (identificador calculado de su firma); monedas de cada pool leídas con token0()/token1() o coins(i)',
        consultado_utc: ISO(r.consultado_utc), ocurrido_utc: ISO(r.ocurrido_utc || r.consultado_utc), red: r.red, direccion: r.from, contrato: r.to || undefined, tx_hash: r.hash, bloque: r.bloque, confianza: 'media',
        limites: ['Un swap decodificado dice lo ocurrido DENTRO de la transacción: no demuestra de qué transferencia anterior procede lo recibido cuando la operación mezcla fondos de varios orígenes.', ...(sinRes ? [`${sinRes} swap(s) (Uniswap V4) sin monedas resueltas: solo se conocen cantidades con signo.`] : []), ...(r.sin_decodificar && r.sin_decodificar.length ? [`${r.sin_decodificar.length} tipos de evento del recibo sin decodificar (no se interpretan).`] : []), ...(enc.length ? [`Continuidad entre pools comprobada en ${enc.filter(c => c.encadenan).length} de ${enc.length} pares consecutivos.`] : [])],
        alternativas: ['Un enrutador puede haber repartido o mezclado el resultado entre varios destinatarios.'], raw_sha256: rawRecibo });
      evs.push(evS.id);
    }
    await consulta({ parametros: params, proposito, hipotesis, estado: 'ok', resumen: `tx ${r.estado} en bloque ${r.bloque}`, evidencias: evs, raw_sha256: rawRecibo });
    return { ok: true, evidencia: ev.id, evidencias: evs };
  }

  // ---- un rastreo de fondos (de fondos.cjs) ----
  async function ruta(r, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'ruta', ...c });
    const params = { red: r.red, direccion: r.direccion, sentido: r.sentido, ...(r.parametros ? { profundidad: r.parametros.profundidad, minUsd: r.parametros.minUsd, desde: r.parametros.desde, hasta: r.parametros.hasta } : {}) };
    if (!r.ok) {
      const ev = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudo rastrear los fondos de ${r.direccion} en ${r.red}`, fuente: 'onchain-core /ruta', metodo: 'rastreo de fondos por saltos', consultado_utc: ISO(r.consultado_utc), limites: [r.motivo || 'sin motivo'] });
      await consulta({ parametros: params, proposito, hipotesis, estado: 'no_disponible', error: r.motivo || 'no disponible', evidencias: [ev.id] }); return { ok: false, evidencias: [ev.id] };
    }
    const ids = [], porSalto = new Map(), cruda = await subir([{ tipo: 'ruta_resultado', crudo: JSON.stringify({ red: r.red, direccion: r.direccion, parametros: r.parametros, consultado_utc: r.consultado_utc, saltos: r.saltos, nodos: r.nodos, omitidos: r.omitidos, avisos: r.avisos }) }]);
    await cliente.direccion(expId, { red: r.red, direccion: r.direccion, rol: 'raiz del rastreo' });
    for (const s of [...r.saltos].sort((a, b) => a.profundidad - b.profundidad)) {
      const dec = s.decimales ?? (s.token === 'native' ? 18 : null), sim = s.simbolo || (s.token === 'native' ? 'ETH' : cort(s.token));
      // 1) la transferencia en sí: OBSERVADA en cadena (la lectura del historial del explorador, con hash y fecha)
      const kS = claveSalto(r.red, { ...s, token: s.token === 'native' ? 'native' : s.token });
      if (vistas.has(kS)) { const prev = vistas.get(kS); porSalto.set(s.id, prev[prev.length - 1]); ids.push(...prev); continue; }
      const evT = await cliente.evidencia(expId, { clase: 'hecho_cadena', texto: `${cort(s.de)} envió ${cantidad(s.raw, dec)} ${sim} a ${cort(s.a)} (tx ${cort(s.tx)}, ${s.ocurrido_utc})`, fuente: s.fuente || 'historial del explorador (onchain-core)', metodo: 'lectura del historial de la dirección en el explorador; importe en unidad mínima exacta',
        consultado_utc: ISO(r.consultado_utc), ocurrido_utc: ISO(s.ocurrido_utc), red: r.red, direccion: s.de, tx_hash: s.tx, bloque: s.bloque ?? undefined, confianza: 'alta', limites: ['Dato de un explorador: se comprueba contra el recibo de la transacción cuando hace falta.'], raw_sha256: cruda.ruta_resultado });
      ids.push(evT.id);
      let ref = [evT.id];
      if (s.clase === 'inferida') {   // 2) la ATRIBUCIÓN a los fondos de la raíz: estimación FIFO, nunca una observación
        const base = [evT.id, ...(s.padres || []).map(p => porSalto.get(p)).filter(Boolean)];
        const evI = await cliente.evidencia(expId, { clase: 'inferencia', texto: `Los ${cantidad(s.raw, dec)} ${sim} enviados por ${cort(s.de)} a ${cort(s.a)} se atribuyen a los fondos rastreados desde ${cort(r.direccion)}${s.via_swap ? ' a través de un cambio de activo' : ''}`,
          fuente: 'onchain-core /ruta', metodo: s.metodo, consultado_utc: ISO(r.consultado_utc), base: [...new Set(base)], confianza: s.confianza === 'media' ? 'media' : 'baja',
          alternativas: ['La dirección pudo tener fondos previos del mismo activo o recibir otros ingresos, y lo enviado proceder de ellos.', 'La salida no tiene por qué seguir el orden FIFO supuesto.'],
          limites: ['FIFO no demuestra la procedencia exacta de los fondos.', ...(s.atribucion && s.atribucion.mezcla ? ['La dirección recibió otros ingresos del mismo activo: la cantidad atribuida es una cota superior.'] : []), ...(s.atribucion && s.atribucion.cobertura === false ? ['No se pudo leer toda su actividad.'] : [])] });
        ids.push(evI.id); ref = [evT.id, evI.id];
      }
      porSalto.set(s.id, ref[ref.length - 1]);
      vistas.set(kS, ref);
      await cliente.arista(expId, { red: r.red, desde: s.de, hasta: s.a, clase: s.clase, activo: s.token === 'native' ? undefined : s.token, simbolo: sim, importe_raw: s.raw, decimales: dec ?? undefined, ts_utc: ISO(s.ocurrido_utc), tx_hash: s.tx, evidencias: ref, metodo: s.clase === 'inferida' ? s.metodo : undefined });
    }
    for (const n of r.nodos) if (n.parada && n.parada.etiqueta) await cliente.direccion(expId, { red: r.red, direccion: n.direccion, etiqueta: n.parada.etiqueta.nombre, etiqueta_fuente: n.parada.etiqueta.fuente || 'etiquetas de onchain-core', tipo: n.parada.etiqueta.tipo });
    for (const n of r.nodos) if (n.parada && n.direccion !== r.direccion) {
      const ev = await cliente.evidencia(expId, { clase: n.parada.tipo === 'sin_salidas' ? 'hecho_cadena' : 'no_disponible', texto: `Rastreo detenido en ${cort(n.direccion)}: ${n.parada.detalle}`, fuente: 'onchain-core /ruta', metodo: 'criterio de parada del rastreo', consultado_utc: ISO(r.consultado_utc), red: r.red, direccion: n.direccion,
        ...(n.parada.tipo === 'sin_salidas' ? { confianza: 'media', limites: ['Puede haber salidas posteriores a la fecha leída.'] } : { limites: [n.parada.detalle] }) });
      ids.push(ev.id);
    }
    if (r.omitidos && (r.omitidos.sinPrecio.n || r.omitidos.porLimite.n || r.omitidos.polvo.n)) {
      const ev = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `Lo que NO se siguió: ${r.omitidos.sinPrecio.n} transferencias de tokens sin precio verificado, ${r.omitidos.porLimite.n} ramas por el límite de ${r.parametros.fanout} por dirección (${Math.round(r.omitidos.porLimite.usd).toLocaleString('de-DE')} $), ${r.omitidos.polvo.n} movimientos menores al mínimo (${Math.round(r.omitidos.polvo.usd).toLocaleString('de-DE')} $)`,
        fuente: 'onchain-core /ruta', metodo: 'recuento de lo omitido por el propio rastreo', consultado_utc: ISO(r.consultado_utc), limites: ['El rastreo es incompleto por diseño: estos movimientos podrían continuar la ruta.'] });
      ids.push(ev.id);
    }
    await consulta({ parametros: params, proposito, hipotesis, estado: r.saltos.length ? 'ok' : 'sin_datos', ms: r.ms, resumen: `${r.saltos.length} saltos, ${r.nodos.length} nodos, ${r.peticiones} peticiones`, evidencias: ids, raw_sha256: cruda.ruta_resultado });
    return { ok: true, evidencias: ids };
  }

  // ---- un contrato ----
  async function contrato(c, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'contrato', ...c });
    const params = { red: c.red, direccion: c.direccion };
    if (!c.ok) { const ev = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudo analizar ${c.direccion} en ${c.red}`, fuente: 'JSON-RPC público', metodo: 'eth_getCode', consultado_utc: ISO(c.consultado_utc), limites: [c.error] }); await consulta({ parametros: params, proposito, hipotesis, estado: 'no_disponible', error: c.error, evidencias: [ev.id] }); return { ok: false, evidencias: [ev.id] }; }
    const crudos = await subir(c.crudos), ids = [], raw0 = crudos.eth_getCode, base = { consultado_utc: ISO(c.consultado_utc), red: c.red, direccion: c.direccion };
    if (c.delegacion_7702) { const ev = await cliente.evidencia(expId, { ...base, clase: 'hecho_cadena', texto: `${c.direccion} tiene en ${c.red} código de DELEGACIÓN EIP-7702 (0xef0100…) hacia ${c.delegacion_7702}: es una cuenta normal que ejecuta el código de esa otra dirección; no es un contrato desplegado`, fuente: 'JSON-RPC público: eth_getCode', metodo: 'eth_getCode en el bloque más reciente (prefijo 0xef0100 + dirección de 20 bytes)', confianza: 'alta', limites: c.limites, raw_sha256: raw0 }); await consulta({ parametros: params, proposito, hipotesis, estado: 'ok', resumen: `delegación EIP-7702 hacia ${c.delegacion_7702}`, evidencias: [ev.id], raw_sha256: raw0 }); return { ok: true, evidencias: [ev.id] }; }
    if (!c.es_contrato) { const ev = await cliente.evidencia(expId, { ...base, clase: 'hecho_cadena', texto: `${c.direccion} no tiene código en ${c.red}: es una dirección normal`, fuente: 'JSON-RPC público: eth_getCode', metodo: 'eth_getCode en el bloque más reciente', confianza: 'alta', limites: c.limites, raw_sha256: raw0 }); await consulta({ parametros: params, proposito, hipotesis, estado: 'ok', resumen: 'sin código', evidencias: [ev.id], raw_sha256: raw0 }); return { ok: true, evidencias: [ev.id] }; }
    const evC = await cliente.evidencia(expId, { ...base, clase: 'hecho_cadena', texto: `${c.direccion} es un contrato de ${c.bytecode.bytes} bytes (sha256 del código ${c.bytecode.sha256.slice(0, 16)}…)`, fuente: 'JSON-RPC público: eth_getCode', metodo: 'eth_getCode en el bloque más reciente', confianza: 'alta', limites: ['Es el código a la hora de la consulta: puede cambiar si es actualizable.'], raw_sha256: raw0 }); ids.push(evC.id);
    const p = c.proxy;
    if (p.es_proxy) { const ev = await cliente.evidencia(expId, { ...base, clase: 'hecho_cadena', texto: `Es un proxy (${p.tipo}) cuya implementación es ${p.implementacion || 'desconocida'}${p.admin ? ' y su administrador ' + p.admin : ''}`, fuente: 'JSON-RPC público: eth_getStorageAt / eth_getCode', metodo: p.evidencia.join('; '), confianza: 'alta', limites: ['Quien tenga el permiso de actualización puede cambiar la implementación.'], raw_sha256: crudos['eth_getStorageAt:eip1967_implementacion'] || crudos['eth_getStorageAt:zos_implementacion'] || raw0 }); ids.push(ev.id); }
    const v = c.vistas || {}, vs = Object.entries(v).filter(([, x]) => x != null).map(([k, x]) => `${k}=${x}`);
    if (vs.length) { const ev = await cliente.evidencia(expId, { ...base, clase: 'hecho_cadena', texto: `Lo que el propio contrato contesta: ${vs.join(', ')}`, fuente: 'JSON-RPC público: eth_call', metodo: 'llamadas de solo lectura owner(), name(), symbol(), decimals(), totalSupply(), paused()', confianza: 'alta', limites: ['Un nombre o símbolo lo escribe quien despliega el contrato: no prueba su identidad.'], raw_sha256: raw0 }); ids.push(ev.id); }
    if (c.funciones_control && c.funciones_control.length) {
      const ev = await cliente.evidencia(expId, { ...base, clase: 'inferencia', texto: `El código contiene funciones de control: ${c.funciones_control.map(f => `${f.firma} (${f.en.join('+')})`).join(', ')}`, fuente: 'análisis de selectores del bytecode', metodo: 'búsqueda de los selectores de 4 bytes de funciones de control en el bytecode (PUSH4)', base: [evC.id], confianza: 'media',
        alternativas: ['El selector puede aparecer sin que la función esté activa o sea llamable.', 'Un dato embebido puede coincidir con un selector por azar.'], limites: c.limites });
      ids.push(ev.id);
    }
    await cliente.evidencia(expId, { ...base, clase: 'fuente_externa', texto: `Verificación del código en Sourcify: ${c.verificacion.sourcify}`, fuente: 'Sourcify (API v2)', metodo: 'GET /server/v2/contract/{chainId}/{address}', confianza: 'media', limites: ['Otro explorador podría tener el código verificado aunque Sourcify no.'] }).then(e => ids.push(e.id));
    await consulta({ parametros: params, proposito, hipotesis, estado: 'ok', resumen: `contrato ${c.proxy.es_proxy ? 'proxy ' : ''}${c.clasificacion ? c.clasificacion.tipo : ''}`, evidencias: ids, raw_sha256: raw0 });
    return { ok: true, evidencias: ids };
  }

  // ---- eventos de control (Etherscan getLogs) ----
  async function eventos(ev, { red, proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'eventos', ...c });
    const params = { red, direccion: ev.direccion, eventos: (ev.eventos || []).map(e => e.evento) };
    if (!ev.ok) { const e = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudieron leer los eventos de ${ev.direccion}`, fuente: 'Etherscan getLogs', metodo: 'logs por topic0', consultado_utc: ISO(ev.consultado_utc || ahoraIso()), limites: [ev.error] }); await consulta({ parametros: params, proposito, hipotesis, estado: 'no_disponible', error: ev.error, evidencias: [e.id] }); return { ok: false, evidencias: [e.id] }; }
    const crudos = await subir(ev.crudos), ids = [];
    for (const e of ev.eventos) {
      if (e.estado !== 'ok') { const x = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `Evento ${e.evento} de ${ev.direccion}: no se pudo leer (${e.estado})`, fuente: 'Etherscan getLogs', metodo: 'logs por topic0', consultado_utc: ISO(ev.consultado_utc), limites: [e.detalle || e.estado] }); ids.push(x.id); continue; }
      if (!e.total) { const x = await cliente.evidencia(expId, { clase: 'hecho_cadena', texto: `Evento ${e.evento}: ningún registro desde el bloque ${e.desde_bloque} hasta el último, en ${ev.direccion}`, fuente: 'Etherscan getLogs', metodo: 'logs por topic0, bloque inicial acotado', consultado_utc: ISO(ev.consultado_utc), red, contrato: ev.direccion, bloque: e.desde_bloque, ocurrido_utc: ISO(ev.consultado_utc), confianza: 'media', limites: ['Una sola fuente. Sin registros no significa que la función no exista, solo que no se emitió ese evento en la ventana.'], raw_sha256: crudos['etherscan:getLogs:' + e.evento] }); ids.push(x.id); continue; }
      for (const r of e.registros) { const x = await cliente.evidencia(expId, { clase: 'hecho_cadena', texto: `Evento ${e.evento} en ${ev.direccion}: bloque ${r.bloque}, ${r.utc}${r.topics.length ? ', parámetros ' + r.topics.map(t => '0x' + t.slice(-40)).join(' / ') : ''}${r.data && r.data.length > 2 ? ', datos 0x…' + r.data.slice(-40) : ''}`, fuente: 'Etherscan getLogs', metodo: 'logs por topic0', consultado_utc: ISO(ev.consultado_utc), ocurrido_utc: ISO(r.utc), red, contrato: ev.direccion, tx_hash: r.tx, bloque: r.bloque, confianza: 'media', limites: [`Una sola fuente (Etherscan)${e.truncado ? '; la lista está truncada: faltan eventos posteriores' : ''}.`], raw_sha256: crudos['etherscan:getLogs:' + e.evento] }); ids.push(x.id); }
    }
    await consulta({ parametros: params, proposito, hipotesis, estado: 'ok', resumen: ev.eventos.map(e => `${e.evento}:${e.total ?? e.estado}`).join(' '), evidencias: ids });
    return { ok: true, evidencias: ids };
  }

  // ---- una página o documento externo (documentos.cjs) ----
  async function documento(d, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'documento', ...c });
    const params = { url: d.url };
    if (!d.ok) { const e = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudo leer ${d.url}`, fuente: d.dominio || 'documento externo', metodo: 'lectura de página pública', consultado_utc: ISO(d.consultado_utc || ahoraIso()), limites: [d.error] }); await consulta({ parametros: params, proposito, hipotesis, estado: d.no_permitido ? 'no_disponible' : 'error', error: d.error, evidencias: [e.id] }); return { ok: false, evidencias: [e.id] }; }
    const crudos = await subir([{ tipo: 'documento', crudo: JSON.stringify({ url: d.url, consultado_utc: d.consultado_utc, status: d.status, sha256_html: d.sha256_html, titulo: d.titulo, texto: d.texto }) }]);
    const e = await cliente.evidencia(expId, { clase: 'fuente_externa', texto: `Documento «${d.titulo || d.url}» (${d.dominio}): ${d.resumen}`, fuente: d.url, metodo: 'lectura de página pública de un dominio permitido; texto extraído sin interpretar', consultado_utc: ISO(d.consultado_utc), ocurrido_utc: d.publicado_utc ? ISO(d.publicado_utc) : undefined, confianza: 'media', limites: d.limites, raw_sha256: crudos.documento });
    await consulta({ parametros: params, proposito, hipotesis, estado: 'ok', resumen: d.titulo || d.url, evidencias: [e.id], raw_sha256: crudos.documento }); return { ok: true, evidencias: [e.id] };
  }

  // ---- estado de bloqueo de una dirección en un token (estadoBloqueo de contrato.cjs) ----
  async function bloqueo(b, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'bloqueo', ...c }), params = { red: b.red, token: b.token, direccion: b.direccion };
    if (!b.ok) { const e = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudo comprobar si ${b.direccion} está bloqueada en el token ${b.token} (${b.red})`, fuente: 'JSON-RPC público: eth_call', metodo: 'isBlackListed / isBlocked', consultado_utc: ISO(b.consultado_utc), limites: [b.error] }); await consulta({ parametros: params, proposito, hipotesis, estado: 'no_disponible', error: b.error, evidencias: [e.id] }); return { ok: false, evidencias: [e.id] }; }
    const crudos = await subir(b.crudos), raw = Object.values(crudos).pop();
    const e = await cliente.evidencia(expId, { clase: 'hecho_cadena', texto: `${b.direccion} ${b.bloqueada ? 'ESTÁ' : 'NO está'} en la lista de bloqueo del token ${b.token} en ${b.red} (${b.funcion}) a ${ISO(b.consultado_utc)}`, fuente: 'JSON-RPC público: eth_call al contrato del token', metodo: 'lectura de ' + b.funcion + ' en el último bloque', consultado_utc: ISO(b.consultado_utc), red: b.red, contrato: b.token, direccion: b.direccion, confianza: 'alta', limites: b.limites, raw_sha256: raw });
    await consulta({ parametros: params, proposito, hipotesis, estado: 'ok', resumen: `bloqueada=${b.bloqueada}`, evidencias: [e.id], raw_sha256: raw }); return { ok: true, evidencias: [e.id], bloqueada: b.bloqueada };
  }

  // ---- saldo actual (moneda nativa y tokens pedidos), con la hora del bloque leído
  async function saldo(s, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'saldo', ...c }), params = { red: s.red, direccion: s.direccion };
    if (!s.ok) { const e = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudo leer el saldo de ${s.direccion} en ${s.red}`, fuente: 'JSON-RPC público: eth_getBalance / balanceOf', metodo: 'lectura de saldo en el último bloque', consultado_utc: ISO(s.consultado_utc), limites: [s.error] }); await consulta({ parametros: params, proposito, hipotesis, estado: 'no_disponible', error: s.error, evidencias: [e.id] }); return { ok: false, evidencias: [e.id] }; }
    const crudos = await subir(s.crudos), raw = crudos.eth_getBalance || Object.values(crudos).pop(), ids = [], base = { consultado_utc: ISO(s.consultado_utc), ocurrido_utc: s.ocurrido_utc, bloque: s.bloque, red: s.red, direccion: s.direccion, fuente: 'JSON-RPC público: eth_getBalance / balanceOf', confianza: 'alta', limites: s.limites };
    const n = await cliente.evidencia(expId, { ...base, clase: 'hecho_cadena', texto: `${s.direccion} tenía ${cantidad(s.nativo.raw, s.nativo.decimales)} ${s.nativo.simbolo} (moneda nativa) en ${s.red} en el bloque ${s.bloque} (${s.ocurrido_utc})`, metodo: 'eth_getBalance en el último bloque', raw_sha256: raw }); ids.push(n.id);
    for (const t of s.tokens) {
      if (!t.ok) { const e = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudo leer el saldo del token ${t.token} de ${s.direccion} en ${s.red}`, fuente: 'JSON-RPC público: eth_call balanceOf', metodo: 'balanceOf en el último bloque', consultado_utc: ISO(s.consultado_utc), limites: [t.error] }); ids.push(e.id); continue; }
      const e = await cliente.evidencia(expId, { ...base, clase: 'hecho_cadena', contrato: t.token, texto: `${s.direccion} tenía ${cantidad(t.raw, t.decimales)} ${t.simbolo || 'del token'} (contrato ${t.token}${t.verificado ? ', verificado' : ', símbolo SIN verificar'}) en ${s.red} en el bloque ${s.bloque} (${s.ocurrido_utc})`, metodo: 'balanceOf del propio contrato en el último bloque', raw_sha256: crudos['balanceOf(' + t.token + ')'] || raw }); ids.push(e.id);
    }
    await consulta({ parametros: { ...params, tokens: s.tokens.map(t => t.token) }, proposito, hipotesis, estado: 'ok', resumen: `${cantidad(s.nativo.raw, s.nativo.decimales)} ${s.nativo.simbolo}${s.tokens.length ? ' y ' + s.tokens.length + ' token(s)' : ''} en el bloque ${s.bloque}`, evidencias: ids, raw_sha256: raw }); return { ok: true, evidencias: ids };
  }

  // ---- reparto por saldos reales: libro de entradas y salidas por activo, conciliado con el saldo del mismo bloque
  async function reparto(s, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'reparto', ...c }), params = { red: s.red, direccion: s.direccion };
    if (!s.ok) { const e = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudo leer el libro de entradas y salidas de ${s.direccion} en ${s.red}`, fuente: 'Etherscan v2 + JSON-RPC público', metodo: 'libro completo conciliado con el saldo', consultado_utc: ISO(s.consultado_utc), limites: [s.error] }); await consulta({ parametros: params, proposito, hipotesis, estado: 'no_disponible', error: s.error, evidencias: [e.id] }); return { ok: false, evidencias: [e.id] }; }
    const paginas = await subir(s.crudos), cant = (raw, d) => cantidad(raw, d), corto = x => x.slice(0, 8) + '…' + x.slice(-4);
    const libro = JSON.stringify({ guion: 'reparto', direccion: s.direccion, red: s.red, bloque: s.bloque, ocurrido_utc: s.ocurrido_utc, completa: s.completa, filas: s.filas, activos: s.activos, cambios: s.cambios, n_cambios: s.n_cambios, paginas_sha256: paginas });
    const rawLibro = (await subir([{ tipo: 'libro_conciliado', crudo: libro }])).libro_conciliado, ids = [];
    const base = { consultado_utc: ISO(s.consultado_utc), ocurrido_utc: s.ocurrido_utc, bloque: s.bloque, red: s.red, direccion: s.direccion, fuente: 'Etherscan v2 (txlist, txlistinternal, tokentx) + JSON-RPC público (saldo en el mismo bloque)', metodo: 'libro completo de entradas y salidas conciliado con el saldo del mismo bloque', limites: s.limites, raw_sha256: rawLibro };
    for (const a of s.activos) {
      const nom = a.simbolo || 'token', un = a.activo === 'ETH' ? 'ETH (moneda nativa)' : `${nom} (contrato ${a.activo}${a.verificado ? ', verificado' : ', símbolo SIN verificar'})`, d = a.decimales;
      const lista = (xs, k) => xs.slice(0, 5).map(x => `${corto(x.direccion)} ${cant(x.raw, d)}${x.n > 1 ? ' (' + x.n + ' mov.)' : ''}`).join('; ') + (xs.length < (k === 'o' ? a.origenes_distintos : a.destinos_distintos) ? ' …' : '');
      const cierre = a.saldo_raw == null ? `saldo NO leído (${a.error_saldo})` : !s.completa ? `libro INCOMPLETO (tope de filas): no se afirma cierre; saldo ${cant(a.saldo_raw, d)}` : a.cuadra ? `CUADRA al entero: entradas − salidas${a.activo === 'ETH' ? ' − gas' : ''} = saldo ${cant(a.saldo_raw, d)}` : `NO CUADRA: saldo ${cant(a.saldo_raw, d)}, esperado ${cant(a.esperado_raw, d)}, diferencia ${a.diferencia_raw} (unidad mínima)`;
      const texto = `${s.direccion} · libro de ${un} ${s.desde_bloque ? `entre los bloques ${s.desde_bloque} y ${s.bloque}${a.saldo_inicial_raw != null ? ` (saldo inicial ${cant(a.saldo_inicial_raw, d)})` : ''}` : `hasta el bloque ${s.bloque}`} (${s.ocurrido_utc}): entró ${cant(a.entra_raw, d)} (${a.n_entradas} mov. de ${a.origenes_distintos} origen(es): ${lista(a.origenes, 'o') || '—'}); salió ${cant(a.sale_raw, d)} (${a.n_salidas} mov. a ${a.destinos_distintos} destino(s): ${lista(a.destinos, 'd') || '—'})${a.activo === 'ETH' ? '; gas pagado ' + cant(a.gas_raw, 18) : ''}. ${cierre}. Atribución: ${a.atribucion === 'origen_unico' ? 'ORIGEN ÚNICO (lo que salió procede exactamente de esa dirección)' : a.atribucion === 'mezcla' ? 'MEZCLA de varios orígenes en todo el historial' : 'sin entradas'}${a.origenes_distintos >= 50 ? ` ALTO TRÁFICO: ${a.origenes_distintos} orígenes distintos; lo que entra se mezcla con todos ellos y no se puede seguir a un importe concreto sin suponer.` : ''}.${a.primera_salida_utc ? ` En el TIEMPO: hasta la primera salida (${a.primera_salida_utc}) habían entrado ${cant(a.entradas_antes_de_la_primera_salida_raw, d)} de ${a.origenes_antes_de_la_primera_salida} origen(es) → ${a.atribucion_a_la_primera_salida === 'origen_unico_hasta_la_primera_salida' ? 'las primeras salidas solo pueden proceder de ese origen' : a.atribucion_a_la_primera_salida === 'sin_entradas_previas' ? 'no había entradas previas' : 'mezcla ya antes de la primera salida'}; después llegaron ${cant(a.entradas_despues_raw, d)} en ${a.n_entradas_despues} mov. de ${a.origenes_despues} origen(es) (no pueden ser el origen de las salidas anteriores).` : ''}`;
      const e = await cliente.evidencia(expId, { ...base, clase: 'hecho_cadena', texto: texto.slice(0, 3900), ...(a.activo === 'ETH' ? {} : { contrato: a.activo }), confianza: a.cuadra ? 'alta' : 'baja' }); ids.push(e.id);
    }
    if (s.n_cambios) { const e = await cliente.evidencia(expId, { ...base, clase: 'hecho_cadena', texto: `${s.direccion} hizo ${s.n_cambios} cambio(s) de activo (la transacción le quita un activo y le da otro, por balance neto) hasta el bloque ${s.bloque}; consta el listado completo en la lectura original (libro conciliado).`, confianza: 'media' }); ids.push(e.id); }
    await consulta({ parametros: { ...params, activos: s.activos.map(x => x.activo) }, proposito, hipotesis, estado: 'ok', resumen: `${s.activos.length} activo(s) conciliados: ${s.activos.filter(x => x.cuadra).length} cuadran; ${s.n_cambios} cambios de activo`, evidencias: ids, raw_sha256: rawLibro }); return { ok: true, evidencias: ids, cuadran: s.activos.filter(x => x.cuadra).length };
  }

  // ---- texto que APORTA el propietario (p. ej. un comunicado oficial que no se puede leer automáticamente): se guarda tal cual, diciendo quién lo aportó y que su origen no está verificado ----
  async function aportado({ titulo, texto, origen = null, aportado_por = 'propietario', consultado_utc = ahoraIso() }, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'documento_aportado', ...c });
    const crudos = await subir([{ tipo: 'documento', crudo: JSON.stringify({ titulo, origen, aportado_por, consultado_utc, texto }) }]);
    const e = await cliente.evidencia(expId, { clase: 'fuente_externa', texto: `Documento aportado por el ${aportado_por}: «${titulo}»${origen ? ' (origen declarado: ' + origen + ')' : ''}: ${String(texto).replace(/\s+/g, ' ').slice(0, 240)}`, fuente: origen || ('aportado por el ' + aportado_por), metodo: 'texto entregado por el propietario; se guarda sin interpretar', consultado_utc: ISO(consultado_utc), confianza: 'baja', limites: ['El origen no está verificado por el sistema: lo aporta una persona.', 'Lo que el documento afirma no es un hecho verificado en cadena.'], raw_sha256: crudos.documento });
    await consulta({ parametros: { titulo, origen }, proposito, hipotesis, estado: 'ok', resumen: titulo, evidencias: [e.id], raw_sha256: crudos.documento }); return { ok: true, evidencias: [e.id] };
  }

  // ---- etiquetas de terceros de una dirección (onchain-core labels.lookup) ----
  async function etiquetas(red, direccion, l, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'etiquetas', ...c }), params = { red, direccion }, ids = [];
    for (const e of (l && l.labels) || []) {
      await cliente.direccion(expId, { red, direccion, etiqueta: e.nombre, etiqueta_fuente: e.fuente, tipo: e.tipo });
      const ev = await cliente.evidencia(expId, { clase: 'etiqueta_terceros', texto: `${direccion} figura como «${e.nombre}» (${e.tipo}) según ${e.fuente}`, fuente: e.fuente + (e.url ? ' · ' + e.url : ''), metodo: 'consulta en la base de etiquetas', consultado_utc: ahoraIso(), red, direccion, confianza: e.confianza === 'alta' || e.confianza === 'media' ? e.confianza : 'baja', limites: ['Una etiqueta de terceros es una pista, no una prueba de quién controla la dirección.', ...(e.nota ? [e.nota] : [])], alternativas: ['La etiqueta puede estar desactualizada, ser errónea o referirse a otra dirección parecida.'] });
      ids.push(ev.id);
    }
    await consulta({ parametros: params, proposito, hipotesis, estado: ids.length ? 'ok' : 'sin_datos', resumen: ids.length ? `${ids.length} etiqueta(s)` : 'sin etiquetas en las fuentes consultadas (eso NO significa que sea inocua)', evidencias: ids });
    return { ok: true, evidencias: ids, sin_etiquetas: !ids.length };
  }

  // ---- lo que ChainScope tiene GUARDADO (texto de la puerta de solo lectura): dato secundario, no una lectura nueva de la cadena ----
  async function chainscope(comando, r, { proposito = 'apoyo', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'chainscope', ...c }), params = { comando };
    if (!r.ok) { const e = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `ChainScope no contestó a «${comando}»`, fuente: 'ChainScope (puerta de servicio)', metodo: 'consulta de solo lectura', consultado_utc: ahoraIso(), limites: [r.motivo || r.estado || 'sin respuesta'] }); await consulta({ parametros: params, proposito, hipotesis, estado: 'no_disponible', error: r.motivo || r.estado || 'sin respuesta', evidencias: [e.id] }); return { ok: false, evidencias: [e.id] }; }
    const crudos = await subir([{ tipo: 'chainscope', crudo: JSON.stringify({ comando, consultado_utc: ahoraIso(), texto: r.texto }) }]);
    const e = await cliente.evidencia(expId, { clase: 'fuente_externa', texto: `ChainScope (datos guardados) para «${comando}»: ${String(r.texto).replace(/\s+/g, ' ').slice(0, 700)}`, fuente: 'ChainScope: datos guardados (grafo, etiquetas, caché de lecturas)', metodo: 'consulta de solo lectura a la puerta de servicio', consultado_utc: ahoraIso(), confianza: 'media', limites: ['Son datos guardados, no una lectura en vivo: «no guardado» no es «sin movimientos».', 'Sus etiquetas son de terceros.'], raw_sha256: crudos.chainscope });
    await consulta({ parametros: params, proposito, hipotesis, estado: 'ok', resumen: String(r.texto).slice(0, 200), evidencias: [e.id], raw_sha256: crudos.chainscope }); return { ok: true, evidencias: [e.id] };
  }

  // ---- precio histórico (DefiLlama): ESTIMACIÓN, nunca un hecho de cadena ----
  async function precio(p, { proposito = 'contexto', hipotesis } = {}) {
    const consulta = c => consultaBase({ herramienta: 'precio', ...c }), params = { activo: p.activo, utc: p.utc_pedido };
    if (!p.ok) { const e = await cliente.evidencia(expId, { clase: 'no_disponible', texto: `No se pudo obtener el precio de ${p.activo} en ${p.utc_pedido}`, fuente: 'DefiLlama coins', metodo: 'precio histórico', consultado_utc: ISO(p.consultado_utc), limites: [p.error] }); await consulta({ parametros: params, proposito, hipotesis, estado: 'no_disponible', error: p.error, evidencias: [e.id] }); return { ok: false, evidencias: [e.id] }; }
    const crudos = await subir([{ tipo: 'precio', crudo: p.crudo }]);
    const e = await cliente.evidencia(expId, { clase: 'fuente_externa', texto: `Precio de ${p.activo} cerca de ${p.utc_pedido}: ${p.precio_usd} $ (dato de DefiLlama fechado ${p.utc_dato})`, fuente: 'DefiLlama coins (api histórica)', metodo: 'GET /prices/historical/{timestamp}/{coin}', consultado_utc: ISO(p.consultado_utc), ocurrido_utc: ISO(p.utc_dato), confianza: 'media', limites: ['Es una ESTIMACIÓN: el valor en dólares de un movimiento depende del precio y de la hora elegidos; la cantidad en la unidad del activo es el dato exacto.', 'Una sola fuente.'], raw_sha256: crudos.precio });
    await consulta({ parametros: params, proposito, hipotesis, estado: 'ok', resumen: `${p.precio_usd} $`, evidencias: [e.id], raw_sha256: crudos.precio }); return { ok: true, evidencias: [e.id] };
  }

  return { inicializar, transaccion, ruta, contrato, eventos, documento, bloqueo, saldo, reparto, aportado, etiquetas, chainscope, precio, consulta: consultaBase, subir };
}
module.exports = { crearRegistrador, cantidad };

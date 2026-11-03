'use strict';
// REGISTRAR UNA RELACIÓN DIRECTA DESDE EL RECIBO (acción «relacion» de la respuesta del agente a la revisión).
// Carencia detectada al seguir los 175 M USDT (caso 0x811f…): la herramienta de ruta tiene un umbral de importe y deja fuera movimientos pequeños que SÍ son hechos; el agente no podía registrarlos como relación del grafo.
//  · El modelo solo PIDE (red, transacción, origen, destino, activo): el código vuelve a leer el recibo por JSON-RPC y construye la relación con lo que dice el recibo (importe exacto, decimales, hora, hash). Nada de lo que escriba el modelo entra en la relación.
//  · Si el recibo no contiene esa transferencia (mismo activo, origen y destino), no se registra nada y se dice por qué.
//  · Una relación ya registrada (mismo hash, origen, destino y activo) no se duplica.
const { leerTransaccion } = require('./transaccion.cjs');

const lc = s => String(s || '').toLowerCase();
const ETH = 'ETH';

async function registrarRelacion({ cliente, expId, reg, rpc, tokens, exp }, { red = 'ethereum', tx, desde, hasta, activo }) {
  const h = lc(tx), d = lc(desde), a = lc(hasta), act = String(activo || '').toUpperCase() === ETH ? ETH : lc(activo);
  if (!/^0x[0-9a-f]{64}$/.test(h)) throw new Error('hash de transacción no válido');
  if (!/^0x[0-9a-f]{40}$/.test(d) || !/^0x[0-9a-f]{40}$/.test(a)) throw new Error('origen o destino no son direcciones EVM válidas');
  if (act !== ETH && !/^0x[0-9a-f]{40}$/.test(act)) throw new Error('el activo debe ser «ETH» o la dirección de un contrato de token');
  const t = await leerTransaccion(rpc, red, h, { tokens });
  if (!t.ok) throw new Error('no se pudo leer la transacción: ' + t.error);
  if (t.estado !== 'exitosa') throw new Error('la transacción no se ejecutó con éxito (' + t.estado + ')');
  let raw = null, decimales = 18, simbolo = 'ETH', via = null;
  if (act === ETH) {
    if (t.from === d && t.to === a && BigInt(t.valor_wei) > 0n) { raw = t.valor_wei; via = 'campo «value» de la transacción'; }
  } else {
    const c = t.transferencias.filter(x => x.token === act && x.from === d && x.to === a);
    if (c.length) { raw = c.reduce((s, x) => s + BigInt(x.raw), 0n).toString(); const inf = (t.monedas || {})[act] || await tokens.info(red, act); decimales = Number.isInteger(inf.decimales) ? inf.decimales : null; simbolo = inf.identificado_por_contrato || inf.simbolo_reportado || null; via = `${c.length} evento(s) Transfer del recibo`; }
  }
  if (raw == null) throw new Error('el recibo no contiene esa transferencia (mismo activo, origen y destino): no se registra nada');
  if (!t.ocurrido_utc) throw new Error('no se pudo confirmar la hora del bloque: no se registra la relación');
  const previas = (exp || await cliente.ver(expId)).aristas.filter(x => x.tx_hash === h && x.desde === d && x.hasta === a && (x.activo || ETH) === (act === ETH ? ETH : act));
  if (previas.length) return { ok: true, id: previas[0].id, nueva: false, importe_raw: previas[0].importe_raw };
  const exp2 = await cliente.ver(expId);
  let ev = exp2.evidencias.find(e => e.clase === 'hecho_cadena' && e.tx_hash === h);
  if (!ev) { const g = await reg.transaccion(t, { proposito: 'apoyo' }); if (!g.ok) throw new Error('no se pudo registrar la evidencia de la transacción'); ev = { id: g.evidencias[0] }; }
  const r = await cliente.arista(expId, { red, desde: d, hasta: a, clase: 'directa', activo: act === ETH ? undefined : act, simbolo: simbolo || undefined, importe_raw: raw, decimales: decimales == null ? undefined : decimales, ts_utc: t.ocurrido_utc.replace(/\.\d{3}Z$/, 'Z'), tx_hash: h, evidencias: [ev.id], metodo: 'recibo leído por JSON-RPC público (' + via + ')' });
  return { ok: true, id: r.id, nueva: true, importe_raw: raw, decimales, simbolo, via, evidencia: ev.id };
}
module.exports = { registrarRelacion };

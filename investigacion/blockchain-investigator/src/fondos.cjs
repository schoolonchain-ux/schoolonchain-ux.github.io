'use strict';
// RASTREO DE FONDOS ESTRUCTURADO: envuelve el motor de onchain-core (createTracer, el mismo de /ruta del bot) y devuelve DATOS, no texto.
//  · Estado propio (blockchain-investigator/state/: grafo, etiquetas y diccionario de contratos): no comparte archivos con el bot ni con ChainScope.
//  · Método rotulado en cada salto: salto 1 = transferencia observada; saltos siguientes = la transferencia es observada pero su ATRIBUCIÓN a los fondos de la raíz es una estimación FIFO (INFERIDO).
//    FIFO no demuestra procedencia: supone que la dirección no tenía fondos previos del activo. Si recibió otros ingresos del mismo activo, la cantidad atribuida es una cota superior (confianza baja).
//  · Se detiene en exchanges, puentes, mezcladores, protocolos y contratos sin identificar, y lo dice; el límite de saltos, de nodos, de consultas y de tiempo es configurable y también se declara.
const fs = require('node:fs');
const path = require('node:path');
const { createForenseBase } = require('../../tether-blacklist/src/service/forense-base.cjs');
const { createTracer } = require('../../onchain-core/src/ruta.cjs');

const ESTADO_DEFECTO = path.join(__dirname, '..', 'state');
const isoMs = ms => (Number.isFinite(ms) ? new Date(ms).toISOString().replace('.000Z', 'Z') : null);

function crearFondos({ transporte, claves = {}, stateDir = ESTADO_DEFECTO, vaultRoot = undefined, ahora = () => new Date(), log = () => {} }) {
  if (stateDir) fs.mkdirSync(stateDir, { recursive: true });
  // Etiquetas públicas de la comunidad (exchanges, protocolos; foto de oct-2023, confianza baja): el bot de blacklist las carga desde su carpeta de estado; aquí se COPIA el archivo (solo lectura del original) para que el investigador también las tenga.
  try { const o = path.join(__dirname, '..', '..', 'tether-blacklist', 'state', 'etherscan-labels.json'), d = stateDir && path.join(stateDir, 'etherscan-labels.json'); if (d && fs.existsSync(o) && !fs.existsSync(d)) fs.copyFileSync(o, d); } catch { /* sin esas etiquetas: se declara en las consultas de etiquetas */ }
  const base = createForenseBase({ transport: transporte, config: null, etherscanKey: claves.etherscanKey || null, blockscoutKey: claves.blockscoutKey || null, tronscanKey: claves.tronscanKey || null, tronGridKey: claves.tronGridKey || null, stateDir, vaultRoot, now: ahora, log });
  const tracer = createTracer({ reader: base.reader, graph: base.graph, labels: base.labels, valuer: base.valuer, diccionario: base.diccionario, etiquetaViva: base.etiquetaViva, now: () => ahora().getTime(), log });

  async function rastrear({ red, direccion, sentido = 'out', profundidad = 3, minUsd = 1000, desde = null, hasta = null, tx = null, fanout = 4, maxNodos = 40, maxPeticiones = 150, maxMs = 110000 }) {
    const t0 = ahora().toISOString(), sf = base.sinFuente(red);
    if (sf) return { ok: false, no_disponible: true, red, direccion, consultado_utc: t0, motivo: `no hay fuente de historial para ${red}` + (sf.falta && sf.falta.length ? ` (falta: ${sf.falta.map(f => f.como || f.nombre || f.id).join('; ')})` : ''), permanente: !!sf.permanente };
    if (base.prepararTasas) await base.prepararTasas();
    const reqs0 = base.reader.requests;
    const r = await tracer.rastrear({ network: red, address: direccion, direction: sentido === 'in' ? 'in' : 'out', profundidad, minUsd, fanout, maxNodos, maxPeticiones, maxMs, ...(desde != null ? { desde } : {}), ...(hasta != null ? { hasta } : {}), ...(tx ? { tx } : {}) });
    const out = sentido === 'in' ? 'in' : 'out';
    const saltos = r.saltos.map(f => {
      const de = out === 'out' ? f.prev : f.next, a = out === 'out' ? f.next : f.prev, e = f.edge || {};
      const directo = f.depth === 1 && !f.viaSwap;
      return {
        id: f.id, profundidad: f.depth, de, a, tx: e.tx, token: e.token, simbolo: e.symbol || null, decimales: Number.isInteger(e.decimals) ? e.decimals : null, raw: String(f.raw), usd: f.usd == null ? null : f.usd,
        valoracion: f.metodo || null, ocurrido_utc: isoMs(e.at), bloque: Number.isSafeInteger(e.block) ? e.block : null, fuente: e.source || null,
        clase: directo ? 'directa' : 'inferida', via_swap: !!f.viaSwap, metodo: directo ? 'transferencia leída de la cadena' : f.viaSwap ? 'balance neto de la transacción (cambio de activo)' : r.metodo || 'FIFO sobre lo recibido de la ruta',
        confianza: f.confianza || (directo ? 'alta' : 'baja'), atribucion: f.atribucion || null, padres: f.padres || []
      };
    });
    const nodos = r.nodos.map(n => ({ direccion: n.address, profundidad: n.depth ?? null, parada: n.parada ? { tipo: n.parada.tipo, detalle: n.parada.detalle, etiqueta: n.parada.etiqueta ? { nombre: n.parada.etiqueta.nombre, tipo: n.parada.etiqueta.tipo, fuente: n.parada.etiqueta.fuente, confianza: n.parada.etiqueta.confianza } : null } : null,
      es_contrato: n.esContrato === undefined ? null : !!n.esContrato, contrato: n.contrato ? { tipo: n.contrato.tipo, nombre: n.contrato.nombre || null, verificado: !!n.contrato.verificado, confianza: n.contrato.confianza || null, via: n.contrato.via || null, fuente: n.contrato.fuente || null } : null,
      es_cartera: !!n.esCartera, swap: n.swap ? { veredicto: n.swap.veredicto, tx: n.swap.tx, motivo: n.swap.motivo || null, destinatario: n.swap.destinatario || null, relacion: n.swap.relacion ?? null } : null }));
    return {
      ok: true, red, direccion: r.root, sentido: out, consultado_utc: t0, parametros: r.params, metodo: r.metodo || null,
      saltos, nodos, omitidos: r.omitidos, avisos: r.avisos, hallazgos: r.findings, peticiones: base.reader.requests - reqs0, ms: r.ms,
      limites: ['La atribución de los saltos 2 y siguientes es una estimación FIFO: no demuestra la procedencia exacta de los fondos.', 'Solo se sigue lo que se puede valorar (stablecoins con contrato verificado y moneda nativa con precio diario); lo demás se cuenta como omitido, no se sigue.', 'Tras un swap o un contrato sin identificar la ruta se detiene o pasa a inferencia de confianza baja.']
    };
  }

  const etiquetas = (red, direccion) => base.labels.lookup(red, direccion, ahora().getTime());
  return { rastrear, etiquetas, base, close: () => { try { base.graph.close && base.graph.close(); base.labels.close(); } catch { /* ya cerrado */ } } };
}

module.exports = { crearFondos, ESTADO_DEFECTO };

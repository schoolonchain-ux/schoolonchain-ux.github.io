'use strict';
// Cliente JSON-RPC de solo lectura para redes EVM, con varios proveedores públicos por red (los de onchain-core/src/redes.cjs) y respaldo.
// Cada llamada devuelve, además del resultado, la respuesta CRUDA con su procedencia (proveedor y fecha UTC): es lo que se guarda como lectura original del expediente y lo que revisa el segundo revisor.
const { REDES } = require('../../onchain-core/src/redes.cjs');
const { canon } = require('./canon.cjs');

const METODOS = Object.freeze(['eth_getTransactionByHash', 'eth_getTransactionReceipt', 'eth_getBlockByNumber', 'eth_getCode', 'eth_getStorageAt', 'eth_call', 'eth_blockNumber', 'eth_getLogs', 'eth_chainId', 'eth_getBalance']);   // lista cerrada: solo lectura

function crearRpc({ http, redes = REDES, ahora = () => new Date() }) {
  if (typeof http !== 'function') throw Error('hace falta un transporte HTTP');
  const urls = red => { const r = redes[red]; if (!r) throw Object.assign(new Error('RED_NO_SOPORTADA: ' + red), { codigo: 'RED_NO_SOPORTADA' }); return r.rpc; };
  let n = 0;

  // → { ok, resultado, proveedor, consultado_utc, crudo (texto JSON canónico de la petición y la respuesta), error?, revert?, noEncontrado? }
  async function llamar(red, metodo, params = [], { timeoutMs = 15000 } = {}) {
    if (!METODOS.includes(metodo)) throw Object.assign(new Error('METODO_NO_PERMITIDO: ' + metodo), { codigo: 'METODO_NO_PERMITIDO' });
    let ultimo = 'sin respuesta de los proveedores', vistoNulo = null;
    for (const url of urls(red)) {
      const ts = ahora().toISOString();
      try {
        const r = await http({ url, method: 'POST', body: { jsonrpc: '2.0', id: ++n, method: metodo, params }, timeoutMs });
        const j = r.json, crudo = canon({ red, metodo, params, proveedor: new URL(url).host, consultado_utc: ts, status: r.status, respuesta: j });
        if (j && j.error) { const msg = String(j.error.message || 'error').slice(0, 120); ultimo = msg; if (/revert|execution|invalid opcode/i.test(msg)) return { ok: false, revert: true, error: msg, proveedor: new URL(url).host, consultado_utc: ts, crudo }; continue; }
        if (!j || j.result === undefined) { ultimo = 'respuesta no válida (HTTP ' + r.status + ')'; continue; }
        if (j.result === null) { vistoNulo = { proveedor: new URL(url).host, consultado_utc: ts, crudo }; continue; }
        return { ok: true, resultado: j.result, proveedor: new URL(url).host, consultado_utc: ts, crudo };
      } catch (e) { ultimo = String(e && e.message || e).slice(0, 80); }
    }
    if (vistoNulo) return { ok: true, resultado: null, noEncontrado: true, ...vistoNulo };   // todos los que contestaron dicen «no existe» (o aún no está)
    return { ok: false, error: ultimo, consultado_utc: ahora().toISOString() };
  }

  const q = (red, m, p, o) => llamar(red, m, p, o);
  return {
    llamar,
    transaccion: (red, h) => q(red, 'eth_getTransactionByHash', [h]),
    recibo: (red, h) => q(red, 'eth_getTransactionReceipt', [h]),
    bloque: (red, nOTag, completo = false) => q(red, 'eth_getBlockByNumber', [typeof nOTag === 'number' ? '0x' + nOTag.toString(16) : nOTag, !!completo]),
    codigo: (red, a, bloque = 'latest') => q(red, 'eth_getCode', [a, bloque]),
    almacenamiento: (red, a, slot, bloque = 'latest') => q(red, 'eth_getStorageAt', [a, slot, bloque]),
    call: (red, to, data, bloque = 'latest') => q(red, 'eth_call', [{ to, data }, bloque]),
    logs: (red, filtro) => q(red, 'eth_getLogs', [filtro], { timeoutMs: 25000 }),
    ultimoBloque: red => q(red, 'eth_blockNumber', []),
    saldo: (red, a, bloque = 'latest') => q(red, 'eth_getBalance', [a, bloque]),
    redes: () => Object.keys(redes)
  };
}
module.exports = { crearRpc, METODOS };

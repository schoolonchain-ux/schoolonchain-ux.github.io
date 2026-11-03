'use strict';
// SALIDA A INTERNET del investigador: UN solo punto por el que pasa toda petición, con lista cerrada de servidores y registro de cada consulta.
//  · Solo se puede hablar con servidores de la lista (RPC públicos de las redes, exploradores gratuitos, TronGrid/TronScan, Sourcify, DefiLlama). Cualquier otro se rechaza ANTES de salir.
//  · Solo lectura: GET, o POST de consultas JSON-RPC y de TronGrid (no hay otra forma de pedir esos datos). No sigue redirecciones.
//  · Cada consulta queda anotada (fecha UTC, servidor, ruta SIN parámetros —ahí van las claves—, estado, bytes y milisegundos): nada se oculta ni se reintenta en silencio.
//  · Las claves gratuitas del propietario viajan solo en la consulta y no se anotan nunca.
const { REDES } = require('../../onchain-core/src/redes.cjs');

const HOSTS_FIJOS = Object.freeze([
  'api.etherscan.io', 'api.routescan.io', 'api.blockscout.com', 'eth.blockscout.com', 'polygon.blockscout.com', 'arbitrum.blockscout.com', 'optimism.blockscout.com', 'base.blockscout.com',
  'sourcify.dev', 'repo.sourcify.dev', 'api.trongrid.io', 'apilist.tronscanapi.com', 'coins.llama.fi', 'stablecoins.llama.fi',
  'brutusservices.com'   // tasa de BRST (staking líquido de TRON), la misma fuente que ya usa el bot de blacklist
]);
const hostsDeRedes = () => Object.values(REDES).flatMap(r => r.rpc.map(u => new URL(u).host));
const MAX_REGISTRO = 20000;

// «hosts» (si se da) REEMPLAZA la lista por defecto: el lector documental usa su propia lista, sin acceso a los servidores de cadena.
function crearTransporte({ fetchImpl = globalThis.fetch, hostsExtra = [], hosts = null, ahora = () => new Date() } = {}) {
  const permitidos = new Set(hosts ? hosts : [...HOSTS_FIJOS, ...hostsDeRedes(), ...hostsExtra]);
  const registro = [];
  const anotar = r => { registro.push(r); if (registro.length > MAX_REGISTRO) registro.shift(); };

  async function transport({ url, method = 'GET', headers = {}, body = null, timeoutMs = 15000, maxResponseChars = 200000 }) {
    let u; try { u = new URL(url); } catch { throw Object.assign(new Error('URL_INVALIDA'), { codigo: 'URL_INVALIDA' }); }
    const ts = ahora().toISOString(), ent = { ts_utc: ts, host: u.host, ruta: u.pathname, metodo: method, status: null, bytes: 0, ms: null, error: null };
    if (u.protocol !== 'https:' || !permitidos.has(u.host)) { ent.error = 'HOST_NO_PERMITIDO'; anotar(ent); throw Object.assign(new Error('HOST_NO_PERMITIDO: ' + u.host), { codigo: 'HOST_NO_PERMITIDO' }); }
    if (!['GET', 'POST'].includes(method)) { ent.error = 'METODO_NO_PERMITIDO'; anotar(ent); throw Object.assign(new Error('METODO_NO_PERMITIDO'), { codigo: 'METODO_NO_PERMITIDO' }); }
    const ac = new AbortController(), timer = setTimeout(() => ac.abort(), timeoutMs), t0 = Date.now();
    try {
      const r = await fetchImpl(url, { method, headers, body, signal: ac.signal, redirect: 'manual' });
      const text = await r.text(), cap = Number.isSafeInteger(maxResponseChars) ? Math.max(200000, Math.min(maxResponseChars, 12000000)) : 200000;
      ent.status = r.status; ent.bytes = text.length; ent.ms = Date.now() - t0; anotar(ent);
      return text.length > cap ? { status: r.status, text: text.slice(0, cap), truncada: true } : { status: r.status, text };
    } catch (e) {
      ent.ms = Date.now() - t0; ent.error = e && e.name === 'AbortError' ? 'TIMEOUT' : 'RED'; anotar(ent);
      throw Object.assign(new Error(ent.error), { codigo: ent.error });
    } finally { clearTimeout(timer); }
  }
  transport.registro = () => registro.slice();
  transport.desde = n => registro.slice(n);
  transport.total = () => registro.length;
  transport.permitidos = () => [...permitidos].sort();
  return transport;
}

// Adaptador al formato que esperan las herramientas de onchain-core: http({url, method, body, timeoutMs, headers}) → { status, json, truncada }.
function crearHttpJson(transport, { tronGridKey = null } = {}) {
  return async ({ url, method = 'GET', body = null, timeoutMs = 15000, headers = {} }) => {
    const clave = tronGridKey && url.startsWith('https://api.trongrid.io') ? { 'TRON-PRO-API-KEY': tronGridKey } : {};
    const r = await transport({ url, method, headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}), ...clave, ...headers }, body: body ? JSON.stringify(body) : null, timeoutMs, maxResponseChars: 12000000 });
    let json = null; try { json = JSON.parse(r.text); } catch { json = null; }
    return { status: r.status, json, truncada: !!r.truncada };
  };
}

module.exports = { crearTransporte, crearHttpJson, HOSTS_FIJOS };

'use strict';
// IDENTIDAD DE UN TOKEN: siempre por CONTRATO, nunca por nombre. El símbolo lo lee del propio contrato (symbol()/decimals()), pero lo da como «reportado»: cualquiera puede desplegar un contrato que se llame USDT.
// Solo se llama «verificado por contrato» a los que están en la lista de stablecoins de onchain-core (validacion/datos/stables-conocidas.json: cada entrada se comprobó leyendo symbol() y decimals() en cadena).
// USDT, USDT0 y los falsos «USDT» son contratos distintos: aquí nunca se mezclan.
const fs = require('node:fs');
const path = require('node:path');
const { textoAbi, uint } = require('./abi.cjs');

const SEL = Object.freeze({ symbol: '0x95d89b41', decimals: '0x313ce567', name: '0x06fdde03' });

function cargarConocidos(archivo = path.join(__dirname, '..', '..', 'onchain-core', 'validacion', 'datos', 'stables-conocidas.json')) {
  const m = new Map(); try { for (const s of JSON.parse(fs.readFileSync(archivo, 'utf8')).stables || []) m.set(s.network + '|' + String(s.address).toLowerCase(), s); } catch { /* sin lista: nada queda «verificado» */ }
  return m;
}

function crearTokens({ rpc, conocidos = cargarConocidos() }) {
  const cache = new Map();
  async function info(red, contrato) {
    const c = String(contrato).toLowerCase(), k = red + '|' + c; if (cache.has(k)) return cache.get(k);
    const p = (async () => {
      const [s, d] = await Promise.all([rpc.call(red, c, SEL.symbol), rpc.call(red, c, SEL.decimals)]);
      const simbolo = s.ok ? textoAbi(s.resultado) : null, dec = d.ok && typeof d.resultado === 'string' && /^0x[0-9a-fA-F]{64}$/.test(d.resultado) ? Number(uint(d.resultado.slice(2))) : null;
      const kn = conocidos.get(k);
      return { contrato: c, red, simbolo_reportado: simbolo, decimales: dec, identificado_por_contrato: kn ? kn.base : null, verificado_por_contrato: !!kn, nota: kn ? `contrato verificado de ${kn.base}` : 'símbolo reportado por el propio contrato: no verificado (puede ser un imitador)' };
    })();
    cache.set(k, p); return p;
  }
  return { info, conocidos };
}
module.exports = { crearTokens, cargarConocidos };

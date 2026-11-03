'use strict';
// Precio histórico de un activo (DefiLlama, gratuito): sirve SOLO para dar un orden de magnitud en dólares. Es una ESTIMACIÓN con una fuente: la cantidad en la unidad del activo es el dato exacto.
// Se pide por «coingecko:<id>» (moneda nativa) o «<red>:<contrato>» (token). Si no hay precio, se dice; nunca se inventa.
const NATIVOS = Object.freeze({ ETH: 'coingecko:ethereum', BTC: 'coingecko:bitcoin', POL: 'coingecko:polygon-ecosystem-token', AVAX: 'coingecko:avalanche-2', BNB: 'coingecko:binancecoin', TRX: 'coingecko:tron' });
const REDES_LLAMA = Object.freeze({ ethereum: 'ethereum', polygon: 'polygon', arbitrum: 'arbitrum', optimism: 'optimism', base: 'base', avalanche: 'avax', bnb: 'bsc', tron: 'tron' });

async function precioHistorico(http, { activo, red = null, utc }) {
  const consultado = new Date().toISOString(), ms = Date.parse(utc);
  const falla = error => ({ ok: false, activo: String(activo), utc_pedido: utc, consultado_utc: consultado, error });
  if (!Number.isFinite(ms)) return falla('la fecha no es válida (usa UTC ISO)');
  let moneda = null;
  if (typeof activo === 'string' && NATIVOS[activo.toUpperCase()]) moneda = NATIVOS[activo.toUpperCase()];
  else if (typeof activo === 'string' && /^0x[0-9a-fA-F]{40}$/.test(activo) && REDES_LLAMA[red]) moneda = REDES_LLAMA[red] + ':' + activo.toLowerCase();
  if (!moneda) return falla('activo no reconocido: usa ETH, BTC, POL, AVAX, BNB, TRX o un contrato con su red');
  const ts = Math.floor(ms / 1000);
  try {
    const r = await http({ url: `https://coins.llama.fi/prices/historical/${ts}/${moneda}`, method: 'GET', timeoutMs: 15000 });
    const c = r.json && r.json.coins && r.json.coins[moneda];
    if (r.status !== 200 || !c || !Number.isFinite(c.price)) return { ...falla(r.status === 200 ? 'DefiLlama no tiene precio de ese activo en esa fecha' : 'DefiLlama contestó HTTP ' + r.status), crudo: JSON.stringify({ consultado_utc: consultado, url_moneda: moneda, ts, status: r.status, respuesta: r.json }) };
    const dato = Number.isFinite(c.timestamp) ? new Date(c.timestamp * 1000).toISOString() : null;
    return { ok: true, activo: String(activo), moneda, utc_pedido: utc, utc_dato: dato || new Date(ms).toISOString(), precio_usd: c.price, confianza_fuente: c.confidence ?? null, consultado_utc: consultado, crudo: JSON.stringify({ consultado_utc: consultado, moneda, ts, status: r.status, respuesta: r.json }) };
  } catch (e) { return falla('no se pudo consultar DefiLlama: ' + (e.codigo || e.message)); }
}
module.exports = { precioHistorico, NATIVOS };

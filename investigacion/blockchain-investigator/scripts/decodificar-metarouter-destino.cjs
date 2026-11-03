'use strict';
// Segundo paso de la decodificación del enrutador de Symbiosis (MetaRouterGateway): el evento del portal solo dice que el dinero pasa a la cadena propia de Symbiosis (13863860), que es un paso intermedio.
// La cadena FINAL está en los datos de la propia llamada: metaRoute → otherSideCalldata = metaSynthesize(...) → finalCalldata = metaBurnSyntheticToken(...), cuyo campo chainID es la cadena de destino.
// Se decodifica la estructura (no se busca a ciegas): si alguna pieza no cuadra con la forma esperada, esa transacción se anota como «no decodificable» con el motivo. Solo lectura (nodo público de TRON).
// Uso: node decodificar-metarouter-destino.cjs <carpeta-del-tramo>   (necesita metarouter-resumen.json de decodificar-metarouter.cjs)  → <tramo>/metarouter-destino.json (reanudable) y metarouter-destino-resumen.json
const fs = require('node:fs'); const path = require('node:path');
const dir = process.argv[2]; if (!dir) { console.error('uso: node decodificar-metarouter-destino.cjs <carpeta-del-tramo>'); process.exit(1); }
const NODO = process.env.NODO_TRON || 'https://tron-rpc.publicnode.com'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const SEL = { metaRoute: 'a11b1198', metaSynthesize: 'ce654c17', metaBurn: 'e66bb550' };
const CADENAS = { 1: 'Ethereum', 10: 'Optimism', 25: 'Cronos', 30: 'Rootstock', 40: 'Telos', 56: 'BNB Chain', 100: 'Gnosis', 130: 'Unichain', 137: 'Polygon', 146: 'Sonic', 169: 'Manta', 204: 'opBNB', 223: 'B² Network', 252: 'Fraxtal', 288: 'Boba', 324: 'zkSync Era', 388: 'Cronos zkEVM', 999: 'HyperEVM', 1088: 'Metis', 1329: 'Sei', 1868: 'Soneium', 2345: 'Goat', 2741: 'Abstract', 4200: 'Merlin', 5000: 'Mantle', 5426: 'Solana', 8453: 'Base', 33139: 'ApeChain', 34443: 'Mode', 42161: 'Arbitrum', 43114: 'Avalanche', 59144: 'Linea', 80094: 'Berachain', 85918: 'TON', 167000: 'Taiko', 534352: 'Scroll', 728126428: 'TRON', 3652501241: 'Bitcoin', 13863860: 'Symbiosis (cadena intermedia)' };
const num = h => BigInt('0x' + h);
function piezas(datos) {            // datos = hex de la llamada, con selector
  const sel = datos.slice(0, 8); const b = datos.slice(8); const W = i => b.slice(i * 64, i * 64 + 64); return { sel, b, W };
}
function bytesEn(P, tupla, campo) {  // bytes dinámicos de un campo de una tupla (offset relativo al inicio de la tupla)
  const off = Number(num(P.W(tupla + campo))) / 32; const base = tupla + off; const len = Number(num(P.W(base))); if (!(len > 0 && len < 200000)) throw new Error('longitud de bytes fuera de rango'); return P.b.slice((base + 1) * 64, (base + 1) * 64 + len * 2);
}
function decodificar(datos) {
  const P1 = piezas(datos); if (P1.sel !== SEL.metaRoute) throw new Error('no es metaRoute (' + P1.sel + ')');
  const t1 = Number(num(P1.W(0))) / 32; const lado = bytesEn(P1, t1, 8);
  const P2 = piezas(lado); if (P2.sel !== SEL.metaSynthesize) throw new Error('otherSideCalldata no es metaSynthesize (' + P2.sel + ')');
  const t2 = Number(num(P2.W(0))) / 32; const hub = Number(num(P2.W(t2 + 7))); const fin = bytesEn(P2, t2, 12);
  const P3 = piezas(fin); if (P3.sel !== SEL.metaBurn) throw new Error('finalCalldata no es metaBurnSyntheticToken (' + P3.sel + ')');
  const t3 = Number(num(P3.W(0))) / 32; const chainID = num(P3.W(t3 + 12)); const dir20 = i => '0x' + P3.W(t3 + i).slice(24);
  return { cadenaIntermedia: hub, cadenaFinalId: chainID <= 2n ** 53n ? Number(chainID) : chainID.toString(), importeSintetico: Number(num(P3.W(t3 + 1))) / 1e6, comision: Number(num(P3.W(t3 + 0))) / 1e6, contratoDestino: dir20(8), receptorReembolso: dir20(11), clienteId: Buffer.from(P3.W(t3 + 13), 'hex').toString('latin1').replace(/\0+$/, '') };
}
async function leer(tx) { for (let i = 0; i < 6; i++) { try { const r = await fetch(NODO + '/wallet/gettransactionbyid', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: tx }), signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } const j = await r.json(); const c = j && j.raw_data && j.raw_data.contract && j.raw_data.contract[0]; if (!c) { await sleep(1000 * (i + 1)); continue; } return c.parameter.value.data || null; } catch { await sleep(1000 * (i + 1)); } } return undefined; }
(async () => {
  const R = JSON.parse(fs.readFileSync(path.join(dir, 'metarouter-resumen.json'), 'utf8')); const envios = new Map(); for (const f of R.filas) envios.set(f.tx, f);
  const out = path.join(dir, 'metarouter-destino.json'); let S = {}; try { S = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* primera vez */ }
  const cola = [...envios.keys()].filter(t => !S[t] || S[t].error === 'sin lectura'); let n = 0; console.log('envíos', envios.size, '| por leer', cola.length);
  async function trab() { while (cola.length) { const tx = cola.shift(); const d = await leer(tx); if (d === undefined) S[tx] = { error: 'sin lectura' }; else if (!d) S[tx] = { error: 'la transacción no lleva datos' }; else { try { S[tx] = decodificar(d); } catch (e) { S[tx] = { error: 'no decodificable: ' + e.message }; } } await sleep(60); if (++n % 200 === 0) { fs.writeFileSync(out, JSON.stringify(S)); console.log('  …', n); } } }
  await Promise.all([trab(), trab(), trab()]); fs.writeFileSync(out, JSON.stringify(S));
  const porCadena = {}; let ok = 0, err = 0; const errores = {};
  for (const [tx, f] of envios) { const d = S[tx]; if (!d || d.error) { err++; const k = (d && d.error) || 'sin dato'; errores[k] = (errores[k] || 0) + 1; continue; } ok++; const nombre = CADENAS[d.cadenaFinalId] || 'cadena ' + d.cadenaFinalId; const x = porCadena[nombre] || (porCadena[nombre] = { n: 0, enviadoUsd: 0, remitentes: new Set() }); x.n++; x.enviadoUsd += f.v; x.remitentes.add(f.de); }
  const resumen = { envios: envios.size, decodificados: ok, noDecodificados: err, errores, porCadena: Object.fromEntries(Object.entries(porCadena).map(([k, v]) => [k, { n: v.n, enviadoUsd: Math.round(v.enviadoUsd), remitentes: v.remitentes.size }])), leidoEn: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, 'metarouter-destino-resumen.json'), JSON.stringify(resumen, null, 1));
  console.log('decodificados', ok, '| no decodificados', err, JSON.stringify(errores)); for (const [k, v] of Object.entries(resumen.porCadena).sort((a, b) => b[1].enviadoUsd - a[1].enviadoUsd)) console.log('  ', k.padEnd(28), String(v.n).padStart(5), 'envíos', String(v.enviadoUsd).padStart(12), '$', v.remitentes, 'remitentes');
})();

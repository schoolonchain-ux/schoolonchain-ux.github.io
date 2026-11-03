'use strict';
// Para cada envío al enrutador de Symbiosis pregunta a la API pública de Symbiosis qué llegó a la cadena de destino: transacción de llegada, receptor, activo, importe y hora.
// Se contrasta con la cadena de destino decodificada de la propia llamada (decodificar-metarouter-destino.cjs). Solo lectura.
// Uso: node symbiosis-llegadas.cjs <carpeta-del-tramo>   → <tramo>/symbiosis-llegadas.json (reanudable) y symbiosis-llegadas-resumen.json
const fs = require('node:fs'); const path = require('node:path');
const dir = process.argv[2]; if (!dir) { console.error('uso: node symbiosis-llegadas.cjs <carpeta-del-tramo>'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(tx) { for (let i = 0; i < 6; i++) { try { const r = await fetch('https://api.symbiosis.finance/crosschain/v1/tx/728126428/' + tx, { signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(3000 * (i + 1)); continue; } if (r.status === 404) return { sinDato: true, http: 404 }; const j = await r.json(); return j; } catch { await sleep(1500 * (i + 1)); } } return { error: 'sin lectura' }; }
(async () => {
  const R = JSON.parse(fs.readFileSync(path.join(dir, 'metarouter-resumen.json'), 'utf8')); const D = JSON.parse(fs.readFileSync(path.join(dir, 'metarouter-destino.json'), 'utf8'));
  const envios = new Map(); for (const f of R.filas) envios.set(f.tx, f);
  const out = path.join(dir, 'symbiosis-llegadas.json'); let S = {}; try { S = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* primera vez */ }
  const cola = [...envios.keys()].filter(t => !S[t] || S[t].error); let n = 0; console.log('envíos', envios.size, '| por consultar', cola.length);
  async function trab() { while (cola.length) { const tx = cola.shift(); const j = await api(tx); if (j.error) S[tx] = { error: j.error }; else if (j.sinDato) S[tx] = { sinDato: true }; else S[tx] = { estado: j.status && j.status.text, entrada: j.txIn && { cadena: j.txIn.chainId, remitente: j.txIn.address, activo: j.txIn.tokenAmount && j.txIn.tokenAmount.symbol, importe: j.txIn.tokenAmount && +j.txIn.tokenAmount.amount / 10 ** j.txIn.tokenAmount.decimals, hora: j.txIn.time }, llegada: j.tx && { cadena: j.tx.chainId, tx: j.tx.hash, receptor: j.tx.address, activo: j.tx.tokenAmount && j.tx.tokenAmount.symbol, contratoActivo: j.tx.tokenAmount && j.tx.tokenAmount.address, importe: j.tx.tokenAmount && +j.tx.tokenAmount.amount / 10 ** j.tx.tokenAmount.decimals, precioUsd: j.tx.tokenAmount && j.tx.tokenAmount.priceUsd, hora: j.tx.time } }; await sleep(220); if (++n % 100 === 0) { fs.writeFileSync(out, JSON.stringify(S)); console.log('  …', n); } } }
  await Promise.all([trab(), trab()]); fs.writeFileSync(out, JSON.stringify(S));
  let ok = 0, sin = 0, dif = 0; const porCadena = {}; const receptores = new Set(); const estados = {};
  for (const [tx, f] of envios) { const s = S[tx]; if (!s || s.error || s.sinDato || !s.llegada) { sin++; continue; } ok++; estados[s.estado] = (estados[s.estado] || 0) + 1; const d = D[tx]; if (d && !d.error && String(d.cadenaFinalId) !== String(s.llegada.cadena)) dif++; if (d && !d.error && d.contratoDestino.toLowerCase() !== String(s.llegada.receptor).toLowerCase()) dif++;
    const k = s.llegada.cadena + ' ' + s.llegada.activo; const x = porCadena[k] || (porCadena[k] = { n: 0, importe: 0, usd: 0 }); x.n++; x.importe += s.llegada.importe; x.usd += s.llegada.importe * (s.llegada.precioUsd || 0); receptores.add(s.llegada.cadena + ':' + String(s.llegada.receptor).toLowerCase()); }
  const resumen = { envios: envios.size, conLlegada: ok, sinLlegada: sin, estados, discrepanciasConLaLlamada: dif, receptoresDistintos: receptores.size, porCadenaYActivo: porCadena, leidoEn: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, 'symbiosis-llegadas-resumen.json'), JSON.stringify(resumen, null, 1)); console.log(JSON.stringify(resumen, null, 1));
})();

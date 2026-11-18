'use strict';
// Solo lectura (TronGrid /wallet/getdelegatedresourcev2). Cuánto TRX de energía tiene delegado en la lectura la cuenta de energía (TEF9ZV…) a TU4vEruv… (etiqueta de TronScan «Bybit» en la lectura del 5-nov).
// Uso: node k2-energia-a-bybit.cjs <salida.json>
const fs = require('node:fs');
const DE = 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', A = 'TU4vEruvZwLLkSfV9bNw12EJTPvNr7Pvaa';
(async () => {
  let j = null;
  for (let i = 0; i < 8 && !(j && Array.isArray(j.delegatedResource) && j.delegatedResource.length && j.delegatedResource.every((d) => d.from === DE && d.to === A)); i++) { if (i) await new Promise((r) => setTimeout(r, 2500)); try { const r = await fetch('https://api.trongrid.io/wallet/getdelegatedresourcev2', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fromAddress: DE, toAddress: A, visible: true }) }); j = await r.json(); } catch (e) { j = null; } }
  if (!(j && Array.isArray(j.delegatedResource) && j.delegatedResource.length)) throw new Error('sin respuesta válida (una respuesta vacía no es «cero delegado»)');
  const out = { version: 1, leidoEn: new Date().toISOString(), fuente: 'TronGrid /wallet/getdelegatedresourcev2', de: DE, a: A, energiaTrx: j.delegatedResource.reduce((s, d) => s + (d.frozen_balance_for_energy || 0), 0) / 1e6, anchoTrx: j.delegatedResource.reduce((s, d) => s + (d.frozen_balance_for_bandwidth || 0), 0) / 1e6, el5Nov: { energiaTrx: 100000000, origen: 'investigacion-energia-2026-11-05/a2-a4-a5/receptores-81.json' }, bruto: j };
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1)); console.log(out.energiaTrx, out.anchoTrx);
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });

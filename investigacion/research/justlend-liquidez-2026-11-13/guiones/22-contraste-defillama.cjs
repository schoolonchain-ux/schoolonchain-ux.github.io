'use strict';
const L = require('./lib.cjs'); L.usar('22-2026-11-13'); const path = require('node:path');
(async () => {
  const out = {}; for (const u of ['https://api.llama.fi/tvl/justlend', 'https://api.llama.fi/protocol/justlend']) { try { const r = await L.get(u); out[u] = u.endsWith('justlend') && u.includes('/tvl/') ? r : { nombre: r.name, tvlActual: (r.currentChainTvls || null), tokensEnLiquidez: r.tokensInUsd ? r.tokensInUsd.slice(-1)[0] : null, categoria: r.category, descripcion: (r.description || '').slice(0, 200) }; } catch (e) { out[u] = 'ERROR ' + e.message; } }
  console.log(JSON.stringify(out, null, 1).slice(0, 3000));
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '22-contraste-defillama.json'), { leido: new Date().toISOString(), out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });

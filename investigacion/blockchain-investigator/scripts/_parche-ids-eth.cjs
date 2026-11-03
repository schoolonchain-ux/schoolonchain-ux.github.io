'use strict';
// Parche (3-nov): los movimientos de Ethereum del libro se identificaban por su POSICIÓN en el historial de cada billetera; la misma transferencia aparece en el historial del que envía y en el del que recibe
// con posiciones distintas y entraba dos veces. Ahora el índice es el número de ocurrencia de (hash, origen, destino, importe[, traceId/logIndex]) dentro del historial, igual en ambos historiales.
const fs = require('fs'); const f = 'C:/EquipoIA/blockchain-investigator/src/libro-mayor/desde-eth.cjs'; let s = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('no encontrado: ' + a.slice(0, 80)); if (s.split(a).length !== 2) throw new Error('aparece más de una vez: ' + a.slice(0, 80)); s = s.replace(a, b); };
rep("const base = { cadena: 'ethereum', estado: 'VERIFICADO', fuente: 'Etherscan v2 ' + f };",
  "const occ = new Map(); const oc = k => { const c = occ.get(k) || 0; occ.set(k, c + 1); return c; };   // ocurrencia dentro de este historial: dos transferencias idénticas en una misma transacción siguen siendo dos; la misma vista desde otra billetera sale igual\n    const base = { cadena: 'ethereum', estado: 'VERIFICADO', fuente: 'Etherscan v2 ' + f };");
rep("h.tx.forEach((x, i) => { if (x.isError === '1' || !(Number(x.value) > 0) || !x.to) return; if (Number(x.value) / 1e18 < MIN_ETH) { const k = x.hash + 'n' + i;",
  "h.tx.forEach(x => { if (x.isError === '1' || !(Number(x.value) > 0) || !x.to) return; const idx = 'n' + oc('n|' + x.hash + '|' + x.from.toLowerCase() + '|' + x.to.toLowerCase() + '|' + x.value); if (Number(x.value) / 1e18 < MIN_ETH) { const k = x.hash + idx;");
rep("indice: 'n' + i, activo: 'ETH'", "indice: idx, activo: 'ETH'");
rep("h.internas.forEach((x, i) => { if (x.isError === '1' || !(Number(x.value) > 0) || !x.to) return; if (Number(x.value) / 1e18 < MIN_ETH) { const k = x.hash + 'i' + i + (x.traceId || '');",
  "h.internas.forEach(x => { if (x.isError === '1' || !(Number(x.value) > 0) || !x.to) return; const idx = 'i' + oc('i|' + x.hash + '|' + x.from.toLowerCase() + '|' + x.to.toLowerCase() + '|' + x.value + '|' + (x.traceId || '')) + ':' + (x.traceId || ''); if (Number(x.value) / 1e18 < MIN_ETH) { const k = x.hash + idx;");
rep("indice: 'i' + i + ':' + (x.traceId || ''), activo: 'ETH'", "indice: idx, activo: 'ETH'");
rep("h.tokens.forEach((x, i) => { const g = GENUINOS[x.contractAddress.toLowerCase()]; if (!g) return; const v = Number(x.value) / Math.pow(10, g[1]); if (!(v > 0)) return;",
  "h.tokens.forEach(x => { const g = GENUINOS[x.contractAddress.toLowerCase()]; if (!g) return; const v = Number(x.value) / Math.pow(10, g[1]); if (!(v > 0)) return; const idx = 't' + oc('t|' + x.hash + '|' + x.contractAddress.toLowerCase() + '|' + x.from.toLowerCase() + '|' + x.to.toLowerCase() + '|' + x.value + '|' + (x.logIndex || '')) + ':' + (x.logIndex || '');");
rep("indice: 't' + i + ':' + (x.logIndex || ''), activo: g[0]", "indice: idx, activo: g[0]");
fs.writeFileSync(f, s); console.log('parche aplicado');

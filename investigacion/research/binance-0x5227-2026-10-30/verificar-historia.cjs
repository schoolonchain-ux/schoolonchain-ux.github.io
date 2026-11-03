'use strict';
// Comprueba que cada hash (64 hex) y cada dirección completa citada en la historia consolidada aparece en los datos guardados (tron/*.json|csv) o en los vigilantes.
const fs = require('fs'), path = require('path');
const md = fs.readFileSync(process.argv[2] || 'C:/EquipoIA/docs/HISTORIA-TRON-TRAS-EL-ROBO-BINANCE-2026-10-31.md', 'utf8');
const hashes = [...new Set(md.match(/\b[0-9a-f]{64}\b/g) || [])], tr = [...new Set(md.match(/\bT[1-9A-HJ-NP-Za-km-z]{33}\b/g) || [])], evm = [...new Set((md.match(/\b0x[0-9a-fA-F]{40}\b/g) || []).map(s => s.toLowerCase()))];
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; let corpus = '';
for (const f of fs.readdirSync(D)) { try { corpus += fs.readFileSync(D + f, 'utf8').toLowerCase() + '\n'; } catch {} }
const extra = ['C:/EquipoIA/tron-salidas-watch/state/estado.json', 'C:/EquipoIA/tron-salidas-watch/state/eventos.jsonl', 'C:/EquipoIA/eth-salidas-watch/state/eventos.jsonl', 'C:/EquipoIA/docs/INFORME-COMPLETO-ROBO-BINANCE-2026-10-30.md', 'C:/EquipoIA/docs/INFORME-TRAZABILIDAD-TRX-ROBO-BINANCE-2026-10-31.md'];
for (const f of extra) { try { corpus += fs.readFileSync(f, 'utf8').toLowerCase() + '\n'; } catch {} }
const sinH = hashes.filter(h => !corpus.includes(h)), sinT = tr.filter(a => !corpus.includes(a.toLowerCase())), sinE = evm.filter(a => !corpus.includes(a));
console.log('hashes', hashes.length, '| sin hallar', sinH.length, sinH); console.log('direcciones TRON completas', tr.length, '| sin hallar', sinT.length, sinT); console.log('direcciones EVM completas', evm.length, '| sin hallar', sinE.length, sinE);

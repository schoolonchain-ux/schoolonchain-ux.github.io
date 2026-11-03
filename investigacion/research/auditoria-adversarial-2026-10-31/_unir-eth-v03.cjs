'use strict';
// Une los nodos de Ethereum de tramo5-v02 y tramo6-v03 en tramo5-v03/eth-adelante-v2.json: los que están en los dos se quedan con la lectura MÁS RECIENTE (la del tramo 6, 3-nov); los demás se añaden.
// Después hay que ejecutar rastrear-eth-adelante.cjs con las carpetas tramo5-v03 y tramo6-v03 (reanudable: no vuelve a leer los nodos ya guardados).
const fs = require('fs'); const D = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const a = JSON.parse(fs.readFileSync(D + 'tramo5-v02/eth-adelante-v2.json', 'utf8')), b = JSON.parse(fs.readFileSync(D + 'tramo6-v03/eth-adelante-v2.json', 'utf8'));
const m = JSON.parse(JSON.stringify(a)); let nuevos = 0, reemp = 0;
for (const [k, v] of Object.entries(b.nodos)) { if (!(k in m.nodos)) { m.nodos[k] = v; nuevos++; } else if (JSON.stringify(m.nodos[k]) !== JSON.stringify(v)) { m.nodos[k] = v; reemp++; } }
m.ficha = m.ficha || {}; for (const [k, v] of Object.entries(b.ficha || {})) if (!(k in m.ficha)) m.ficha[k] = v;
fs.writeFileSync(D + 'tramo5-v03/eth-adelante-v2.json', JSON.stringify(m));
fs.writeFileSync(D + 'tramo5-v03/eth-adelante-NOTA.txt', 'eth-adelante-v2.json = nodos de tramo5-v02 + nodos de tramo6-v03 (' + reemp + ' estaban en los dos y se sustituyen por la lectura más reciente, 3-nov 09:3x UTC; ' + nuevos + ' son nuevos). Después se ejecutó rastrear-eth-adelante.cjs con las semillas de tramo5-v03 y tramo6-v03.\n');
console.log('nodos', Object.keys(m.nodos).length, '| nuevos', nuevos, '| sustituidos por lectura más reciente', reemp);

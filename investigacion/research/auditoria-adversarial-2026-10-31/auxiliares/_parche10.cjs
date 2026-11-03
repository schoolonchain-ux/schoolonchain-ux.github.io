'use strict';
// Parche 10 (1-nov, Codex R6-03..R6-06): textos y un fallo de la tabla del tramo 3.
const fs = require('fs'); const base = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/'; const fallos = [];
function P(f, pares) { let s = fs.readFileSync(base + f, 'utf8'); for (const [a, b] of pares) { const k = s.split(a).length - 1; if (k !== 1) { fallos.push(f + ' (' + k + ') · ' + a.slice(0, 80)); continue; } s = s.replace(a, () => b); } fs.writeFileSync(base + f, s); }
P('reproducir-tramo2.cjs', [["SIN red y SIN escribir en disco\n// (las escrituras se capturan en memoria)", "SIN red y sin escribir los ficheros del análisis original\n// (las escrituras del guion original se capturan en memoria). Solo escribe su propio resultado: resultados/reproduccion-tramo2.json (y crea la carpeta resultados/ si no existe)"]]);
P('objeciones.cjs', [["sin red y sin escribir en disco): 0 llamadas de red", "sin red; el guion original no escribe nada, solo se guarda resultados/reproduccion-tramo2.json): 0 llamadas de red"]]);
P('figuras/g3-blanqueo-tron.cjs', [["title: 'TZG47zhb8k… · el mayor destino final'", "title: 'TZG47zhb8k… · mayor nodo receptor observado'"]]);
P('armar-entregables.cjs', [
  ["l.map(x => ({ clase, ...x }))", "l.map(x => ({ ...x, clase }))"],
  ["el dinero acaba en: nodos de servicio", "el rastreo registra llegadas a: nodos de servicio"],
  ["' (' + fm(34302218) + ' en las 5 billeteras del 11-oct y '", "' (' + fm(T3FIN.filter(x => CINCO11.includes(x.k)).reduce((a, x) => a + x.v, 0)) + ' en las 5 billeteras del 11-oct y '"],
  ["const T3SUMA =", "const CINCO11 = ['TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM', 'TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL', 'TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW', 'THPaGKe6aZkUcNht24hcscZPLwtcJAbpun', 'TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B'];\nconst T3SUMA ="],
  ["Los nodos que absorben 46,6 M$ (el grupo del 11-oct y <code>TM8uy…</code>) ya eran destinos del segundo tramo: no sumo", "Los nodos que absorben ' + fm(T3.totales.nodo) + ' M$ (el grupo del 11-oct y <code>TM8uy…</code>) son destinos terminales del primer tramo y puntos de partida (semillas) del segundo: no sumo"],
]);
console.log(fallos.length ? 'NO ENCONTRADOS:\n' + fallos.join('\n') : 'ok');

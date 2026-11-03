'use strict';
// Añade (o sustituye) la entrada v0.6 en state/informe-trazabilidad/novedades.json
const fs = require('fs'); const f = 'C:/EquipoIA/blockchain-investigator/state/informe-trazabilidad/novedades.json';
const N = JSON.parse(fs.readFileSync(f, 'utf8')).filter(x => x.version !== 'v0.6');
N.push({ version: 'v0.6', fecha: '2026-11-03', cambios: [
  'DECISIÓN DEL PROPIETARIO: las dos vías de pureza (actual y ciclo) se conservan SIEMPRE, con su método, su evidencia y sus resultados. Ninguna sustituye a la otra; un método nuevo se añade como una vía más.',
  'NUEVO · Evidencia versionada e inmutable en research/auditoria-adversarial-2026-10-31/pureza-dos-vias/2026-11-03-v1/: METODO.md (definiciones, fórmulas, cómo reproducir, límites), MANIFIESTO.json (SHA-256 de entradas, resultados, registros y guiones), copias de los 12 resultados (2 tramos × 3 vías × resultado y aristas), registros de las seis ejecuciones, copia exacta del código, tabla de comparación y la revisión independiente que motivó la segunda vía. Nunca se sobrescribe: si algo cambia, se guarda una versión nueva (scripts/conservar-dos-vias.cjs).',
  'NUEVO · Comprobación de calidad nº 9: las dos vías están calculadas en los dos tramos y sus resultados coinciden con la versión guardada. FALLA si falta una vía, si un resultado vivo cambió sin guardar versión o si una copia guardada no coincide con su hash; AVISA si cambió una entrada o un guion. Probado: quitar un resultado o alterarlo la hace fallar; al restaurarlo vuelve a OK.',
  'Reproducibilidad: las seis ejecuciones (2 tramos × 3 vías) se repitieron con el código final y dan exactamente los mismos resultados que las anteriores.',
  'Las cifras del informe siguen usando la vía actual; la comparación está en la sección 17. Ninguna vía está revisada por una fuente externa.'
] });
fs.writeFileSync(f, JSON.stringify(N, null, 1)); console.log('novedades:', N.map(x => x.version).join(', '));

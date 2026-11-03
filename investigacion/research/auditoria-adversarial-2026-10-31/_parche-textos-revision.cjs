'use strict';
// Correcciones de redacción y de valores por defecto tras la revisión independiente del 3-nov (Claude, secciones A y B). Cada reemplazo exige que el texto exista una sola vez.
const fs = require('fs');
function parchear(f, pares) { let s = fs.readFileSync(f, 'utf8'); for (const [a, b] of pares) { if (!s.includes(a)) throw new Error(f + ': no encontrado: ' + a.slice(0, 70)); if (s.split(a).length !== 2) throw new Error(f + ': aparece más de una vez: ' + a.slice(0, 70)); s = s.replace(a, b); } fs.writeFileSync(f, s); }
const B = 'C:/EquipoIA/blockchain-investigator/'; const A = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
// 1) Retenido: en el tramo 6 es «a la hora de la foto», no «hoy»
parchear(B + 'scripts/informe-trazabilidad.cjs', [
  ["'Unidades que quedaron en cada billetera (entró − salió) × su parte atribuida, valoradas al precio de hoy. El saldo real de cada billetera se lee aparte (sección 8).'", "'Unidades que quedaron en cada billetera (entró − salió) × su parte atribuida, valoradas al precio de hoy. OJO con la fase «antes de la foto» (tramo 6): su retenido es lo que había en cada billetera A LA HORA DE LA FOTO (30-oct 22:40 UTC), no hoy, y de lo que estaba en tránsito en ese momento no se sigue su destino posterior (revisión del 3-nov: la mayor parte de esos ~3,4 M$ ya había salido de esas billeteras antes del 2-nov). El saldo real de cada billetera se lee aparte (sección 8).'"],
  ["T5 = process.env.INFORME_T5 || (A + 'tramo5'), T6 = process.env.INFORME_T6 || (A + 'tramo6');", "T5 = process.env.INFORME_T5 || (A + 'tramo5-v03'), T6 = process.env.INFORME_T6 || (A + 'tramo6-v03');   // por defecto las copias congeladas corregidas (las carpetas de trabajo tramo5/ y tramo6/ tienen el corte de lectura y reproducirían el fallo del tramo 6)"]]);
// 2) el análisis del tramo 6 usa por defecto la copia corregida y sus comentarios dejan de mentir
parchear(A + 'analisis-tramo6.cjs', [
  ["const OUT = process.env.TRAMO_DIR || 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo6/';", "const OUT = process.env.TRAMO_DIR || 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo6-v03/';"],
  ["// TRAMO 4 (auditoría 2-nov): análisis del rastreo a fondo de lo repartido por TRBdWq… después de la foto; semilla TRBdWq… con pureza 1, corte T3.", "// TRAMO 6 (auditoría 3-nov): análisis del rastreo a fondo de lo repartido por TRBdWq… ANTES de la foto (copia de analisis-tramo5.cjs); semilla TRBdWq… con pureza 1. El corte T3 de este tramo es la FOTO (30-oct 22:40 UTC), no la hora de lectura."],
  ["// foto común: 23:40 hora de Madrid del 30-oct; ninguna lectura empezó antes", "// corte de análisis de ESTE tramo (en tramo6-v03/t4.json = la foto, 30-oct 22:40 UTC; en tramo5 es la hora de lectura, 2-nov 09:23 UTC)"]]);
parchear(A + 'analisis-tramo5.cjs', [["// foto común: 23:40 hora de Madrid del 30-oct; ninguna lectura empezó antes", "// corte de análisis de ESTE tramo (en tramo5 es la hora de lectura, 2-nov 09:23 UTC; no es la foto: ver tramo6-v03/t4.json)"]]);
console.log('textos corregidos');

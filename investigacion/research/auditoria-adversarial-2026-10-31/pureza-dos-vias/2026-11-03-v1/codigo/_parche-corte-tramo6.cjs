'use strict';
// Corrige el corte del análisis del tramo 6: debe ser la hora de la foto (30-oct 22:40 UTC), no la hora de lectura (2-nov 09:23 UTC).
// 1) escribe tramo6-v03/t4.json con t3 = la foto (y conserva la hora de lectura en «lecturaHasta»); 2) hace que analisis-tramo6.cjs admita TRAMO_DIR y avise si la pureza no converge.
const fs = require('fs');
const FOTO = Date.UTC(2026, 9, 30, 22, 40, 0);
fs.writeFileSync('tramo6-v03/t4.json', JSON.stringify({
  t3: FOTO, iso: new Date(FOTO).toISOString(),
  nota: 'Corte de ANÁLISIS del tramo 6 = la foto (30-oct 22:40 UTC): solo cuenta lo ocurrido hasta esa hora, porque el tramo 6 es el reparto ANTERIOR a la foto. Antes tenía la hora de lectura (2-nov 09:23 UTC), lo que hacía contar de nuevo lo posterior a la foto, que ya está en el tramo 5.',
  lecturaHasta: '2026-11-02T09:23:00.033Z'
}));
let s = fs.readFileSync('analisis-tramo6.cjs', 'utf8');
const a1 = "const OUT = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo6/';";
const b1 = "const OUT = process.env.TRAMO_DIR || 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo6/';   // TRAMO_DIR: carpeta congelada donde leer y escribir (p. ej. tramo6-v03/)";
if (!s.includes(a1)) throw new Error('no se encontró OUT');
s = s.replace(a1, b1);
const a2 = 'for (let it = 0; it < 60; it++) {';
if (!s.includes(a2)) throw new Error('no se encontró el bucle de pureza');
s = s.replace(a2, 'let convergio = false; for (let it = 0; it < (+process.env.VUELTAS || 2000); it++) {');
const a3 = "console.log('pureza convergida en', it + 1, 'vueltas'); break; } }";
if (!s.includes(a3)) throw new Error('no se encontró el aviso de convergencia');
s = s.replace(a3, "console.log('pureza convergida en', it + 1, 'vueltas'); convergio = true; break; } } if (!convergio) console.log('AVISO: la pureza NO convergió; el resultado no es fiable');");
fs.writeFileSync('analisis-tramo6.cjs', s);
console.log('parche aplicado', s.includes('TRAMO_DIR'), s.includes('convergio'));

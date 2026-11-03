'use strict';
// Guarda una versión NUEVA de la evidencia de las dos vías de pureza (actual y ciclo; también la cota «diluida») para los tramos 5 y 6 congelados.
// Nunca sobrescribe: si lo vivo cambió, crea otra carpeta fecha-vN en research/auditoria-adversarial-2026-10-31/pureza-dos-vias/. Uso: node conservar-dos-vias.cjs ["nota de esta versión"]
const dv = require('../src/libro-mayor/dos-vias.cjs'); const A = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const tramos = [{ nombre: 'tramo5', dir: A + 'tramo5-v04', pref: 'tramo5' }, { nombre: 'tramo6', dir: A + 'tramo6-v03', pref: 'tramo6' }];
const r = dv.conservar(tramos, { nota: process.argv[2] || '' }); console.log(r.nueva ? 'versión nueva guardada: ' + r.version + ' (' + r.ficheros + ' resultados)' : 'sin cambios: lo vivo coincide con ' + r.version);
const v = dv.verificar(tramos); console.log('verificación:', v.estado, '-', v.detalle); process.exit(v.estado === 'FALLO' ? 1 : 0);

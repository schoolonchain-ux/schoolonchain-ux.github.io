'use strict';
// Solo lectura de ficheros locales. Compara la comprobación propia en la cadena (i1-posiciones-sunswap-v3.cjs, respuestas en bruto de TronGrid) con la foto de posiciones
// de V3 del informe «sun.io bajo el microscopio» (research/sunswap-2026-11-11/f3-v3/posiciones.json, 11-nov ~14:37 UTC): ¿mismas posiciones con liquidez, mismo titular, misma liquidez?
// Uso: node i2-comparar-con-el-informe.cjs <posiciones-informe.json> <i1-resultado.json> <i1-crudo.json> <salida.json>
const fs = require('node:fs');
const [pInf, pRes, pCrudo, pOut] = process.argv.slice(2);
if (!pOut) { console.error('Uso: node i2-comparar-con-el-informe.cjs <posiciones-informe.json> <i1-resultado.json> <i1-crudo.json> <salida.json>'); process.exit(1); }
const informe = JSON.parse(fs.readFileSync(pInf, 'utf8')).posiciones;
const res = JSON.parse(fs.readFileSync(pRes, 'utf8'));
const crudo = JSON.parse(fs.readFileSync(pCrudo, 'utf8'));
const liqHoy = {};
for (const r of crudo) if (r.fn === 'positions(uint256)') liqHoy[BigInt('0x' + r.param).toString()] = BigInt('0x' + r.respuesta.slice(7 * 64, 8 * 64)).toString();
const salida = { version: 1, nota: 'Comparación de la lectura propia en la cadena con la foto del informe. Liquidez en unidades del contrato (L), no en dólares.', leidoEn: res.leidoEn, cuentas: {} };
let todoIgual = true;
for (const [clave, c] of Object.entries(res.cuentas)) {
  const enInforme = informe.filter((x) => x.titular === c.direccion && x.liquidez !== '0').map((x) => +x.id).sort((a, b) => a - b);
  const detalle = c.idsConLiquidez.map((id) => { const f = informe.find((x) => x.id === String(id)); return { id, titularInforme: f ? f.titular : null, liquidezInforme: f ? f.liquidez : null, liquidezCadena: liqHoy[String(id)], igual: !!f && f.titular === c.direccion && f.liquidez === liqHoy[String(id)] }; });
  const mismasPosiciones = JSON.stringify(enInforme) === JSON.stringify(c.idsConLiquidez);
  const igual = mismasPosiciones && detalle.every((d) => d.igual); if (!igual) todoIgual = false;
  salida.cuentas[clave] = { direccion: c.direccion, posicionesInforme: enInforme, posicionesCadena: c.idsConLiquidez, mismasPosiciones, detalle, todoIgual: igual };
}
salida.todoIgual = todoIgual;
fs.writeFileSync(pOut, JSON.stringify(salida, null, 1));
console.log(JSON.stringify({ todoIgual, cuentas: Object.fromEntries(Object.entries(salida.cuentas).map(([k, v]) => [k, { posiciones: v.posicionesCadena.length, mismasPosiciones: v.mismasPosiciones, todoIgual: v.todoIgual }])) }));
if (!todoIgual) process.exit(2);

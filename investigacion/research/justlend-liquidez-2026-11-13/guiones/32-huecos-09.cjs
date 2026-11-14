'use strict';
// R1-/E8 de la revisión de Codex: ¿hubo lecturas fallidas o con código de error en la lectura de las 807 cuentas (09)? Mi script 09 seguía con lista vacía si getAssetsIn fallaba y no miraba el código de error de getAccountSnapshot.
// Aquí se reexaminan, desde las respuestas en bruto guardadas, TODAS las llamadas de esa sesión.
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs');
const dir = path.join(__dirname, 'raw', '09-2026-11-13'); const cont = { getAssetsIn: { total: 0, vacias: 0, sinResultado: 0 }, getAccountLiquidity: { total: 0, codigoDistintoDeCero: 0, sinResultado: 0 }, getAccountSnapshot: { total: 0, codigoDistintoDeCero: 0, sinResultado: 0, vacia: 0 } }; const codigos = {}; const ejemplos = [];
for (const f of fs.readdirSync(dir)) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); const fn = j.pedido && j.pedido.body && j.pedido.body.function_selector; if (!fn) continue; const nombre = fn.split('(')[0]; if (!cont[nombre]) continue; const c = cont[nombre]; c.total++;
  const r = j.respuesta; const hex = r && r.constant_result && r.constant_result[0];
  if (!r || !r.constant_result) { c.sinResultado++; if (ejemplos.length < 5) ejemplos.push(nombre + ' ' + f); continue; }
  if (!hex) { if (nombre === 'getAssetsIn') c.vacias++; else c.vacia = (c.vacia || 0) + 1; if (ejemplos.length < 5) ejemplos.push(nombre + ' vacía ' + f); continue; }
  if (nombre !== 'getAssetsIn') { const cod = BigInt('0x' + hex.slice(0, 64)); if (cod !== 0n) { c.codigoDistintoDeCero++; codigos[nombre + ':' + cod] = (codigos[nombre + ':' + cod] || 0) + 1; if (ejemplos.length < 8) ejemplos.push(nombre + ' código ' + cod + ' ' + f); } }
}
console.log(JSON.stringify(cont, null, 1)); console.log('códigos de error:', JSON.stringify(codigos)); console.log('ejemplos:', ejemplos);
console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '32-huecos-09.json'), { generado: new Date().toISOString(), contadores: cont, codigos, ejemplos }));

'use strict';
// Reproducción personal del segundo tramo: ejecuta el guion ORIGINAL traza-post-analisis.cjs con la misma caché, SIN red y sin escribir los ficheros del análisis original
// (las escrituras del guion original se capturan en memoria). Solo escribe su propio resultado: resultados/reproduccion-tramo2.json (y crea la carpeta resultados/ si no existe), y compara lo que produce con traza-post-resultado.json publicado. No modifica nada del original.
const fs = require('fs'), path = require('path'), Module = require('module');
const ORIG = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/';
const capturas = {};
const escrituraReal = fs.writeFileSync;
fs.writeFileSync = (f, d, ...r) => { capturas[String(f).replace(/\\/g, '/')] = typeof d === 'string' ? d : Buffer.from(d).toString('utf8'); };
let llamadasRed = 0;
global.fetch = async (u) => { llamadasRed++; throw new Error('SIN RED en esta reproducción: ' + u); };
// el guion usa createChainReader → su lector de contratos haría red; se bloquea igual (los remitentes ya constan en traza-post-escontrato.json)
const origLoad = Module._load;
Module._load = function (req, parent, isMain) { const m = origLoad.apply(this, arguments); return m; };
const log = console.log; const salida = []; console.log = (...a) => { salida.push(a.join(' ')); };
(async () => {
  try {
    require(ORIG + 'traza-post-analisis.cjs');
    await new Promise(r => setTimeout(r, 15000));   // el guion es asíncrono; sin red termina rápido
  } catch (e) { salida.push('EXCEPCIÓN: ' + e.message); }
  console.log = log;
  const clave = Object.keys(capturas).find(k => /traza-post-resultado\.json$/.test(k));
  if (!clave) { console.log('El guion no llegó a escribir traza-post-resultado.json. Salida:\n' + salida.slice(-15).join('\n')); process.exit(1); }
  const nuevo = JSON.parse(capturas[clave]); const pub = JSON.parse(fs.readFileSync(ORIG + 'tron/traza-post-resultado.json', 'utf8'));
  const cmp = (n, a, b) => console.log(n.padEnd(28), String(a).padStart(24), String(b).padStart(24), a === b || Math.abs(a - b) < 1e-6 ? 'IGUAL' : 'DIFERENTE');
  console.log('llamadas de red intentadas:', llamadasRed, '| escrituras capturadas (no hechas):', Object.keys(capturas).length);
  console.log('Campo'.padEnd(28), 'reproducido'.padStart(24), 'publicado'.padStart(24));
  for (const k of ['billeteras', 'nivelMax', 'fallidas', 'parciales', 'retenidoTainted', 'neutrales', 'continuan', 'polvo']) cmp(k, nuevo[k], pub[k]);
  for (const t of Object.keys(pub.totales)) cmp('totales.' + t, nuevo.totales[t], pub.totales[t]);
  let maxDifP = 0, nP = 0; for (const w of Object.keys(pub.pureza)) { nP++; maxDifP = Math.max(maxDifP, Math.abs((nuevo.pureza[w] ?? NaN) - pub.pureza[w])); }
  console.log('pureza: carteras comparadas', nP, '| diferencia máxima', maxDifP, '| claves solo en reproducido', Object.keys(nuevo.pureza).filter(w => !(w in pub.pureza)).length);
  const csvNuevo = Object.entries(capturas).filter(([k]) => /aristas-terminales/.test(k)).map(([k, v]) => k.split('/').pop() + ' (' + v.length + ' bytes)');
  console.log('otros ficheros que habría escrito:', Object.keys(capturas).map(k => k.split('/').pop()).join(', '));
  const casasN = nuevo.fin.casa.reduce((s, x) => s + x.v, 0), casasP = pub.fin.casa.reduce((s, x) => s + x.v, 0); cmp('casas (suma de fin.casa)', casasN, casasP);
  fs.mkdirSync(__dirname + '/resultados', { recursive: true });
  escrituraReal(__dirname + '/resultados/reproduccion-tramo2.json', JSON.stringify({ ejecutado: new Date().toISOString(), llamadasRed, totalesReproducido: nuevo.totales, totalesPublicado: pub.totales, retenido: [nuevo.retenidoTainted, pub.retenidoTainted], billeteras: [nuevo.billeteras, pub.billeteras], diferenciaMaximaPureza: maxDifP, carterasComparadas: nP }, null, 1));
})();

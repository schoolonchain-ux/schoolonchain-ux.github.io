'use strict';
// DECIDE si el fichero de liquidez recién calculado es VÁLIDO y si hay que PUBLICARLO. Solo lee; no escribe nada.
// Uso: node decidir.cjs <nuevo.json> [publicado.json]   (sin el segundo = no hay nada publicado todavía)
// Salida (una línea JSON): { publicar: bool, motivo: texto, problemas: [..], cambios: [..] }
//  1) VALIDEZ: si la lectura trae errores, faltan tokens o a un token que tenía mercado le sale ahora «sin mercado», NO se publica (se deja lo anterior y la web avisa de su antigüedad).
//  2) PUBLICAR cuando: no hay nada publicado; han pasado 2,5 h o más (así la web nunca pasa de ~3 h sin renovar); o cambia el veredicto («Sí / Caro / No») de algún token
//     para alguno de los importes habituales (10 mil, 100 mil, 1 M, 10 M $) y de los límites del selector (0,1 / 0,5 / 1 / 2 / 5 %) — pero no antes de 1,5 h desde la última publicación, para no llenar el historial de GitHub con cambios en el borde.
const fs = require('fs'); const LIQ = require('./interp.js'); const AQUI = __dirname.split(String.fromCharCode(92)).join('/') + '/';
const IMPORTES = [1e4, 1e5, 1e6, 1e7], UMBRALES = [0.1, 0.5, 1, 2, 5], HORAS_CAP = Number(process.env.LIQ_HORAS_CAP || 2.5), HORAS_MIN = Number(process.env.LIQ_HORAS_MIN || 1.5);
const leer = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const sin = t => t.sinMercado || !t.curva || !t.curva.length;
const veredictos = d => { const o = {}; for (const t of d.tokens) for (const u of UMBRALES) for (const v of IMPORTES) o[t.simbolo + ' · ' + v + ' $ · ' + u + ' %'] = sin(t) ? 'rojo' : LIQ.semaforo(LIQ.evaluar(t.curva, v), u, u * 4); return o; };
function decidir(nuevo, ant, ahora = Date.now()) {
  const problemas = [], esperados = leer(AQUI + 'tokens.json').tokens.map(t => t.simbolo);
  if (!nuevo || nuevo.version !== 1 || !Array.isArray(nuevo.tokens)) return { publicar: false, motivo: 'el fichero nuevo no tiene el formato esperado', problemas: ['formato'], cambios: [] };
  if ((nuevo.errores || []).length) problemas.push('la lectura de la cadena trae ' + nuevo.errores.length + ' error(es): ' + JSON.stringify(nuevo.errores[0]).slice(0, 160));
  for (const s of esperados) if (!nuevo.tokens.some(t => t.simbolo === s)) problemas.push('falta el token ' + s);
  for (const t of nuevo.tokens) if (!sin(t) && t.curva.length < 50) problemas.push(t.simbolo + ': curva incompleta (' + t.curva.length + ' puntos)');
  if (ant && Array.isArray(ant.tokens)) for (const a of ant.tokens) { const t = nuevo.tokens.find(x => x.simbolo === a.simbolo); if (t && !sin(a) && sin(t)) problemas.push(a.simbolo + ': tenía mercado y ahora sale «sin mercado»'); }
  if (!(Date.parse(nuevo.generado) > 0)) problemas.push('sin fecha de lectura');
  if (problemas.length) return { publicar: false, motivo: 'lectura no válida: no se publica y se deja lo anterior', problemas, cambios: [] };
  if (!ant) return { publicar: true, motivo: 'todavía no hay nada publicado', problemas: [], cambios: [] };
  const horas = (ahora - Date.parse(ant.generado)) / 36e5; const vn = veredictos(nuevo), va = veredictos(ant), cambios = [];
  for (const k of Object.keys(vn)) if (va[k] !== undefined && va[k] !== vn[k]) cambios.push(k + ': ' + va[k] + ' → ' + vn[k]);
  if (horas >= HORAS_CAP) return { publicar: true, motivo: 'han pasado ' + horas.toFixed(1) + ' h desde la última publicación', problemas: [], cambios: cambios.slice(0, 8) };
  if (cambios.length && horas >= HORAS_MIN) return { publicar: true, motivo: 'cambia el veredicto en ' + cambios.length + ' caso(s)', problemas: [], cambios: cambios.slice(0, 8) };
  return { publicar: false, motivo: cambios.length ? 'hay ' + cambios.length + ' cambio(s) de veredicto pero se publicó hace solo ' + horas.toFixed(1) + ' h' : 'sin cambios apreciables (última publicación hace ' + horas.toFixed(1) + ' h)', problemas: [], cambios: cambios.slice(0, 8) };
}
module.exports = { decidir, veredictos };
if (require.main === module) {
  const [nf, af] = process.argv.slice(2); if (!nf) { console.error('Uso: node decidir.cjs <nuevo.json> [publicado.json]'); process.exit(2); }
  let nuevo = null, ant = null; try { nuevo = leer(nf); } catch (e) { console.log(JSON.stringify({ publicar: false, motivo: 'no se pudo leer el fichero nuevo: ' + e.message.slice(0, 120), problemas: ['lectura'], cambios: [] })); process.exit(0); }
  if (af && fs.existsSync(af)) { try { ant = leer(af); } catch (e) { ant = null; } }
  console.log(JSON.stringify(decidir(nuevo, ant)));
}

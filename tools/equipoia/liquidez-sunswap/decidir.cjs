'use strict';
// DECIDE si el fichero de liquidez recién calculado es VÁLIDO y si hay que PUBLICARLO. Solo lee; no escribe nada.
// Uso: node decidir.cjs <nuevo.json> [publicado.json] [--previa lectura-anterior.json]   (sin el segundo = no hay nada publicado todavía)
// Salida (una línea JSON): { publicar: bool, motivo: texto, problemas: [..], pendientes: [..], cambios: [..] }
//  1) VALIDEZ: si la lectura trae errores, faltan tokens o algún token no leyó TODOS sus mercados (lectura incompleta), NO se publica (se deja lo anterior y la web avisa de su antigüedad).
//     Un token que tenía mercado y ahora sale «sin mercado» con la lectura COMPLETA (todos sus mercados leídos sin error) es una pérdida real de liquidez, no un fallo de lectura
//     (caso real: el 13-nov-2026 14:37 UTC se retiró casi toda la liquidez del mercado stUSDT/USDT y la regla antigua dejó el monitor parado 30 h). Se publica cuando la MISMA pérdida
//     aparece también en la lectura anterior (--previa, de hace entre 10 min y 6 h): dos lecturas completas e independientes. Con una sola, queda «pendiente» (no se publica esa hora).
//  2) PUBLICAR cuando: no hay nada publicado; han pasado 2,5 h o más (así la web nunca pasa de ~3 h sin renovar); o cambia el veredicto («Sí / Caro / No») de algún token
//     para alguno de los importes habituales (10 mil, 100 mil, 1 M, 10 M $) y de los límites del selector (0,1 / 0,5 / 1 / 2 / 5 %) — pero no antes de 1,5 h desde la última publicación, para no llenar el historial de GitHub con cambios en el borde.
const fs = require('fs'); const LIQ = require('./interp.js'); const AQUI = __dirname.split(String.fromCharCode(92)).join('/') + '/';
const IMPORTES = [1e4, 1e5, 1e6, 1e7], UMBRALES = [0.1, 0.5, 1, 2, 5], HORAS_CAP = Number(process.env.LIQ_HORAS_CAP || 2.5), HORAS_MIN = Number(process.env.LIQ_HORAS_MIN || 1.5);
const leer = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const sin = t => t.sinMercado || !t.curva || !t.curva.length;
// cuántos mercados DEBE haber leído cada token (misma lógica que curvas.cjs: rutas/perfil; WTRX usa los de segunda pata) y si la lectura los trae todos
const esperados = (mk, s) => s === 'WTRX' ? { d: mk.filter(x => x.roles.includes('salto2')).length, s1: 0 } : { d: mk.filter(x => x.roles.includes('directo') && x.tokens.includes(s)).length, s1: mk.filter(x => x.roles.includes('salto1') && x.tokens.includes(s)).length };
const completo = (mk, t) => { const e = esperados(mk, t.simbolo); return t.mercadosDirectos === e.d && t.mercadosSalto1 === e.s1; };
const veredictos = d => { const o = {}; for (const t of d.tokens) for (const u of UMBRALES) for (const v of IMPORTES) o[t.simbolo + ' · ' + v + ' $ · ' + u + ' %'] = sin(t) ? 'rojo' : LIQ.semaforo(LIQ.evaluar(t.curva, v), u, u * 4); return o; };
function decidir(nuevo, ant, ahora = Date.now(), previa = null) {
  const problemas = [], esperadosTokens = leer(AQUI + 'tokens.json').tokens.map(t => t.simbolo), mk = leer(AQUI + 'mercados.json').mercados;
  if (!nuevo || nuevo.version !== 1 || !Array.isArray(nuevo.tokens)) return { publicar: false, motivo: 'el fichero nuevo no tiene el formato esperado', problemas: ['formato'], cambios: [] };
  if ((nuevo.errores || []).length) problemas.push('la lectura de la cadena trae ' + nuevo.errores.length + ' error(es): ' + JSON.stringify(nuevo.errores[0]).slice(0, 160));
  for (const s of esperadosTokens) if (!nuevo.tokens.some(t => t.simbolo === s)) problemas.push('falta el token ' + s);
  for (const t of nuevo.tokens) if (!sin(t) && t.curva.length < 50) problemas.push(t.simbolo + ': curva incompleta (' + t.curva.length + ' puntos)');
  for (const t of nuevo.tokens) if (!completo(mk, t)) { const e = esperados(mk, t.simbolo); problemas.push(t.simbolo + ': lectura incompleta (leyó ' + t.mercadosDirectos + ' directos y ' + t.mercadosSalto1 + ' de un salto; debería leer ' + e.d + ' y ' + e.s1 + ')'); }
  if (!(Date.parse(nuevo.generado) > 0)) problemas.push('sin fecha de lectura');
  if (problemas.length) return { publicar: false, motivo: 'lectura no válida: no se publica y se deja lo anterior', problemas, pendientes: [], cambios: [] };
  // pérdida de mercado con la lectura completa: real, pero solo se publica si la lectura anterior (independiente, completa y sin errores) dice lo mismo
  const perdidas = [], pendientes = [], cambiosPerdida = [];
  if (ant && Array.isArray(ant.tokens)) for (const a of ant.tokens) { const t = nuevo.tokens.find(x => x.simbolo === a.simbolo); if (t && !sin(a) && sin(t)) perdidas.push(t.simbolo); }
  const minutos = previa && Array.isArray(previa.tokens) ? (Date.parse(nuevo.generado) - Date.parse(previa.generado)) / 6e4 : NaN;
  const confirma = s => { if (!(minutos >= 10 && minutos <= 360) || (previa.errores || []).length) return false; const p = previa.tokens.find(x => x.simbolo === s); return !!p && sin(p) && completo(mk, p); };
  for (const s of perdidas) (confirma(s) ? cambiosPerdida : pendientes).push(s);
  if (pendientes.length) return { publicar: false, motivo: 'pérdida de mercado pendiente de confirmar (se publica si la lectura siguiente la repite): ' + pendientes.join(', '), problemas: [], pendientes, cambios: [] };
  if (!ant) return { publicar: true, motivo: 'todavía no hay nada publicado', problemas: [], pendientes: [], cambios: [] };
  const horas = (ahora - Date.parse(ant.generado)) / 36e5; const vn = veredictos(nuevo), va = veredictos(ant), cambios = cambiosPerdida.map(s => s + ': ha perdido su mercado (lectura completa, confirmada en dos lecturas)');
  for (const k of Object.keys(vn)) if (va[k] !== undefined && va[k] !== vn[k]) cambios.push(k + ': ' + va[k] + ' → ' + vn[k]);
  if (horas >= HORAS_CAP) return { publicar: true, motivo: 'han pasado ' + horas.toFixed(1) + ' h desde la última publicación', problemas: [], cambios: cambios.slice(0, 8) };
  if (cambios.length && horas >= HORAS_MIN) return { publicar: true, motivo: 'cambia el veredicto en ' + cambios.length + ' caso(s)', problemas: [], cambios: cambios.slice(0, 8) };
  return { publicar: false, motivo: cambios.length ? 'hay ' + cambios.length + ' cambio(s) de veredicto pero se publicó hace solo ' + horas.toFixed(1) + ' h' : 'sin cambios apreciables (última publicación hace ' + horas.toFixed(1) + ' h)', problemas: [], cambios: cambios.slice(0, 8) };
}
module.exports = { decidir, veredictos, completo, esperados };
if (require.main === module) {
  const args = process.argv.slice(2), ip = args.indexOf('--previa'), pf = ip >= 0 ? args[ip + 1] : null; if (ip >= 0) args.splice(ip, 2);
  const [nf, af] = args; if (!nf) { console.error('Uso: node decidir.cjs <nuevo.json> [publicado.json] [--previa lectura-anterior.json]'); process.exit(2); }
  let nuevo = null, ant = null, previa = null; try { nuevo = leer(nf); } catch (e) { console.log(JSON.stringify({ publicar: false, motivo: 'no se pudo leer el fichero nuevo: ' + e.message.slice(0, 120), problemas: ['lectura'], pendientes: [], cambios: [] })); process.exit(0); }
  if (af && fs.existsSync(af)) { try { ant = leer(af); } catch (e) { ant = null; } }
  if (pf && fs.existsSync(pf)) { try { previa = leer(pf); } catch (e) { previa = null; } }
  console.log(JSON.stringify(decidir(nuevo, ant, Date.now(), previa)));
}

'use strict';
// DECIDE si el fichero del panel de JustLend recién generado es VÁLIDO y si hay que PUBLICARLO. Solo lee; no escribe nada.
// Uso: node decidir.cjs <nuevo.json> [publicado.json]   (sin el segundo = no hay nada publicado todavía)
// Salida (una línea JSON): { publicar: bool, motivo: texto, problemas: [..], cambios: [..] }
//  1) VALIDEZ: si la lectura trae errores, no está completa (24 mercados, 23 tokens con curva), es vieja o a un token que tenía mercado de venta le sale «sin mercado», NO se publica
//     (se deja lo anterior y la pestaña avisa de su antigüedad; con más de 3 h el semáforo pasa a «desconocido»).
//  2) PUBLICAR cuando: no hay nada publicado; cambia la lista de cambios de gobierno (aviso importante: sin esperar); la caja total cae un 10 % o más, o la de un mercado de 10 M$ o más cae un 30 %
//     o más desde la última publicación (también sin esperar: es justo lo que el panel debe enseñar); han pasado 2,5 h; o cambia el veredicto de algún mercado para alguno de los importes
//     habituales (10 mil, 100 mil, 1 M, 10 M $) — pero no antes de 1,5 h desde la última publicación, para no llenar el historial de GitHub con cambios en el borde.
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'regla.js'), 'utf8'), sb); const R = sb.window.JLR;
const IMPORTES = [1e4, 1e5, 1e6, 1e7], HORAS_CAP = Number(process.env.JL_HORAS_CAP || 2.5), HORAS_MIN = Number(process.env.JL_HORAS_MIN || 1.5), EDAD_MAX_MIN = Number(process.env.JL_EDAD_MAX_MIN || 20);
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const merge = (d, mk) => { const p = d.poderes[mk.jToken] || {}; return { ...mk, poderes: p.poderes || null, parteTop3: p.parteTop3, reclamoUSDfoto: p.reclamoUSDfoto }; };
const veredictos = (d) => { const o = {}; const ctx = { psm: d.psm ? d.psm.usdtEnPSM : null, edadH: 0 }; for (const mk of d.mercados) { const m = merge(d, mk); for (const v of IMPORTES) o[mk.simbolo + ' · ' + v + ' $'] = R.veredicto(m, v, ctx).v; } return o; };
const sinMercado = (mk) => !!(mk.venta && !mk.venta.esUSDT && (mk.venta.sinMercado || !mk.venta.curva || !mk.venta.curva.length));
const firma = (d) => JSON.stringify((d.cambios || []).map((c) => [c.donde, c.campo, c.antes, c.ahora]).sort());
function decidir(nuevo, ant, ahora = Date.now()) {
  const problemas = [];
  if (!nuevo || nuevo.version !== 1 || !Array.isArray(nuevo.mercados)) return { publicar: false, motivo: 'el fichero nuevo no tiene el formato esperado', problemas: ['formato'], cambios: [] };
  if (nuevo.ok !== true) problemas.push('el generador no dio la lectura por buena');
  if ((nuevo.errores || []).length) problemas.push('la lectura trae ' + nuevo.errores.length + ' error(es): ' + String(nuevo.errores[0]).slice(0, 160));
  if (nuevo.mercados.length !== 24) problemas.push('hay ' + nuevo.mercados.length + ' mercados en vez de 24');
  for (const mk of nuevo.mercados) { if (mk.cajaUSD == null || mk.caja == null) problemas.push(mk.simbolo + ': sin caja'); if (mk.venta && !mk.venta.esUSDT && !mk.venta.sinMercado && (!mk.venta.curva || mk.venta.curva.length < 10)) problemas.push(mk.simbolo + ': curva de venta incompleta'); if (!mk.venta) problemas.push(mk.simbolo + ': sin datos de venta'); }
  if (!(Date.parse(nuevo.bloque && nuevo.bloque.ts) > 0)) problemas.push('sin hora de bloque');
  else { const edad = (ahora - Date.parse(nuevo.bloque.ts)) / 6e4; if (edad > EDAD_MAX_MIN) problemas.push('la lectura tiene ' + edad.toFixed(0) + ' min (máximo ' + EDAD_MAX_MIN + ')'); }
  if (ant && Array.isArray(ant.mercados)) for (const a of ant.mercados) {
    const t = nuevo.mercados.find((x) => x.jToken === a.jToken); if (!t) continue;
    if (!sinMercado(a) && sinMercado(t)) problemas.push(a.simbolo + ': tenía mercado de venta y ahora sale «sin mercado»');
    const la = a.venta && a.venta.curva ? a.venta.curva.length : 0, ln = t.venta && t.venta.curva ? t.venta.curva.length : 0; if (la >= 20 && ln < la * 0.6) problemas.push(a.simbolo + ': la curva de venta pasa de ' + la + ' a ' + ln + ' puntos (se pierde profundidad medida)');
  }
  if (problemas.length) return { publicar: false, motivo: 'lectura no válida: no se publica y se deja lo anterior', problemas, cambios: [] };
  if (!ant || !Array.isArray(ant.mercados)) return { publicar: true, motivo: 'todavía no hay nada publicado', problemas: [], cambios: [] };
  const horas = (ahora - Date.parse(ant.generado)) / 36e5;
  if (firma(nuevo) !== firma(ant)) return { publicar: true, motivo: 'cambian los avisos de gobierno (' + (nuevo.cambios || []).length + ' ahora, ' + (ant.cambios || []).length + ' antes)', problemas: [], cambios: (nuevo.cambios || []).slice(0, 8).map((c) => c.donde + ' · ' + c.campo) };
  const caidas = []; const tn = nuevo.totales.cajaUSD, ta = ant.totales.cajaUSD; if (ta > 0 && tn <= ta * 0.9) caidas.push('caja total ' + Math.round((tn / ta - 1) * 100) + ' %');
  for (const a of ant.mercados) { const t = nuevo.mercados.find((x) => x.jToken === a.jToken); if (t && a.cajaUSD >= 1e7 && t.cajaUSD <= a.cajaUSD * 0.7) caidas.push(a.simbolo + ' caja ' + Math.round((t.cajaUSD / a.cajaUSD - 1) * 100) + ' %'); }
  if (caidas.length) return { publicar: true, motivo: 'cae la caja: ' + caidas.join(', '), problemas: [], cambios: caidas.slice(0, 8) };
  const vn = veredictos(nuevo), va = veredictos(ant), cambios = []; for (const k of Object.keys(vn)) if (va[k] !== undefined && va[k] !== vn[k]) cambios.push(k + ': ' + va[k] + ' → ' + vn[k]);
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

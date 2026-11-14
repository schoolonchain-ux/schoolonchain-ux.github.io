'use strict';
// FASE 4c · «Carrera de salida»: si los mayores depositantes de un mercado retiraran TODO uno tras otro (de mayor a menor), ¿en qué puesto se acaba la caja?
// Es un ejercicio de estrés con los saldos de ahora, no una predicción. Ignora deudas propias (que limitarían a algunos) y los intereses que se devengan al retirar.
const path = require('node:path'); const L = require('./lib.cjs');
const h = require('./resultados/08-titulares.json'), d = require('./resultados/04-liquidez-por-mercado.json');
const out = [];
for (const mk of h.mercados) {
  const f = d.mercados.find(x => x.jToken === mk.jToken); let acum = 0, puesto = null, parcial = null; const lista = mk.titulares;
  for (let i = 0; i < lista.length; i++) { const r = lista[i].reclamo; if (acum + r > f.caja) { puesto = i + 1; parcial = Math.max(0, f.caja - acum); break; } acum += r; }
  out.push({ jToken: mk.jToken, simbolo: mk.simbolo, subyacente: f.simboloSubyacente, estado: f.estado, cajaUSD: f.cajaUSD, reclamoUSD: f.reclamoUSD, titularesLeidos: lista.length, puestoEnQueSeAcabaLaCaja: puesto, quedaParaEsePuesto: parcial === null ? null : parcial, quedaParaEsePuestoUSD: parcial === null ? null : parcial * f.precioUSD, saldrianCompletosAntes: puesto === null ? null : puesto - 1, nota: puesto === null ? 'con los ' + lista.length + ' mayores no se agota la caja' : null });
  const o = out[out.length - 1]; console.log(mk.simbolo.padEnd(9), f.simboloSubyacente.padEnd(8), 'caja', (f.cajaUSD / 1e6).toFixed(2).padStart(8) + ' M$', '| se agota en el puesto', String(o.puestoEnQueSeAcabaLaCaja ?? '>' + lista.length).padStart(4), '| salen completos', String(o.saldrianCompletosAntes ?? '-').padStart(3));
}
console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '17-carrera-de-salida.json'), { generado: new Date().toISOString(), mercados: out }));

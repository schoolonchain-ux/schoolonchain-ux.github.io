'use strict';
// LÍNEA D · D5 — Conclusión por pareja con la regla del plan (sección 2). Sobre las cuentas de d1 + la proveedora:
//  DINERO SIMPLE    = al menos un flujo directo de ≥ 1 M (TRX o USDT) o una delegación de energía de ≥ 1 M entre las dos.
//  RELACIÓN DE TRABAJO = dinero + recurrencia (≥ 3 operaciones en la misma dirección) + exclusividad (el origen aporta ≥ 30 % de TODO lo que la receptora recibió: en TRX, todas las transferencias recibidas; en energía, toda la energía delegada a la receptora por cualquier cuenta). v2 tras la revisión externa: la v1 daba la exclusividad de energía por cumplida con solo ≥ 3 delegaciones (era la misma condición que la recurrencia) y mezclaba tamaños en numerador y denominador.
//  CONTROL COMÚN    = una de las dos aparece como CLAVE (propietario/activa) de la otra, o comparten clave: solo eso cuenta aquí. La huella (hora, votos, alta) no sube de escalón.
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node d5-conclusion-por-pareja.cjs (tras d1)
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); L.usar('d5-2026-11-05');
const OUT = path.join(__dirname, 'd-historia'); const TG = 'https://api.trongrid.io'; const M = x => Math.round(x * 100) / 100; const ANCLA = 1793870328000;
const F = JSON.parse(fs.readFileSync(path.join(OUT, 'flujos-y-huellas.json'), 'utf8')); const nodos = Object.fromEntries(Object.entries(F.huellas_por_cuenta).map(([k, v]) => [k, v.direccion])); nodos.PROVEEDORA = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2';
const flu = F.flujos_dirigidos_entre_cuentas_del_caso;
(async () => {
  // entradas totales de ≥1 M TRX por receptora (para la exclusividad)
  const entradas = {}, energiaRecibida = {}; for (const [k, a] of Object.entries(F.huellas_por_cuenta).map(([k, v]) => [k, v.direccion])) { const tx = await C.txCuenta(a, { hasta: ANCLA }); entradas[k] = tx.filas.filter(r => r.tipo === 'Transfer' && r.ok && r.a === a).reduce((s, r) => s + r.trx, 0); energiaRecibida[k] = tx.filas.filter(r => r.tipo === 'DelegateResource' && r.ok && r.a === a && r.recurso === 'ENERGY').reduce((s, r) => s + r.trx, 0); }
  entradas.PROVEEDORA = JSON.parse(fs.readFileSync(path.join(__dirname, 'b-proveedora', 'analisis-proveedora.json'), 'utf8')).totales.TRX.in;
  // claves: ¿alguna cuenta del caso es clave de otra?
  const control = []; for (const [k, a] of Object.entries(nodos)) { const g = await L.post(TG + '/wallet/getaccount', { address: a, visible: true }).catch(() => ({})); const claves = new Set(); for (const p of [g.owner_permission, ...(g.active_permission || [])]) for (const x of (p && p.keys) || []) claves.add(x.address); for (const c of claves) { const dueno = Object.entries(nodos).find(([, v]) => v === c); if (dueno && dueno[1] !== a) control.push({ controlada: k, clave_de: dueno[0] }); } }
  const pares = {}; const add = (tipo, clave, v) => { const [x, y] = clave.split('→'); const id = [x, y].sort().join(' ↔ '); const o = pares[id] = pares[id] || { pareja: id, flujos: [] }; o.flujos.push({ tipo, sentido: clave, ...v }); };
  for (const [t, o] of Object.entries(flu)) for (const [k, v] of Object.entries(o)) if (v.total >= 1e6) add(t, k, v);
  for (const c of control) { const id = [c.controlada, c.clave_de].sort().join(' ↔ '); pares[id] = pares[id] || { pareja: id, flujos: [] }; }
  const filas = Object.values(pares).map(p => {
    const dinero = p.flujos.length > 0 || false; const rec = p.flujos.some(f => f.n >= 3); const [x, y] = p.pareja.split(' ↔ ');
    const ex = p.flujos.filter(f => f.tipo === 'TRX' || f.tipo === 'energia_delegada_TRX').map(f => { const [o, d] = f.sentido.split('→'); const tot = f.tipo === 'TRX' ? entradas[d] : energiaRecibida[d]; return tot ? { tipo: f.tipo, sentido: f.sentido, porcentaje_de_lo_que_recibio_la_receptora: M(100 * f.total / tot) } : null; }).filter(Boolean);
    const excl = ex.some(e => e.porcentaje_de_lo_que_recibio_la_receptora >= 30);
    const ctl = control.filter(c => (c.controlada === x && c.clave_de === y) || (c.controlada === y && c.clave_de === x));
    const clase = ctl.length ? 'CONTROL COMÚN (una es clave de la otra)' : (dinero && rec && excl) ? 'RELACIÓN DE TRABAJO (dinero + recurrencia + exclusividad)' : 'DINERO SIMPLE';
    return { pareja: p.pareja, clase, flujos: p.flujos, exclusividad: ex, control: ctl, que_falta_para_subir: clase.startsWith('CONTROL') ? '—' : clase.startsWith('RELACIÓN') ? 'una clave o contrato que una a las dos (hoy ninguno)' : 'recurrencia y exclusividad, y después una clave o contrato en común' };
  }).sort((a, b) => (a.clase > b.clase ? 1 : -1) || a.pareja.localeCompare(b.pareja));
  const res = { regla: 'Plan sección 2. Las huellas (hora, votos, forma de alta, 1 TRX menos) no suben de escalón.', parejas_con_algun_flujo_de_1M_o_mas: filas.length, control_por_claves_entre_cuentas_del_caso: control, resumen: filas.reduce((o, f) => { const k = f.clase.split(' (')[0]; o[k] = (o[k] || 0) + 1; return o; }, {}), parejas: filas };
  const h = L.guardar(path.join(OUT, 'conclusion-por-pareja.json'), res);
  console.log('control por claves:', JSON.stringify(control)); console.log(JSON.stringify(res.resumen)); for (const f of filas) console.log(f.clase.split(' (')[0].padEnd(20), f.pareja.padEnd(24), f.flujos.map(x => x.tipo.slice(0, 3) + ' ' + x.sentido + ' ' + Math.round(x.total / 1e6) + 'M n' + x.n).join(' | ').slice(0, 130)); console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });

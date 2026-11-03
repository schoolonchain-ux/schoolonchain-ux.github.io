#!/usr/bin/env node
'use strict';
// Investigación desde la línea de comandos (solo lectura de cadena; escribe únicamente en el expediente de ChainScope).
//   node bin/investigar.cjs --pregunta "…" [--profundidad 3] [--minimo 1000000] [--max-consultas 150] [--rondas 5]
//   node bin/investigar.cjs --reanudar inv-xxxxxxxx
//   Añade --temporal para usar un ChainScope temporal (pruebas: no toca el ChainScope vivo ni sus datos).
const fs = require('node:fs');
const path = require('node:path');
const { crearClienteExpediente } = require('../src/cliente-expediente.cjs');
const { crearFabricaEntorno } = require('../src/entorno.cjs');
const { crearModeloClaude } = require('../src/modelo.cjs');
const { investigar, resumenParaRedactar } = require('../src/agente.cjs');
const { generarInforme } = require('../src/informe.cjs');
const { revisar, crearRevisorCodex, crearRevisorClaude } = require('../src/revision.cjs');

const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };

(async () => {
  const pregunta = arg('pregunta'), reanudar = arg('reanudar'); if (!pregunta && !reanudar) { console.error('Uso: --pregunta "…" | --reanudar inv-xxxxxxxx   (--temporal para un ChainScope de pruebas)'); process.exit(2); }
  let S = null, F = null, cliente;
  if (arg('temporal')) { const { montar } = require('../../chainscope/test/fixtures.cjs'), { createServer } = require('../../chainscope/src/server.cjs'); F = montar(); S = await createServer({ cfg: F.cfg, puerto: 0, pool: { trabajadores: 1, colaMaxima: 4, plazoMs: 8000 } }); cliente = crearClienteExpediente({ puerto: S.puerto, fichaFile: path.join(F.cfg.datos, 'investigador.token') }); }
  else { const pu = arg('puerto'), da = arg('datos'); cliente = crearClienteExpediente({ ...(pu && pu !== true ? { puerto: Number(pu) } : {}), ...(da && da !== true ? { fichaFile: path.join(da, 'investigador.token') } : {}) }); }   // --puerto/--datos: lo usa el botón «Investigar» de ChainScope
  const num = (n, d) => { const v = arg(n); return v && v !== true ? Number(v) : d; };
  const config = {}; if (arg('profundidad')) config.profundidad = num('profundidad'); if (arg('minimo')) config.minimoUsd = num('minimo'); if (arg('max-consultas')) config.maxConsultas = num('max-consultas');
  const fabrica = crearFabricaEntorno({ cliente, ...(S ? { fichaChainscope: path.join(F.cfg.datos, 'servicio.token'), puertoChainscope: S.puerto } : (arg('puerto') && arg('puerto') !== true ? { puertoChainscope: Number(arg('puerto')), ...(arg('datos') && arg('datos') !== true ? { fichaChainscope: path.join(arg('datos'), 'servicio.token') } : {}) } : {})) }), modelo = crearModeloClaude();
  const t0 = Date.now();
  const r = await investigar({ pregunta: pregunta || (await cliente.ver(reanudar)).pregunta, expId: reanudar || null, config, modelo, cliente, crearEntorno: fabrica.crearEntorno, maxRondas: num('rondas', 5), log: (e, d) => console.error('·', e, JSON.stringify(d)) });
  const salida = path.join(__dirname, '..', 'state'); fs.mkdirSync(salida, { recursive: true });
  fs.writeFileSync(path.join(salida, r.expId + '.json'), JSON.stringify(r.expediente, null, 1)); fs.writeFileSync(path.join(salida, r.expId + '.resumen.md'), resumenParaRedactar(r));
  console.log(resumenParaRedactar(r)); console.log('\n---\nExpediente:', r.expId, '· estado', r.estado, '· detenida por:', r.detenida_por || '—', '· presupuesto', JSON.stringify(r.presupuesto), '· modelo:', JSON.stringify(modelo.usos().reduce((a, u) => ({ llamadas: a.llamadas + 1, coste_usd: +(a.coste_usd + (u.coste_usd || 0)).toFixed(4) }), { llamadas: 0, coste_usd: 0 })), '· ' + Math.round((Date.now() - t0) / 1000) + ' s');
  console.log('Guardado en', path.join(salida, r.expId + '.json'));
  // Revisión independiente (obligatoria para cerrar): Codex contra los datos originales, hasta 10 rondas. --sin-revision solo para pruebas; el expediente queda entonces «pendiente de revisión».
  let expFinal = r.expediente;
  if (!process.argv.includes('--sin-revision') && !r.interrumpida) {
    try { const rv = await revisar({ expId: r.expId, cliente, revisor: arg('revisor') === 'claude' ? crearRevisorClaude() : crearRevisorCodex(), modelo, crearEntorno: fabrica.crearEntorno, dirBase: path.join(salida, 'revisiones'), log: (e, d) => console.error('·', e, JSON.stringify(d)) }); expFinal = rv.expediente || await cliente.ver(r.expId); console.log('Revisión independiente:', rv.aprobado ? 'APROBADA' : 'NO aprobada', '·', rv.motivo_fin, '·', rv.rondas, 'ronda(s) · estado', rv.estado); }
    catch (e) { console.error('Revisión independiente NO realizada:', e.message); expFinal = await cliente.ver(r.expId); }
  }
  if (!process.argv.includes('--sin-informe')) { const g = await generarInforme({ exp: expFinal, cliente, dir: path.join(salida, 'informes', r.expId) }); console.log('Informe de 18 apartados:', g.pdf || ('PDF no generado: ' + g.error_pdf), '· controles fallidos:', g.manifiesto.controles.fallidos.join(', ') || 'ninguno'); }
  fabrica.cerrar(); if (S) { await S.close(); F.limpiar(); }
  if (r.interrumpida) { console.error('LA INVESTIGACIÓN SE INTERRUMPIÓ POR UN ERROR:', r.detenida_por); process.exit(3); }   // código distinto de 0: quien la lanzó (p. ej. ChainScope) la muestra como fallida con este motivo
})().catch(e => { console.error('ERROR', e); process.exit(1); });

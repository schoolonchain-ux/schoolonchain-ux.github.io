#!/usr/bin/env node
'use strict';
// Revisión independiente de un expediente (fase 6): Codex revisa contra los datos originales, el agente responde, hasta 10 rondas. Al terminar regenera el informe con el apartado de revisión.
//   node bin/revisar.cjs --derivar inv-xxxxxxxx   (SEGUNDA INSTANCIA: solo si agotó las 10 rondas sin aprobación; crea un expediente nuevo heredando todo y lo revisa otras 10 rondas)
//   node bin/revisar.cjs --expediente inv-xxxxxxxx [--rondas 10] [--puerto 5720] [--datos <carpeta de datos de ChainScope>]
const fs = require('node:fs');
const path = require('node:path');
const { crearClienteExpediente } = require('../src/cliente-expediente.cjs');
const { crearFabricaEntorno } = require('../src/entorno.cjs');
const { crearModeloClaude } = require('../src/modelo.cjs');
const { revisar, crearRevisorCodex, crearRevisorClaude } = require('../src/revision.cjs');
const { generarInforme } = require('../src/informe.cjs');

const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };

(async () => {
  const aDerivar = arg('derivar');
  let expId = aDerivar && aDerivar !== true ? aDerivar : arg('expediente'); if (!expId || expId === true) { console.error('Uso: --expediente inv-xxxxxxxx [--rondas 10] [--puerto 5720] [--datos <carpeta>]'); process.exit(2); }
  const pu = arg('puerto'), da = arg('datos'), puerto = pu && pu !== true ? Number(pu) : undefined, datos = da && da !== true ? da : null;
  const cliente = crearClienteExpediente({ ...(puerto ? { puerto } : {}), ...(datos ? { fichaFile: path.join(datos, 'investigador.token') } : {}) });
  const fabrica = crearFabricaEntorno({ cliente, ...(puerto ? { puertoChainscope: puerto, ...(datos ? { fichaChainscope: path.join(datos, 'servicio.token') } : {}) } : {}) }), modelo = crearModeloClaude(), revisor = arg('revisor') === 'claude' ? crearRevisorClaude() : crearRevisorCodex();   // --revisor claude: SUSTITUTO de Codex (menos independiente; consta en cada ronda y en el informe)
  const salida = path.join(__dirname, '..', 'state'), t0 = Date.now();
  if (aDerivar && aDerivar !== true) { const d = await cliente.derivar(aDerivar); console.log(`Segunda instancia de ${aDerivar}: nuevo expediente ${d.id} (hereda ${JSON.stringify(d.conteo)})`); expId = d.id; }
  const r = await revisar({ expId, cliente, revisor, modelo, crearEntorno: fabrica.crearEntorno, dirBase: path.join(salida, 'revisiones'), maxRondas: arg('rondas') && arg('rondas') !== true ? Number(arg('rondas')) : 10, log: (e, d) => console.error('·', e, JSON.stringify(d)) });
  console.log(`Revisión independiente de ${expId}: ${r.aprobado ? 'APROBADA' : 'NO aprobada'} · ${r.motivo_fin} · ${r.rondas} ronda(s) · estado ${r.estado} · modelo del agente: ${JSON.stringify(modelo.usos().reduce((a, u) => ({ llamadas: a.llamadas + 1, coste_usd: +(a.coste_usd + (u.coste_usd || 0)).toFixed(4) }), { llamadas: 0, coste_usd: 0 }))} · ${Math.round((Date.now() - t0) / 1000)} s`);
  if (!process.argv.includes('--sin-informe')) { const exp = await cliente.ver(expId), g = await generarInforme({ exp, cliente, dir: path.join(salida, 'informes', expId) }); console.log('Informe de 18 apartados:', g.pdf || ('PDF no generado: ' + g.error_pdf), '· controles fallidos:', g.manifiesto.controles.fallidos.join(', ') || 'ninguno'); fs.writeFileSync(path.join(salida, expId + '.json'), JSON.stringify(exp, null, 1)); }
  fabrica.cerrar(); process.exit(0);   // 0 = la revisión se hizo hasta el final (aprobada o no: consta en el expediente); solo un error real sale con otro código
})().catch(e => { console.error('ERROR', e); process.exit(1); });

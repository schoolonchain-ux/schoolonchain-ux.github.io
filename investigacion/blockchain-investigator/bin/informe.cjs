#!/usr/bin/env node
'use strict';
// Genera el informe de un expediente (PDF + HTML + Markdown + JSON + manifiesto con huellas).
//   node bin/informe.cjs inv-xxxxxxxx [--salida carpeta] [--sin-pdf]      (lee el expediente del ChainScope en marcha por la puerta del investigador)
//   node bin/informe.cjs --archivo state/inv-xxxxxxxx.json [--salida carpeta]   (expediente guardado en un JSON; sin comprobar las lecturas originales)
const fs = require('node:fs');
const path = require('node:path');
const { generarInforme } = require('../src/informe.cjs');
const { crearClienteExpediente } = require('../src/cliente-expediente.cjs');

const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
(async () => {
  const archivo = arg('archivo'), id = process.argv.slice(2).find(a => /^inv-[0-9a-f]{8}$/.test(a));
  if (!archivo && !id) { console.error('Uso: node bin/informe.cjs inv-xxxxxxxx | --archivo expediente.json  [--salida carpeta] [--sin-pdf]'); process.exit(2); }
  let exp, cliente = null;
  if (archivo) exp = JSON.parse(fs.readFileSync(archivo, 'utf8')); else { cliente = crearClienteExpediente(); exp = await cliente.ver(id); }
  const dir = arg('salida') && arg('salida') !== true ? arg('salida') : path.join(__dirname, '..', 'state', 'informes', exp.id);
  const r = await generarInforme({ exp, cliente, dir, pdf: !process.argv.includes('--sin-pdf') });
  console.log(JSON.stringify(r.manifiesto, null, 1));
  console.log('Carpeta:', dir); if (r.error_pdf) { console.error('PDF NO generado:', r.error_pdf); process.exit(3); }
})().catch(e => { console.error('ERROR', e); process.exit(1); });

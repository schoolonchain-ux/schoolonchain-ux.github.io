'use strict';
// DEMOSTRACIÓN REAL de las fases 1 y 2 (solo lectura de la cadena): lee el caso 0x5227…2f8c con los adaptadores nuevos y lo guarda en un expediente de ChainScope.
// El expediente se crea en un ChainScope TEMPORAL (carpeta de datos propia en la carpeta temporal del sistema): no toca el ChainScope vivo ni sus datos.
// Uso: node scripts/demo-fase2.cjs [carpeta-de-salida] [--servir]   (--servir deja el ChainScope temporal en marcha para ver el expediente en la pantalla «Investigaciones»; se para con Ctrl+C)
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { montar } = require('../../chainscope/test/fixtures.cjs');
const { createServer } = require('../../chainscope/src/server.cjs');
const { crearTransporte, crearHttpJson } = require('../src/transporte.cjs');
const { leerClaves } = require('../src/claves.cjs');
const { crearRpc } = require('../src/rpc.cjs');
const { crearTokens } = require('../src/tokens.cjs');
const { leerTransaccion, balanceNeto } = require('../src/transaccion.cjs');
const { crearFondos } = require('../src/fondos.cjs');
const { analizarContrato, eventosControl, estadoBloqueo } = require('../src/contrato.cjs');
const { crearLectorDocumentos } = require('../src/documentos.cjs');
const { crearClienteExpediente } = require('../src/cliente-expediente.cjs');
const { crearRegistrador } = require('../src/registrador.cjs');

const RAIZ = '0x5227f603C1eE34CE3C06eFe6477003BDfCCB2f8c', USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const TXS = ['0x68d7d69deaeb9750c38020b4f8d3728146ca8d2267eba1e38cf9b56722ad659a', '0x1fc0ef33a767132edad434834a5555b30fcb5a171206c03b86175ef6dafac81c', '0x551d7961652e6d9835b11988908adf86ebe480badb4ce2d7d52193b2b1b02c76', '0x9edf86533e73658700c5dadb2432dd7bebb628dc0f5fe37991c241f537856071'];

(async () => {
  const servir = process.argv.includes('--servir'), salida = process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(__dirname, '..', 'state'); fs.mkdirSync(salida, { recursive: true });
  // Con --servir se leen los almacenes REALES de EquipoIA (solo lectura, como el ChainScope vivo) para que la web cargue entera; los datos propios (expedientes, cuaderno) van a una carpeta temporal.
  const F = servir ? { cfg: (() => { const c = require('../../chainscope/src/core/stores.cjs').loadConfig(); c.datos = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-demo-')); return c; })(), limpiar() {} } : montar(), S = await createServer({ cfg: F.cfg, puerto: 0, pool: { trabajadores: 1, colaMaxima: 4, plazoMs: 8000 } });
  const tr = crearTransporte(), http = crearHttpJson(tr), rpc = crearRpc({ http }), tokens = crearTokens({ rpc }), claves = leerClaves();
  const cli = crearClienteExpediente({ puerto: S.puerto, fichaFile: path.join(F.cfg.datos, 'investigador.token') });
  const id = await cli.crear({ titulo: 'DEMO fases 1-2: dirección 0x5227…2f8c (29-10-2026)', pregunta: '¿A dónde fueron los fondos de 0x5227…2f8c el 29-10-2026 y qué se puede comprobar en cadena?', config: { profundidad: 2, minimoUsd: 1000000 }, previo: 'interfaz/jobs/ui-fb29df2b-dfa6-4ba1-b08a-268f2231020d.json (informe anterior: NO es evidencia primaria)' });
  const reg = crearRegistrador({ cliente: cli, expId: id }); const t0 = Date.now(), log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6) + ' s ·', ...a);
  log('expediente', id);

  // 1) los cuatro movimientos principales, desde la cadena (recibos), con sus lecturas crudas
  for (const h of TXS) { const r = await leerTransaccion(rpc, 'ethereum', h, { tokens }); const g = await reg.transaccion(r); log('tx', h.slice(0, 12), r.ok ? `${r.estado} bloque ${r.bloque} ${r.ocurrido_utc}` : r.error, '→ evidencia', g.evidencias.join(',')); }
  // 2) el bloqueo de Tether en Ethereum y los eventos de control del contrato USDT desde el 29-oct
  const bl = await leerTransaccion(rpc, 'ethereum', '0x7baba482077843514d9c72bac0110ba0916b0814288a72917e2c3bb27a9d8659', { tokens }); await reg.transaccion(bl); log('tx del bloqueo', bl.ok ? `${bl.estado} ${bl.ocurrido_utc} sin_decodificar=${bl.sin_decodificar.length}` : bl.error);
  const ev = await eventosControl(http, claves.etherscanKey, 1, USDT, { desdeBloque: 26300000, nombres: ['AddedBlackList', 'RemovedBlackList', 'DestroyedBlackFunds', 'Pause', 'Unpause', 'OwnershipTransferred', 'Upgraded'] }); await reg.eventos(ev, { red: 'ethereum' });
  log('eventos USDT', ev.eventos.map(e => `${e.evento}:${e.total ?? e.estado}`).join(' '));
  // 3) contrato USDT y la EOA raíz
  await reg.contrato(await analizarContrato(rpc, 'ethereum', USDT, { http, chainId: 1 })); await reg.contrato(await analizarContrato(rpc, 'ethereum', RAIZ, { http, chainId: 1 })); log('contratos analizados');
  // 3b) ¿está la dirección raíz en la lista de bloqueo del USDT de cada red? (lectura del propio contrato)
  const TOKENS = [['ethereum', USDT], ['avalanche', '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'], ['polygon', '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'], ['arbitrum', '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'], ['optimism', '0x01bff41798a0bcf287b996046ca68b395dbc1071']];
  for (const [red, tok] of TOKENS) { const b = await estadoBloqueo(rpc, red, tok, RAIZ); await reg.bloqueo(b); log('bloqueo', red, b.ok ? b.funcion + ' → ' + b.bloqueada : b.error); }
  // 4) rastreo de fondos estructurado (2 saltos, mínimo 1 M$)
  const fondos = crearFondos({ transporte: tr, claves, stateDir: path.join(__dirname, '..', 'state') });
  const ruta = await fondos.rastrear({ red: 'ethereum', direccion: RAIZ, desde: Date.parse('2026-10-29T00:00:00Z'), profundidad: 2, minUsd: 1000000, maxMs: 100000 }); const gr = await reg.ruta(ruta);
  log('ruta', ruta.ok ? `${ruta.saltos.length} saltos, ${ruta.nodos.length} nodos, ${ruta.peticiones} peticiones, ${ruta.ms} ms` : ruta.motivo);
  // 5) un swap real de la ruta: el contrato 0x74edc79f… recibió USDT y devolvió ETH; se decodifica la transacción
  const sw = ruta.ok && ruta.saltos.find(s => s.a.toLowerCase() === '0x74edc79fea13bdf1f7841570227127cec493bdd9');
  if (sw) { const r = await leerTransaccion(rpc, 'ethereum', sw.tx, { tokens }); await reg.transaccion(r); log('swap', sw.tx.slice(0, 12), r.ok ? `swaps decodificados=${r.swaps.length} transferencias=${r.transferencias.length} multicall=${r.entrada.multicall || '-'} sin_decodificar=${r.sin_decodificar.length}` : r.error); if (r.ok) { for (const s of r.swaps) log('   ', s.dex, 'pool', s.pool.slice(0, 10), 'entra', JSON.stringify(s.entra.map(e => (r.monedas[e.token] || {}).simbolo_reportado + ' ' + e.raw)), 'sale', JSON.stringify(s.sale.map(e => (r.monedas[e.token] || {}).simbolo_reportado + ' ' + e.raw)), s.notas.join(';')); log('    balance neto:', JSON.stringify(balanceNeto(r).slice(0, 6).map(x => x.direccion.slice(0, 8) + ' ' + x.moneda.slice(0, 8) + ' ' + x.neto))); } }
  // 6) lector documental sobre un dominio autorizado (comunicados de Binance): lo que devuelva, tal cual
  const lector = crearLectorDocumentos(); const doc = await lector.leer('https://www.binance.com/en/support/announcement'); await reg.documento(doc); log('documento', doc.ok ? `${doc.titulo} · ${doc.caracteres} caracteres` : doc.error);
  const dom = await reg.documento(await lector.leer('https://example.com/informe')); log('dominio no autorizado → ', dom.ok ? 'LEÍDO (¡mal!)' : 'rechazado (bien)');

  const v = await cli.ver(id); fs.writeFileSync(path.join(salida, 'demo-fase2-expediente.json'), JSON.stringify(v, null, 1));
  const cuenta = (xs, k) => xs.reduce((m, x) => (m[x[k]] = (m[x[k]] || 0) + 1, m), {});
  console.log('\n==== EXPEDIENTE', id, '====');
  console.log('evidencias:', v.evidencias.length, JSON.stringify(cuenta(v.evidencias, 'clase')), '· aristas:', JSON.stringify(cuenta(v.aristas, 'clase')), '· consultas:', v.consultas.length, JSON.stringify(cuenta(v.consultas, 'estado')), '· direcciones:', v.direcciones.length);
  console.log('libro:', JSON.stringify(v.libro), '· lecturas crudas guardadas:', fs.readdirSync(path.join(F.cfg.datos, 'investigaciones', id, 'raw')).length);
  console.log('consultas salientes:', tr.total(), JSON.stringify(cuenta(tr.registro(), 'host')), '· rechazadas:', tr.registro().filter(x => x.error === 'HOST_NO_PERMITIDO').length);
  console.log('salida:', path.join(salida, 'demo-fase2-expediente.json'));
  fondos.close();
  if (servir) { console.log('\nCHAINSCOPE TEMPORAL EN MARCHA:', S.url, '(abre «Investigaciones»; Ctrl+C para parar)'); await new Promise(() => {}); }
  await S.close(); F.limpiar();
})().catch(e => { console.error('ERROR', e); process.exit(1); });

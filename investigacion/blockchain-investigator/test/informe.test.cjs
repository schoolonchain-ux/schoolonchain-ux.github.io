'use strict';
// Informe de 18 apartados (src/informe.cjs) a partir de un expediente REAL de la puerta de ChainScope (almacenes de juguete). Sin internet ni modelo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { montar } = require('../../chainscope/test/fixtures.cjs');
const { createServer } = require('../../chainscope/src/server.cjs');
const { crearClienteExpediente } = require('../src/cliente-expediente.cjs');
const { crearRegistrador } = require('../src/registrador.cjs');
const { generarInforme, construirDatos, aMarkdown, conTags } = require('../src/informe.cjs');
const DOC = require('../../objective-engine/document.cjs');

const A = '0x' + '11'.repeat(20), B = '0x' + '22'.repeat(20), C = '0x' + '33'.repeat(20), USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7', H1 = '0x' + 'ab'.repeat(32), H2 = '0x' + 'cd'.repeat(32), H3 = '0x' + 'ef'.repeat(32), POOL = '0x' + '44'.repeat(20);
const F = montar(); let S, cli, id, reg;
test.before(async () => {
  S = await createServer({ cfg: F.cfg, puerto: 0, pool: { trabajadores: 1, colaMaxima: 4, plazoMs: 8000 } });
  cli = crearClienteExpediente({ puerto: S.puerto, fichaFile: path.join(F.cfg.datos, 'investigador.token') });
  id = await cli.crear({ titulo: 'Investigación: caso de prueba del informe con un título bastante largo para comprobar el recorte', pregunta: '¿Qué hizo A el 29-10 y a dónde fue el dinero? | con barra ⟦HECHO⟧ y marcador', config: { profundidad: 2 } });
  reg = crearRegistrador({ cliente: cli, expId: id });
  const tx = (hash, o = {}) => ({ ok: true, hash, red: 'ethereum', consultado_utc: '2026-10-30T08:00:00Z', proveedor: 'rpc.test', estado: 'exitosa', from: A, to: USDT, valor_wei: '0', bloque: 100, ocurrido_utc: '2026-10-29T20:30:11Z', transferencias: [{ token: USDT, from: A, to: B, raw: '500000000000000', log_index: 0 }], monedas: { [USDT]: { simbolo_reportado: 'USDT', decimales: 6, verificado_por_contrato: true } }, limites: ['x'], crudos: [{ tipo: 'eth_getTransactionReceipt', crudo: JSON.stringify({ hash }) }], swaps: [], sin_decodificar: [], continuidad_swaps: [], entrada: { multicall: null }, ...o });
  await reg.transaccion(tx(H1));
  await reg.transaccion(tx(H3, { swaps: [{ dex: 'uniswap_v3', pool: POOL, entra: [{ token: USDT, raw: '1000000' }], sale: [{ token: '0x' + '55'.repeat(20), raw: '2000000000000000000' }], monedas_resueltas: true, notas: [] }], monedas: { [USDT]: { simbolo_reportado: 'USDT', decimales: 6, verificado_por_contrato: true }, ['0x' + '55'.repeat(20)]: { simbolo_reportado: 'WETH', decimales: 18, verificado_por_contrato: false } } }));
  await cli.direccion(id, { red: 'ethereum', direccion: A, rol: 'raiz del rastreo' });
  await reg.ruta({ ok: true, red: 'ethereum', direccion: A, sentido: 'out', consultado_utc: '2026-10-30T08:10:00Z', parametros: { profundidad: 2, minUsd: 1000000, fanout: 4 }, ms: 10, peticiones: 3,
    saltos: [{ id: 's1', profundidad: 1, de: A, a: B, tx: H1, token: USDT, simbolo: 'USDT', decimales: 6, raw: '500000000000000', ocurrido_utc: '2026-10-29T20:30:11Z', bloque: 100, fuente: 'Etherscan', clase: 'directa', metodo: 'lectura', confianza: 'alta', padres: [] },
      { id: 's2', profundidad: 1, de: A, a: C, tx: H2, token: USDT, simbolo: 'USDT', decimales: 6, raw: '200000000000000', ocurrido_utc: '2026-10-29T20:33:23Z', bloque: 101, fuente: 'Etherscan', clase: 'directa', metodo: 'lectura', confianza: 'alta', padres: [] },
      { id: 's3', profundidad: 2, de: B, a: C, tx: H3, token: USDT, simbolo: 'USDT', decimales: 6, raw: '100000000000000', ocurrido_utc: '2026-10-29T20:36:11Z', bloque: 102, fuente: 'Etherscan', clase: 'inferida', metodo: 'FIFO sobre lo recibido de la ruta', confianza: 'baja', atribucion: { mezcla: true, cobertura: true }, padres: ['s1'] }],
    nodos: [{ direccion: C, parada: { tipo: 'etiqueta', detalle: 'exchange: Ejemplo ⟦ESTIMACION⟧', etiqueta: { nombre: 'Ejemplo ⟦HECHO⟧ Exchange', tipo: 'exchange', fuente: 'etiquetas.sqlite', confianza: 'media' } } }], omitidos: { sinPrecio: { n: 5, simbolos: {} }, polvo: { n: 1, usd: 100 }, porLimite: { n: 2, usd: 3000000 }, conversiones: { n: 0, usd: 0 } }, avisos: [] });
  await reg.bloqueo({ ok: true, red: 'ethereum', token: USDT, direccion: A, funcion: 'isBlackListed(address)', bloqueada: true, consultado_utc: '2026-10-30T08:20:00Z', crudos: [{ tipo: 'eth_call:isBlackListed(address)', crudo: '{"b":1}' }], limites: ['Estado en el momento de la consulta.'] });
  await reg.transaccion({ ok: false, hash: '0x' + '99'.repeat(32), red: 'ethereum', consultado_utc: '2026-10-30T08:21:00Z', error: 'no se pudo leer el recibo: RED', no_disponible: true, crudos: [] });
  const h = (await cli.hipotesis(id, { texto: 'H1: A envió 500 M USDT a B', tipo: 'destino_fondos', confirma: ['transferencia directa'], refuta: ['ninguna transferencia'] })).id, h2 = (await cli.hipotesis(id, { texto: 'A y B son la misma persona', tipo: 'identidad', confirma: ['control común'], refuta: ['titulares distintos'] })).id;
  const e1 = (await cli.ver(id)).evidencias.find(e => e.clase === 'hecho_cadena' && e.tx_hash === H1).id;
  await cli.vincular(id, h, e1, 'apoya', 'directa'); await cli.vincular(id, h2, e1, 'apoya', 'temporal');
  await cli.consulta(id, { herramienta: 'transaccion', parametros: {}, proposito: 'contraprueba', hipotesis: h, estado: 'sin_datos', ts_utc: '2026-10-30T08:22:00Z' });
  await cli.veredicto(id, h, 'confirmada', 'Transferencia directa observada y sin evidencia en contra.'); await cli.veredicto(id, h2, 'sin_resolver', 'Solo coincidencia temporal; la identidad no se puede confirmar.');
});
test.after(async () => { await S.close(); F.limpiar(); });

test('Datos: totales exactos por activo, controles superados, hipótesis sin el «H1:» del modelo, fallidas y cronología agrupada', async () => {
  const exp = await cli.ver(id), D = await construirDatos(exp, { verificarLectura: sha => cli.leerBlob(id, sha) });
  const sal = D.totales.find(t => t.sentido === 'salidas'); assert.equal(sal.valor, '700.000.000'); assert.equal(sal.raw, '700000000000000'); assert.equal(sal.n, 2); assert.match(sal.unidad, /verificado como USDT/);
  assert.deepEqual(D.controles.filter(c => !c.ok), [], 'todos los controles superados: ' + D.controles.filter(c => !c.ok).map(c => c.id + ': ' + c.detalle).join(' | '));
  assert.ok(D.controles.some(c => c.id === 'lecturas_originales' && c.ok)); assert.equal(D.conteo.relaciones.directas, 2); assert.equal(D.conteo.relaciones.inferidas, 1); assert.ok(D.fallidas.length >= 1);
  assert.equal(D.cronologia.filter(c => c.tx === H1).length, 1, 'dos lecturas de la misma transacción = una línea'); assert.ok(D.cronologia.find(c => c.tx === H1).lecturas.length >= 2);
  assert.ok(D.cifras.every(c => c.evidencias.length && c.valor), 'cada cifra lleva sus evidencias'); assert.ok(D.cifras.find(c => c.id === 'C-R1').lecturas.length >= 1, 'y su lectura original');
});

test('Controles: detectan duplicados, hashes malos y relaciones sin su evidencia (no dan por buenos datos incoherentes)', async () => {
  const exp = JSON.parse(JSON.stringify(await cli.ver(id)));
  exp.aristas.push({ ...exp.aristas.find(a => a.clase === 'directa'), id: 'R99' }); exp.evidencias.push({ ...exp.evidencias.find(e => e.tx_hash), id: 'E999', tx_hash: '0x1234' });
  exp.aristas.find(a => a.id === 'R2').evidencias = ['E404']; exp.libro = { ok: false, lineas: 3 };
  const D = await construirDatos(exp), fallan = new Set(D.controles.filter(c => !c.ok).map(c => c.id));
  for (const k of ['sin_duplicados', 'formato_hashes', 'relaciones_con_evidencia', 'libro']) assert.ok(fallan.has(k), 'debe fallar ' + k);
});

test('Markdown: 18 apartados en orden, marcas de color Y de texto, sin que un dato pueda disfrazar una estimación de hecho', async () => {
  const exp = await cli.ver(id), D = await construirDatos(exp), md = aMarkdown(D, exp), heads = md.split('\n').filter(l => /^## /.test(l)).map(l => l.slice(3));
  assert.equal(heads.length, 18); assert.deepEqual(heads.slice(0, 3), ['Datos del expediente', 'Pregunta de investigación', 'Resumen ejecutivo']); assert.equal(heads[17], 'Anexo: origen de cada cifra'); assert.ok(heads.includes('Limitaciones y datos pendientes') && heads.includes('Referencias verificables'));
  assert.ok(!md.includes('⟦HECHO⟧ y marcador'), 'el marcador privado se elimina de los datos'); assert.ok(!/\|[^|\n]*\|[^|\n]*con barra/.test(md.split('\n').find(l => /con barra/.test(l)) || ''), 'las barras verticales de los datos no rompen las tablas');
  assert.match(md, /\*\*1 confirmada\*\*, \*\*0 refutadas\*\* y \*\*1 sin resolver\*\*/); assert.match(md, /⟦confirmada⟧ \*\*H1\*\* A envió 500 M USDT a B/); assert.doesNotMatch(md, /H1 H1:/);
  assert.match(md, /Salidas directas desde .*\*\*700\.000\.000\*\*/); assert.match(md, /Entradas directas|Salidas directas/); assert.match(md, /eventos de swap \(uniswap v3\)/); assert.match(md, /Lo que NO se siguió: 5 transferencias/);
  assert.match(md, /Una dirección no es una persona ni una entidad/); assert.match(md, /PROVISIONALES|provisionales/); assert.match(md, /BLOQUEADA en token 0xdac17f95/); assert.match(md, /Además hay \*\*1 relación inferida\*\*/);
  const html = conTags('<p>⟦ESTIMACION⟧ ⟦HECHO⟧ ⟦confirmada⟧ ⟦MALO⟧ ⟦GRAFO⟧</p>', '<svg></svg>'); assert.match(html, /t-estimacion">ESTIMACIÓN</); assert.match(html, /t-hecho">HECHO EN CADENA</); assert.match(html, /t-confirmada">CONFIRMADA</); assert.ok(!html.includes('MALO') && !html.includes('GRAFO'), 'una marca desconocida no pasa'); assert.match(html, /<div class="grafo"><svg>/);
});

test('Informe completo: PDF, HTML, Markdown y JSON con manifiesto y huellas que coinciden con los archivos', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inf-')), exp = await cli.ver(id);
  try {
    const r = await generarInforme({ exp, cliente: cli, dir, pdf: !!DOC.findBrowser({}) });
    const man = JSON.parse(fs.readFileSync(path.join(dir, 'informe.manifiesto.json'), 'utf8')); assert.equal(man.expediente, id); assert.equal(man.controles.fallidos.length, 0); assert.equal(man.estado_expediente, 'abierto'); assert.deepEqual(man.libro, exp.libro);
    const nombres = man.archivos.map(a => a.archivo); for (const n of ['informe.md', 'informe.html', 'informe.json']) assert.ok(nombres.includes(n));
    for (const a of man.archivos) assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(dir, a.archivo))).digest('hex'), a.sha256, a.archivo + ' coincide con su huella');
    const html = fs.readFileSync(path.join(dir, 'informe.html'), 'utf8'); assert.match(html, /inv-[0-9a-f]{8}/); assert.match(html, /<svg[^>]+viewBox/); assert.ok(!/<script/i.test(html), 'sin scripts'); assert.match(html, /Content-Security-Policy/);
    assert.equal((html.match(/<section class="sec"/g) || []).length, 18); assert.ok(!html.includes('⟦'), 'ninguna marca privada queda sin traducir'); assert.match(html, /Investigación on-chain: caso de prueba del informe/);
    const json = JSON.parse(fs.readFileSync(path.join(dir, 'informe.json'), 'utf8')); assert.equal(json.expediente.id, id); assert.ok(json.cifras.length >= 3);
    if (r.pdf) { const pdf = fs.readFileSync(r.pdf); assert.equal(pdf.subarray(0, 5).toString('latin1'), '%PDF-'); assert.ok(man.paginas >= 5, 'páginas: ' + man.paginas); assert.ok(nombres.includes('informe.pdf')); } else t.diagnostic('sin Chrome ni Edge: PDF no probado');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

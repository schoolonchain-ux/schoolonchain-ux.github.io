'use strict';
// Registrador + cliente + puerta REAL de ChainScope (con almacenes de juguete): lo que leen los adaptadores acaba en el expediente con las reglas del almacén aplicadas. Sin internet.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { montar } = require('../../chainscope/test/fixtures.cjs');
const { createServer } = require('../../chainscope/src/server.cjs');
const { crearClienteExpediente } = require('../src/cliente-expediente.cjs');
const { crearRegistrador } = require('../src/registrador.cjs');

const A = '0x' + '11'.repeat(20), B = '0x' + '22'.repeat(20), C = '0x' + '33'.repeat(20), USDT = '0x' + 'aa'.repeat(20), H1 = '0x' + 'ab'.repeat(32), H2 = '0x' + 'cd'.repeat(32);
const F = montar(); let S, cli, id, reg;
test.before(async () => {
  S = await createServer({ cfg: F.cfg, puerto: 0, pool: { trabajadores: 1, colaMaxima: 4, plazoMs: 8000 } });
  cli = crearClienteExpediente({ puerto: S.puerto, fichaFile: path.join(F.cfg.datos, 'investigador.token') });
  id = await cli.crear({ titulo: 'Integración', pregunta: '¿Qué hizo la dirección A el 29-10?' }); reg = crearRegistrador({ cliente: cli, expId: id });
});
test.after(async () => { await S.close(); F.limpiar(); });

const tx = (o = {}) => ({ ok: true, hash: H1, red: 'ethereum', consultado_utc: '2026-10-30T08:09:00.123Z', proveedor: 'rpc.test', estado: 'exitosa', from: A, to: USDT, valor_wei: '0', bloque: 26300799, ocurrido_utc: '2026-10-29T20:30:11Z',
  transferencias: [{ token: USDT, from: A, to: B, raw: '500000000000000', log_index: 0 }], monedas: { [USDT]: { simbolo_reportado: 'USDT', decimales: 6, verificado_por_contrato: true } }, limites: ['Las transferencias internas de ETH no están en el recibo.'],
  crudos: [{ tipo: 'eth_getTransactionReceipt', crudo: JSON.stringify({ r: 1, h: H1 }) }], ...o });

test('Transacción: se guarda la lectura cruda, la evidencia de cadena con su hash y fecha, y la consulta', async () => {
  const r = await reg.transaccion(tx()); assert.equal(r.ok, true);
  const v = await cli.ver(id), e = v.evidencias.find(x => x.id === r.evidencia);
  assert.equal(e.clase, 'hecho_cadena'); assert.equal(e.tx_hash, H1); assert.equal(e.bloque, 26300799); assert.equal(e.ocurrido_utc, '2026-10-29T20:30:11.000Z'); assert.match(e.texto, /500\.000\.000 USDT \(contrato verificado\)/);
  assert.match(e.raw_sha256, /^[0-9a-f]{64}$/); assert.equal((await cli.leerBlob(id, e.raw_sha256)).toString('utf8'), JSON.stringify({ r: 1, h: H1 }));
  const q = v.consultas.find(x => x.herramienta === 'transaccion'); assert.equal(q.estado, 'ok'); assert.deepEqual(q.evidencias, [r.evidencia]); assert.equal(q.parametros.hash, H1);
});

test('Transacción que no se pudo leer: queda NO_COMPROBADO con el motivo y la consulta fallida registrada (nada se oculta)', async () => {
  const r = await reg.transaccion({ ok: false, hash: H2, red: 'ethereum', consultado_utc: '2026-10-30T08:09:00Z', error: 'no se pudo leer el recibo: RED', no_disponible: true, crudos: [] });
  assert.equal(r.ok, false); const v = await cli.ver(id), e = v.evidencias.find(x => x.id === r.evidencias[0]);
  assert.equal(e.nivel, 'NO_COMPROBADO'); assert.match(e.limites[0], /RED/); const q = v.consultas.filter(x => x.herramienta === 'transaccion').pop(); assert.equal(q.estado, 'no_disponible'); assert.match(q.error, /RED/);
});

test('Ruta: la transferencia es OBSERVADA en cada salto; solo la atribución de los saltos 2+ es INFERIDA (FIFO, nunca «alta»), y se dibuja como relación inferida', async () => {
  const ruta = { ok: true, red: 'ethereum', direccion: A, sentido: 'out', consultado_utc: '2026-10-30T08:10:00Z', parametros: { profundidad: 2, minUsd: 1000000, fanout: 4, desde: 1793232000000, hasta: 1793353475782 }, ms: 1000, peticiones: 12,
    saltos: [{ id: 's1', profundidad: 1, de: A, a: B, tx: H1, token: USDT, simbolo: 'USDT', decimales: 6, raw: '500000000000000', usd: 5e8, ocurrido_utc: '2026-10-29T20:30:11Z', bloque: 26300799, fuente: 'Etherscan', clase: 'directa', via_swap: false, metodo: 'transferencia leída de la cadena', confianza: 'alta', atribucion: null, padres: [] },
      { id: 's2', profundidad: 2, de: B, a: C, tx: H2, token: USDT, simbolo: 'USDT', decimales: 6, raw: '100000000000000', usd: 1e8, ocurrido_utc: '2026-10-29T20:36:11Z', bloque: 26300820, fuente: 'Etherscan', clase: 'inferida', via_swap: false, metodo: 'FIFO sobre lo recibido de la ruta', confianza: 'baja', atribucion: { mezcla: true, cobertura: true }, padres: ['s1'] }],
    nodos: [{ direccion: C, parada: { tipo: 'etiqueta', detalle: 'exchange: Ejemplo', etiqueta: { nombre: 'Ejemplo', tipo: 'exchange', fuente: 'etiquetas.sqlite', confianza: 'media' } } }, { direccion: B, parada: null }],
    omitidos: { sinPrecio: { n: 652, simbolos: {} }, polvo: { n: 24, usd: 2657880 }, porLimite: { n: 5, usd: 103099407 }, conversiones: { n: 0, usd: 0 } }, avisos: [] };
  const r = await reg.ruta(ruta); assert.equal(r.ok, true);
  const v = await cli.ver(id), a1 = v.aristas.find(x => x.tx_hash === H1 && x.clase === 'directa'), a2 = v.aristas.find(x => x.tx_hash === H2);
  assert.ok(a1, 'salto 1 = relación directa'); assert.equal(a2.clase, 'inferida'); assert.match(a2.metodo, /FIFO/);
  const evA2 = a2.evidencias.map(e => v.evidencias.find(x => x.id === e)); assert.deepEqual(evA2.map(e => e.clase).sort(), ['hecho_cadena', 'inferencia']);
  const inf = evA2.find(e => e.clase === 'inferencia'); assert.equal(inf.confianza, 'baja'); assert.ok(inf.alternativas.length >= 2); assert.ok(inf.limites.some(l => /FIFO no demuestra/.test(l)) && inf.limites.some(l => /cota superior/.test(l)));
  assert.ok(inf.base.length >= 2, 'la inferencia cita la transferencia y la ruta anterior como base');
  assert.ok(v.direcciones.find(d => d.direccion === C && d.etiqueta === 'Ejemplo' && d.etiqueta_fuente), 'la etiqueta lleva su fuente');
  assert.ok(v.evidencias.some(e => e.nivel === 'NO_COMPROBADO' && /Lo que NO se siguió: 652/.test(e.texto)), 'lo omitido se declara');
  assert.equal(v.libro.ok, true);
});

test('Contrato y eventos: lo observado y lo deducido del bytecode quedan separados; la verificación externa es «fuente externa»', async () => {
  const c = { ok: true, red: 'ethereum', direccion: USDT, consultado_utc: '2026-10-30T08:11:00Z', es_contrato: true, bytecode: { bytes: 11075, sha256: 'ab'.repeat(32) }, proxy: { es_proxy: false, evidencia: [] }, vistas: { owner: A, symbol: 'USDT', decimals: 6 },
    funciones_control: [{ grupo: 'lista_negra', firma: 'addBlackList(address)', selector: '0x0ecb93c0', en: ['contrato'] }], verificacion: { sourcify: 'verificado_parcial' }, clasificacion: { tipo: 'token' }, limites: ['Un selector presente en el bytecode indica que PUEDE tener esa función.'], crudos: [{ tipo: 'eth_getCode', crudo: '{"c":1}' }] };
  const r = await reg.contrato(c); assert.equal(r.ok, true);
  let v = await cli.ver(id); const ds = r.evidencias.map(e => v.evidencias.find(x => x.id === e));
  assert.deepEqual(ds.map(e => e.clase), ['hecho_cadena', 'hecho_cadena', 'inferencia', 'fuente_externa']); const inf = ds[2]; assert.deepEqual(inf.base, [ds[0].id]); assert.ok(inf.alternativas.length >= 1);
  const ev = { ok: true, direccion: USDT, consultado_utc: '2026-10-30T08:12:00Z', crudos: [{ tipo: 'etherscan:getLogs:AddedBlackList', crudo: '{"l":1}' }], eventos: [
    { evento: 'AddedBlackList', estado: 'ok', total: 1, truncado: false, desde_bloque: 26300000, registros: [{ tx: H1, bloque: 26300954, utc: '2026-10-29T21:01:35Z', topics: [], data: '0x' + '00'.repeat(12) + A.slice(2) }] }, { evento: 'RemovedBlackList', estado: 'ok', total: 0, desde_bloque: 26300000, registros: [] }, { evento: 'Pause', estado: 'error', detalle: 'Max rate limit' }] };
  const e = await reg.eventos(ev, { red: 'ethereum' }); assert.equal(e.ok, true); v = await cli.ver(id);
  const ee = e.evidencias.map(x => v.evidencias.find(y => y.id === x)); assert.equal(ee[0].tx_hash, H1); assert.equal(ee[0].bloque, 26300954); assert.match(ee[1].texto, /ningún registro/); assert.equal(ee[1].confianza, 'media'); assert.equal(ee[2].nivel, 'NO_COMPROBADO');
});

test('Documento externo: queda como «fuente externa» con su copia del texto y huella; un dominio no autorizado se registra como no disponible', async () => {
  const d = { ok: true, url: 'https://www.binance.com/es/support/announcement/x', dominio: 'www.binance.com', status: 200, consultado_utc: '2026-10-30T08:13:00Z', titulo: 'Aviso', texto: 'Texto del aviso', resumen: 'Texto del aviso', sha256_html: 'cd'.repeat(32), limites: ['Fuente de terceros.'] };
  const r = await reg.documento(d); const v = await cli.ver(id), e = v.evidencias.find(x => x.id === r.evidencias[0]); assert.equal(e.clase, 'fuente_externa'); assert.equal(e.fuente, d.url); assert.match((await cli.leerBlob(id, e.raw_sha256)).toString(), /Texto del aviso/);
  const n = await reg.documento({ ok: false, no_permitido: true, url: 'https://evil.example/x', dominio: 'evil.example', consultado_utc: '2026-10-30T08:13:00Z', error: 'dominio no autorizado' }); assert.equal(n.ok, false);
  const q = (await cli.ver(id)).consultas.filter(x => x.herramienta === 'documento').pop(); assert.equal(q.estado, 'no_disponible');
});

test('Puerta: el almacén sigue rechazando lo que incumple las reglas aunque lo envíe el registrador (p. ej. confirmar una hipótesis sin contraprueba)', async () => {
  const h = await cli.hipotesis(id, { texto: 'A envió fondos a B', tipo: 'destino_fondos', confirma: ['transferencia directa A→B'], refuta: ['ninguna transferencia'] });
  const e1 = (await cli.ver(id)).evidencias.find(x => x.tx_hash === H1 && x.clase === 'hecho_cadena'); await cli.vincular(id, h.id, e1.id, 'apoya', 'directa');
  await assert.rejects(cli.veredicto(id, h.id, 'confirmada', 'transferencia observada en cadena'), e => e.codigo === 'REGLA' && /EN CONTRA/.test(e.message));
  await cli.consulta(id, { herramienta: 'transaccion', parametros: { red: 'ethereum', hash: H2 }, proposito: 'contraprueba', hipotesis: h.id, estado: 'sin_datos', ts_utc: '2026-10-30T08:20:00Z' });
  assert.equal((await cli.veredicto(id, h.id, 'confirmada', 'transferencia observada en cadena y sin evidencia en contra')).estado, 'confirmada');
});

test('Bloqueo y documento aportado por el propietario: quedan como hecho de cadena y como fuente externa de confianza baja, con su origen declarado', async () => {
  const b = await reg.bloqueo({ ok: true, red: 'ethereum', token: USDT, direccion: A, funcion: 'isBlackListed(address)', bloqueada: true, consultado_utc: '2026-10-30T08:30:00Z', crudos: [{ tipo: 'eth_call:isBlackListed(address)', crudo: '{"b":1}' }], limites: ['Es el estado en el momento de la consulta.'] });
  let v = await cli.ver(id); const e = v.evidencias.find(x => x.id === b.evidencias[0]); assert.equal(e.clase, 'hecho_cadena'); assert.equal(e.contrato, USDT); assert.match(e.texto, /ESTÁ en la lista de bloqueo/);
  const nb = await reg.bloqueo({ ok: false, no_disponible: true, red: 'bnb', token: USDT, direccion: A, consultado_utc: '2026-10-30T08:30:00Z', error: 'el contrato no contestó' }); assert.equal(nb.ok, false);
  const ap = await reg.aportado({ titulo: 'Comunicado oficial', texto: 'Binance informa de un incidente de seguridad…', origen: 'binance.com/es/support/announcement/…', consultado_utc: '2026-10-30T09:00:00Z' }); v = await cli.ver(id);
  const d = v.evidencias.find(x => x.id === ap.evidencias[0]); assert.equal(d.clase, 'fuente_externa'); assert.equal(d.confianza, 'baja'); assert.ok(d.limites.some(l => /origen no está verificado/.test(l))); assert.match((await cli.leerBlob(id, d.raw_sha256)).toString(), /incidente de seguridad/);
});

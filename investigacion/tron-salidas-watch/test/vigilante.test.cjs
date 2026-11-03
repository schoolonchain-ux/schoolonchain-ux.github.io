'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const V = require('../src/vigilante.cjs');

const VANECK = 'TCGVFGDd62LSrfZEaz3M3fYifWWdSDHRL8', SEGUNDA = 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', HTX4 = 'TFTWNgDBkQ5wQoP8RXpRznnHvAVV8x5jLu', NUEVA = 'TUVw5u9yCG1CdE9aYrt6tzAoJciZ6hFgxa', OTRA = 'TKK4M7HNG4NzfGYD3YGPMWZqZnZApycEfX';
const T0 = Date.UTC(2026, 9, 31, 9, 0, 0);
const cuenta = { direccion: VANECK, nombre: 'Vaneck', esperado: [{ fecha: '2026-10-31', trx: 132700000 }] };
const config = { umbralTrx: 1000000, diasSeguimientoDestinos: 10, profundidadMaxima: 2, horaRecordatorioLocal: 8, cuentas: [cuenta, { direccion: SEGUNDA, nombre: 'Segunda', esperado: [] }] };
const trx = (from, to, m, at, tx) => ({ tx, idx: 0, flujo: 'nativo', from, to, token: 'native', raw: String(m * 1e6), decimals: 6, at, symbol: null });
const stake = (owner, tipo, raw, at, tx) => ({ tx, idx: 0, owner, tipo, recurso: 'ENERGY', raw, receptor: null, at, contrato: tipo });
const conocidas = { direcciones: { [HTX4]: { nombre: 'HTX 4', tipo: 'exchange', fuente: 'TronScan' }, [VANECK]: { nombre: 'Vaneck', tipo: 'vigilada', fuente: 'TronScan' } } };
const nombres = () => V.crearNombres({ conocidas, now: () => T0 });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tsw-test-'));

test('detectar: retirada, descongelación, salida y entrada por encima del umbral; lo pequeño no cuenta', () => {
  const lectura = { edges: [trx(VANECK, NUEVA, 200e6, T0, 'a'.repeat(64)), trx(VANECK, OTRA, 5, T0, 'b'.repeat(64)), trx(HTX4, VANECK, 3e6, T0, 'c'.repeat(64))], stake: [stake(VANECK, 'retirar_descongelado', null, T0 - 1000, 'd'.repeat(64)), stake(VANECK, 'descongelar', '50000000000000', T0, 'e'.repeat(64)), stake(SEGUNDA, 'retirar_descongelado', null, T0, 'f'.repeat(64))] };
  const h = V.detectar({ cuenta, lectura, umbral: 1e6 });
  assert.deepStrictEqual(h.map(x => x.clase), ['retirada', 'descongelar', 'salida', 'entrada']);
  assert.strictEqual(h[1].trx, 50e6);
  assert.strictEqual(h[2].destino, NUEVA); assert.strictEqual(h[2].cantidad, 200e6);
  assert.strictEqual(h[3].origen, HTX4);
  assert.strictEqual(new Set(h.map(x => x.clave)).size, 4, 'claves únicas');
});

test('detectar: tokens TRC20 con decimales; sin decimales conocidos no se inventa el importe', () => {
  const edges = [{ tx: '1'.repeat(64), idx: 0, flujo: 'token', from: VANECK, to: OTRA, token: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', raw: '2500000000000', decimals: 6, at: T0, symbol: 'USDT' }, { tx: '2'.repeat(64), idx: 0, flujo: 'token', from: VANECK, to: OTRA, token: 'TXYZ', raw: '999', decimals: null, at: T0, symbol: '?' }];
  const h = V.detectar({ cuenta, lectura: { edges, stake: [] }, umbral: 1e6 });
  assert.strictEqual(h.length, 1); assert.strictEqual(h[0].simbolo, 'USDT'); assert.strictEqual(h[0].cantidad, 2.5e6);
});

test('detectar: salida y entrada de tokens en la misma transacción se unen en un intercambio; con TRX no', () => {
  const tx = '3'.repeat(64), edges = [{ tx, idx: 0, flujo: 'token', from: VANECK, to: OTRA, token: 'TUSDD', raw: '30000000000000000000000000', decimals: 18, at: T0, symbol: 'USDD' }, { tx, idx: 0, flujo: 'token', from: NUEVA, to: VANECK, token: 'TUSDT', raw: '30000000000000', decimals: 6, at: T0, symbol: 'USDT' }, trx(VANECK, OTRA, 2e6, T0, '4'.repeat(64)), trx(HTX4, VANECK, 2e6, T0, '4'.repeat(64))];
  const h = V.detectar({ cuenta, lectura: { edges, stake: [] }, umbral: 1e6 });
  assert.deepStrictEqual(h.map(x => x.clase).sort(), ['entrada', 'intercambio', 'salida']);
  const i = h.find(x => x.clase === 'intercambio'); assert.strictEqual(i.entrega.simbolo, 'USDD'); assert.strictEqual(i.recibe.cantidad, 30e6); assert.strictEqual(i.claves.length, 2);
  const m = V.mensaje(i, { nombreCuenta: 'Vaneck', nombreDestino: { nombre: 'contrato inteligente «PSM»', tipo: 'contrato' }, precio: null });
  assert.ok(m.includes('ha cambiado <b>30,0 M USDD</b> por <b>30,0 M USDT</b>'), m); assert.match(m, /PSM/);
});

test('mensajes: nombre y enlace del destino, dólares con fecha del precio, casa de cambio detiene el seguimiento', () => {
  const precio = { usd: 0.33, fecha: '2026-10-29' };
  const h = { clase: 'salida', cuenta: VANECK, destino: HTX4, cantidad: 200e6, simbolo: 'TRX', at: T0, tx: 'a'.repeat(64) };
  const m = V.mensaje(h, { nombreCuenta: 'Vaneck', nombreDestino: { nombre: 'HTX 4', tipo: 'exchange' }, precio, seguir: null });
  assert.match(m, /200,0 M TRX/); assert.match(m, /66,0 M\$/); assert.match(m, /cierre del 29-10/); assert.match(m, /HTX 4<\/i> \(casa de cambio\)/); assert.match(m, new RegExp(V.enlace(HTX4).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(m, /ya no se ve en la cadena/);
  const m2 = V.mensaje({ ...h, destino: NUEVA }, { nombreCuenta: 'Vaneck', nombreDestino: null, precio, seguir: 10 });
  assert.match(m2, /sin nombre conocido/); assert.match(m2, /Sigo esa billetera 10 días/);
  const r = V.mensaje({ clase: 'retirada', cuenta: VANECK, at: T0, tx: 'b'.repeat(64) }, { nombreCuenta: 'Vaneck', precio, estado: { ok: true, saldoLibreTrx: 133e6, pendienteTotalTrx: 0 } });
  assert.match(r, /retirado al saldo/); assert.match(r, /133,0 M TRX/); assert.match(r, /la cadena no dice cuánto/);
  const rec = V.mensajeRecordatorio({ cuenta, esperado: cuenta.esperado[0], estado: { ok: true, saldoLibreTrx: 1e6, pendienteDeRetirar: [{ trx: 132.7e6, expira: T0 - 1000 }] }, precio, ahora: T0 });
  assert.match(rec, /Hoy 31-10/); assert.match(rec, /132,7 M TRX \(ya libre\)/);
  assert.match(V.mensaje({ clase: 'salida', cuenta: VANECK, destino: OTRA, cantidad: 1e6, simbolo: 'TRX', at: T0, tx: 'c'.repeat(64) }, { nombreCuenta: 'A <b>&', nombreDestino: null, precio: null }), /A &lt;b&gt;&amp;/, 'se escapa el HTML');
});

test('ciclo: avisa una vez por hecho, sigue a la billetera nueva y cierra el seguimiento cuando llega a una casa de cambio', async () => {
  const dir = tmp(); const E = V.crearEstado(dir); const enviados = [];
  const enviar = async text => { enviados.push(text); return { message_id: enviados.length, chat: { id: 1 } }; };
  let fase = 1;
  const reader = {
    async leerVentana(net, addr, desde, hasta) {
      if (fase === 1 && addr === VANECK) return { edges: [trx(VANECK, NUEVA, 200e6, T0 - 5 * 60000, 'a'.repeat(64))], stake: [stake(VANECK, 'retirar_descongelado', null, T0 - 6 * 60000, 'd'.repeat(64))], cobertura: {}, errores: [] };
      if (fase === 2 && addr === NUEVA) return { edges: [trx(NUEVA, HTX4, 200e6, T0 + 60000, 'b'.repeat(64))], stake: [], cobertura: {}, errores: [] };
      return { edges: [], stake: [], cobertura: {}, errores: [] };
    },
    async estadoCuenta() { return { ok: true, saldoLibreTrx: 1e6, pendienteTotalTrx: 0, pendienteDeRetirar: [] }; }
  };
  const base = { reader, nombres: nombres(), enviar, estado: E, config: { ...config, horaRecordatorioLocal: 99 } };
  let r = await V.ejecutarCiclo({ ...base, now: () => T0 });
  assert.strictEqual(r.avisos, 2); assert.match(enviados[0], /retirado al saldo/); assert.match(enviados[1], /Sigo esa billetera 10 días/);
  assert.ok(E.estado.destinos[NUEVA] && E.estado.destinos[NUEVA].nivel === 1);
  assert.strictEqual(E.estado.cursores[VANECK], T0 - 60000, 'el cursor avanza hasta «ahora − 1 min»');
  // Mismo hecho otra vez (solape): no se repite.
  r = await V.ejecutarCiclo({ ...base, now: () => T0 + 60000 });
  assert.strictEqual(r.avisos, 0);
  // La billetera nueva mueve el TRX a HTX 4.
  fase = 2;
  r = await V.ejecutarCiclo({ ...base, now: () => T0 + 10 * 60000 });
  assert.strictEqual(r.avisos, 1); assert.match(enviados[2], /ha seguido camino/); assert.match(enviados[2], /HTX 4/); assert.match(enviados[2], /aquí termina/);
  assert.match(E.estado.destinos[NUEVA].cerrado, /HTX 4/);
  // Reabrir el estado desde disco conserva lo visto.
  const E2 = V.crearEstado(dir); assert.ok(E2.vistos.has('retirada|' + 'd'.repeat(64))); assert.strictEqual(fs.readFileSync(E2.ficheros.avisos, 'utf8').trim().split('\n').length, 3);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('ciclo: con fallo de lectura el cursor no avanza y el aviso de fallo llega al tercer ciclo, una sola vez en 6 h', async () => {
  const dir = tmp(); const E = V.crearEstado(dir); const enviados = [];
  const reader = { async leerVentana() { return { edges: [], stake: [], cobertura: {}, errores: [{ flujo: 'nativo', error: 'TronGrid HTTP 503' }] }; }, async estadoCuenta() { return { ok: false }; } };
  const base = { reader, nombres: nombres(), enviar: async t => { enviados.push(t); return { ok: true }; }, estado: E, config: { ...config, horaRecordatorioLocal: 99 } };
  for (let i = 0; i < 4; i++) await V.ejecutarCiclo({ ...base, now: () => T0 + i * 10 * 60000 });
  assert.strictEqual(E.estado.cursores[VANECK], undefined);
  assert.strictEqual(enviados.length, 1); assert.match(enviados[0], /sin poder leer bien TronGrid/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('ciclo: el recordatorio del día esperado sale una vez a partir de la hora configurada (hora de Madrid)', async () => {
  const dir = tmp(); const E = V.crearEstado(dir); const enviados = [];
  const reader = { async leerVentana() { return { edges: [], stake: [], cobertura: {}, errores: [] }; }, async estadoCuenta() { return { ok: true, saldoLibreTrx: 2e6, pendienteDeRetirar: [{ trx: 132.7e6, expira: T0 + 3600000 }], pendienteTotalTrx: 132.7e6 }; } };
  const base = { reader, nombres: nombres(), enviar: async t => { enviados.push(t); return { ok: true }; }, estado: E, config };
  await V.ejecutarCiclo({ ...base, now: () => Date.UTC(2026, 9, 31, 5, 0, 0) });   // 06:00 Madrid: aún no
  assert.strictEqual(enviados.length, 0);
  await V.ejecutarCiclo({ ...base, now: () => T0 });                                 // 10:00 Madrid
  await V.ejecutarCiclo({ ...base, now: () => T0 + 3600000 });
  assert.strictEqual(enviados.length, 1); assert.match(enviados[0], /Hoy 31-10/); assert.match(enviados[0], /libre el/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('nombres: directorio propio, lista de las 10.000 mayores y TronScan en vivo con caché; una casa de cambio se reconoce por el nombre', async () => {
  let llamadas = 0;
  const n = V.crearNombres({ conocidas, lista: { filas: [{ address: OTRA, addressTag: 'Binance-Cold 2' }] }, tronscan: async () => { llamadas++; return { ok: true, tag: 'Bybit-Hot' }; }, now: () => T0 });
  assert.deepStrictEqual(await n.nombreDe(HTX4), { nombre: 'HTX 4', tipo: 'exchange', fuente: 'TronScan' });
  assert.strictEqual((await n.nombreDe(OTRA)).tipo, 'exchange');
  const vivo = await n.nombreDe(NUEVA); assert.strictEqual(vivo.nombre, 'Bybit-Hot'); assert.strictEqual(vivo.tipo, 'exchange');
  await n.nombreDe(NUEVA); assert.strictEqual(llamadas, 1, 'la segunda vez sale de la caché');
  assert.strictEqual(await n.nombreDe('no-es-direccion'), null);
});

test('entrega: el cliente de Telegram devuelve el mensaje (message_id), no { ok }', () => {
  assert.strictEqual(V.entregado({ message_id: 134, chat: { id: 1 } }), true); assert.strictEqual(V.idMensaje({ message_id: 134 }), 134);
  assert.strictEqual(V.entregado({ ok: true, simulado: true }), true); assert.strictEqual(V.entregado(null), false); assert.strictEqual(V.entregado({}), false);
});

test('formato: importes en español', () => {
  assert.strictEqual(V.fmtTrx(132700000), '132,7 M TRX'); assert.strictEqual(V.fmtTrx(950000), '950.000 TRX'); assert.strictEqual(V.fmtTrx(1.5e9), '1,50 mil M TRX'); assert.strictEqual(V.fmtTrx(2.5e6, 'USDT'), '2,5 M USDT');
  assert.strictEqual(V.fmtUsd(66e6), '66,0 M$');
});

test('ciclo: una cuenta con su propio umbral y sin seguimiento de destinos avisa de la salida grande, calla la pequeña y no sigue a nadie', async () => {
  const dir = tmp(); const E = V.crearEstado(dir); const enviados = [];
  const enviar = async text => { enviados.push(text); return { message_id: enviados.length, chat: { id: 1 } }; };
  const ROBO = 'TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki';
  const reader = { async leerVentana(net, addr) { if (addr === ROBO) return { edges: [trx(ROBO, NUEVA, 60e6, T0 - 5 * 60000, 'e'.repeat(64)), trx(ROBO, OTRA, 20e6, T0 - 4 * 60000, 'f'.repeat(64))], stake: [], cobertura: {}, errores: [] }; return { edges: [], stake: [], cobertura: {}, errores: [] }; }, async estadoCuenta() { return { ok: true }; } };
  const cfg = { ...config, horaRecordatorioLocal: 99, cuentas: [{ direccion: ROBO, nombre: 'Robo Binance', umbralTrx: 50000000, seguirDestinos: false }] };
  const r = await V.ejecutarCiclo({ reader, nombres: nombres(), enviar, estado: E, config: cfg, now: () => T0 });
  assert.strictEqual(r.hechos, 1); assert.strictEqual(enviados.length, 1); assert.match(enviados[0], /60,0 M TRX/); assert.doesNotMatch(enviados[0], /seguir/i);
  assert.deepStrictEqual(Object.keys(E.estado.destinos), []);
});

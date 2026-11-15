'use strict';
// Pruebas de decidir.cjs (validez y publicación del monitor de liquidez de sun.io). Uso, desde esta carpeta: node --test
// Nacieron del caso real del 13-nov-2026: se retiró casi toda la liquidez del mercado stUSDT/USDT (tx 0e1943ba…, bloque 87968918) y la regla antigua
// («tenía mercado y ahora sale sin mercado = lectura no válida») dejó el monitor sin publicar 30 h. Aquí se comprueba que (1) una pérdida real se publica cuando
// dos lecturas completas la confirman, (2) una lectura incompleta o con errores sigue sin publicarse nunca, y (3) con una sola lectura la pérdida queda pendiente.
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process');
const D = require('./decidir.cjs');
const MK = JSON.parse(fs.readFileSync(path.join(__dirname, 'mercados.json'), 'utf8')).mercados;
const SIMBOLOS = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens.json'), 'utf8')).tokens.map(t => t.simbolo);
const ISO = ms => new Date(ms).toISOString();
const AHORA = Date.parse('2026-11-14T21:25:00Z');
const curva = (c = 0.3) => Array.from({ length: 84 }, (_, i) => { const usd = Math.round(100 * Math.pow(5e7 / 100, i / 83)); return { usd, salidaUsdt: Math.round(usd * (1 - c / 100) * 100) / 100, costePct: c, ruta: 'directa', partes: [[0, 1]] }; });
// token como lo escribe liquidez.cjs: leyó todos sus mercados; con `sin` no tiene mercado con profundidad (como stUSDT el 14-nov: mercadosDirectos 1, curva vacía)
const token = (s, o = {}) => { const e = D.esperados(MK, s); const base = { simbolo: s, mercadosDirectos: e.d, mercadosSalto1: e.s1, precioReferenciaUsdt: 1, curva: curva(), maximos: {} }; return o.sin ? { ...base, precioReferenciaUsdt: null, curva: [], maximos: {}, sinMercado: true, ...o.cambio } : { ...base, ...o.cambio }; };
const lectura = (t, { sinMercado = [], cambios = {}, errores = [] } = {}) => ({ version: 1, generado: ISO(t), errores, avisos: [], tokens: SIMBOLOS.map(s => token(s, { sin: sinMercado.includes(s), cambio: cambios[s] })) });
const HACE = h => AHORA - h * 36e5;

test('el recuento de mercados esperados coincide con lo que leyó el monitor el 13-nov (lectura publicada) y con la lectura del 14-nov', () => {
  for (const f of ['../repo/data/liquidez-sunswap.json', '../logs/liquidez-nuevo.json']) {
    const p = path.join(__dirname, f); if (!fs.existsSync(p)) continue;
    for (const t of JSON.parse(fs.readFileSync(p, 'utf8')).tokens) assert.ok(D.completo(MK, t), f + ': ' + t.simbolo + ' no cuadra con mercados.json');
  }
});
test('lectura sana y nada publicado → se publica', () => {
  const r = D.decidir(lectura(AHORA), null, AHORA); assert.equal(r.publicar, true); assert.deepEqual(r.problemas, []);
});
test('una lectura con errores de la cadena no se publica', () => {
  const r = D.decidir(lectura(AHORA, { errores: [{ id: 'v2:x', error: 'reservas no legibles' }] }), lectura(HACE(5)), AHORA); assert.equal(r.publicar, false); assert.ok(r.problemas.length);
});
test('lectura incompleta (a un token le falta un mercado por leer) no se publica, aunque no haya errores ni pérdida', () => {
  const nuevo = lectura(AHORA, { cambios: { WTRX: { mercadosDirectos: D.esperados(MK, 'WTRX').d - 1 } } });
  const r = D.decidir(nuevo, lectura(HACE(5)), AHORA); assert.equal(r.publicar, false); assert.match(r.problemas.join(' '), /WTRX: lectura incompleta/);
});
test('lectura incompleta con el token «sin mercado» tampoco se publica (no se confunde con una pérdida real)', () => {
  const nuevo = lectura(AHORA, { sinMercado: ['stUSDT'], cambios: { stUSDT: { mercadosDirectos: 0 } } });
  const r = D.decidir(nuevo, lectura(HACE(5)), AHORA, lectura(HACE(1), { sinMercado: ['stUSDT'] })); assert.equal(r.publicar, false); assert.match(r.problemas.join(' '), /stUSDT: lectura incompleta/);
});
test('falta un token o una curva queda corta: no se publica', () => {
  const sinTok = lectura(AHORA); sinTok.tokens = sinTok.tokens.filter(t => t.simbolo !== 'BTC');
  assert.match(D.decidir(sinTok, null, AHORA).problemas.join(' '), /falta el token BTC/);
  assert.match(D.decidir(lectura(AHORA, { cambios: { ETH: { curva: curva().slice(0, 20) } } }), null, AHORA).problemas.join(' '), /ETH: curva incompleta/);
});
test('CASO REAL: stUSDT pierde el mercado con la lectura completa y no hay lectura previa → pendiente, no se publica ni se da por error', () => {
  const r = D.decidir(lectura(AHORA, { sinMercado: ['stUSDT'] }), lectura(HACE(30)), AHORA);
  assert.equal(r.publicar, false); assert.deepEqual(r.problemas, []); assert.deepEqual(r.pendientes, ['stUSDT']);
});
test('CASO REAL: la lectura de hace 1 h dice lo mismo (completa) → la pérdida se confirma y se publica', () => {
  const r = D.decidir(lectura(AHORA, { sinMercado: ['stUSDT'] }), lectura(HACE(30)), AHORA, lectura(HACE(1), { sinMercado: ['stUSDT'] }));
  assert.equal(r.publicar, true); assert.deepEqual(r.problemas, []); assert.deepEqual(r.pendientes || [], []);
  assert.match(r.cambios.join(' '), /stUSDT: ha perdido su mercado/); assert.match(r.motivo, /han pasado 30\.0 h/);
});
test('la previa NO confirma si es muy reciente (<10 min), muy vieja (>6 h), con errores, con el token aún con mercado o con ese token incompleto', () => {
  const nuevo = lectura(AHORA, { sinMercado: ['stUSDT'] }), ant = lectura(HACE(30));
  const prev = (h, o) => lectura(HACE(h), o);
  for (const [nombre, previa] of [['reciente', prev(0.05, { sinMercado: ['stUSDT'] })], ['vieja', prev(7, { sinMercado: ['stUSDT'] })], ['con errores', prev(1, { sinMercado: ['stUSDT'], errores: [{ id: 'x', error: 'e' }] })],
    ['con mercado', prev(1)], ['incompleta', prev(1, { sinMercado: ['stUSDT'], cambios: { stUSDT: { mercadosDirectos: 0 } } })], ['sin fecha', { ...prev(1, { sinMercado: ['stUSDT'] }), generado: 'no' }]]) {
    const r = D.decidir(nuevo, ant, AHORA, previa); assert.equal(r.publicar, false, nombre); assert.deepEqual(r.pendientes, ['stUSDT'], nombre);
  }
});
test('un token que ya estaba «sin mercado» en la lectura publicada (LTC, DOGE) no cuenta como pérdida: sigue la decisión normal', () => {
  const r = D.decidir(lectura(AHORA, { sinMercado: ['LTC'] }), lectura(HACE(30), { sinMercado: ['LTC'] }), AHORA); assert.equal(r.publicar, true); assert.match(r.motivo, /han pasado/);
});
test('un token que recupera su mercado se publica sin pedir confirmación', () => {
  const r = D.decidir(lectura(AHORA), lectura(HACE(30), { sinMercado: ['stUSDT'] }), AHORA); assert.equal(r.publicar, true); assert.deepEqual(r.pendientes || [], []);
});
test('la pérdida confirmada respeta el ritmo de publicación: si se publicó hace menos de 1,5 h, espera', () => {
  const r = D.decidir(lectura(AHORA, { sinMercado: ['stUSDT'] }), lectura(HACE(1)), AHORA, lectura(HACE(0.5), { sinMercado: ['stUSDT'] }));
  assert.equal(r.publicar, false); assert.match(r.motivo, /cambio\(s\) de veredicto pero se publicó hace solo|sin cambios/); assert.deepEqual(r.problemas, []);
});
test('por línea de órdenes (como lo llama Actualizar-Liquidez.ps1): nuevo, publicado y --previa', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'decidir-')); const w = (n, o) => { const f = path.join(dir, n); fs.writeFileSync(f, JSON.stringify(o)); return f; };
  const ahoraReal = Date.now(); const nuevo = w('nuevo.json', lectura(ahoraReal, { sinMercado: ['stUSDT'] })), pub = w('pub.json', lectura(ahoraReal - 30 * 36e5)), previa = w('previa.json', lectura(ahoraReal - 36e5, { sinMercado: ['stUSDT'] }));
  const salida = a => JSON.parse(cp.execFileSync(process.execPath, [path.join(__dirname, 'decidir.cjs'), ...a], { encoding: 'utf8' }).trim().split('\n').pop());
  assert.equal(salida([nuevo, pub, '--previa', previa]).publicar, true);
  assert.deepEqual(salida([nuevo, pub]).pendientes, ['stUSDT']);
  assert.equal(salida([nuevo, path.join(dir, 'no-existe.json'), '--previa', previa]).publicar, true);   // nada publicado todavía
  fs.rmSync(dir, { recursive: true, force: true });
});

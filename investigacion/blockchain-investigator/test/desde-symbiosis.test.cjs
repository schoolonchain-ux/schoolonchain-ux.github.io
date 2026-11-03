'use strict';
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const { Libro } = require('../src/libro-mayor/modelo.cjs'); const symb = require('../src/libro-mayor/desde-symbiosis.cjs'); const { añadirAlLibro, añadirSeguimientoEth, METAROUTER } = symb;
const T0 = Date.UTC(2026, 9, 31, 18, 0, 0);
function carpeta(llegadas, destino, filas) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sym-')); fs.writeFileSync(path.join(d, 'symbiosis-llegadas.json'), JSON.stringify(llegadas)); fs.writeFileSync(path.join(d, 'metarouter-destino.json'), JSON.stringify(destino)); fs.writeFileSync(path.join(d, 'metarouter-resumen.json'), JSON.stringify({ filas })); return d; }
function libroConEnvio(tx, usd) { const L = new Libro(); L.mov({ cadena: 'tron', tx, activo: 'USDT', importe: usd, usd, usdEstado: 'ESTIMADO', de: 'TRemitente', a: METAROUTER, t: T0, tipo: 'deposito_contrato' }); return L; }

test('un cruce correcto crea el recibo en Ethereum y un grupo puente conciliado en dólares', () => {
  const tx = 'a1'.repeat(32); const L = libroConEnvio(tx, 10000); const hora = new Date(T0 + 80000).toISOString();
  const d = carpeta({ [tx]: { estado: 'Success', llegada: { cadena: 1, tx: '0xdest', receptor: '0xrecep', activo: 'ETH', importe: 4.4, hora } } }, { [tx]: { cadenaFinalId: 1, contratoDestino: '0xRECEP' } }, [{ tx }]);
  const r = añadirAlLibro(L, d); assert.equal(r.conLlegada, 1); assert.equal(r.ok, 1); assert.equal(r.revertidos, 0);
  const g = L.grupos.get('puente:' + tx); assert.ok(g); assert.equal(g.tipo, 'puente'); assert.ok(L.porId.get(g.recibo).tipo === 'puente_recibo'); assert.equal(L.porId.get(g.recibo).cadena, 'ethereum');
  assert.ok(Math.abs(g.enviadoUsd - 10000) < 1e-6);
});
test('un cruce revertido se anota como devolución y no como destino', () => {
  const tx = 'b2'.repeat(32); const L = libroConEnvio(tx, 5000); const hora = new Date(T0 + 90000).toISOString();
  const d = carpeta({ [tx]: { estado: 'Reverted', llegada: { cadena: 728126428, tx: 'ret', receptor: 'TRemitente', activo: 'USDT', importe: 4990, hora } } }, { [tx]: { cadenaFinalId: 1, contratoDestino: '0xx' } }, [{ tx }]);
  const r = añadirAlLibro(L, d); assert.equal(r.revertidos, 1); assert.equal(r.devuelto.n, 1); assert.ok(Math.abs(r.devuelto.usd - 4990) < 1e-6); assert.equal(r.ok, 0); assert.equal(L.grupos.get('puente:' + tx).revertido, true);
});
test('una diferencia grande entre lo enviado y lo recibido queda DESCONOCIDO, no se ajusta', () => {
  const tx = 'c3'.repeat(32); const L = libroConEnvio(tx, 10000); const hora = new Date(T0).toISOString();
  const d = carpeta({ [tx]: { estado: 'Success', llegada: { cadena: 1, tx: '0xd', receptor: '0xr', activo: 'USDC', importe: 6000, hora } } }, { [tx]: { cadenaFinalId: 1, contratoDestino: '0xr' } }, [{ tx }]);
  const r = añadirAlLibro(L, d); assert.equal(L.grupos.get('puente:' + tx).estado, 'DESCONOCIDO'); assert.equal(r.discrepancias.length, 1);
});
test('sin los archivos de Symbiosis no se inventa nada', () => { assert.equal(añadirAlLibro(new Libro(), path.join(os.tmpdir(), 'no-existe-sym')), null); });
test('seguimiento en Ethereum: anota ETH y stablecoins genuinas, cuenta aparte los otros tokens, no duplica y descarta lo anterior a la entrada trazada', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'eth-')); const t = T0 / 1000;
  const nodos = { '0xaaa': { salidas: [{ a: '0xbbb', eth: 3, tx: '0xt1', t: t + 100 }, { a: '0xold', eth: 9, tx: '0xviejo', t: t - 86400 }], tokens: [{ a: '0xccc', token: 'USDT', v: 100, tx: '0xt2', t: t + 100 }, { a: '0xddd', token: 'WETH', v: 2, tx: '0xt3', t: t + 100 }] } };
  fs.writeFileSync(path.join(d, 'eth-adelante-v2.json'), JSON.stringify({ nodos, semillas: { '0xaaa': t }, ficha: {} })); const L = new Libro(); const r = añadirSeguimientoEth(L, d); assert.equal(r.n, 2); assert.equal(r.tokensNoAnotados, 1);
  assert.ok(!L.movs.some(m => m.tx === '0xviejo'), 'una salida anterior a la primera entrada trazada no es del robo'); const r2 = añadirSeguimientoEth(L, d); assert.equal(r2.n, 0); assert.equal(L.movs.length, 2);
});
function carpetaEth(nodos, semillas, llegadas) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'res-')); fs.writeFileSync(path.join(d, 'eth-adelante-v2.json'), JSON.stringify({ nodos, semillas, ficha: {} })); fs.writeFileSync(path.join(d, 'llegadas-eth.json'), JSON.stringify(llegadas)); return d; }
test('resumenEth conserva el total: lo atribuido nunca supera lo llegado y las salidas anteriores a la entrada no cuentan', () => {
  const t = T0 / 1000; const nodos = {
    '0xa': { saldoEth: 0, salidas: [{ a: '0xb', eth: 10, tx: 'x1', t: t + 100 }, { a: '0xz', eth: 50, tx: 'x0', t: t - 5000 }], polvos: [], tokens: [] },
    '0xb': { saldoEth: 10, salidas: [], polvos: [], tokens: [] } };
  const r = symb.resumenEth(carpetaEth(nodos, { '0xa': t }, { u: { cadena: 1, direccion: '0xa', eth: 10, primera: new Date(T0).toISOString() } }));
  assert.ok(Math.abs(r.llegadas - 10) < 1e-9); assert.ok(Math.abs(r.quietoAtribuible - 10) < 1e-6); assert.ok(Math.abs(r.diferencia) < 1e-6); assert.ok(r.quietoAtribuible + r.aContratosTotal + r.polvo <= r.llegadas + 1e-9);
});
test('resumenEth: una billetera con mucho dinero propio solo transmite la fracción trazada', () => {
  const t = T0 / 1000; const nodos = { '0xd': { saldoEth: 0, salidas: [{ a: '0xc', eth: 1, tx: 'y1', t: t + 10 }], polvos: [], tokens: [] }, '0xc': { saldoEth: 0, salidas: [{ a: '0xq', eth: 100, tx: 'y2', t: t + 20 }], polvos: [], tokens: [] }, '0xq': { saldoEth: 100, salidas: [], polvos: [], tokens: [] } };
  const r = symb.resumenEth(carpetaEth(nodos, { '0xd': t }, { u: { cadena: 1, direccion: '0xd', eth: 1, primera: new Date(T0).toISOString() } }));
  assert.ok(r.quietoAtribuible <= 1 + 1e-9, 'no puede atribuirse más de lo que entró: ' + r.quietoAtribuible); assert.ok(r.quietoAtribuible > 0.9);
});

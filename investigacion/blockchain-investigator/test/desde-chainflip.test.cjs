'use strict';
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const { Libro } = require('../src/libro-mayor/modelo.cjs'); const { añadirAlLibro, añadirRelevos } = require('../src/libro-mayor/desde-chainflip.cjs');
const T0 = Date.UTC(2026, 9, 31, 18, 0, 0); const CANAL = 'TCanal1'; const DEP = 'd1'.repeat(32);
function carpeta({ destinos, llegadas, relevos }) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-')); if (destinos) fs.writeFileSync(path.join(d, 'chainflip-destinos.json'), JSON.stringify(destinos)); if (llegadas) fs.writeFileSync(path.join(d, 'chainflip-llegadas.json'), JSON.stringify(llegadas)); if (relevos) fs.writeFileSync(path.join(d, 'relevos-informe.json'), JSON.stringify(relevos)); return d; }
const libro = () => { const L = new Libro(); L.mov({ cadena: 'tron', tx: DEP, activo: 'USDT', importe: 1000, usd: 1000, usdEstado: 'ESTIMADO', de: 'TRemitente', a: CANAL, t: T0, tipo: 'deposito_contrato' }); return L; };
const destinos = { [CANAL]: { canales: [{ cambios: [{ nativeId: 7, entradaUsd: 1000, activoDestino: 'Eth', destino: '0xabc', salida: { usd: 990 } }, { nativeId: 8, entradaUsd: 5000, activoDestino: 'Eth', destino: '0xotro', salida: { usd: 4990 } }] }] } };
const llegadas = { 7: { nuestro: { remitente: 'TRemitente' }, destino: 'Ethereum ETH', direccionDestino: '0xAbC', deposito: { tx: DEP, importe: 1000e6 }, salida: { tx: '0xsalida', importe: '420000000000000000', hora: T0 + 120000 } }, 8: { destino: 'Ethereum ETH', direccionDestino: '0xotro', deposito: { tx: 'ee'.repeat(32) }, salida: { tx: '0xotra', importe: '2000000000000000000', hora: T0 } } };

test('solo se anotan los cambios cuyo depósito hizo una billetera del recorrido; los de otras personas se cuentan aparte', () => {
  const L = libro(); const r = añadirAlLibro(L, carpeta({ destinos, llegadas }));
  assert.equal(r.cambios, 2); assert.equal(r.ajenos, 1); assert.equal(r.enlazados, 1); assert.equal(L.movs.filter(m => m.tipo === 'puente_recibo').length, 1);
  const rec = L.movs.find(m => m.tipo === 'puente_recibo'); assert.equal(rec.activo, 'ETH'); assert.ok(Math.abs(rec.importe - 0.42) < 1e-12); assert.equal(rec.cadena, 'ethereum'); assert.equal(L.movs.find(m => m.tx === DEP).tipo, 'puente_envio');
});
test('el grupo puente concilia en dólares y la diferencia queda a la vista', () => {
  const L = libro(); añadirAlLibro(L, carpeta({ destinos, llegadas })); const g = L.grupos.get('puente:cf:7'); assert.equal(g.tipo, 'puente'); assert.equal(g.enviadoUsd, 1000); assert.equal(g.recibidoUsd, 990); assert.equal(g.diferenciaUsd, 10); assert.equal(g.estado, 'ESTIMADO');
});
test('repetir la carga no duplica movimientos', () => {
  const L = libro(); const d = carpeta({ destinos, llegadas }); añadirAlLibro(L, d); const n = L.movs.length; añadirAlLibro(L, d); assert.equal(L.movs.length, n);
});
test('un relevo se anota como pago ESTIMADO con comisión y el depósito pasa a ser envío a puente', () => {
  const L = libro(); const pareja = { remitente: 'TRemitente', deposito: DEP, canal: CANAL, importe: 1000, hora: T0, pago: 'pp'.repeat(32), receptor: 'TNuevo', pagado: 992.81, comision: 7.19, minutos: 3 };
  const r = añadirRelevos(L, carpeta({ relevos: { depositosSinCambio: 2, sinPareja: 1, parejasLista: [pareja] } })); assert.equal(r.parejas, 1); assert.equal(r.enlazadas, 1);
  const rec = L.movs.find(m => m.tipo === 'puente_recibo'); assert.equal(rec.estado, 'ESTIMADO'); assert.equal(rec.a, 'TNuevo'); assert.equal(rec.t, T0 + 180000); assert.equal(L.grupos.get('puente:relevo:' + DEP).comision, 7.19);
});
test('sin los archivos de Chainflip no se inventa nada', () => { assert.equal(añadirAlLibro(new Libro(), carpeta({})), null); assert.equal(añadirRelevos(new Libro(), carpeta({})), null); });

test('un cambio reembolsado entero se anota como devolución en TRON y no como destino', () => {
  const DEP2 = 'd2'.repeat(32); const L = new Libro(); L.mov({ cadena: 'tron', tx: DEP2, activo: 'USDT', importe: 900, usd: 900, usdEstado: 'ESTIMADO', de: 'TRemitente', a: CANAL, t: T0, tipo: 'deposito_contrato' });
  const dest = { [CANAL]: { canales: [{ cambios: [{ nativeId: 9, entradaUsd: 900, activoDestino: 'Eth', destino: '0xabc', salida: null }] }] } };
  const lleg = { 9: { nuestro: { remitente: 'TRemitente' }, origen: 'Tron USDT', destino: 'Ethereum ETH', direccionDestino: '0xabc', deposito: { tx: DEP2 }, salida: null, reembolso: { importe: '893000000', tx: 'rr'.repeat(32), hora: T0 + 60000 }, direccionReembolso: 'TReembolso' } };
  const r = añadirAlLibro(L, carpeta({ destinos: dest, llegadas: lleg })); assert.equal(r.reembolsos, 1); assert.equal(r.reembolsadosEnteros, 1); assert.equal(r.ok === undefined, true);
  const rec = L.movs.find(m => m.tipo === 'puente_recibo'); assert.equal(rec.cadena, 'tron'); assert.equal(rec.a, 'TReembolso'); assert.equal(rec.importe, 893); const g = L.grupos.get('puente:cf:9'); assert.equal(g.revertido, true); assert.equal(g.estado, 'ESTIMADO');
});

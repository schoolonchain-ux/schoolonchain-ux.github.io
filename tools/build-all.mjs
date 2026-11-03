#!/usr/bin/env node
// Genera TODOS los datos de un informe para la web:
//   data.json            resumen agregado (gráficos)
//   detalle.json         tablas de detalle para "profundizar" desde cada gráfico
//   libro/cuentas.json   todas las direcciones del libro mayor (fichas)
//   libro/movs.json      todos los movimientos del libro mayor (fichas, líneas temporales)
//
//   node tools/build-all.mjs <informe.html> <carpeta-salida>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extraerDatos, construir } from './build-data.mjs';

const r2 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 100) / 100);
const sig = (x) => (x == null || Number.isNaN(x) ? null : Number(Number(x).toPrecision(10)));

export function construirDetalle(D) {
  const out = {};
  const cr = D.cruces || {}, T = (D.items && D.items.terminales) || {};

  // 1. direcciones bloqueadas por Tether en TRON
  out.congeladas = ((D.congTron && D.congTron.filas) || []).map((f) => ({ direccion: f.direccion, evento: f.evento, t: f.t, tx: f.tx, bloqueadaHoy: f.bloqueadaHoy, usdt: r2(f.usdt), trx: r2(f.trx) }));

  // 2. destinos finales del reparto (tras la foto), agregados por dirección y clase
  const agg = new Map();
  for (const [clase, lista] of Object.entries(T)) {
    for (const e of lista) {
      const k = clase + '|' + e.a;
      const x = agg.get(k) || { clase, direccion: e.a, nombre: e.nombre || '', atribuido: 0, bruto: 0, n: 0, primera: e.at, ultima: e.at, simbolos: {} };
      x.atribuido += e.atribuido || 0; x.bruto += e.bruto || 0; x.n++; x.primera = Math.min(x.primera, e.at); x.ultima = Math.max(x.ultima, e.at);
      x.simbolos[e.simbolo] = (x.simbolos[e.simbolo] || 0) + 1; agg.set(k, x);
    }
  }
  out.destinos = [...agg.values()].sort((a, b) => b.atribuido - a.atribuido).slice(0, 600).map((x) => ({ ...x, atribuido: r2(x.atribuido), bruto: r2(x.bruto), simbolos: Object.keys(x.simbolos).join('/') }));
  out.destinosTotales = Object.fromEntries(Object.entries(T).map(([c, l]) => [c, { n: l.length, direcciones: new Set(l.map((e) => e.a)).size }]));

  // 3. billeteras donde queda dinero retenido
  out.retenido = ((D.items && D.items.retenido) || []).slice().sort((a, b) => b.atribuido - a.atribuido).slice(0, 300).map((x) => ({ direccion: x.w, trx: Math.round(x.trx), usdt: Math.round(x.usdt), pureza: x.pureza, atribuido: r2(x.atribuido) }));
  out.sinResolverContratos = (D.items && D.items.sinResolverContratos || []).map((x) => ({ contrato: x.contrato, nombre: x.nombre, importe: r2(x.importe), bruto: r2(x.bruto), n: x.n }));
  out.polvo = D.items && D.items.polvo ? { n: D.items.polvo.length, atribuido: r2(D.items.polvo.reduce((s, x) => s + (x.atribuido || 0), 0)) } : null;

  // 4. rastro perdido (lista completa)
  out.perdida = (D.perdida || []).map((p) => ({ grupo: p.grupo, clase: p.clase, red: p.red, direccion: p.direccion, nombre: p.nombre, atribuido: r2(p.atribuido), bruto: r2(p.bruto), envios: p.envios, tramo: p.tramo, estado: p.estado, causa: p.causa }));

  // 5. puentes
  out.usdt0 = (D.puentes || []).map((p) => ({ tx: p.tx, t: p.t, cadena: p.cadena, destino: p.destino, enviado: r2(p.enviado), recibido: r2(p.recibido), estado: p.estadoLZ, dstTx: p.dstTx }));
  out.symbiosisReceptores = ((cr.symbiosis && cr.symbiosis.receptores) || []).map((x) => ({ cadena: x.cadena, receptor: x.receptor, activo: x.activo, n: x.n, importe: sig(x.importe), usd: r2(x.usd), primera: x.primera, ultima: x.ultima, verificadas: x.verificadas }));
  out.chainflipDestinos = ((cr.chainflip && cr.chainflip.destinos) || []).map((x) => ({ cadena: x.cadena, direccion: x.direccion, activo: x.activo, n: x.n, importe: sig(x.importe), usd: r2(x.usd), primera: x.primera, ultima: x.ultima }));
  out.chainflipRelevos = cr.chainflip && cr.chainflip.relevos ? cr.chainflip.relevos : null;
  out.across = cr.across ? { envios: cr.across.envios, bruto: r2(cr.across.bruto), receptores: cr.across.receptores, receptorInfo: cr.across.receptorInfo } : null;

  // 6. casas de cambio
  out.casasVerificadas = ((D.casas && D.casas.verificadas) || []).map((v) => ({ casa: v.casa, deposito: v.deposito, destino: v.destino, llegadas: v.llegadas, enviado: r2(v.enviado), primera: v.primera, ultima: v.ultima, pureza: v.pureza, tx: (v.tx || []).map((x) => ({ tx: x.tx, t: x.at, cantidad: r2(x.cant), simbolo: x.simbolo })) }));
  out.casasPorCasa = ((D.casas && D.casas.tramo2) || []).map((c) => ({ nombre: c.nombre, n: c.n, bruto: r2(c.bruto), atribuido: r2(c.atribuido), remitentes: c.remitentes }));

  // 7. pureza
  out.purezaTop = D.pureza2 ? D.pureza2.tramos.map((t) => ({ nombre: t.nombre, top: (t.top || []).slice(0, 20).map((x) => ({ direccion: x.a, nivel: x.nivel, puraActual: x.puraActual, puraCiclo: x.puraCiclo, salidas: r2(x.salidas), sinEnlace: r2(x.sinEnlace), efecto: r2(x.efecto) })) })) : null;

  // 8. cruces externos
  out.arkham = D.arkham ? D.arkham.filas.map((f) => ({ red: f.red, t: f.t, tx: f.tx, de: f.de, deEtiqueta: f.deEtiqueta, a: f.a, aEtiqueta: f.aEtiqueta, token: f.token, usd: r2(f.usd), hashNuestro: f.hashNuestro, deNuestra: f.deNuestra, aNuestra: f.aNuestra })) : null;

  // 9. Ethereum y otras cadenas EVM
  if (D.eth) {
    out.ethQuieto = (D.eth.quieto || []).map((q) => ({ nombre: q.nombre, direccion: q.direccion, hoy: sig(q.hoy), entra: sig(q.entraETH), sale: sig(q.saleETH), primera: q.primera, ultima: q.ultima }));
    out.ethTokens = (D.eth.tokens || []).map((t) => ({ cadena: t.cadena, simbolo: t.simbolo, contrato: t.contrato, direccion: t.direccion, saldoHoy: sig(t.saldoHoy), bloqueadaHoy: t.bloqueadaHoy, funcion: t.funcionUsada }));
    out.ethOrigen = ((D.eth.origen && D.eth.origen.terminales) || []).map((x) => ({ direccion: x.direccion, tipo: x.tipo }));
    out.ethOtras = { polygon: D.eth.pol || null, arbitrum: D.eth.arbitrum || null, avalanche: D.eth.avalanche || null };
    out.ethActivos = (D.eth.activos || []).map((a) => ({ activo: a.activo, contrato: a.contrato, entro: sig(a.entro), salio: sig(a.salio), nE: a.nE, nS: a.nS, entradas: (a.txEntrada || []).map((x) => ({ hash: x.hash, de: x.de, cantidad: sig(x.cantidad), t: x.t })) }));
    out.ethDirecto = D.eth.ethDirecto ? { entra: sig(D.eth.ethDirecto.entra), sale: sig(D.eth.ethDirecto.sale), entradas: (D.eth.ethDirecto.entradas || []).map((x) => ({ hash: x.hash, de: x.de, cantidad: sig(x.cantidad), t: x.t })) } : null;
  }
  // 10. puntos de partida del robo (cadena de custodia)
  out.capitalItems = ((D.capital && D.capital.items) || []).map((i) => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, unidad: i.unidad, usd: r2(i.usd), estado: i.estado, fuente: i.fuente, tx: i.tx, nota: i.nota }));
  return out;
}

export function construirLibro(D) {
  const cuentas = { dir: D.dir, cuentas: D.cuentas, clases: D.clases, tipos: D.tipos, activos: D.activos, estados: D.estadosCod, nombreClase: D.nombreClase, precioTRX: D.precioTRX, precioETH: D.precioETH, saldosFecha: D.saldosFecha };
  // [tx, de, a, activo, cantidad, usd, t(seg), tipo, estado, nota]
  const movs = D.movs.map((m) => [m[1], m[2], m[3], m[4], sig(m[5]), m[6] == null ? null : r2(m[6]), Math.round(m[7] / 1000), m[8], m[9], m[10] || '']);
  return { cuentas, movs };
}

function main() {
  const [, , entrada, salida] = process.argv;
  if (!entrada || !salida) { console.error('Uso: node tools/build-all.mjs <informe.html> <carpeta-salida>'); process.exit(1); }
  const D = extraerDatos(fs.readFileSync(entrada, 'utf8'));
  fs.mkdirSync(path.join(salida, 'libro'), { recursive: true });
  const w = (f, o) => { const p = path.join(salida, f); fs.writeFileSync(p, JSON.stringify(o)); console.log('  ' + f.padEnd(22), (fs.statSync(p).size / 1024).toFixed(0).padStart(6) + ' KB'); };
  console.log('Escribiendo en', salida);
  w('data.json', construir(D));
  w('detalle.json', construirDetalle(D));
  const L = construirLibro(D);
  w('libro/cuentas.json', L.cuentas);
  w('libro/movs.json', L.movs);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();

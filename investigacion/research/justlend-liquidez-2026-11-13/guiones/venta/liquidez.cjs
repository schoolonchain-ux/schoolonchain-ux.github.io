'use strict';
// MONITOR DE LIQUIDEZ DE SALIDA DE SUNSWAP: lee el estado actual de la cadena (o un estado guardado), calcula las curvas coste–tamaño de venta por USDT de cada token y escribe el fichero de datos que pinta la web.
// Uso: node liquidez.cjs <salida.json> [--estado estado.json] [--tokens BTC,ETH,...] [--trozos 32] [--puntos 40]
//   sin --estado lee TronGrid ahora (unos segundos); con --estado no usa la red (sirve para repetir el cálculo y para las pruebas).
const fs = require('fs'); const AQUI = __dirname.split(String.fromCharCode(92)).join('/') + '/';
const C = require('C:/EquipoIA/web-publicador/liquidez-sunswap/curvas.cjs'); const { leerEstado } = require('C:/EquipoIA/web-publicador/liquidez-sunswap/lector.cjs');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const SALIDA = process.argv[2]; if (!SALIDA || SALIDA.startsWith('--')) { console.error('Uso: node liquidez.cjs <salida.json> [--estado estado.json] [--tokens BTC,ETH] [--trozos 32] [--puntos 40]'); process.exit(1); }
const M = JSON.parse(fs.readFileSync(AQUI + 'mercados.json', 'utf8')).mercados; const T = JSON.parse(fs.readFileSync(AQUI + 'tokens.json', 'utf8')).tokens;
const decs = new Map(); for (const m of M) { decs.set(m.token0, m.dec0); decs.set(m.token1, m.dec1); }
(async () => {
  const t0 = Date.now(); const est = arg('--estado') ? JSON.parse(fs.readFileSync(arg('--estado'), 'utf8')) : await leerEstado(M, { log: s => console.log(s) });
  const solo = arg('--tokens') ? arg('--tokens').split(',') : null; const trozos = Number(arg('--trozos') || 32), puntos = Number(arg('--puntos') || 72);
  const tamanos = C.tamanosPorDefecto(puntos); const toks = T.filter(t => !solo || solo.includes(t.simbolo)).map(t => ({ ...t, decimales: decs.get(t.direccion) ?? 6 }));
  const out = { version: 1, generado: new Date().toISOString(), bloque: est.bloqueFin || est.bloqueInicio, palabrasPorLado: est.palabrasPorLado, tamanosUsd: tamanos, tokens: [], mercados: [], avisos: (est.aviso || []).map(a => a.id.slice(0, 18) + ': ' + a.aviso), errores: est.errores || [] };
  for (const t of toks) { const p = C.perfil(t, M, est, { tamanos, trozos }); out.tokens.push(p); console.log(t.simbolo.padEnd(10), 'directos', p.mercadosDirectos, '| ref', p.precioReferenciaUsdt, '| 1 M$:', (p.curva.find(c => c.usd >= 1e6) || {}).costePct, '% ', (p.curva.find(c => c.usd >= 1e6) || {}).ruta, '| máx ≤0,5 %:', p.maximos['0.5'], '$'); }
  const usados = new Set(); for (const p of out.tokens) for (const c of p.curva) for (const q of c.partes) usados.add(q.id);
  const lista = M.filter(m => usados.has(m.id) || m.roles.includes('directo')); const indice = new Map(lista.map((m, i) => [m.id, i]));
  out.mercados = lista.map(m => ({ version: m.version, direccion: m.direccion, par: m.simbolo0 + '/' + m.simbolo1, comisionPpm: m.feePpm, capital11nov: m.capital11nov }));
  for (const p of out.tokens) for (const c of p.curva) c.partes = c.partes.map(q => q.salto ? [indice.get(q.id), q.parte, q.salto] : [indice.get(q.id), q.parte]);
  try { const v = JSON.parse(fs.readFileSync(AQUI + 'validacion-ultima.json', 'utf8')); out.validacion = v.iguales + ' de ' + (v.cotizaciones - v.inestables) + ' cotizaciones idénticas (las otras ' + (v.distintas + v.sinRespuesta) + ' son ventas que el contrato no puede cotizar o paga a menos del 1 % de lo vendido)'; out.validacionFecha = v.generado; } catch (e) { out.validacion = null; }
  out.segundos = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(SALIDA, JSON.stringify(out)); console.log('escrito', SALIDA, fs.statSync(SALIDA).size, 'bytes en', out.segundos, 's');
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });

#!/usr/bin/env node
'use strict';
// GUION DE ACEPTACIÓN del caso 0x5227…2f8c (fase 7): repite, por una fuente INDEPENDIENTE de la que usó el agente (recibos y saldos por JSON-RPC público, no Etherscan), las comprobaciones de los pasos 1, 2 y 4 del encargo.
//  · Sin modelo, sin escribir en ningún expediente y de solo lectura (usa el mismo transporte con lista cerrada de servidores que el agente).
//  · Para cada relación DIRECTA del expediente vuelve a leer la transacción y comprueba: existe y se ejecutó bien, bloque y hora, y que el importe del recibo coincide con el guardado.
//    Si el importe no está en el recibo (ETH movido por una llamada interna) lo dice: «no verificable con el recibo». Nunca da por bueno lo que no puede comprobar.
//  · Lee también el código y el saldo ACTUAL de las receptoras (¿dirección normal o contrato? ¿han movido algo?) con la hora de cada lectura.
//  · Compara con lo que dijo la investigación previa hecha a mano (docs/INVESTIGACION-BINANCE-0x5227-2026-10-30.md): bloques e importes de las cuatro transferencias principales. Se comparan números, no se copia texto.
//  · Guarda un JSON con TODO (lecturas crudas con su huella sha256) y un resumen en Markdown en state/aceptacion/.
//   node scripts/aceptacion-0x5227.cjs [--expediente inv-ed6af503] [--puerto 5720] [--salida carpeta]
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { crearClienteExpediente } = require('../src/cliente-expediente.cjs');
const { crearTransporte, crearHttpJson } = require('../src/transporte.cjs');
const { leerClaves } = require('../src/claves.cjs');
const { crearRpc } = require('../src/rpc.cjs');
const { crearTokens } = require('../src/tokens.cjs');
const { leerTransaccion } = require('../src/transaccion.cjs');
const { cantidad } = require('../src/registrador.cjs');

const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7', USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const ROOT = '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c';
// Lo que dijo la investigación previa hecha a mano (apartado 2 de docs/INVESTIGACION-BINANCE-0x5227-2026-10-30.md): hash corto, bloque, importe.
const PREVIA = [
  { hash: '0x68d7d69d', bloque: 26300799, que: 'USDT', importe: '500000000', destino: '0x9749292d74fd460982d0912ea9515ea24736c762' },
  { hash: '0x1fc0ef33', bloque: 26300815, que: 'USDT', importe: '200000000', destino: '0x0ddf0480016e6bcb2c1f5d190d221fba1320697e' },
  { hash: '0x551d7961', bloque: 26300842, que: 'ETH', importe: '195460', destino: '0x8532fa14acaf483729c449b8458aeddb900543d4' },
  { hash: '0x9edf8653', bloque: 26303416, que: 'ETH', importe: '17260', destino: '0x03b0ee5d82990cff1bda48651ac3e436d1a020ea' }
];
const RECEPTORAS = [
  ['0x8532fa14acaf483729c449b8458aeddb900543d4', 'receptora de 195.460 ETH'], ['0x03b0ee5d82990cff1bda48651ac3e436d1a020ea', 'receptora de 17.260 ETH'],
  ['0x9749292d74fd460982d0912ea9515ea24736c762', 'receptora de 500 M USDT'], ['0x0ddf0480016e6bcb2c1f5d190d221fba1320697e', 'receptora de 200 M USDT']
];
// Afirmaciones de la investigación previa que se pueden comprobar HOY con un saldo (apartados 4 y 6 del documento). La dirección completa sale del expediente (por prefijo) o del propio documento; si no se puede resolver, NO se inventa: se dice.
const AFIRMACIONES = [
  { prefijo: '0xc887af69', activo: 'ETH', esperado: 137602, texto: 'recibió 122.310 ETH de la rama de 500 M y «hoy tiene 137.602 ETH sin ninguna salida»' },
  { prefijo: '0x897c80d1', completa: '0x897c80d1a9729e94460e2bd93178bd5215158df3', activo: 'ETH', esperado: 78415, texto: '«hoy tiene 78.415 ETH sin ninguna salida»' },
  { prefijo: '0xaa246bf6', activo: 'USDT', esperado: 174999872, texto: 'Tether la congeló: «174.999.872 USDT bloqueados»' },
  { prefijo: '0xb171ca86', activo: 'USDT', esperado: 30000000, texto: 'Tether la congeló: «30 M USDT bloqueados»' }
];
const hexN = h => (h && h !== '0x' ? BigInt(h) : 0n);
const balanceOf = (rpc, token, a) => rpc.call('ethereum', token, '0x70a08231' + '0'.repeat(24) + a.slice(2));

async function main() {
  const expId = arg('expediente', 'inv-ed6af503'), puerto = arg('puerto') && arg('puerto') !== true ? Number(arg('puerto')) : undefined;
  const cliente = crearClienteExpediente(puerto ? { puerto } : {}), exp = await cliente.ver(expId);
  const claves = leerClaves(), transporte = crearTransporte({}), http = crearHttpJson(transporte, { tronGridKey: claves.tronGridKey }), rpc = crearRpc({ http }), tokens = crearTokens({ rpc });
  const crudos = [], guarda = (tipo, r) => { if (r && r.crudo) { const h = sha(r.crudo); crudos.push({ tipo, sha256: h, bytes: r.crudo.length, proveedor: r.proveedor, consultado_utc: r.consultado_utc, crudo: r.crudo }); } return r; };
  const hechos = exp.evidencias.filter(e => e.clase === 'hecho_cadena' && e.tx_hash);
  const directas = exp.aristas.filter(a => a.clase === 'directa'), porHash = new Map();
  for (const a of directas) (porHash.get(a.tx_hash) || porHash.set(a.tx_hash, []).get(a.tx_hash)).push(a);
  const verificaciones = [];
  for (const [h, aristas] of porHash) {
    const t = await leerTransaccion(rpc, 'ethereum', h, { tokens }); for (const c of t.crudos || []) guarda(c.tipo, { crudo: c.crudo, proveedor: t.proveedor, consultado_utc: t.consultado_utc });
    for (const a of aristas) {
      const v = { relacion: a.id, hash: h, desde: a.desde, hasta: a.hasta, activo: a.activo ? (a.simbolo || a.activo) : 'ETH', importe_guardado: cantidad(a.importe_raw, a.decimales), importe_raw_guardado: a.importe_raw, consultado_utc: t.consultado_utc || null, proveedor: t.proveedor || null };
      if (!t.ok) { Object.assign(v, { resultado: 'NO_VERIFICABLE', motivo: t.error }); verificaciones.push(v); continue; }
      v.estado_tx = t.estado; v.bloque = t.bloque; v.hora_utc = t.ocurrido_utc;
      const ev = hechos.find(e => e.tx_hash === h && e.bloque != null); v.bloque_guardado = ev ? ev.bloque : null;
      v.hora_coincide = !!t.ocurrido_utc && String(t.ocurrido_utc).slice(0, 19) === String(a.ts_utc).slice(0, 19);
      v.bloque_coincide = v.bloque_guardado == null ? null : v.bloque_guardado === t.bloque;
      let importe = null;
      if (a.activo) { const cand = t.transferencias.filter(x => x.token === a.activo && x.from === a.desde && x.to === a.hasta); if (cand.length) importe = { raw: cand.reduce((s, x) => s + BigInt(x.raw), 0n).toString(), via: `${cand.length} evento(s) Transfer del recibo` }; }
      else if (t.from === a.desde && t.to === a.hasta && BigInt(t.valor_wei) > 0n) importe = { raw: t.valor_wei, via: 'campo «value» de la transacción' };
      if (importe) { v.importe_recibo = cantidad(importe.raw, a.decimales); v.via = importe.via; v.importe_coincide = importe.raw === a.importe_raw; v.resultado = v.estado_tx === 'exitosa' && v.importe_coincide && v.hora_coincide && v.bloque_coincide !== false ? 'COINCIDE' : 'NO_COINCIDE'; }
      else { v.resultado = 'IMPORTE_NO_VERIFICABLE_CON_EL_RECIBO'; v.motivo = a.activo ? 'el recibo no trae un evento Transfer con ese token, origen y destino' : 'el ETH no se movió en el campo «value» de la transacción (llamada interna o envío múltiple): el recibo no lo recoge'; v.hora_coincide_con_guardada = v.hora_coincide; }
      verificaciones.push(v);
    }
  }
  // receptoras: código y saldos AHORA
  const bn = guarda('eth_blockNumber', await rpc.ultimoBloque('ethereum')), bloqueAhora = bn.ok ? Number(BigInt(bn.resultado)) : null, receptoras = [];
  const blk = bloqueAhora != null ? guarda('eth_getBlockByNumber', await rpc.bloque('ethereum', bloqueAhora)) : null, horaBloque = blk && blk.ok && blk.resultado ? new Date(Number(BigInt(blk.resultado.timestamp)) * 1000).toISOString() : null;
  const dirs = [...new Set([...RECEPTORAS.map(r => r[0]), ...directas.map(a => a.hasta), ROOT])];
  for (const a of dirs) {
    const cod = guarda('eth_getCode', await rpc.codigo('ethereum', a)), eth = guarda('eth_getBalance', await rpc.saldo('ethereum', a)), usdt = guarda('balanceOf(USDT)', await balanceOf(rpc, USDT, a)), usdc = guarda('balanceOf(USDC)', await balanceOf(rpc, USDC, a));
    const bytes = cod.ok ? (cod.resultado.length - 2) / 2 : null, ro = RECEPTORAS.find(r => r[0] === a);
    receptoras.push({ direccion: a, nota: ro ? ro[1] : (a === ROOT ? 'dirección investigada' : null), tipo: bytes == null ? 'NO_LEIDO' : bytes === 0 ? 'direccion normal (sin código)' : /^0xef0100[0-9a-f]{40}$/i.test(cod.resultado) ? 'cuenta con delegación EIP-7702 hacia 0x' + cod.resultado.slice(8) + ' (no es un contrato desplegado)' : `contrato (${bytes} bytes de código)`, eth_ahora: eth.ok ? cantidad(hexN(eth.resultado).toString(), 18) : null, usdt_ahora: usdt.ok ? cantidad(hexN(usdt.resultado).toString(), 6) : null, usdc_ahora: usdc.ok ? cantidad(hexN(usdc.resultado).toString(), 6) : null, leido_utc: eth.consultado_utc || cod.consultado_utc || null });
  }
  // afirmaciones de saldo de la investigación previa, comprobadas ahora
  const afirmaciones = [];
  for (const a of AFIRMACIONES) {
    const cands = [...new Set([...(a.completa ? [a.completa] : []), ...exp.direcciones.map(d => d.direccion), ...directas.flatMap(x => [x.desde, x.hasta])].filter(d => d && d.toLowerCase().startsWith(a.prefijo)))];
    if (cands.length !== 1) { afirmaciones.push({ ...a, direccion: null, resultado: 'NO_VERIFICABLE', motivo: cands.length ? 'el prefijo es ambiguo' : 'la dirección completa no consta en el expediente ni en el documento: no se inventa' }); continue; }
    const d = cands[0], lec = a.activo === 'ETH' ? guarda('eth_getBalance', await rpc.saldo('ethereum', d)) : guarda('balanceOf(' + a.activo + ')', await balanceOf(rpc, USDT, d));
    if (!lec.ok) { afirmaciones.push({ ...a, direccion: d, resultado: 'NO_VERIFICABLE', motivo: lec.error }); continue; }
    const real = Number(hexN(lec.resultado)) / (a.activo === 'ETH' ? 1e18 : 1e6), dif = Math.abs(real - a.esperado) / a.esperado;
    afirmaciones.push({ ...a, direccion: d, saldo_ahora: real, diferencia_relativa: +dif.toFixed(5), leido_utc: lec.consultado_utc, resultado: dif <= 0.005 ? 'COINCIDE_HOY' : 'HA_CAMBIADO' });
  }
  // contraste con la investigación previa hecha a mano
  const contraste = PREVIA.map(p => { const v = verificaciones.find(x => x.hash.startsWith(p.hash)); return { hash_previa: p.hash + '…', bloque_previa: p.bloque, importe_previa: p.importe + ' ' + p.que, destino_previa: p.destino, nuevo_hash: v ? v.hash : null, nuevo_bloque: v ? v.bloque : null, nuevo_importe: v ? v.importe_guardado : null, nuevo_destino: v ? v.hasta : null, resultado_nuevo: v ? v.resultado : 'SIN_RELACION', coinciden_bloque: v ? v.bloque === p.bloque : false, coinciden_importe: v ? v.importe_guardado.replace(/\./g, '').replace(',', '.').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') === p.importe : false, coinciden_destino: v ? v.hasta === p.destino : false }; });
  const resumen = { coincide: verificaciones.filter(v => v.resultado === 'COINCIDE').length, no_coincide: verificaciones.filter(v => v.resultado === 'NO_COINCIDE').length, no_verificable_importe: verificaciones.filter(v => v.resultado === 'IMPORTE_NO_VERIFICABLE_CON_EL_RECIBO').length, no_verificable_total: verificaciones.filter(v => v.resultado === 'NO_VERIFICABLE').length, total: verificaciones.length };
  const salida = { guion: 'aceptacion-0x5227', version: '1.0.0', generado_utc: new Date().toISOString(), expediente: exp.id, libro_expediente: exp.libro, fuente_independiente: 'JSON-RPC público de Ethereum (recibos, bloques, código, saldos); NO Etherscan', bloque_lectura: bloqueAhora, hora_bloque_lectura: horaBloque, resumen, verificaciones, receptoras, contraste_investigacion_previa: contraste, afirmaciones_previas_hoy: afirmaciones, lecturas_crudas: crudos.map(({ crudo, ...r }) => r) };
  const dir = arg('salida') && arg('salida') !== true ? arg('salida') : path.join(__dirname, '..', 'state', 'aceptacion'); fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, `${exp.id}-${salida.generado_utc.slice(0, 10)}`); fs.writeFileSync(base + '.json', JSON.stringify({ ...salida, lecturas_crudas: crudos }, null, 1)); fs.writeFileSync(base + '.md', aMarkdown(salida));
  console.log(aMarkdown(salida)); console.log('\nGuardado en', base + '.json', 'y .md'); return salida;
}
function aMarkdown(s) {
  const L = [`# Guion de aceptación 0x5227 — ${s.expediente}`, '', `Generado ${s.generado_utc} · fuente independiente: ${s.fuente_independiente} · lectura en el bloque ${s.bloque_lectura} (${s.hora_bloque_lectura}).`, '', `**Relaciones directas releídas: ${s.resumen.total}** — coinciden ${s.resumen.coincide}, NO coinciden ${s.resumen.no_coincide}, importe no verificable con el recibo ${s.resumen.no_verificable_importe}, transacción no legible ${s.resumen.no_verificable_total}.`, '', '| Rel. | Hash | Activo | Importe guardado | Importe del recibo | Bloque | Hora | Resultado |', '|---|---|---|---|---|---|---|---|'];
  for (const v of s.verificaciones) L.push(`| ${v.relacion} | \`${v.hash.slice(0, 12)}…\` | ${v.activo} | ${v.importe_guardado} | ${v.importe_recibo || '—'} | ${v.bloque ?? '—'} | ${v.hora_coincide ? 'coincide' : 'NO'} | ${v.resultado}${v.motivo ? ' (' + v.motivo + ')' : ''} |`);
  L.push('', '## Receptoras: tipo y saldo ahora', '', '| Dirección | Papel | Tipo | ETH | USDT | USDC | Leído (UTC) |', '|---|---|---|---|---|---|---|');
  for (const r of s.receptoras) L.push(`| \`${r.direccion}\` | ${r.nota || '—'} | ${r.tipo} | ${r.eth_ahora} | ${r.usdt_ahora} | ${r.usdc_ahora} | ${r.leido_utc} |`);
  L.push('', '## Contraste con la investigación previa hecha a mano (cuatro transferencias principales)', '', '| Hash previa | Bloque previa → nuevo | Importe previa → nuevo | Destino coincide | Resultado de la relectura |', '|---|---|---|---|---|');
  for (const c of s.contraste_investigacion_previa) L.push(`| \`${c.hash_previa}\` | ${c.bloque_previa} → ${c.nuevo_bloque ?? '—'} ${c.coinciden_bloque ? '✔' : '✘'} | ${c.importe_previa} → ${c.nuevo_importe ?? '—'} ${c.coinciden_importe ? '✔' : '✘'} | ${c.coinciden_destino ? 'sí' : 'NO'} | ${c.resultado_nuevo} |`);
  if (s.afirmaciones_previas_hoy && s.afirmaciones_previas_hoy.length) { L.push('', '## Afirmaciones de saldo de la investigación previa, comprobadas hoy', '', '| Dirección | Afirmación previa | Esperado | Saldo ahora | Resultado |', '|---|---|---|---|---|'); for (const a of s.afirmaciones_previas_hoy) L.push(`| ${a.direccion ? '`' + a.direccion + '`' : a.prefijo + '…'} | ${a.texto} | ${a.esperado.toLocaleString('es-ES')} ${a.activo} | ${a.saldo_ahora != null ? a.saldo_ahora.toLocaleString('es-ES', { maximumFractionDigits: 4 }) : '—'} | ${a.resultado}${a.motivo ? ' (' + a.motivo + ')' : ''} |`); }
  return L.join('\n') + '\n';
}
if (require.main === module) main().catch(e => { console.error('ERROR', e); process.exit(1); });
module.exports = { main, aMarkdown };

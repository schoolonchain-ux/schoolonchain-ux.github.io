'use strict';
// INFORME DE INVESTIGACIÓN (fase 5): 18 apartados, PDF + HTML + Markdown + JSON estructurado, generado de forma DETERMINISTA a partir del expediente de ChainScope (sin modelo de lenguaje en medio).
//  · Cada cifra sale del expediente y lleva el identificador de su evidencia; los importes son enteros exactos (BigInt) con sus decimales; nunca se suman activos distintos.
//  · Hechos, estimaciones, etiquetas de terceros, fuentes externas y lo no comprobado se distinguen con marcas de color y de texto (no solo con color).
//  · Antes de maquetar corren CONTROLES AUTOMÁTICOS (sumas, duplicados, hashes, cronología, reglas del almacén, lecturas originales). Se listan en el informe, también los que fallan. No sustituyen a la revisión independiente.
//  · Nada se oculta: consultas fallidas, límites de lectura, ramas sin seguir y lo no comprobado tienen su apartado.
//  · Lo que viene del expediente (textos, etiquetas, páginas leídas) es DATO: se escapa siempre y las marcas visuales usan un marcador privado que se elimina de los datos, para que un texto externo no pueda disfrazar una estimación de hecho.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { sha256 } = require('./canon.cjs');
const { cantidad } = require('./registrador.cjs');
const { cargarConocidos } = require('./tokens.cjs');
const DOC = require('../../objective-engine/document.cjs');
const STYLE = require('../../objective-engine/report-style.cjs');

const VERSION = '1.0.0';
const EXPLORADOR = { ethereum: 'https://etherscan.io/', polygon: 'https://polygonscan.com/', arbitrum: 'https://arbiscan.io/', optimism: 'https://optimistic.etherscan.io/', base: 'https://basescan.org/', avalanche: 'https://snowscan.xyz/', bnb: 'https://bscscan.com/' };
const urlTx = (red, h) => (red === 'tron' ? 'https://tronscan.org/#/transaction/' + h : EXPLORADOR[red] ? EXPLORADOR[red] + 'tx/' + h : null);
const urlDir = (red, a) => (red === 'tron' ? 'https://tronscan.org/#/address/' + a : EXPLORADOR[red] ? EXPLORADOR[red] + 'address/' + a : null);
const TAG = { hecho_cadena: 'HECHO', inferencia: 'ESTIMACION', etiqueta_terceros: 'TERCEROS', fuente_externa: 'EXTERNA', no_disponible: 'NOCOMP', hipotesis: 'HIPOTESIS' };
const TAG_TXT = { HECHO: 'HECHO EN CADENA', ESTIMACION: 'ESTIMACIÓN', TERCEROS: 'ETIQUETA DE TERCEROS', EXTERNA: 'FUENTE EXTERNA', NOCOMP: 'NO COMPROBADO', HIPOTESIS: 'HIPÓTESIS', confirmada: 'CONFIRMADA', refutada: 'REFUTADA', sin_resolver: 'SIN RESOLVER', pendiente: 'PENDIENTE', directa: 'DIRECTA', inferida: 'INFERIDA', no_verificada: 'NO VERIFICADA' };
const CLASE_TXT = { hecho_cadena: 'Hecho verificado en cadena', inferencia: 'Inferencia (estimación)', etiqueta_terceros: 'Etiqueta de terceros', fuente_externa: 'Fuente externa', no_disponible: 'No comprobado', hipotesis: 'Hipótesis' };

// ---- texto seguro: sin el marcador privado, sin barras verticales (rompen las tablas) y en una sola línea
const s = v => String(v == null ? '' : v).replace(/[⟦⟧]/g, '').replace(/\|/g, '¦').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
const clip = (v, n) => { const t = s(v); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const tag = k => '⟦' + k + '⟧';
const pl = (n, uno, varios) => (n === 1 ? uno : varios);
const hTxt = v => s(v).replace(/^H\d+\s*[:.)-]\s*/i, '');
const cod = v => '`' + s(v).replace(/`/g, "'") + '`';
const utc = v => (v ? String(v).replace('T', ' ').replace(/\.\d+Z$/, 'Z').replace(/Z$/, ' UTC') : '—');
const ev = (ids, max = 8) => (ids && ids.length ? ids.slice(0, max).join(', ') + (ids.length > max ? ` (+${ids.length - max})` : '') : '—');
const unidad = (a, conocidos) => { if (!a.activo) return (a.simbolo || 'moneda nativa') + ' (moneda nativa)'; const kn = conocidos.get(a.red + '|' + String(a.activo).toLowerCase()); return `${a.simbolo || 'token'} (contrato ${a.activo}${kn ? ', verificado como ' + kn.base : ', símbolo SIN verificar'})`; };
const tabla = (cab, filas) => (filas.length ? ['| ' + cab.join(' | ') + ' |', '|' + cab.map(() => '---').join('|') + '|', ...filas.map(f => '| ' + f.map(x => s(x) || '—').join(' | ') + ' |')].join('\n') : '_Sin elementos._');
const seg = iso => (iso ? String(iso).slice(0, 19) : '');

// ------------------------------------------------------------------ datos y controles
// Una evidencia rectificada con una clase efectiva se lee con ESA clase (la original queda en clase_original): las reglas y las tablas usan lo que el revisor y el agente acordaron.
function conClaseEfectiva(exp) {
  const ef = {}, rect = {}; for (const r of exp.rectificaciones || []) { rect[r.evidencia] = r; if (r.clase_efectiva) ef[r.evidencia] = r.clase_efectiva; }
  const ret = new Set((exp.rectificaciones || []).filter(r => r.retirada).map(r => r.evidencia));
  return { ...exp, retiradas: exp.evidencias.filter(e => ret.has(e.id)), hipotesis: exp.hipotesis.map(h => ({ ...h, evidencias: h.evidencias.filter(v => !ret.has(v.evidencia)) })), consultas: exp.consultas.map(q => { const todas = (q.evidencias || []).map(i => rect[i]).filter(Boolean), rs = todas.filter(x => !x.retirada), rt = todas.filter(x => x.retirada); return { ...q, evidencias: (q.evidencias || []).filter(i => !ret.has(i)), ...(rs.length ? { resumen_original: q.resumen, resumen: '[RECTIFICADO ' + rs.map(x => x.id).join(', ') + '] ' + String(rs[0].texto_correcto).slice(0, 220) } : rt.length ? { resumen_original: q.resumen, resumen: '[RESULTADO RETIRADO ' + rt.map(x => x.id).join(', ') + ': ' + String(rt[0].motivo).slice(0, 180) + ']' } : {}) }; }), evidencias: exp.evidencias.filter(e => !ret.has(e.id)).map(e => (rect[e.id] ? { ...e, ...(ef[e.id] ? { clase: ef[e.id], clase_original: e.clase } : {}), texto_original: e.texto, texto: '[RECTIFICADA ' + rect[e.id].id + '] ' + rect[e.id].texto_correcto, limites_originales: e.limites, alternativas_originales: e.alternativas, limites: ['(los límites y avisos originales de esta evidencia quedan sustituidos por su rectificación ' + rect[e.id].id + ': ver el apartado de revisión)'], rectificada: rect[e.id].id, ...(e.confianza === 'alta' ? { confianza: 'baja', confianza_original: 'alta' } : {}) } : e)) };
}
async function construirDatos(exp, { generado = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), verificarLectura = null, conocidos = cargarConocidos() } = {}) {
  exp = conClaseEfectiva(exp);
  const evPor = Object.fromEntries(exp.evidencias.map(e => [e.id, e])), roots = [...new Map(exp.direcciones.filter(d => /raiz|semilla/i.test(d.rol || '')).map(d => [d.red + '|' + d.direccion, d])).values()];
  const bloq = new Map(); for (const e of exp.evidencias) if (e.clase === 'hecho_cadena' && /(ESTÁ|NO está) en la lista de bloqueo/.test(e.texto)) { const k = e.red + '|' + e.direccion, v = bloq.get(k) || []; v.push({ estado: /ESTÁ en/.test(e.texto) ? 'BLOQUEADA' : 'no bloqueada', token: e.contrato, ev: e.id }); bloq.set(k, v); }
  const altas = new Map(); for (const e of exp.evidencias) { const m = /Evento (AddedBlackList|RemovedBlackList) en (0x[0-9a-f]{40}): bloque (\d+), (\d{4}-\d\d-\d\dT[\d:]+Z), datos 0x…([0-9a-f]{40})/i.exec(e.texto || ''); if (!m || e.clase !== 'hecho_cadena') continue; const k = e.red + '|0x' + m[5].toLowerCase(), v = altas.get(k) || []; const dup = v.find(x => x.evento === m[1] && x.token === m[2].toLowerCase() && x.bloque === Number(m[3])); if (dup) dup.evs.push(e.id); else v.push({ evento: m[1], token: m[2].toLowerCase(), bloque: Number(m[3]), fecha: m[4], evs: [e.id] }); altas.set(k, v); }
  const directas = exp.aristas.filter(a => a.clase === 'directa'), inferidas = exp.aristas.filter(a => a.clase === 'inferida'), noVer = exp.aristas.filter(a => a.clase === 'no_verificada');
  // duplicados: la misma transferencia registrada dos veces
  const vistos = new Map(), duplicados = []; for (const a of exp.aristas) { const k = [a.red, a.tx_hash, a.desde, a.hasta, a.activo || 'native', a.importe_raw].join('|'); if (a.tx_hash) { if (vistos.has(k)) duplicados.push([vistos.get(k), a.id]); else vistos.set(k, a.id); } }
  // totales EXACTOS por dirección raíz y activo (solo relaciones directas; no se suman activos distintos)
  const totales = [];
  for (const r of roots) for (const sentido of ['salidas', 'entradas']) {
    const por = new Map(); for (const a of directas.filter(x => x.red === r.red && (sentido === 'salidas' ? x.desde === r.direccion : x.hasta === r.direccion) && x.importe_raw)) { const k = (a.activo || 'native') + '|' + (a.simbolo || ''); const o = por.get(k) || { a, raw: 0n, n: 0, rels: [], evs: new Set() }; o.raw += BigInt(a.importe_raw); o.n++; o.rels.push(a.id); a.evidencias.forEach(x => o.evs.add(x)); por.set(k, o); }
    for (const o of por.values()) totales.push({ id: 'T' + (totales.length + 1), raiz: r.direccion, red: r.red, sentido, activo: o.a.activo || null, simbolo: o.a.simbolo || null, decimales: o.a.decimales, raw: o.raw.toString(), valor: cantidad(o.raw.toString(), o.a.decimales), unidad: unidad(o.a, conocidos), n: o.n, relaciones: o.rels, evidencias: [...o.evs] });
  }
  const cifras = [...exp.aristas.filter(a => a.importe_raw).map(a => ({ id: 'C-' + a.id, que: `${a.clase === 'directa' ? 'Transferencia observada' : a.clase === 'inferida' ? 'Relación inferida (atribución estimada; el propio movimiento puede estar estimado por balance neto: ver método)' : 'Relación no verificada'} ${a.desde} → ${a.hasta}`, valor: cantidad(a.importe_raw, a.decimales), unidad: unidad(a, conocidos), raw: a.importe_raw, decimales: a.decimales ?? null, clase: a.clase, tx: a.tx_hash, utc: a.ts_utc, evidencias: a.evidencias })),
    ...totales.map(t => ({ id: t.id, que: `${t.sentido === 'salidas' ? 'Suma de salidas directas desde' : 'Suma de entradas directas hacia'} ${t.raiz} (${t.n} transferencia${t.n > 1 ? 's' : ''}: ${t.relaciones.join(', ')})`, valor: t.valor, unidad: t.unidad, raw: t.raw, decimales: t.decimales ?? null, clase: 'directa', tx: null, utc: null, evidencias: t.evidencias }))];
  for (const c of cifras) { const evs = c.evidencias.map(i => evPor[i]).filter(Boolean); c.fuentes = [...new Set(evs.map(e => e.fuente))].slice(0, 3); c.lecturas = [...new Set(evs.map(e => e.raw_sha256).filter(Boolean))]; }
  // ---- controles automáticos
  const C = [], ok = (id, bien, detalle) => C.push({ id, ok: !!bien, detalle });
  ok('libro', exp.libro && exp.libro.ok, exp.libro && exp.libro.ok ? `libro íntegro (${exp.libro.lineas} líneas, última huella ${String(exp.libro.ultima_huella || '').slice(0, 16)}…)` : 'EL LIBRO DE HUELLAS ESTÁ ALTERADO');
  const sinEv = exp.aristas.filter(a => a.evidencias.some(i => !evPor[i])).map(a => a.id); ok('relaciones_con_evidencia', !sinEv.length && exp.aristas.every(a => a.evidencias.length), sinEv.length ? 'relaciones que citan evidencias inexistentes: ' + sinEv.join(', ') : `las ${exp.aristas.length} relaciones citan evidencias que existen`);
  const dirSinHash = directas.filter(a => !a.evidencias.map(i => evPor[i]).some(e => e && e.clase === 'hecho_cadena' && e.tx_hash === a.tx_hash)).map(a => a.id); ok('directas_con_hash', !dirSinHash.length, dirSinHash.length ? 'directas sin evidencia de cadena con su hash: ' + dirSinHash.join(', ') : `las ${directas.length} relaciones directas tienen una evidencia de cadena con su mismo hash`);
  ok('sin_duplicados', !duplicados.length, duplicados.length ? 'transferencias registradas dos veces: ' + duplicados.map(d => d.join('=')).join(', ') : 'ninguna transferencia está registrada dos veces (misma red, hash, origen, destino, activo e importe)');
  const reTx = (red, h) => (['tron', 'bitcoin'].includes(red) ? /^[0-9a-f]{64}$/.test(h) : /^0x[0-9a-f]{64}$/.test(h)), malHash = exp.evidencias.filter(e => e.tx_hash && !reTx(e.red, e.tx_hash)).map(e => e.id); ok('formato_hashes', !malHash.length, malHash.length ? 'hashes con formato dudoso: ' + malHash.join(', ') : 'todos los hashes de transacción tienen el formato de su red');
  const malDir = exp.direcciones.filter(d => ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'bnb'].includes(d.red) && !/^0x[0-9a-f]{40}$/.test(d.direccion)).map(d => d.direccion); ok('formato_direcciones', !malDir.length, malDir.length ? 'direcciones EVM con formato dudoso: ' + malDir.join(', ') : 'todas las direcciones EVM tienen 40 hexadecimales en minúscula');
  const horaMal = directas.filter(a => { const e = a.evidencias.map(i => evPor[i]).find(x => x && x.clase === 'hecho_cadena' && x.tx_hash === a.tx_hash); return e && seg(e.ocurrido_utc) !== seg(a.ts_utc); }).map(a => a.id); ok('horas_coherentes', !horaMal.length, horaMal.length ? 'la hora de la relación no coincide con la de su evidencia: ' + horaMal.join(', ') : 'la hora de cada relación directa coincide con la de su evidencia de cadena');
  const futuro = exp.evidencias.filter(e => e.ocurrido_utc && e.consultado_utc && Date.parse(e.ocurrido_utc) > Date.parse(e.consultado_utc) + 1000).map(e => e.id); ok('cronologia_coherente', !futuro.length, futuro.length ? 'hechos con fecha posterior a la consulta: ' + futuro.join(', ') : 'ningún hecho es posterior al momento en que se consultó');
  const suma = totales.filter(t => { let x = 0n; for (const i of t.relaciones) x += BigInt((exp.aristas.find(a => a.id === i) || {}).importe_raw || 0); return x.toString() !== t.raw; }).map(t => t.id); ok('totales', !suma.length, suma.length ? 'totales que no cuadran con la suma de sus relaciones: ' + suma.join(', ') : `${pl(totales.length, 'el total se recalculó', 'los ' + totales.length + ' totales se recalcularon')} sumando las relaciones (enteros exactos) y cuadra${totales.length === 1 ? '' : 'n'}`);
  const infMal = exp.evidencias.filter(e => e.clase === 'inferencia' && !e.rectificada && (e.confianza === 'alta' || !e.base.length || !e.alternativas.length)).map(e => e.id); const infExc = exp.evidencias.filter(e => e.clase === 'inferencia' && e.rectificada).map(e => e.id); ok('inferencias_prudentes', !infMal.length && !infExc.length, infMal.length ? 'inferencias sin base, sin alternativas o con confianza alta: ' + infMal.join(', ') : infExc.length ? `NO SUPERADO con excepciones: ${infExc.join(', ')} son evidencias reclasificadas como inferencia por una rectificación y no tienen base ni alternativas propias (su confianza se rebajó a baja; el origen consta en la rectificación). El resto de inferencias sí cumple` : 'todas las inferencias tienen base, explicaciones alternativas y confianza no alta');
  const veredMal = exp.hipotesis.filter(h => h.estado === 'confirmada' && !(h.evidencias.some(v => v.efecto === 'apoya' && ['directa', 'estructural'].includes(v.relacion) && (evPor[v.evidencia] || {}).clase === 'hecho_cadena') && exp.consultas.some(q => q.hipotesis === h.id && q.proposito === 'contraprueba'))).map(h => h.id); ok('veredictos', !veredMal.length, veredMal.length ? 'confirmadas sin evidencia sólida o sin contraprueba: ' + veredMal.join(', ') : `los veredictos «confirmada» (${exp.hipotesis.filter(h => h.estado === 'confirmada').length}) cumplen las reglas del almacén`);
  if (verificarLectura) { const faltan = []; const shas = [...new Set(exp.evidencias.map(e => e.raw_sha256).filter(Boolean))]; for (const h of shas) { try { await verificarLectura(h); } catch { faltan.push(h.slice(0, 12)); } } ok('lecturas_originales', !faltan.length, faltan.length ? 'lecturas originales ausentes o alteradas: ' + faltan.join(', ') : `${pl(shas.length, 'la lectura original existe y coincide', 'las ' + shas.length + ' lecturas originales existen y coinciden')} con su huella`); }
  const fallidas = exp.consultas.filter(q => q.estado === 'error' || q.estado === 'no_disponible');
  const cron = [], porTx = new Map(); for (const e of exp.evidencias.filter(x => x.clase === 'hecho_cadena' && x.ocurrido_utc).sort((a, b) => String(a.ocurrido_utc).localeCompare(String(b.ocurrido_utc)))) { const k = e.tx_hash ? e.tx_hash + '|' + e.direccion : null;   // solo se funden lecturas del mismo hecho (misma transacción, dirección y activo); movimientos de activos distintos en una misma transacción son hechos distintos
     if (k && porTx.has(k)) { const g0 = porTx.get(k); g0.lecturas.push(e.id); if (!g0.textos.includes(e.texto)) g0.textos.push(e.texto); continue; } const g = { utc: e.ocurrido_utc, texto: e.texto, textos: [e.texto], red: e.red, tx: e.tx_hash || null, bloque: e.bloque ?? null, lecturas: [e.id] }; if (k) porTx.set(k, g); cron.push(g); }
  const porClase = c => exp.evidencias.filter(e => e.clase === c);
  return { version: VERSION, generado_utc: generado, expediente: { id: exp.id, titulo: exp.titulo, pregunta: exp.pregunta, estado: exp.estado, creado: exp.creado, actualizado: exp.actualizado, config: exp.config, previo: exp.previo, libro: exp.libro, cola: exp.cola },
    etiquetadas: new Set(exp.consultas.filter(q => ['etiquetas', 'chainscope'].includes(q.herramienta) && q.parametros && q.parametros.direccion).map(q => String(q.parametros.direccion).toLowerCase())),
    revisiones: exp.revisiones || [], origen: exp.origen || null, rectificaciones: exp.rectificaciones || [], retiradas: (exp.retiradas || []).map(e => ({ id: e.id, clase: e.clase, texto: e.texto })),
    conteo: { evidencias: exp.evidencias.length, por_clase: Object.fromEntries(Object.keys(CLASE_TXT).map(c => [c, porClase(c).length])), relaciones: { directas: directas.length, inferidas: inferidas.length, no_verificadas: noVer.length }, consultas: exp.consultas.length, consultas_fallidas: fallidas.length },
    controles: C, direcciones: exp.direcciones.map(d => ({ ...d, bloqueo: bloq.get(d.red + '|' + d.direccion) || [], altas: altas.get(d.red + '|' + d.direccion) || [] })), raices: roots.map(r => r.direccion), cronologia: cron, directas, inferidas, no_verificadas: noVer, totales, cifras, hipotesis: exp.hipotesis, evidencias: exp.evidencias, consultas: exp.consultas, fallidas: fallidas.map(q => q.id) };
}

// ------------------------------------------------------------------ gráfico de relaciones (SVG propio, determinista)
function svgGrafo(exp, D) {
  const key = (r, a) => r + ':' + a, nodos = new Map(), roots = new Set(D.raices);
  for (const d of exp.direcciones) nodos.set(key(d.red, d.direccion), { red: d.red, a: d.direccion, et: d.etiqueta, prof: null, bloq: D.direcciones.find(x => x.red === d.red && x.direccion === d.direccion).bloqueo.some(b => b.estado === 'BLOQUEADA') });
  for (const a of exp.aristas) for (const x of [a.desde, a.hasta]) if (!nodos.has(key(a.red, x))) nodos.set(key(a.red, x), { red: a.red, a: x, prof: null, bloq: false });
  if (!nodos.size) return '';
  const cola = []; for (const [k, n] of nodos) if (roots.has(n.a)) { n.prof = 0; cola.push(k); }
  for (let i = 0; i < cola.length; i++) { const n = nodos.get(cola[i]); for (const a of exp.aristas) { if (key(a.red, a.desde) === cola[i]) { const t = nodos.get(key(a.red, a.hasta)); if (t.prof === null) { t.prof = n.prof + 1; cola.push(key(a.red, a.hasta)); } } } }
  for (const a of exp.aristas) { const o = nodos.get(key(a.red, a.desde)), t = nodos.get(key(a.red, a.hasta)); if (o.prof === null && t.prof !== null) o.prof = t.prof - 1; }
  for (const n of nodos.values()) if (n.prof === null) n.prof = 0;
  const cols = new Map(); for (const [k, n] of nodos) { const c = cols.get(n.prof) || []; c.push([k, n]); cols.set(n.prof, c); }
  const claves = [...cols.keys()].sort((x, y) => x - y), W = 265, H = 62, GAP = 14, BW = 215, pos = new Map(); let alto = 0;
  claves.forEach((c, ci) => { cols.get(c).forEach(([k], ri) => { pos.set(k, { x: 20 + ci * W, y: 20 + ri * (H + GAP) }); alto = Math.max(alto, 20 + (ri + 1) * (H + GAP)); }); });
  const ancho = 20 + claves.length * W, E = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const estilo = { directa: 'stroke="#1d6fb8" stroke-width="2.2"', inferida: 'stroke="#c98a00" stroke-width="2" stroke-dasharray="7 4"', no_verificada: 'stroke="#7b8794" stroke-width="1.8" stroke-dasharray="2 4"' };
  const aristas = exp.aristas.map(a => { const o = pos.get(key(a.red, a.desde)), t = pos.get(key(a.red, a.hasta)), x1 = o.x + BW, y1 = o.y + H / 2, x2 = t.x, y2 = t.y + H / 2, same = o.x === t.x; const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - (same ? 0 : 0);
    return `<g><path d="M${same ? o.x + BW : x1},${y1} C${mx},${y1} ${mx},${y2} ${same ? t.x + BW : x2},${y2}" fill="none" ${estilo[a.clase] || estilo.no_verificada} marker-end="url(#fl-${a.clase})"/><text x="${mx}" y="${my - 3}" font-size="17" font-weight="700" fill="#223" text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-width="3">${E(a.id)}</text></g>`; }).join('');
  const cajas = [...nodos].map(([k, n]) => { const p = pos.get(k); return `<g><rect x="${p.x}" y="${p.y}" width="${BW}" height="${H}" rx="8" fill="${n.et ? '#efe8fb' : '#f3f6fa'}" stroke="${n.bloq ? '#c0263d' : roots.has(n.a) ? '#1d6fb8' : '#8a97a8'}" stroke-width="${n.bloq ? 3 : roots.has(n.a) ? 2.5 : 1.2}"/><text x="${p.x + 8}" y="${p.y + 22}" font-size="18" fill="#1b1f24" font-weight="600">${E(n.et ? n.et.slice(0, 18) : roots.has(n.a) ? 'Investigada' : n.red)}</text><text x="${p.x + 8}" y="${p.y + 50}" font-size="17" fill="#334" font-family="Consolas,monospace">${E(n.a.slice(0, 6) + '…' + n.a.slice(-5))}</text></g>`; }).join('');
  const marcadores = Object.entries({ directa: '#1d6fb8', inferida: '#c98a00', no_verificada: '#7b8794' }).map(([c, col]) => `<marker id="fl-${c}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${col}"/></marker>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto + 6}" width="100%" role="img" aria-label="Grafo de relaciones"><defs>${marcadores}</defs>${aristas}${cajas}</svg>`;
}

// Estado de la revisión independiente, en palabras (lo que el lector debe entender sin leer la tabla)
function estadoRevision(E, revs) {
  const ult = revs[revs.length - 1];
  const sust = ult && (/SUSTITUTO/i.test(ult.revisor || '') || !/^Codex/i.test(ult.revisor || ''));
  if (E.estado === 'cerrado' && sust) return { corto: 'Cerrado (revisor sustituto)', largo: 'Cerrado: lo aprobó un REVISOR SUSTITUTO (' + clip(ult.revisor, 120) + ') en la ronda ' + ult.ronda + ', NO la revisión independiente por Codex prevista. Menos independiente: es el mismo modelo que el agente', resumen: 'aprobado por un revisor SUSTITUTO (' + clip(ult.revisor, 90) + ') en la ronda ' + ult.ronda + ', no por Codex; el revisor comparte modelo con el agente, así que la independencia es menor.' };
  if (E.estado === 'cerrado') return { corto: 'Cerrado', largo: 'Cerrado: lo aprobó la revisión independiente' + (ult ? ' (ronda ' + ult.ronda + ')' : ''), resumen: 'revisado y aprobado por el revisor independiente' + (ult ? ' en la ronda ' + ult.ronda : '') + '.' };
  if (ult && ult.veredicto === 'aprobado') return { corto: 'Aprobado', largo: 'La revisión independiente lo aprobó, pero el contenido cambió después: hace falta revisarlo de nuevo. Conclusiones PROVISIONALES', resumen: 'la última revisión lo aprobó pero el contenido cambió después; PROVISIONAL.' };
  if (ult) return { corto: 'No aprobado', largo: 'La revisión independiente NO lo ha aprobado (' + revs.length + ' ' + pl(revs.length, 'ronda', 'rondas') + '): conclusiones PROVISIONALES', resumen: 'la revisión independiente NO lo ha aprobado (' + revs.length + ' ' + pl(revs.length, 'ronda', 'rondas') + '); trata estas conclusiones como provisionales.' };
  return { corto: 'Pendiente', largo: E.estado === 'revision' ? 'Pendiente de revisión independiente (segundo revisor): conclusiones PROVISIONALES' : 'Abierto: conclusiones PROVISIONALES', resumen: 'PENDIENTE de revisión independiente; trata estas conclusiones como provisionales.' };
}
function seccionRevision(D) {
  const revs = D.revisiones || [], L = [];
  L.push('', '### Revisión independiente', '');
  if (D.origen) L.push(`**Segunda instancia.** Este expediente hereda el contenido de ${D.origen.id}, que agotó ${D.origen.revisiones.length} rondas de revisión sin aprobación (con las rectificaciones y retiradas ya aplicadas, marcadas «ronda 0»). Las objeciones de esa instancia constan en el paquete de revisión; la última tenía ${(D.origen.revisiones.at(-1) || { objeciones: [] }).objeciones.length} objeción(es) pendiente(s): ${(D.origen.revisiones.at(-1) || { objeciones: [] }).objeciones.map(o => clip(o.objecion, 160)).join(' · ') || '—'}.`, '');
  if (!revs.length) return L.concat('_Este expediente todavía no ha pasado la revisión independiente: un segundo revisor (Codex) debe contrastarlo con las lecturas originales antes de poder cerrarse. Hasta entonces sus conclusiones son provisionales._');
  L.push('Un segundo revisor (otra IA, sesión efímera y de solo lectura, sin acceso a la conversación del agente) comprobó el expediente y este informe contra las **lecturas originales** (respuestas crudas de las fuentes, con su huella sha256). El agente respondió a cada objeción: corregir, discutir o reconocer el límite. Las reglas del almacén se aplican igual a las correcciones. El expediente solo se cierra si la última ronda aprueba y el contenido no cambia después.', '');
  L.push(tabla(['Ronda', 'Hora (UTC)', 'Revisor', 'Veredicto', 'Objeciones (graves / total)', 'Contrastes con archivos', 'Huella del paquete', 'Huella de la salida'], revs.map(r => [r.ronda, utc(r.ts), clip(r.revisor, 70), r.veredicto === 'aprobado' ? 'APROBADO' : 'CON OBJECIONES', r.objeciones.filter(o => o.severidad !== 'baja').length + ' / ' + r.objeciones.length, r.verificaciones.length + ' (' + r.verificaciones.filter(v => v.resultado === 'no_coincide').length + ' no coinciden)', cod(String(r.paquete_sha).slice(0, 16) + '…'), r.salida_sha ? cod(String(r.salida_sha).slice(0, 16) + '…') : '—'])));
  for (const r of revs) {
    if (r.resumen) L.push('', '**Ronda ' + r.ronda + ' — resumen del revisor:** ' + clip(r.resumen, 900));
    if (!r.objeciones.length) continue;
    L.push('', tabla(['Id', 'Severidad', 'Tipo', 'Objetivo', 'Objeción del revisor', 'Respuesta del agente', 'Acciones'], r.objeciones.map(o => { const x = (r.respuestas || []).find(y => y.objecion === o.id); return [/^R\d+-/.test(o.id) ? o.id : 'R' + r.ronda + '-' + o.id, o.severidad.toUpperCase(), o.tipo.replace(/_/g, ' '), clip(o.objetivo, 50), clip(o.objecion, 420), x ? '**' + x.decision.replace(/_/g, ' ') + '**: ' + clip(x.razon, 420) : '_sin respuesta todavía_', x && x.acciones.length ? clip(x.acciones.join(' · '), 380) : '—']; })));
  }
  const rect = D.rectificaciones || [];
  if (rect.length) L.push('', '### Rectificaciones (una evidencia no se edita: se rectifica aparte)', '', tabla(['Id', 'Evidencia', 'Ronda', 'Se lee como', 'Motivo', 'Texto correcto'], rect.map(x => [x.id, x.evidencia, x.ronda === 0 ? 'heredada' : x.ronda, x.retirada ? 'RETIRADA (ya no cuenta ni figura en el cuerpo del informe)' : x.clase_efectiva ? CLASE_TXT[x.clase_efectiva] : 'sin cambio de clase', clip(x.motivo, 300), x.retirada ? '—' : clip(x.texto_correcto, 400)])));
  return L;
}

// ------------------------------------------------------------------ Markdown (18 apartados)
function aMarkdown(D, exp) {
  const E = D.expediente, L = [], H = (t) => L.push('', '## ' + t, ''), P = (...x) => L.push(...x), ids = a => ev(a);
  const ok = D.controles.filter(c => c.ok).length, hip = D.hipotesis, ER = estadoRevision(E, D.revisiones || []), rectDe = Object.fromEntries((D.rectificaciones || []).map(x => [x.evidencia, x]));
  const conf = hip.filter(h => h.estado === 'confirmada').length, ref = hip.filter(h => h.estado === 'refutada').length, sr = hip.filter(h => h.estado === 'sin_resolver' || h.estado === 'pendiente').length;
  // —— 1
  H('Datos del expediente');
  P(tabla(['Dato', 'Valor'], [['Expediente', cod(E.id)], ['Título', clip(E.titulo, 200)], ['Estado', ER.largo], ['Creado', utc(E.creado)], ['Última actualización', utc(E.actualizado)], ['Informe generado', utc(D.generado_utc) + ` (generador ${D.version})`], ['Libro de huellas', E.libro && E.libro.ok ? `íntegro, ${E.libro.lineas} líneas, última huella ${cod(String(E.libro.ultima_huella || '').slice(0, 32) + '…')}` : 'ALTERADO'],
    ['Límites configurados', `${E.config.profundidad} saltos · mínimo ${E.config.minimoUsd} $ · ${E.config.maxConsultas} consultas · ${Math.round(E.config.maxMs / 60000)} min`], ['Contenido', `${D.conteo.evidencias} evidencias · ${D.conteo.relaciones.directas} relaciones directas, ${D.conteo.relaciones.inferidas} inferidas, ${D.conteo.relaciones.no_verificadas} no verificadas · ${D.conteo.consultas} consultas (de ellas, ${D.conteo.consultas_fallidas} fallidas o no disponibles)`], ['Informe previo', E.previo ? clip(E.previo, 200) : '—']]));
  P('', 'Cada hecho lleva una marca: ' + [tag('HECHO') + ' leído en la cadena', tag('ESTIMACION') + ' deducción con un método declarado', tag('TERCEROS') + ' etiqueta de un tercero (pista, no identidad)', tag('EXTERNA') + ' dato de una fuente externa', tag('NOCOMP') + ' no se pudo comprobar'].join(' · ') + '.');
  // —— 2
  H('Pregunta de investigación'); P('> ' + clip(E.pregunta, 1800));
  // —— 3
  H('Resumen ejecutivo');
  P(`Se formularon ${hip.length} hipótesis: **${conf} confirmada${conf === 1 ? '' : 's'}**, **${ref} refutada${ref === 1 ? '' : 's'}** y **${sr} sin resolver**. Los veredictos los aplica el almacén de reglas de ChainScope, no el redactor.`, '');
  for (const h of hip) P(`- ${tag(h.estado)} **${h.id}** ${clip(hTxt(h.texto), 260)}`);
  P('', '**Lo observado en la cadena** (' + tag('HECHO') + '):', '');
  const dir = D.totales.map(t => `- ${t.sentido === 'salidas' ? 'Salidas directas desde' : 'Entradas directas hacia'} ${cod(t.raiz)}: **${s(t.valor)}** ${s(t.unidad)} en ${t.n} transferencia${t.n > 1 ? 's' : ''} (${ids(t.relaciones)}; evidencias ${ids(t.evidencias)})`);
  P(dir.length ? dir.join('\n') : '- No hay relaciones directas con importe registradas.');
  if (D.conteo.relaciones.inferidas) P('', `Además hay **${D.conteo.relaciones.inferidas} ${pl(D.conteo.relaciones.inferidas, 'relación inferida', 'relaciones inferidas')}** (${tag('ESTIMACION')}): la atribución de esos fondos a la dirección de origen es una estimación FIFO que no demuestra la procedencia exacta, y en algunos saltos el propio movimiento también lo estima el rastreador por balance neto: la columna «Método» de cada fila (apartado 10) dice cuál es cada caso, y ninguna de estas relaciones es una observación directa.`);
  P('', 'Los importes se dan en la unidad exacta de cada activo; no se suman activos distintos ni se convierten a dólares salvo con su precio y su fuente como estimación.');
  if (D.fallidas.length || D.cola_pendiente) P('', `**Límites:** ${D.conteo.consultas_fallidas} ${pl(D.conteo.consultas_fallidas, 'consulta fallida o no disponible', 'consultas fallidas o no disponibles')} y, en conjunto, ${D.conteo.por_clase.no_disponible} ${pl(D.conteo.por_clase.no_disponible, 'punto no comprobado', 'puntos no comprobados')} (apartado 16).`);
  P('', '**Estado:** ' + ER.resumen);
  // —— 4
  H('Conclusiones');
  for (const h of hip) { P(`### ${h.id} · ${TAG_TXT[h.estado] || h.estado}`, '', `${tag(h.estado)} ${clip(hTxt(h.texto), 400)}`, '', `**Motivo del veredicto:** ${clip(h.motivo || 'sin veredicto todavía', 1500)}`, '', `A favor: ${ids(h.evidencias.filter(v => v.efecto === 'apoya').map(v => v.evidencia))} · En contra: ${ids(h.evidencias.filter(v => v.efecto === 'contradice').map(v => v.evidencia))} · Neutras: ${ids(h.evidencias.filter(v => v.efecto === 'neutral').map(v => v.evidencia))}`, ''); }
  if (!hip.length) P('_El expediente no tiene hipótesis._');
  // —— 5
  H('Metodología');
  P('1. **Hipótesis comprobables.** La pregunta se traduce en hipótesis; de cada una se anota qué evidencia la confirmaría y cuál la refutaría **antes** de buscar.',
    '2. **Evidencia a favor y en contra.** Para cada hipótesis se busca de forma expresa evidencia en contra (consultas con propósito «contraprueba»). Sin esa búsqueda el almacén no permite confirmarla.',
    '3. **Clasificación de cada hallazgo.** Hecho verificado en cadena · dato de fuente externa · etiqueta de terceros · inferencia analítica · hipótesis pendiente · dato no disponible. Cada evidencia lleva fuente, método, hora de ocurrencia y de consulta (UTC), confianza (alta, media o baja: sin porcentajes porque no hay método que los respalde), límites y explicaciones alternativas.',
    '4. **Reglas del almacén (no las puede saltar el redactor).** «Confirmada» exige evidencia observada en cadena de relación directa o estructural y búsqueda de evidencia en contra; la coincidencia temporal, una etiqueta de terceros o una fuente externa no bastan. Una hipótesis sobre la identidad de una persona o entidad nunca se confirma. Una inferencia nunca es de confianza alta.',
    ...(D.conteo.relaciones.inferidas || !D.consultas.some(q => q.herramienta === 'reparto') ? ['5. **Rastreo de fondos.** El primer salto de un rastreo es una transferencia leída de la cadena. Los saltos siguientes aplican FIFO sobre lo recibido: es una **estimación** que supone que la dirección no tenía fondos previos del activo; si recibió otros ingresos del mismo activo, la cantidad atribuida es una cota superior. FIFO no demuestra la procedencia exacta. El rastreo se detiene en exchanges, puentes, mezcladores, protocolos y contratos sin identificar, y lo dice.'] : []),
    ...(D.consultas.some(q => q.herramienta === 'reparto') ? ['5b. **Reparto por saldos reales (sin FIFO).** Para las direcciones consultadas con la herramienta de reparto se lee su libro completo de entradas y salidas por activo y se concilia con su saldo en el mismo bloque (entradas − salidas − gas = saldo). Cuando cuadra al entero, esas cifras son exactas y no suponen un orden de salida; si hay varios orígenes se declara la mezcla y se indica qué había entrado antes de la primera salida. Los cambios de activo se detectan por el balance neto de la transacción. Un libro incompleto o que no cuadra no se da por bueno.'] : []),
    '6. **Activos por contrato.** USDT, USDT0 y los tokens que se llaman «USDT» son contratos distintos: se identifican por su dirección de contrato, nunca por el nombre. Un símbolo leído del propio contrato no es una identidad.',
    '7. **Importes exactos.** Se trabaja con enteros en la unidad mínima de cada activo; no se suman activos distintos. El volumen bruto de transferencias no es capital único: el capital único solo se estima si hay un método justificado y aquí no se calcula.',
    '8. **Solo lectura.** No se ejecutan transacciones, no se mueven fondos ni se despliegan contratos. Las consultas salen por un único punto con lista cerrada de servidores y quedan registradas con su hora UTC.');
  P('', '### Controles automáticos realizados sobre este informe', '', `Se ejecutaron ${D.controles.length} controles; ${ok} superados${ok === D.controles.length ? '' : ' y **' + (D.controles.length - ok) + ' NO superados**'}. No sustituyen a la revisión independiente.`, '', tabla(['Control', 'Resultado', 'Detalle'], D.controles.map(c => [c.id, c.ok ? 'SUPERADO' : 'NO SUPERADO', clip(c.detalle, 260)])));
  P(...seccionRevision(D));
  // —— 6
  H('Fuentes y cobertura de datos');
  const porH = new Map(); for (const q of D.consultas) { const o = porH.get(q.herramienta) || { n: 0, ok: 0, sin: 0, mal: 0 }; o.n++; if (q.estado === 'ok') o.ok++; else if (q.estado === 'sin_datos') o.sin++; else o.mal++; porH.set(q.herramienta, o); }
  P(tabla(['Herramienta', 'Consultas', 'Con datos', 'Sin datos', 'Fallidas o no disponibles'], [...porH].map(([k, o]) => [k, o.n, o.ok, o.sin, o.mal])));
  const fuentes = new Map(); for (const e of D.evidencias) { const o = fuentes.get(e.fuente) || { n: 0, clases: new Set() }; o.n++; o.clases.add(CLASE_TXT[e.clase]); fuentes.set(e.fuente, o); }
  P('', '### Fuentes citadas', '', tabla(['Fuente', 'Evidencias', 'Tipo'], [...fuentes].sort((a, b) => b[1].n - a[1].n).slice(0, 40).map(([f, o]) => [clip(f, 160), o.n, [...o.clases].join(', ')])));
  const redes = [...new Set(D.evidencias.map(e => e.red).filter(Boolean))]; P('', `**Redes con evidencia:** ${redes.join(', ') || '—'}. Las redes sin fuente gratuita de historial (BNB Chain y Base) y Bitcoin o Solana no se rastrean con esta herramienta. Cada lectura cruda de cada consulta está guardada con su huella sha256 (anexo 18).`);
  // —— 7
  H('Ficha de las direcciones investigadas');
  P(tabla(['Red', 'Dirección', 'Papel', 'Etiqueta de terceros (fuente)', 'Bloqueo comprobado'], D.direcciones.map(d => [d.red, cod(d.direccion), clip(d.rol || '—', 60), d.etiqueta ? `${tag('TERCEROS')} ${clip(d.etiqueta, 50)} (${clip(d.etiqueta_fuente || 'sin fuente', 70)})` : (D.etiquetadas.has(d.direccion) ? 'sin etiqueta (no significa inocua)' : 'etiquetas NO consultadas para esta dirección'), [d.bloqueo.length ? d.bloqueo.map(b => `${b.estado} en token ${b.token ? b.token.slice(0, 10) + '…' : '?'} [${b.ev}]`).join('; ') : (d.altas.length ? 'estado actual no consultado' : 'no consultado'), ...(d.altas || []).map(a => `${a.evento === 'AddedBlackList' ? 'ALTA en lista negra' : 'BAJA de lista negra'} el ${utc(a.fecha)} (evento, bloque ${a.bloque}, token ${a.token.slice(0, 10)}… [${a.evs.join(', ')}])`)].join('; ')])));
  if (D.direcciones.some(d => d.altas && d.altas.length)) P('', 'Un evento de alta en la lista negra dice que en esa fecha la dirección se añadió a la lista del token; **no demuestra** que siga bloqueada hoy ni cuánto saldo hay inmovilizado: eso solo lo dice la lectura del estado actual (cuando consta en la columna «Bloqueo comprobado») y una lectura de saldo.');
  P('', 'Una dirección no es una persona ni una entidad. Una etiqueta de terceros es una pista: no prueba quién controla la dirección.');
  // —— 8
  H('Cronología de acontecimientos');
  P(`Hora UTC. Cada línea agrupa las lecturas de una misma transacción y dirección y las muestra TODAS (${D.cronologia.length} líneas).`, '', tabla(['Hora (UTC)', 'Hecho', 'Marca', 'Lecturas'], D.cronologia.slice(0, 150).map(c => [utc(c.utc), clip(c.texto, 230) + (c.textos && c.textos.length > 1 ? ' · TAMBIÉN en esta transacción (lecturas distintas, ninguna se oculta): ' + c.textos.slice(1, 6).map(x => clip(x, 150)).join(' · ') + (c.textos.length > 6 ? ' · (+' + (c.textos.length - 6) + ' más)' : '') : ''), tag('HECHO'), ids(c.lecturas, 4)])));
  if (D.cronologia.length > 150) P('', `_Se muestran 150 de ${D.cronologia.length}; el resto está en el JSON del informe._`);
  // —— 9
  H('Movimientos directos');
  P(`${tag('HECHO')} Transferencias leídas de la cadena (relaciones directas).`, '', tabla(['Rel.', 'Hora (UTC)', 'Origen', 'Destino', 'Importe exacto', 'Activo', 'Transacción', 'Evidencias'], D.directas.map(a => [a.id, utc(a.ts_utc), cod(a.desde), cod(a.hasta), a.importe_raw ? cantidad(a.importe_raw, a.decimales) : '—', unidad(a, cargarConocidos()), cod(a.tx_hash || '—'), ids(a.evidencias, 4)])));
  P('', '### Totales por dirección y activo (enteros exactos; no se suman activos distintos)', '', tabla(['Id', 'Dirección', 'Sentido', 'Total exacto', 'Activo', 'Transferencias'], D.totales.map(t => [t.id, cod(t.raiz), t.sentido, t.valor, t.unidad, `${t.n}: ${t.relaciones.join(', ')}`])));
  // —— 10
  H('Rutas de fondos y grafo de relaciones');
  P('⟦GRAFO⟧', '', 'Línea continua azul: **directa** (observada en cadena). Línea discontinua ámbar: **inferida** (estimación). Línea punteada gris: **no verificada**. Borde rojo: bloqueo comprobado. Fondo violeta: etiqueta de terceros (pista).', '');
  P(`${tag('ESTIMACION')} Relaciones inferidas (ninguna es una observación directa): la atribución de esos fondos a la dirección investigada es una estimación; en los saltos marcados «balance neto» el propio movimiento también lo estima el rastreador. La columna «Método» dice cuál es cada caso.`, '', tabla(['Rel.', 'Hora (UTC)', 'Origen', 'Destino', 'Importe exacto', 'Método', 'Evidencias (hecho + inferencia)'], D.inferidas.map(a => [a.id, utc(a.ts_utc), cod(a.desde), cod(a.hasta), a.importe_raw ? cantidad(a.importe_raw, a.decimales) + ' ' + (a.simbolo || '') : '—', clip(a.metodo || '', 90), ids(a.evidencias, 4)])));
  const paradas = D.evidencias.filter(e => /^Rastreo detenido/.test(e.texto)); P('', '### Dónde se detiene el rastreo', '', tabla(['Evidencia', 'Motivo'], paradas.slice(0, 60).map(e => [e.id, clip(e.texto, 220)])));
  // —— 11
  H('Análisis de smart contracts');
  const cont = D.evidencias.filter(e => (e.contrato || e.direccion) && /es un contrato de|Es un proxy|Lo que el propio contrato contesta|funciones de control|Verificación del código|no tiene código/.test(e.texto)); const grupos = new Map(); for (const e of cont) { const k = e.contrato || e.direccion; (grupos.get(k) || grupos.set(k, []).get(k)).push(e); }
  if (!grupos.size) P('_No se analizaron contratos en esta investigación._');
  for (const [k, es] of grupos) { P(`### ${k}`, '', ...es.map(e => `- ${tag(TAG[e.clase])} [${e.id}] ${clip(e.texto, 420)}`), ''); }
  P('Un selector presente en el bytecode indica que el contrato PUEDE tener esa función; no prueba que esté activa, quién puede llamarla ni que se haya usado. Sin código verificado no se confirma nada más.');
  // —— 12
  H('Swaps y operaciones DeFi');
  const sw = D.evidencias.filter(e => /eventos de swap/.test(e.texto)); P(sw.length ? sw.map(e => `- ${tag('HECHO')} [${e.id}] ${clip(e.texto, 700)}\n  - Límites: ${clip(e.limites.join(' · '), 400)}`).join('\n') : '_No se decodificaron swaps._');
  P('', 'Un swap decodificado dice lo que ocurrió dentro de la transacción. **No** se afirma que un activo recibido proceda de una transferencia concreta cuando la operación mezcla fondos de varios orígenes.');
  // —— 13
  H('Relaciones entre entidades');
  const et = D.direcciones.filter(d => d.etiqueta); P(et.length ? tabla(['Dirección', 'Etiqueta', 'Fuente', 'Tipo'], et.map(d => [cod(d.direccion), clip(d.etiqueta, 60), clip(d.etiqueta_fuente || '—', 100), d.tipo || '—'])) : '_No hay etiquetas de terceros en este expediente._');
  P('', 'Una relación observada entre direcciones (una transferencia, una contraparte común) **no demuestra** que pertenezcan a la misma persona o entidad: las hipótesis de identidad no pueden confirmarse.', '', ...hip.filter(h => ['identidad', 'atribucion', 'relacion'].includes(h.tipo)).map(h => `- ${tag(h.estado)} **${h.id}** (${h.tipo}) ${clip(hTxt(h.texto), 240)}`));
  // —— 14
  H('Hipótesis investigadas');
  P(tabla(['Id', 'Tipo', 'Hipótesis', 'Estado', 'La confirmaría', 'La refutaría'], hip.map(h => [h.id, h.tipo, clip(hTxt(h.texto), 240), tag(h.estado) + ' ' + (TAG_TXT[h.estado] || h.estado), clip(h.confirma.join('; '), 200), clip(h.refuta.join('; '), 200)])));
  // —— 15
  H('Evidencias a favor y en contra');
  const evPor = Object.fromEntries(D.evidencias.map(e => [e.id, e]));
  for (const h of hip) { P(`### ${h.id}`, '', tabla(['Evidencia', 'Efecto', 'Relación', 'Marca', 'Texto'], h.evidencias.map(v => { const e = evPor[v.evidencia] || {}; return [v.evidencia, v.efecto === 'apoya' ? 'A FAVOR' : v.efecto === 'contradice' ? 'EN CONTRA' : 'neutral', v.relacion, e.clase ? tag(TAG[e.clase]) : '—', clip(e.texto, 220) + (rectDe[v.evidencia] ? ' — RECTIFICADA (' + rectDe[v.evidencia].id + (rectDe[v.evidencia].clase_efectiva ? ', se lee como ' + CLASE_TXT[rectDe[v.evidencia].clase_efectiva].toLowerCase() : '') + ')' : '')]; })), '');
    const cp = D.consultas.filter(q => q.hipotesis === h.id && q.proposito === 'contraprueba'); P(`Búsquedas de evidencia en contra: ${cp.length ? cp.map(q => `${q.id} (${q.herramienta}, ${q.estado})`).join('; ') : 'ninguna registrada'}.`, ''); }
  if (!hip.length) P('_Sin hipótesis._');
  // —— 16
  H('Limitaciones y datos pendientes');
  const nc = D.evidencias.filter(e => e.clase === 'no_disponible' && !/^Rastreo detenido/.test(e.texto)); P(`${tag('NOCOMP')} Lo que no se pudo comprobar o no se llegó a mirar (no significa «no hay nada»):`, '', tabla(['Evidencia', 'Qué', 'Por qué'], nc.map(e => [e.id, clip(e.texto, 220), clip(e.limites.join('; '), 200)])));
  P('', '### Consultas fallidas o no disponibles', '', tabla(['Consulta', 'Herramienta', 'Estado', 'Hora (UTC)', 'Motivo'], D.consultas.filter(q => q.estado === 'error' || q.estado === 'no_disponible').map(q => [q.id, q.herramienta, q.estado, utc(q.ts_utc), clip(q.error || q.resumen || '', 200)])));
  if (E.cola && E.cola.length) P('', `### Trabajo pendiente en la cola (${E.cola.length})`, '', ...E.cola.slice(0, 20).map(x => `- ${clip(x.herramienta + ' ' + JSON.stringify(x.parametros || {}), 200)}`));
  P('', '### Límites generales', '', '- Los importes en dólares, cuando aparecen, son estimaciones con el precio y la hora elegidos; la cantidad exacta es la de la unidad del activo.', '- El rastreo es incompleto por diseño (límites de saltos, de ramas por dirección, de importe mínimo y de tokens sin precio verificado).', '- Las etiquetas comunitarias son una foto antigua y de confianza baja.', '- ' + (E.estado === 'cerrado' ? 'Este informe pasó la revisión independiente (apartado 5); aun así, lo no comprobado de este apartado sigue siendo un límite.' : 'Este informe es **provisional**: no ha sido aprobado por la revisión independiente (apartado 5).'));
  // —— 17
  H('Referencias verificables');
  const txs = [...new Map(D.evidencias.filter(e => e.tx_hash).map(e => [e.red + e.tx_hash, e])).values()], contr = [...new Set(D.evidencias.filter(e => e.contrato).map(e => e.red + '|' + e.contrato))], bl = [...new Set(D.evidencias.filter(e => e.bloque != null && e.red).map(e => e.red + '|' + e.bloque))];
  P('### Transacciones', '', tabla(['Red', 'Hash', 'Bloque', 'Enlace'], txs.map(e => [e.red, cod(e.tx_hash), e.bloque ?? '—', urlTx(e.red, e.tx_hash) || '—'])));
  P('', '### Contratos', '', tabla(['Red', 'Dirección', 'Enlace'], contr.map(c => { const [r, a] = c.split('|'); return [r, cod(a), urlDir(r, a) || '—']; })));
  const urls = [...new Set(D.evidencias.map(e => e.fuente).filter(f => /^https?:\/\//.test(f)))]; if (urls.length) P('', '### Documentos externos', '', ...urls.map(u => '- ' + s(u)));
  // —— 18
  H('Anexo: origen de cada cifra');
  P('Cada cifra del informe se puede rastrear hasta su evidencia y su lectura original. La lectura original se guarda por su huella sha256 en el expediente de ChainScope (pantalla «Investigaciones» → «Ver la lectura original»).', '', tabla(['Cifra', 'Qué es', 'Valor exacto', 'Unidad', 'Entero crudo', 'Evidencias', 'Fuente', 'Lectura original (sha256)'], D.cifras.map(c => [c.id, clip(c.que, 150), c.valor, clip(c.unidad, 110), c.raw, ids(c.evidencias, 4), clip(c.fuentes.join(' · '), 110), c.lecturas.length ? c.lecturas.slice(0, 2).map(h => cod(h.slice(0, 16) + '…')).join(' ') : '—'])));
  P('', `Huella del libro del expediente al generar este informe: ${cod(E.libro && E.libro.ultima_huella || '—')}.`);
  return L.join('\n');
}

// ------------------------------------------------------------------ HTML/PDF
const EXTRA_CSS = `
.tag{display:inline-block;font-size:7pt;font-weight:700;letter-spacing:.3px;padding:1px 5px;border-radius:3px;border:1px solid;white-space:nowrap}
.t-hecho{color:#0d6b3d;background:#e3f6ec;border-color:#7cc7a0}.t-estimacion{color:#8a5a00;background:#fff3d6;border-color:#e0b85a}.t-terceros{color:#5b2fa0;background:#efe8fb;border-color:#b9a0e6}
.t-externa{color:#0b5a8a;background:#e1f1fb;border-color:#8cc3e6}.t-nocomp{color:#555;background:#ececec;border-color:#b5b5b5}.t-hipotesis{color:#8a5a00;background:#fff3d6;border-color:#e0b85a}
.t-confirmada{color:#0d6b3d;background:#e3f6ec;border-color:#7cc7a0}.t-refutada{color:#9a1c2e;background:#fde7ea;border-color:#e59aa5}.t-sin_resolver,.t-pendiente{color:#8a5a00;background:#fff3d6;border-color:#e0b85a}
.t-directa{color:#0b5a8a;background:#e1f1fb;border-color:#8cc3e6}.t-inferida{color:#8a5a00;background:#fff3d6;border-color:#e0b85a}.t-no_verificada{color:#555;background:#ececec;border-color:#b5b5b5}
td code,th code{font-size:6.6pt;word-break:break-all}table{font-size:8pt}.grafo{border:1px solid #c9d3e0;border-radius:6px;padding:6px;margin:6px 0;page-break-inside:avoid;background:#fff}`;
function conTags(html, svg) {
  return html.replace(/⟦GRAFO⟧/g, () => '</p><div class="grafo">' + (svg || '<p>Sin relaciones que dibujar.</p>') + '</div><p>').replace(/<p>\s*<\/p>/g, '')
    .replace(/⟦([A-Za-z_]+)⟧/g, (_, k) => (TAG_TXT[k] ? `<span class="tag t-${k.toLowerCase()}">${TAG_TXT[k]}</span>` : ''));
}
function ejecutar(exe, args, ms) {
  return new Promise(res => { const p = spawn(exe, args, { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] }); let err = ''; p.stderr.on('data', d => { err += d; }); const t = setTimeout(() => { try { p.kill(); } catch { /* ya terminó */ } res({ timeout: true }); }, ms); p.on('close', code => { clearTimeout(t); res({ code, err }); }); p.on('error', e => { clearTimeout(t); res({ code: -1, err: String(e) }); }); });
}
const hashArchivo = f => sha256(fs.readFileSync(f));

// exp: expediente (cliente.ver); cliente: para comprobar las lecturas originales (opcional); dir: carpeta de salida
async function generarInforme({ exp, cliente = null, dir, name = 'informe', config = {}, pdf = true, ahora = () => new Date() }) {
  const verificarLectura = cliente ? sha => cliente.leerBlob(exp.id, sha) : null;
  const D = await construirDatos(exp, { generado: ahora().toISOString().replace(/\.\d{3}Z$/, 'Z'), verificarLectura });
  const md = aMarkdown(D, exp), svg = svgGrafo(exp, D), toHtml = m => conTags(DOC.markdownToHtml(m), svg);
  fs.mkdirSync(dir, { recursive: true });
  const corto = s(exp.titulo).replace(/^Investigaci[oó]n:\s*/i, '').slice(0, 70).replace(/\s+\S*$/, ''), title = corto ? 'Investigación on-chain: ' + corto : 'Investigación on-chain', meta = `Expediente ${exp.id} · ${D.generado_utc.slice(0, 10)}`;
  const render = pages => STYLE.buildReportHtml({ title, meta, bodyMarkdown: md, trace: [], toHtml, pages, extraCss: EXTRA_CSS, calloutFirst: false });
  const mdFile = path.join(dir, name + '.md'), htmlFile = path.join(dir, name + '.html'), pdfFile = path.join(dir, name + '.pdf'), jsonFile = path.join(dir, name + '.json'), manFile = path.join(dir, name + '.manifiesto.json');
  fs.writeFileSync(mdFile, md, 'utf8'); fs.writeFileSync(htmlFile, render(null), 'utf8'); fs.writeFileSync(jsonFile, JSON.stringify(D, null, 1), 'utf8');
  let paginas = null, navegador = null, errorPdf = null;
  if (pdf) {
    const exe = DOC.findBrowser(config); navegador = exe ? path.basename(exe) : null;
    if (!exe) errorPdf = 'PDF_BROWSER_NOT_FOUND: no hay Chrome ni Edge para convertir a PDF';
    else {
      const perfil = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'inv-pdf-')), url = 'file:///' + htmlFile.replace(/\\/g, '/').replace(/^\/+/, '');
      const args = salida => ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--user-data-dir=' + perfil, '--no-pdf-header-footer', '--print-to-pdf-no-header', '--print-to-pdf=' + salida, url];
      try {
        try { fs.unlinkSync(pdfFile); } catch { /* no existía */ }
        let r = await ejecutar(exe, args(pdfFile), 120000); if (r.timeout) r = await ejecutar(exe, args(pdfFile), 240000);
        if (r.timeout || !fs.existsSync(pdfFile)) errorPdf = r.timeout ? 'PDF_TIMEOUT' : 'PDF_NOT_CREATED: ' + String(r.err).slice(-200);
        else {
          let buf = fs.readFileSync(pdfFile);
          if (buf.length < 800 || buf.subarray(0, 5).toString('latin1') !== '%PDF-') errorPdf = 'PDF_INVALID';
          else { const num = STYLE.pageNumbersOf(buf); if (num) { fs.writeFileSync(htmlFile, render(num), 'utf8'); const seg2 = path.join(dir, name + '.2.pdf'); const r2 = await ejecutar(exe, args(seg2), 120000); if (!r2.timeout && fs.existsSync(seg2)) { const b2 = fs.readFileSync(seg2); if (b2.length >= 800 && b2.subarray(0, 5).toString('latin1') === '%PDF-') { fs.writeFileSync(pdfFile, b2); buf = b2; } } try { fs.unlinkSync(seg2); } catch { /* sin segunda pasada */ } }
            paginas = (buf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length; }
        }
      } finally { try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 3 }); } catch { /* temporal */ } }
    }
  }
  const archivos = [mdFile, htmlFile, jsonFile, ...(fs.existsSync(pdfFile) && !errorPdf ? [pdfFile] : [])].map(f => ({ archivo: path.basename(f), bytes: fs.statSync(f).size, sha256: hashArchivo(f) }));
  const manifiesto = { informe: 'investigacion-onchain', version: VERSION, expediente: exp.id, estado_expediente: exp.estado, libro: exp.libro, generado_utc: D.generado_utc, controles: { total: D.controles.length, superados: D.controles.filter(c => c.ok).length, fallidos: D.controles.filter(c => !c.ok).map(c => c.id) }, paginas, navegador, error_pdf: errorPdf, archivos };
  fs.writeFileSync(manFile, JSON.stringify(manifiesto, null, 1), 'utf8');
  return { dir, datos: D, markdown: md, manifiesto, pdf: errorPdf ? null : pdfFile, error_pdf: errorPdf };
}
module.exports = { conClaseEfectiva, estadoRevision, generarInforme, construirDatos, aMarkdown, svgGrafo, conTags, VERSION };
